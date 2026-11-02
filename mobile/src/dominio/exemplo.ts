import { BIBLIOTECA } from './biblioteca';
import type { PesoCorporal, Rotina, Serie, SessaoTreino } from './tipos';

/**
 * DADOS DE EXEMPLO — FICTÍCIOS. Servem só para demonstração e capturas de tela.
 * Todo registro vem com exemplo: true e a interface mostra o selo "EXEMPLO".
 */
export function gerarExemplo(agora = new Date()) {
  const dia = 86400000;
  const iso = (ms: number) => new Date(ms).toISOString();
  const ex = (n: number) => BIBLIOTECA[n].id;
  const id = (p: string, n: number) => `e${p}000000-0000-4000-b000-${String(n).padStart(12, '0')}`;
  const rot = (n: number, nome: string, exs: number[]): Rotina => ({
    id: id('1', n), nome: `${nome} (exemplo)`, ordem: n, exemplo: true, atualizadoEm: iso(+agora),
    itens: exs.map((e, i) => ({ id: id('2', n * 10 + i), exercicioId: ex(e), ordem: i, seriesAlvo: 3, repsAlvo: 10, descansoS: 90 })),
  });
  const rotinas = [rot(1, 'Treino A', [0, 1, 18]), rot(2, 'Treino B', [4, 5, 16]), rot(3, 'Treino C', [8, 9, 10])];
  const sessoes: SessaoTreino[] = [];
  const series: Serie[] = [];
  for (let k = 0; k < 6; k++) {
    const r = rotinas[k % 3];
    const ini = +agora - (12 - k * 2) * dia;
    const s: SessaoTreino = { id: id('3', k), rotinaId: r.id, iniciadaEm: iso(ini), finalizadaEm: iso(ini + 3600000), notas: null, exemplo: true, atualizadoEm: iso(ini) };
    sessoes.push(s);
    r.itens.forEach((it, j) => {
      for (let o = 1; o <= 3; o++) series.push({
        id: id('4', k * 100 + j * 10 + o), sessaoId: s.id, exercicioId: it.exercicioId, ordem: o, tipo: 'normal',
        cargaKg: 20 + j * 10 + Math.floor(k / 3) * 2.5, reps: 10, duracaoS: null, rpe: null, concluidaEm: iso(ini + o * 300000), exemplo: true, atualizadoEm: iso(ini),
      });
    });
  }
  const pesos: PesoCorporal[] = [0, 1, 2, 3, 4].map((k) => ({
    id: id('5', k), pesoKg: 80 - k * 0.4, medidoEm: iso(+agora - (20 - k * 5) * dia), exemplo: true, atualizadoEm: iso(+agora),
  }));
  return { rotinas, sessoes, series, pesos };
}
