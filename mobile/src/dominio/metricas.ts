import type { Serie, SessaoTreino } from './tipos';

/** 1RM estimado pela fórmula de Epley: carga × (1 + reps/30). Só para reps entre 1 e 12. */
export function umRmEstimado(cargaKg: number | null, reps: number | null): number | null {
  if (cargaKg == null || reps == null || reps < 1 || reps > 12 || cargaKg <= 0) return null;
  if (reps === 1) return cargaKg;
  return Math.round(cargaKg * (1 + reps / 30) * 10) / 10;
}

const contaParaRecorde = (s: Serie) => !s.excluidoEm && s.concluidaEm && s.tipo !== 'aquecimento';

/** Volume = soma de carga × reps das séries concluídas (aquecimento não conta). */
export function volume(series: Serie[]): number {
  let total = 0;
  for (const s of series) if (contaParaRecorde(s) && s.cargaKg && s.reps) total += s.cargaKg * s.reps;
  return Math.round(total * 10) / 10;
}

export interface Recordes { melhorCarga: number | null; melhor1Rm: number | null; melhorVolumeSerie: number | null }

export function recordes(series: Serie[]): Recordes {
  let melhorCarga: number | null = null, melhor1Rm: number | null = null, melhorVolumeSerie: number | null = null;
  for (const s of series) {
    if (!contaParaRecorde(s)) continue;
    if (s.cargaKg != null && (melhorCarga == null || s.cargaKg > melhorCarga)) melhorCarga = s.cargaKg;
    const rm = umRmEstimado(s.cargaKg, s.reps);
    if (rm != null && (melhor1Rm == null || rm > melhor1Rm)) melhor1Rm = rm;
    const v = s.cargaKg && s.reps ? s.cargaKg * s.reps : null;
    if (v != null && (melhorVolumeSerie == null || v > melhorVolumeSerie)) melhorVolumeSerie = v;
  }
  return { melhorCarga, melhor1Rm, melhorVolumeSerie };
}

/** Recorde pessoal ao vivo (RF05): a série nova supera a melhor carga ou o 1RM anteriores? */
export function ehRecorde(nova: Serie, anteriores: Serie[]): boolean {
  if (nova.tipo === 'aquecimento' || nova.cargaKg == null || nova.cargaKg <= 0) return false;
  const r = recordes(anteriores.filter((s) => s.exercicioId === nova.exercicioId && s.id !== nova.id));
  if (r.melhorCarga == null) return false; // primeira vez não é recorde
  const rm = umRmEstimado(nova.cargaKg, nova.reps);
  return nova.cargaKg > r.melhorCarga || (rm != null && r.melhor1Rm != null && rm > r.melhor1Rm);
}

/** "Última vez" (história 3): séries do exercício na sessão finalizada mais recente, exceto a atual. */
export function ultimaVez(exercicioId: string, series: Serie[], sessoes: SessaoTreino[], sessaoAtualId?: string): Serie[] {
  const fin = sessoes
    .filter((s) => !s.excluidoEm && s.finalizadaEm && s.id !== sessaoAtualId)
    .toSorted((a, b) => (b.iniciadaEm < a.iniciadaEm ? -1 : 1));
  for (const ses of fin) {
    const l = series.filter((s) => !s.excluidoEm && s.sessaoId === ses.id && s.exercicioId === exercicioId && s.concluidaEm);
    if (l.length) return l.toSorted((a, b) => a.ordem - b.ordem);
  }
  return [];
}

/** Converte texto com vírgula decimal ("52,5") em número; inválido ou negativo → null. */
export function lerNumero(txt: string): number | null {
  const t = txt.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  return Number(t);
}

export const formatarKg = (n: number | null | undefined) =>
  n == null ? '–' : n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
