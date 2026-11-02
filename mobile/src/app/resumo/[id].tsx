import { Animacao } from '@/componentes/animacao';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Botao, Campo, Cartao, ItemLista, Tela, Texto } from '@/componentes/ui';
import { dataLonga, metricasPorSessao, seriesDaSessao } from '@/dominio/consultas';
import { ehRecorde, formatarKg } from '@/dominio/metricas';
import { acoes, todosExercicios, useEstado } from '@/estado/armazem';

/** Tela 7 – Resumo do treino (volume, recordes, anotação). */
export default function Resumo() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { estado, aplicar } = useEstado();
  const sessao = estado.sessoes.find((s) => s.id === id);
  const [notas, setNotas] = useState(sessao?.notas ?? '');
  if (!sessao) return <Tela voltar={router.back}><Texto suave>Treino não encontrado.</Texto></Tela>;
  const m = metricasPorSessao(estado, sessao.id);
  const exs = new Map(todosExercicios(estado).map((e) => [e.id, e.nome]));
  const minhas = seriesDaSessao(estado, sessao.id).filter((s) => s.concluidaEm);
  const anteriores = estado.series.filter((s) => s.sessaoId !== sessao.id && (estado.sessoes.find((x) => x.id === s.sessaoId)?.iniciadaEm ?? '') < sessao.iniciadaEm);
  // Um recorde por exercício: a melhor série que superou o histórico anterior.
  const recs = [...new Map(minhas.filter((s) => ehRecorde(s, anteriores)).toSorted((a, b) => (a.cargaKg ?? 0) - (b.cargaKg ?? 0)).map((s) => [s.exercicioId, s])).values()];
  const dur = sessao.finalizadaEm ? Math.round((+new Date(sessao.finalizadaEm) - +new Date(sessao.iniciadaEm)) / 60000) : null;
  const porEx = [...new Set(minhas.map((s) => s.exercicioId))];
  return (
    <Tela titulo="Resumo do treino" voltar={() => router.replace('/inicio')}
      rodape={<Botao grande titulo="Concluir" onPress={() => { aplicar((e) => acoes.salvarSessao(e, { ...sessao, notas: notas.slice(0, 2000) || null })); router.replace('/inicio'); }} />}>
      {sessao.finalizadaEm && <Animacao nome="treino-concluido" tamanho={140} />}
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
      <Cartao>{porEx.map((e, i) => <ItemLista key={e} ultimo={i === porEx.length - 1} titulo={exs.get(e) ?? ''} sub={minhas.filter((s) => s.exercicioId === e).map((s) => `${formatarKg(s.cargaKg)}×${s.reps}`).join(' · ')} onPress={() => router.push(`/exercicio/${e}`)} />)}</Cartao>
      <Campo rotulo="Anotação (opcional)" value={notas} onChangeText={setNotas} maxLength={2000} placeholder="Como foi o treino?" multilinha />
    </Tela>
  );
}
