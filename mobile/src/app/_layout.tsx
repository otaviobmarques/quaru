import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AvisoAtualizacao } from '@/componentes/aviso-atualizacao';
import { acoes, ProvedorEstado, useEstado } from '@/estado/armazem';

/** Só em desenvolvimento (ou build local de capturas com EXPO_PUBLIC_CAPTURAS=1) na web: ?exemplo=1 entra no modo local com dados de EXEMPLO (para capturas). */
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
  return (
    <SafeAreaProvider>
      <ProvedorEstado>
        <SementeDev />
        <Stack screenOptions={{ headerShown: false }} />
        {Platform.OS === 'web' && <AvisoAtualizacao />}
      </ProvedorEstado>
    </SafeAreaProvider>
  );
}
