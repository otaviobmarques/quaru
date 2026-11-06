import { Animacao } from '@/componentes/animacao';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, Share, View } from 'react-native';

import { Botao, Campo, Cartao, ItemLista, Tela, Texto } from '@/componentes/ui';
import { Mascote } from '@/componentes/mascote';
import { dataLonga, metricasPorSessao, seriesDaSessao } from '@/dominio/consultas';
import { ehRecorde, formatarKg } from '@/dominio/metricas';
import { acoes, todosExercicios, useEstado } from '@/estado/armazem';
import { textoCompartilharTreino } from '@/dominio/compartilhar';
import { sequenciaDias } from '@/dominio/treino-de-hoje';
import { formatarDuracao } from '@/dominio/cardio';

/** Tela 7 – Resumo do treino (volume, recordes, anotação). */
export default function Resumo() {
  const { id, concluido } = useLocalSearchParams<{ id: string; concluido?: string }>();
  const { estado, aplicar } = useEstado();
  const sessao = estado.sessoes.find((s) => s.id === id);
  const [notas, setNotas] = useState(sessao?.notas ?? '');
  const [copiado, setCopiado] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  if (!sessao) return <Tela voltar={router.back}><Texto suave>Treino não encontrado.</Texto></Tela>;
  const m = metricasPorSessao(estado, sessao.id);
  const exs = new Map(todosExercicios(estado).map((e) => [e.id, e.nome]));
  const minhas = seriesDaSessao(estado, sessao.id).filter((s) => s.concluidaEm);
  const anteriores = estado.series.filter((s) => s.sessaoId !== sessao.id && (estado.sessoes.find((x) => x.id === s.sessaoId)?.iniciadaEm ?? '') < sessao.iniciadaEm);
  // Um recorde por exercício: a melhor série que superou o histórico anterior.
  const recs = [...new Map(minhas.filter((s) => ehRecorde(s, anteriores)).toSorted((a, b) => (a.cargaKg ?? 0) - (b.cargaKg ?? 0)).map((s) => [s.exercicioId, s])).values()];
  const dur = sessao.finalizadaEm ? Math.round((+new Date(sessao.finalizadaEm) - +new Date(sessao.iniciadaEm)) / 60000) : null;
  const porEx = [...new Set(minhas.map((s) => s.exercicioId))];
  const compartilhar = async () => {
    const texto = textoCompartilharTreino({ nome: estado.rotinas.find((r) => r.id === sessao.rotinaId)?.nome ?? 'Treino livre', series: m.series, volumeKg: formatarKg(m.volume), duracaoMin: dur,
      recordes: recs.map((s) => `${exs.get(s.exercicioId)} ${formatarKg(s.cargaKg)} kg × ${s.reps}`), sequencia: sequenciaDias(estado.sessoes, new Date().toISOString()).dias });
    try {
      if (Platform.OS === 'web') {
        const nav = navigator as Navigator & { share?: (d: { text: string }) => Promise<void> };
        if (nav.share) await nav.share({ text: texto }); else { await navigator.clipboard.writeText(texto); setCopiado(true); }
      } else await Share.share({ message: texto });
    } catch { /* a pessoa cancelou */ }
  };
  return (
    <Tela titulo="Resumo do treino" voltar={() => router.replace('/inicio')}
      rodape={<Botao grande titulo="Concluir" onPress={() => { aplicar((e) => acoes.salvarSessao(e, { ...sessao, notas: notas.slice(0, 2000) || null })); router.replace('/inicio'); }} />}>
      {/* v0.11: acabou de finalizar: confirmação clara de que o treino foi concluído (com som e vibração na tela anterior). */}
      {sessao.finalizadaEm && concluido === '1' ? (
        <Cartao destaque>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }} testID="treino-concluido">
            <Mascote pose="festa" tamanho={96} />
            <View style={{ flex: 1, gap: 4 }}>
              <Texto v="titulo-2">{`Treino concluído${estado.perfil?.nome ? `, ${estado.perfil.nome}` : ''}! 🎉`}</Texto>
              <Texto v="rotulo" suave>{`Mandou bem: ${m.series} ${m.series === 1 ? 'série' : 'séries'}${dur != null ? ` em ${dur} min` : ''}. Está registrado no seu histórico.`}</Texto>
            </View>
          </View>
        </Cartao>
      ) : sessao.finalizadaEm && <Animacao nome="treino-concluido" tamanho={140} />}
      <Texto suave>{dataLonga(sessao.iniciadaEm)}{sessao.exemplo ? ' · EXEMPLO' : ''}</Texto>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {[['VOLUME', `${formatarKg(m.volume)} kg`], ['SÉRIES', String(m.series)], ['DURAÇÃO', dur != null ? `${dur} min` : '–']].map(([r, v]) => (
          <View key={r} style={{ flex: 1 }}><Cartao><Texto v="legenda" suave>{r}</Texto><Texto v="titulo-3">{v}</Texto></Cartao></View>
        ))}
      </View>
      <Cartao>
        <Texto v="corpo-forte">Recordes pessoais</Texto>
        {recs.length === 0 ? <Texto v="rotulo" suave>Nenhum recorde neste treino.</Texto> : recs.map((s, i) => <ItemLista key={s.id} ultimo={i === recs.length - 1} titulo={`Recorde · ${exs.get(s.exercicioId)}`} valor={`${formatarKg(s.cargaKg)} kg × ${s.reps}`} />)}
      </Cartao>
      <Cartao>{porEx.map((e, i) => <ItemLista key={e} ultimo={i === porEx.length - 1} titulo={exs.get(e) ?? ''} sub={minhas.filter((s) => s.exercicioId === e).map((s) => (s.duracaoS != null ? formatarDuracao(s.duracaoS) : `${formatarKg(s.cargaKg)}×${s.reps}`)).join(' · ')} onPress={() => router.push(`/exercicio/${e}`)} />)}</Cartao>
      {sessao.finalizadaEm && <Botao v="secundario" titulo={copiado ? 'Texto copiado ✓' : 'Compartilhar treino'} onPress={compartilhar} testID="compartilhar-treino" />}
      <Campo rotulo="Anotação (opcional)" value={notas} onChangeText={setNotas} maxLength={2000} placeholder="Como foi o treino?" multilinha />
      {/* v0.12.3: apagar um treino registrado por engano. */}
      {excluindo ? (
        <Cartao destaque>
          <Texto v="corpo-forte">Excluir este treino?</Texto>
          <Texto v="rotulo" suave>{`${m.series === 0 ? 'Ele' : `Ele e as ${m.series} ${m.series === 1 ? 'série' : 'séries'}`} saem do histórico, da sequência e da evolução. Não dá para desfazer.`}</Texto>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Botao flex v="secundario" titulo="Manter" onPress={() => setExcluindo(false)} />
            <Botao flex v="perigo" titulo="Excluir" testID="confirmar-excluir-sessao" onPress={() => { aplicar((e) => acoes.excluirSessao(e, sessao.id)); router.replace('/inicio'); }} />
          </View>
        </Cartao>
      ) : <Botao v="texto" titulo="Excluir este treino" onPress={() => setExcluindo(true)} testID="excluir-sessao" />}
    </Tela>
  );
}
