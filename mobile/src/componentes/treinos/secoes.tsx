import { router } from 'expo-router';

import { View } from 'react-native';

import { Botao, Cartao, EstadoVazio, Selo, Texto } from '@/componentes/ui';
import { tempoEstimadoTreino } from '@/dominio/descanso';
import { proximaRotina } from '@/dominio/treino-de-hoje';
import { iniciarTreino } from '@/estado/treino';
import { CalendarioTreinos } from '@/componentes/calendario';
import { GraficoColunas } from '@/componentes/graficos';
import { dataLonga, metricasPorSessao, volumePorSemana } from '@/dominio/consultas';
import { formatarKg } from '@/dominio/metricas';
import { todosExercicios, useEstado } from '@/estado/armazem';

/** Seção "Meus treinos" da aba Treinos (antes a aba Rotinas). */
export function MeusTreinos() {
  const { estado, aplicar } = useEstado();
  const ex = new Map(todosExercicios(estado).map((e) => [e.id, e.nome]));
  const ativa = estado.sessoes.find((x) => !x.finalizadaEm && !x.excluidoEm);
  const lista = estado.rotinas.filter((r) => !r.excluidoEm).toSorted((a, b) => a.ordem - b.ordem);
  return (
    <>
      {lista.length === 0 && <EstadoVazio titulo="Nenhum treino ainda" texto="Monte treinos como Treino A, B e C, ou adicione um sugerido. O Início sugere o próximo da sequência." />}
      {lista.map((r) => {
        const proximo = proximaRotina(estado.rotinas, estado.sessoes)?.id === r.id;
        const min = tempoEstimadoTreino(r.itens);
        return (
          <Cartao key={r.id} destaque={proximo}>
            {proximo && <Selo texto="Próximo da sequência" tom="primaria" />}
            <Texto v="titulo-3">{r.nome}</Texto>
            <Texto v="rotulo" suave>{r.itens.length} {r.itens.length === 1 ? 'exercício' : 'exercícios'}{min ? ` · ~${min} min` : ''}</Texto>
            <Texto v="rotulo" suave numberOfLines={2}>{r.itens.toSorted((a, b) => a.ordem - b.ordem).map((i) => ex.get(i.exercicioId)).join(' · ') || 'Sem exercícios'}</Texto>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              <Botao flex titulo={ativa ? (ativa.rotinaId === r.id ? 'Continuar' : 'Treino em andamento') : 'Começar'} onPress={() => iniciarTreino(aplicar, estado, r.id)} desabilitado={r.itens.length === 0 || (!!ativa && ativa.rotinaId !== r.id)} testID={`comecar-${r.id}`} />
              <Botao flex v="secundario" titulo="Editar" onPress={() => router.push(`/rotina/${r.id}`)} testID={`editar-${r.id}`} />
            </View>
          </Cartao>
        );
      })}
      <Cartao onPress={() => router.push('/biblioteca')}>
        <Texto v="titulo-3">Biblioteca de exercícios</Texto>
        <Texto v="rotulo" suave>Veja todos os exercícios e como fazer cada um.</Texto>
      </Cartao>
    </>
  );
}

/** Seção "Histórico" da aba Treinos (antes a aba Histórico). Lista por data. */
export function HistoricoTreinos() {
  const { estado } = useEstado();
  const nome = (id: string | null) => estado.rotinas.find((r) => r.id === id)?.nome ?? 'Treino livre';
  const lista = estado.sessoes.filter((s) => s.finalizadaEm && !s.excluidoEm).toSorted((a, b) => (a.iniciadaEm < b.iniciadaEm ? 1 : -1));
  return (
    <>
      {lista.length > 0 && (() => {
        const semanas = volumePorSemana(estado, new Date().toISOString());
        const total = semanas.reduce((a, x) => a + x.treinos, 0);
        return (
          <>
          <Cartao><CalendarioTreinos sessoes={estado.sessoes} /></Cartao>
          <Cartao>
            <Texto v="corpo-forte">Volume por semana</Texto>
            <Texto v="rotulo" suave>{total} {total === 1 ? 'treino' : 'treinos'} nas últimas 8 semanas · carga × repetições</Texto>
            <GraficoColunas testID="grafico-semanas" unidade="kg" descricao="Volume de treino por semana, últimas 8 semanas"
              pontos={semanas.map((x) => ({ rotulo: `${x.inicio.slice(8, 10)}/${x.inicio.slice(5, 7)}`, valor: Math.round(x.volume) }))} />
          </Cartao>
          </>
        );
      })()}
      {lista.length === 0 && <EstadoVazio titulo="Nenhum treino ainda" texto="Quando você finalizar um treino, ele aparece aqui." acao={<Botao titulo="Ir para o Início" onPress={() => router.push('/inicio')} />} />}
      {lista.map((s) => {
        const m = metricasPorSessao(estado, s.id);
        return (
          <Cartao key={s.id} onPress={() => router.push(`/resumo/${s.id}`)}>
            <Texto v="legenda" suave>{dataLonga(s.iniciadaEm).toUpperCase()}</Texto>
            <Texto v="titulo-3">{nome(s.rotinaId)}</Texto>
            <Texto v="rotulo" suave>{m.exercicios} exercícios · {m.series} séries · {formatarKg(m.volume)} kg</Texto>
          </Cartao>
        );
      })}
    </>
  );
}
