// Função de borda do painel de administração (v0.6, ADR-0022). Roda no Supabase (Deno).
// Quem chama manda o próprio token (Authorization: Bearer ...). A função confere se é ADMIN ATIVO e só então usa
// a service_role, que existe apenas aqui no servidor (variável SUPABASE_SERVICE_ROLE_KEY, nunca no navegador nem no app).
//
// Variáveis (Painel do Supabase → Edge Functions → Secrets):
//   ORIGENS_ADMIN  (opcional) endereços que podem chamar, separados por vírgula. Padrão: https://otaviobmarques.github.io
//   URL_APP        (opcional) para onde o convite leva para criar a senha. Padrão: https://otaviobmarques.github.io/quaru/
// SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY já vêm prontas no Supabase.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import { lerPedido, recusar, type PerfilResumo } from './regras.ts';

const env = (k: string) => Deno.env.get(k) ?? '';
// Padrões do site publicado (valores públicos); as variáveis, se existirem, têm prioridade.
const ORIGENS = (env('ORIGENS_ADMIN') || 'https://otaviobmarques.github.io').split(',').map((s) => s.trim()).filter(Boolean);
const URL_APP = env('URL_APP') || 'https://otaviobmarques.github.io/quaru/';
const BANIDO = '876000h'; // ~100 anos: o Auth recusa login e renovação do token

function cabecalhos(origem: string | null): Record<string, string> {
  const ok = origem && ORIGENS.includes(origem) ? origem : ORIGENS[0] ?? '';
  return {
    'Access-Control-Allow-Origin': ok,
    'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
    'Content-Type': 'application/json; charset=utf-8',
  };
}
const resposta = (origem: string | null, status: number, corpo: unknown) => new Response(JSON.stringify(corpo), { status, headers: cabecalhos(origem) });

Deno.serve(async (req) => {
  const origem = req.headers.get('Origin');
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cabecalhos(origem) });
  if (req.method !== 'POST') return resposta(origem, 405, { erro: 'Use POST.' });
  if (origem && !ORIGENS.includes(origem)) return resposta(origem, 403, { erro: 'Origem não autorizada.' });

  // 1) Quem está pedindo? (token do próprio usuário, validado pelo Auth)
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return resposta(origem, 401, { erro: 'Entre de novo.' });
  const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: quem, error: erroQuem } = await admin.auth.getUser(token);
  if (erroQuem || !quem?.user) return resposta(origem, 401, { erro: 'Sessão expirada. Entre de novo.' });

  // 2) É administrador ativo?
  const { data: perfisDb, error: erroPerfis } = await admin.from('perfis').select('usuario_id, papel, ativo, nome, criado_em');
  if (erroPerfis) return resposta(origem, 500, { erro: 'Não foi possível ler os perfis.' });
  const perfis = (perfisDb ?? []) as (PerfilResumo & { nome: string | null; criado_em: string })[];
  const eu = perfis.find((p) => p.usuario_id === quem.user.id);
  if (!eu || eu.papel !== 'admin' || !eu.ativo) return resposta(origem, 403, { erro: 'Só administradores podem fazer isso.' });

  // 3) O que foi pedido?
  let corpo: unknown = null;
  try { corpo = await req.json(); } catch { /* corpo vazio */ }
  const p = lerPedido(corpo);
  if ('erro' in p) return resposta(origem, 400, p);
  const motivo = recusar(p, eu.usuario_id, perfis);
  if (motivo) return resposta(origem, 409, { erro: motivo });

  try {
    switch (p.acao) {
      case 'listar': {
        const usuarios: { id: string; email?: string; created_at: string; last_sign_in_at?: string | null; email_confirmed_at?: string | null; invited_at?: string | null }[] = [];
        for (let pagina = 1; pagina <= 50; pagina++) {
          const { data, error } = await admin.auth.admin.listUsers({ page: pagina, perPage: 200 });
          if (error) throw error;
          usuarios.push(...data.users);
          if (data.users.length < 200) break;
        }
        const lista = usuarios.map((u) => {
          const pf = perfis.find((x) => x.usuario_id === u.id);
          return { id: u.id, email: u.email ?? '', nome: pf?.nome ?? null, papel: pf?.papel ?? 'usuario', ativo: pf?.ativo ?? false,
            criado_em: u.created_at, ultimo_acesso: u.last_sign_in_at ?? null, convite_pendente: !u.email_confirmed_at && !u.last_sign_in_at, eu: u.id === eu.usuario_id };
        }).sort((a, b) => a.email.localeCompare(b.email));
        return resposta(origem, 200, { usuarios: lista });
      }
      case 'convidar': {
        const { data, error } = await admin.auth.admin.inviteUserByEmail(p.email, { redirectTo: URL_APP, data: { nome: p.nome ?? null } });
        if (error) return resposta(origem, error.status === 422 ? 409 : 400, { erro: /registered|exists/i.test(error.message) ? 'Esse e-mail já tem conta.' : 'Não foi possível enviar o convite.' });
        // O gatilho criou o perfil BLOQUEADO; o convite o ativa e completa nome, papel e quem convidou.
        await admin.from('perfis').upsert({ usuario_id: data.user.id, nome: p.nome ?? null, papel: p.papel ?? 'usuario', ativo: true, convidado_por: eu.usuario_id });
        return resposta(origem, 200, { ok: true, id: data.user.id });
      }
      case 'reenviar': {
        const { data, error } = await admin.auth.admin.getUserById(p.usuario_id);
        if (error || !data.user?.email) return resposta(origem, 404, { erro: 'Usuário não encontrado.' });
        const jaEntrou = !!data.user.email_confirmed_at || !!data.user.last_sign_in_at;
        const r = jaEntrou
          ? await createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY')).auth.resetPasswordForEmail(data.user.email, { redirectTo: URL_APP })
          : await admin.auth.admin.inviteUserByEmail(data.user.email, { redirectTo: URL_APP });
        if (r.error) return resposta(origem, 400, { erro: 'Não foi possível reenviar.' });
        return resposta(origem, 200, { ok: true, enviado: jaEntrou ? 'redefinir-senha' : 'convite' });
      }
      case 'bloquear': case 'desbloquear': {
        const ativo = p.acao === 'desbloquear';
        const { error } = await admin.auth.admin.updateUserById(p.usuario_id, { ban_duration: ativo ? 'none' : BANIDO });
        if (error) throw error;
        await admin.from('perfis').update({ ativo }).eq('usuario_id', p.usuario_id);
        return resposta(origem, 200, { ok: true });
      }
      case 'papel': {
        const { error } = await admin.from('perfis').update({ papel: p.papel }).eq('usuario_id', p.usuario_id);
        if (error) throw error;
        return resposta(origem, 200, { ok: true });
      }
      case 'remover': {
        const { error } = await admin.auth.admin.deleteUser(p.usuario_id); // cascata apaga perfil e dados
        if (error) throw error;
        return resposta(origem, 200, { ok: true });
      }
    }
  } catch (e) {
    console.error('[admin-usuarios]', p.acao, (e as Error).message);
    return resposta(origem, 500, { erro: 'Algo deu errado. Tente de novo.' });
  }
});
