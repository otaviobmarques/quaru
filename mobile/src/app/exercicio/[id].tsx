import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AnimacaoExercicio } from '@/componentes/animacao-exercicio';
import { GraficoLinha } from '@/componentes/graficos';
import { MapaMuscular } from '@/componentes/mapa-muscular';
import { Aviso, Cartao, ItemLista, Segmentado, Selo, Tela, Texto } from '@/componentes/ui';
import { regioesDoExercicio } from '@/dominio/treinos-sugeridos';
import { doCatalogo } from '@/dominio/biblioteca';
import { dataCurta } from '@/dominio/consultas';
import { formatarKg, recordes, umRmEstimado, volume } from '@/dominio/metricas';
import { todosExercicios, useEstado } from '@/estado/armazem';

type Metrica = 'carga' | 'volume' | '1rm';

const NIVEL = { iniciante: 'Iniciante', intermediario: 'Intermediário', avancado: 'Avançado' } as const;
export const AVISO_CREF = 'Nomes e instruções traduzidos pela Domma estão em revisão por um profissional de educação física (CREF). Na dúvida, siga a orientação do seu professor.';

/** Tela 9 – Detalhe do exercício ("Ver demonstração"): animação, instruções, gráficos e recordes. */
export default function DetalheExercicio() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { estado } = useEstado();
  const [m, setM] = useState<Metrica>('carga');
  const ex = todosExercicios(estado).find((e) => e.id === id);
  if (!ex) return <Tela voltar={router.back}><Texto suave>Exercício não encontrado.</Texto></Tela>;
  const series = estado.series.filter((s) => s.exercicioId === id && !s.excluidoEm && s.concluidaEm);
  const sessoes = estado.sessoes.filter((s) => !s.excluidoEm && series.some((x) => x.sessaoId === s.id)).toSorted((a, b) => (a.iniciadaEm < b.iniciadaEm ? -1 : 1));
  const pontos = sessoes.slice(-10).map((s) => {
    const l = series.filter((x) => x.sessaoId === s.id);
    const r = recordes(l);
    const valor = m === 'carga' ? r.melhorCarga ?? 0 : m === 'volume' ? volume(l) : r.melhor1Rm ?? 0;
    return { rotulo: dataCurta(s.iniciadaEm), valor };
  });
  const rec = recordes(series);
  const melhorSerie = series.toSorted((a, b) => (umRmEstimado(b.cargaKg, b.reps) ?? 0) - (umRmEstimado(a.cargaKg, a.reps) ?? 0))[0];
  const cat = doCatalogo(ex.id);
  return (
    <Tela titulo={ex.nome} voltar={router.back}>
      <View style={{ flexDirection: 'row', gap: 8 }}><Selo texto={ex.grupoMuscular} /><Selo texto={ex.equipamento} /></View>
      <AnimacaoExercicio exercicioId={ex.id} nome={ex.nome} />
      {cat && <Aviso titulo="Instruções em revisão profissional" texto={AVISO_CREF} tom="alerta" />}
      {cat && (
        <Cartao>
          {cat.nomeOriginal !== cat.nome ? <Texto v="legenda" suave>Nome na fonte: {cat.nomeOriginal}</Texto> : null}
          <Texto v="rotulo">Músculos: {cat.musculos.join(', ')}{cat.musculosSecundarios.length ? ` · também ${cat.musculosSecundarios.join(', ')}` : ''}</Texto>
          <Texto v="rotulo" suave>Nível: {NIVEL[cat.nivel]} · {cat.categoria}</Texto>
          <Texto v="corpo-forte">Como fazer</Texto>
          {cat.instrucoes ? (
            cat.instrucoes.map((t, i) => <Texto key={i} v="corpo">{i + 1}. {t}</Texto>)
          ) : cat.instrucoesOriginais.length ? (
            <>
              <Selo texto="Tradução pendente · texto original em inglês" />
              {cat.instrucoesOriginais.map((t, i) => <Texto key={i} v="corpo" lang="en">{i + 1}. {t}</Texto>)}
            </>
          ) : <Texto suave>A fonte não traz instruções para este exercício.</Texto>}
        </Cartao>
      )}
      {regioesDoExercicio(ex.nome).length > 0 && (
        <Cartao>
          <Texto v="corpo-forte">Músculos trabalhados</Texto>
          <View style={{ alignItems: 'center' }}><MapaMuscular regioes={regioesDoExercicio(ex.nome)} altura={180} /></View>
        </Cartao>
      )}
      <Segmentado<Metrica> valor={m} onChange={setM} opcoes={[{ valor: 'carga', rotulo: 'Melhor carga' }, { valor: 'volume', rotulo: 'Volume' }, { valor: '1rm', rotulo: '1RM estimado' }]} />
      <Cartao>
        <Texto v="corpo-forte">Sua evolução</Texto>
        {pontos.length > 1 ? <GraficoLinha testID="grafico-exercicio" pontos={pontos} unidade="kg" descricao={`${m === 'carga' ? 'Melhor carga' : m === 'volume' ? 'Volume' : '1RM estimado'} por treino em ${ex.nome}`} />
          : <Texto suave>{pontos.length === 1 ? 'Faça este exercício em mais um treino para ver a evolução.' : 'Quando você registrar séries deste exercício, a evolução aparece aqui.'}</Texto>}
      </Cartao>
      <Cartao>
        <Texto v="corpo-forte">Recordes</Texto>
        <ItemLista titulo="Melhor carga" valor={`${formatarKg(rec.melhorCarga)} kg`} />
        <ItemLista titulo="1RM estimado (Epley)" valor={`${formatarKg(rec.melhor1Rm)} kg`} sub={melhorSerie ? `de ${formatarKg(melhorSerie.cargaKg)} kg × ${melhorSerie.reps}` : undefined} />
        <ItemLista ultimo titulo="Melhor série (carga × reps)" valor={`${formatarKg(rec.melhorVolumeSerie)} kg`} />
      </Cartao>
      <Texto v="legenda" suave>1RM estimado é uma conta (carga × (1 + reps/30)), não uma prescrição.</Texto>
    </Tela>
  );
}
