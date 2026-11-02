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
