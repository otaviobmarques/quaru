import { volume } from './metricas';
import type { Serie, SessaoTreino } from './tipos';

type Base = { series: Serie[]; sessoes: SessaoTreino[] };
export const seriesDaSessao = (e: Base, sessaoId: string) => e.series.filter((s) => s.sessaoId === sessaoId && !s.excluidoEm);
export function metricasPorSessao(e: Base, sessaoId: string) {
  const l = seriesDaSessao(e, sessaoId).filter((s) => s.concluidaEm);
  return { series: l.length, volume: volume(l), exercicios: new Set(l.map((s) => s.exercicioId)).size };
}
export const dataCurta = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' });
export const dataLonga = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', timeZone: 'America/Sao_Paulo' });
export const dataHora = (iso: string) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }) + ' (Brasília)';

/**
 * v0.5: volume (kg × reps) e número de treinos por semana (segunda a domingo, fuso de Brasília), das últimas `n` semanas,
 * da mais antiga para a mais nova. Semanas sem treino entram com zero.
 */
export function volumePorSemana(e: Base, agora: string, n = 8): { inicio: string; volume: number; treinos: number }[] {
  const dia = (iso: string) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));
  const segunda = (d: string) => { const x = new Date(`${d}T12:00:00Z`); x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7)); return x.toISOString().slice(0, 10); };
  const semanas: string[] = [segunda(dia(agora))];
  for (let i = 1; i < n; i++) { const x = new Date(`${semanas[0]}T12:00:00Z`); x.setUTCDate(x.getUTCDate() - 7); semanas.unshift(x.toISOString().slice(0, 10)); }
  const mapa = new Map(semanas.map((s) => [s, { inicio: s, volume: 0, treinos: 0 }]));
  for (const s of e.sessoes) {
    if (s.excluidoEm || !s.finalizadaEm) continue;
    const alvo = mapa.get(segunda(dia(s.finalizadaEm)));
    if (!alvo) continue;
    alvo.treinos++;
    alvo.volume += metricasPorSessao(e, s.id).volume;
  }
  return semanas.map((s) => mapa.get(s)!);
}
