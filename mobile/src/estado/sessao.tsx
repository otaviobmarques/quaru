import { createContext, use, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabase, tipoLinkInicial } from '@/servicos/supabase';
import { BASE } from '@/config/endereco';

/**
 * Sessão da conta (v0.6, ADR-0022). Sem Supabase configurado, `modo` = 'local' e nada muda no app.
 * Com Supabase: guarda a sessão do Auth, confere papel e situação (public.meu_acesso) e encerra a sessão
 * de quem foi bloqueado pelo administrador.
 */
export type Acesso = { papel: 'admin' | 'usuario'; ativo: boolean };
type CtxSessao = {
  modo: 'local' | 'conta';
  pronta: boolean;
  usuario: { id: string; email: string } | null;
  acesso: Acesso | null;
  aviso: string | null;
  /** Link de convite ou de nova senha que abriu o app (web): leva à tela de criar senha. */
  link: 'invite' | 'recovery' | null;
  /** v0.6.1: o admin criou a conta (ou trocou a senha) e pediu para a pessoa criar a própria senha no 1º acesso. */
  trocarSenha: boolean;
  entrar: (email: string, senha: string) => Promise<string | null>;
  /** v0.12: autocadastro (teste grátis). Devolve a mensagem de erro, ou null quando o e-mail de confirmação foi enviado. */
  criarConta: (nome: string, email: string, senha: string) => Promise<string | null>;
  esqueci: (email: string) => Promise<string | null>;
  definirSenha: (senha: string) => Promise<string | null>;
  sair: () => Promise<void>;
  limparLink: () => void;
};
const Ctx = createContext<CtxSessao | null>(null);

export const SENHA_MINIMA = 8;
export const MSG = {
  credenciais: 'E-mail ou senha incorretos.',
  bloqueado: 'Seu acesso foi bloqueado. Fale com o administrador do Quaru.',
  semPerfil: 'Esta conta não tem acesso ao Quaru. Fale com o administrador.',
  rede: 'Sem conexão. Confira a internet e tente de novo.',
  senhaCurta: `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`,
} as const;

