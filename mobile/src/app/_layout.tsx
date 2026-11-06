import { router, Stack, usePathname } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { AppState, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AvisoAtualizacao } from '@/componentes/aviso-atualizacao';
import { acoes, ProvedorEstado, temSaude, useEstado } from '@/estado/armazem';
import { ProvedorSessao, useSessao } from '@/estado/sessao';
import { planoLembretes } from '@/dominio/lembretes';
import { diaLocal } from '@/dominio/treino-de-hoje';
import { agendarLembretes } from '@/servicos/notificacoes';
import { chaveAniversario, enviarAniversario } from '@/servicos/aniversario';
import { buscarDoTreinador, meuIdAluno, meusConvites, publicarEvolucao } from '@/servicos/treinador';
import { assinatura, montarResumo } from '@/dominio/evolucao';
import { buscarPlano } from '@/servicos/assinatura';
import { AvisoNovoEndereco } from '@/componentes/aviso-novo-endereco';
import { VigiaDescanso } from '@/componentes/vigia-descanso';
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
const ROTAS_ABERTAS = ['/', '/entrar', '/criar-conta', '/definir-senha', '/juridico', '/vincular', '/receber-dados'];
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
      // v0.12: o plano da conta (teste, assinatura, cortesia)
      buscarPlano().then((pl) => { if (pl) aplicar((e) => acoes.receberPlano(e, pl)); }).catch(() => { /* sem rede: vale o último */ });
      // v0.10: convites pelo ID e o próprio ID de aluno
      meusConvites().then((c) => { if (c) aplicar((e) => acoes.receberConvites(e, c)); }).catch(() => { /* sem rede */ });
      meuIdAluno().then((id) => { if (id) aplicar((e) => (e.idAluno === id ? e : acoes.guardarIdAluno(e, id))); }).catch(() => { /* sem rede */ });
    };
    sincronizar();
    const sub = AppState.addEventListener('change', (st) => { if (st === 'active') sincronizar(); });
    return () => sub.remove();
  }, [logado, pronto, aplicar]);
  return null;
}

/**
 * v0.10: com o compartilhamento ligado (e o consentimento de dados de saúde), publica o resumo da evolução
 * para o treinador: peso, treinos feitos e agenda. Só quando muda. Desligado, nada sai do aparelho.
 */
function PublicarEvolucao() {
  const s = useSessao();
  const { estado, pronto, aplicar } = useEstado();
  const logado = s.modo === 'conta' && !!s.usuario && !!s.acesso?.ativo;
  const compartilha = (estado.vinculos ?? []).some((v) => v.compartilha) && temSaude(estado);
  const resumo = useMemo(() => (compartilha ? montarResumo(estado) : null), [compartilha, estado.rotinas, estado.sessoes, estado.series, estado.pesos, estado.agenda]); // eslint-disable-line react-hooks/exhaustive-deps
  const ass = resumo ? assinatura(resumo) : null;
  useEffect(() => {
    if (!logado || !pronto || !resumo || !ass || estado.evolucaoEnviada === ass) return;
    const t = setTimeout(() => {
      publicarEvolucao(resumo).then((ok) => { if (ok) aplicar((e) => acoes.marcarEvolucaoEnviada(e, ass)); }).catch(() => { /* sem rede */ });
    }, 1500);
    return () => clearTimeout(t);
  }, [logado, pronto, ass]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!compartilha && estado.evolucaoEnviada) aplicar((e) => acoes.marcarEvolucaoEnviada(e, null)); }, [compartilha]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/** v0.9: leva o aniversário para o perfil no servidor quando muda (ou na próxima abertura, se estava sem rede). */
function SincronizarAniversario() {
  const s = useSessao();
  const { estado, pronto, aplicar } = useEstado();
  const logado = s.modo === 'conta' && !!s.usuario && !!s.acesso?.ativo;
  const a = estado.perfil?.aniversario ?? null;
  const chave = chaveAniversario(a);
  const enviado = estado.aniversarioEnviado ?? (a ? null : '-'); // nunca informado: nada a enviar
  useEffect(() => {
    if (!logado || !pronto || enviado === chave) return;
    enviarAniversario(a).then((ok) => { if (ok) aplicar((e) => acoes.marcarAniversarioEnviado(e, chave)); }).catch(() => { /* sem rede */ });
  }, [logado, pronto, chave, enviado]); // eslint-disable-line react-hooks/exhaustive-deps
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
        <SincronizarAniversario />
        <PublicarEvolucao />
        <AvisoNovoEndereco />
        <Stack screenOptions={{ headerShown: false }} />
        <VigiaDescanso />
        {Platform.OS === 'web' && <AvisoAtualizacao />}
      </ProvedorEstado>
      </ProvedorSessao>
    </SafeAreaProvider>
  );
}
