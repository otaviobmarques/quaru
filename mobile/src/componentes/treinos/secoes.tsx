import { router } from 'expo-router';

import { Botao, Cartao, EstadoVazio, Texto } from '@/componentes/ui';
import { dataLonga, metricasPorSessao } from '@/dominio/consultas';
import { formatarKg } from '@/dominio/metricas';
import { todosExercicios, useEstado } from '@/estado/armazem';

/** Seção "Meus treinos" da aba Treinos (antes a aba Rotinas). */
export function MeusTreinos() {
  const { estado } = useEstado();
  const ex = new Map(todosExercicios(estado).map((e) => [e.id, e.nome]));
  const lista = estado.rotinas.filter((r) => !r.excluidoEm).toSorted((a, b) => a.ordem - b.ordem);
  return (
    <>
      {lista.length === 0 && <EstadoVazio titulo="Nenhuma rotina" texto="Monte rotinas como Treino A, B e C. O Início sugere a próxima da sequência." />}
      {lista.map((r) => (
        <Cartao key={r.id} onPress={() => router.push(`/rotina/${r.id}`)}>
          <Texto v="titulo-3">{r.nome}</Texto>
          <Texto v="rotulo" suave>{r.itens.map((i) => ex.get(i.exercicioId)).join(' · ') || 'Sem exercícios'}</Texto>
        </Cartao>
      ))}
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
