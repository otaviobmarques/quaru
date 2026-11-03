import { router, Stack, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AvisoAtualizacao } from '@/componentes/aviso-atualizacao';
import { acoes, ProvedorEstado, useEstado } from '@/estado/armazem';
import { ProvedorSessao, useSessao } from '@/estado/sessao';
import { planoLembretes } from '@/dominio/lembretes';
import { diaLocal } from '@/dominio/treino-de-hoje';
import { agendarLembretes } from '@/servicos/notificacoes';
import { buscarDoTreinador } from '@/servicos/treinador';
import { ARQUIVOS_FONTES } from '@/tema/fontes';
import { useFonts } from 'expo-font';

/** Só em desenvolvimento (ou build local de capturas com EXPO_PUBLIC_CAPTURAS=1) na web: ?exemplo=1 entra no modo local com dados de EXEMPLO (para capturas). */
/** v0.5: mantém os lembretes agendados iguais às preferências (tour / Meus dados). O de treino pula se já treinou hoje. */
function Lembretes() {
  const { estado, pronto } = useEstado();
  const l = estado.perfil?.lembretes;
  const chave = `${l?.treinoHora ?? ''}|${l?.agua ? 1 : 0}`;
  const treinouHoje = estado.sessoes.some((s) => !s.excluidoEm && s.finalizadaEm && diaLocal(s.finalizadaEm) === diaLocal(new Date().toISOString()));
  useEffect(() => {
    if (!pronto) return;
    agendarLembretes(planoLembretes(l), (x) => !(x.tipo === 'treino' && treinouHoje)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, pronto, treinouHoje]);
  return null;
}

/** Rotas abertas sem login quando a conta é obrigatória (v0.6). */
const ROTAS_ABERTAS = ['/', '/entrar', '/definir-senha', '/juridico', '/vincular'];
/** v0.6: com conta obrigatória, qualquer endereço do app sem sessão ativa volta para a tela de entrar. */
function GuardaConta() {
  const s = useSessao();
  const caminho = usePathname();
  const logado = !!(s.usuario && s.acesso?.ativo);
  const bloqueia = s.modo === 'conta' && s.pronta && !logado && !ROTAS_ABERTAS.includes(caminho);
  // v0.6.1: senha passada pelo admin com "trocar no 1º acesso": só sai da tela de criar senha depois de trocar.
  const forcaTroca = s.modo === 'conta' && s.pronta && logado && s.trocarSenha && caminho !== '/definir-senha' && caminho !== '/juridico';
  useEffect(() => { if (bloqueia) router.replace(s.link ? '/definir-senha' : '/entrar'); else if (forcaTroca) router.replace('/definir-senha'); }, [bloqueia, forcaTroca, s.link]);
  return null;
}

/** v0.8: traz os treinos do treinador ao abrir o app e ao voltar para ele (no máximo 1 vez por minuto). */
function SincronizarTreinador() {
  const s = useSessao();
  const { pronto, aplicar } = useEstado();
  const logado = s.modo === 'conta' && !!s.usuario && !!s.acesso?.ativo;
  useEffect(() => {
    if (!logado || !pronto) return;
    let ultimo = 0;
    const sincronizar = () => {
      if (Date.now() - ultimo < 60000) return;
      ultimo = Date.now();
      buscarDoTreinador().then((r) => { if (r) aplicar((e) => acoes.receberTreinosDoTreinador(e, r.vinculos, r.treinos)); }).catch(() => { /* sem rede: tenta na próxima */ });
    };
    sincronizar();
    const sub = AppState.addEventListener('change', (st) => { if (st === 'active') sincronizar(); });
    return () => sub.remove();
  }, [logado, pronto, aplicar]);
  return null;
}

function SementeDev() {
  const { aplicar, pronto } = useEstado();
  useEffect(() => {
    if (!(__DEV__ || process.env.EXPO_PUBLIC_CAPTURAS === '1') || Platform.OS !== 'web' || !pronto) return;
    const p = new URLSearchParams(window.location.search);
    if (p.get('exemplo') === '1') aplicar((e) => acoes.carregarExemplo(acoes.concluirApresentacao(acoes.consentir(acoes.entrar(e), { dadosSaude: true, iaVisaoEua: false }))));
    if (p.get('treino') === '1') aplicar((e) => {
      const r = e.rotinas.find((x) => x.exemplo && x.ordem === 2);
      if (!r || e.sessoes.some((x) => !x.finalizadaEm)) return e;
      const ini = new Date().toISOString();
      return acoes.iniciarSessao(e, { id: 'e3000000-0000-4000-b000-000000000099', rotinaId: r.id, iniciadaEm: ini, finalizadaEm: null, notas: null, atualizadoEm: ini, exemplo: true });
    });
    if (p.get('vazio') === '1') aplicar(() => acoes.concluirApresentacao(acoes.consentir(acoes.entrar(acoes.excluirTudo()), { dadosSaude: true, iaVisaoEua: false })));
    if (p.get('novo') === '1') aplicar(() => acoes.consentir(acoes.entrar(acoes.excluirTudo()), { dadosSaude: true, iaVisaoEua: false }));
    const av = p.get('avatar'); if (av) aplicar((e) => acoes.definirAvatar(acoes.definirNome(e, 'Pessoa Exemplo'), { tipo: 'ilustrado', id: av }));
    if (p.get('tour') === 'completo') aplicar((e) => acoes.atualizarPerfil(e, { faixaIdade: '18-29', experiencia: 'parado', tempoTreinoMin: 30, local: 'casa', restricoes: ['joelho'], prefAlimentar: 'vegetariana', lembretes: { treinoHora: '18:30', agua: true }, cidade: 'Cidade Exemplo', bairro: 'Centro' }));
    if (p.get('idade') === 'menor') aplicar((e) => acoes.atualizarPerfil(e, { faixaIdade: 'menos-18' }));
    const obj = p.get('objetivo'); if (obj) aplicar((e) => acoes.definirObjetivo(e, { objetivo: obj as never, nivel: 'iniciante', dias: 4, areas: ['core'] }));
    const loc = p.get('local'); if (loc) aplicar((e) => acoes.atualizarPerfil(e, { local: loc as never }));
    const eq = p.get('equip'); if (eq) aplicar((e) => acoes.atualizarPerfil(e, { equipamentos: eq.split(',') as never }));
    const alt = p.get('altura'); if (alt) aplicar((e) => acoes.definirAltura(e, Number(alt)));
    if (p.get('limpar') === '1') aplicar(() => acoes.excluirTudo());
  }, [pronto, aplicar]);
  return null;
}

export default function Layout() {
  useFonts(ARQUIVOS_FONTES); // começa a carregar a fonte de títulos já na abertura
  return (
    <SafeAreaProvider>
      <ProvedorSessao>
      <ProvedorEstado>
        <SementeDev />
        <Lembretes />
        <GuardaConta />
        <SincronizarTreinador />
        <Stack screenOptions={{ headerShown: false }} />
        {Platform.OS === 'web' && <AvisoAtualizacao />}
      </ProvedorEstado>
      </ProvedorSessao>
    </SafeAreaProvider>
  );
}