export function ProvedorSessao({ children }: { children: ReactNode }) {
  const sb = supabase();
  const [sessao, setSessao] = useState<Session | null>(null);
  const [acesso, setAcesso] = useState<Acesso | null>(null);
  const [carregou, setCarregou] = useState(!sb);
  const [conferido, setConferido] = useState<string | null>(null); // uid cuja situação já foi conferida
  const [aviso, setAviso] = useState<string | null>(null);
  const [link, setLink] = useState(tipoLinkInicial);

  useEffect(() => {
    if (!sb) return;
    let vivo = true;
    sb.auth.getSession().then(({ data }) => { if (vivo) { setSessao(data.session); setCarregou(true); } });
    const { data: sub } = sb.auth.onAuthStateChange((ev, s) => {
      if (!vivo) return;
      setSessao(s);
      if (ev === 'PASSWORD_RECOVERY') setLink('recovery');
      if (!s) setAcesso(null);
      setCarregou(true);
    });
    return () => { vivo = false; sub.subscription.unsubscribe(); };
  }, [sb]);

  // Com sessão, confere papel e situação; bloqueado ou sem perfil: encerra a sessão.
  const uid = sessao?.user.id;
  useEffect(() => {
    if (!sb || !uid) return;
    let vivo = true;
    (async () => {
      const { data, error } = await sb.rpc('meu_acesso');
      if (!vivo) return;
      // Sem rede: mantém a sessão como usuário ativo (o app funciona offline); a conferência volta na próxima abertura.
      // Outro erro (ex.: banco sem a migração): não deixa entrar, porque não dá para saber se a conta está ativa.
      if (error) {
        const semRede = /fetch|network|failed/i.test(error.message ?? '');
        if (semRede) { setAviso(MSG.rede); setAcesso({ papel: 'usuario', ativo: true }); }
        else { setAviso('Não foi possível conferir seu acesso. Tente de novo em instantes.'); setAcesso(null); await sb.auth.signOut({ scope: 'local' }); }
        setConferido(uid); return;
      }
      const a = data as Acesso | null;
      if (!a || !a.ativo) { setAviso(a ? MSG.bloqueado : MSG.semPerfil); setAcesso(null); await sb.auth.signOut({ scope: 'local' }); }
      else setAcesso(a);
      setConferido(uid);
    })();
    return () => { vivo = false; };
  }, [sb, uid]);

  // Pronta quando a sessão foi lida e, se há sessão, a situação da conta já foi conferida.
  const pronta = !sb || (carregou && (!uid || conferido === uid));
  const valor: CtxSessao = {
    modo: sb ? 'conta' : 'local',
    pronta,
    usuario: sessao ? { id: sessao.user.id, email: sessao.user.email ?? '' } : null,
    acesso, aviso, link,
    trocarSenha: sessao?.user.user_metadata?.trocar_senha === true,
    limparLink: () => setLink(null),
    entrar: async (email, senha) => {
      if (!sb) return null;
      setAviso(null);
      const { error } = await sb.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: senha });
      if (!error) return null;
      if (/banned/i.test(error.message)) return MSG.bloqueado;
      if (/fetch|network/i.test(error.message)) return MSG.rede;
      return MSG.credenciais; // não diz se o e-mail existe
    },
    criarConta: async (nome, email, senha) => {
      if (!sb) return null;
      if (senha.length < SENHA_MINIMA) return MSG.senhaCurta;
      if (!/[A-Za-zÀ-ÿ]/.test(senha) || !/\d/.test(senha)) return 'Use letras e números na senha.';
      const destino = typeof window !== 'undefined' && window.location ? `${window.location.origin}${BASE}` : undefined;
      const { data, error } = await sb.auth.signUp({ email: email.trim().toLowerCase(), password: senha, options: { emailRedirectTo: destino, data: { nome: nome.trim().slice(0, 80) } } });
      if (error) {
        if (/fetch|network/i.test(error.message)) return MSG.rede;
        if (/not allowed|disabled/i.test(error.message)) return 'O cadastro está fechado no momento. Fale com o suporte do Quaru.';
        if (/password/i.test(error.message)) return 'Senha fraca: use pelo menos 8 caracteres, com letras e números.';
        if (/rate|seconds/i.test(error.message)) return 'Muitas tentativas. Espere um minuto e tente de novo.';
        return 'Não deu para criar a conta. Confira o e-mail e tente de novo.';
      }
      // Com confirmação de e-mail ligada, não há sessão ainda: a pessoa confirma pelo link e depois entra.
      if (data.session) return null;
      return null;
    },
    esqueci: async (email) => {
      if (!sb) return null;
      const destino = typeof window !== 'undefined' && window.location ? `${window.location.origin}${BASE}` : undefined;
      const { error } = await sb.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: destino });
      return error && /fetch|network/i.test(error.message) ? MSG.rede : null; // não revela se o e-mail tem conta
    },
    definirSenha: async (senha) => {
      if (!sb) return null;
      if (senha.length < SENHA_MINIMA) return MSG.senhaCurta;
      const { error } = await sb.auth.updateUser({ password: senha, data: { trocar_senha: false } });
      if (error) return /fetch|network/i.test(error.message) ? MSG.rede : 'O link expirou. Peça um novo ao administrador ou use "Esqueci minha senha".';
      setLink(null);
      return null;
    },
    sair: async () => { if (sb) await sb.auth.signOut({ scope: 'local' }); },
  };
  return <Ctx value={valor}>{children}</Ctx>;
}

/** Sem provedor (modo local e testes): sessão "local", sempre pronta, sem conta. */
const LOCAL: CtxSessao = {
  modo: 'local', pronta: true, usuario: null, acesso: null, aviso: null, link: null, trocarSenha: false,
  entrar: async () => null, criarConta: async () => null, esqueci: async () => null, definirSenha: async () => null, sair: async () => {}, limparLink: () => {},
};
export function useSessao(): CtxSessao {
  return use(Ctx) ?? LOCAL;
}
