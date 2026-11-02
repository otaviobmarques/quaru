import type { Serie } from './tipos';

/**
 * Progressão dupla (v0.5), conservadora: se na última vez TODAS as séries de trabalho chegaram às repetições-alvo,
 * sugere subir a carga um degrau (5%, arredondado a 0,5 kg, entre 1 e 2,5 kg). Sem carga (peso do corpo),
 * sugere +1 repetição. Se alguma série ficou abaixo do alvo, não sugere nada: o certo é repetir a carga.
 * É só uma sugestão; a pessoa decide e o aviso lembra de manter a carga se a técnica piorar ou houver dor.
 */
export type Progressao = { tipo: 'carga'; deKg: number; paraKg: number; incrementoKg: number } | { tipo: 'reps'; paraReps: number };

export const AVISO_PROGRESSAO = 'Se a técnica piorar ou sentir dor, mantenha a carga anterior.';

export function sugerirProgressao(ultima: Serie[], repsAlvo: number | null): Progressao | null {
  const trabalho = ultima.filter((s) => s.tipo !== 'aquecimento' && s.reps != null);
  if (!repsAlvo || trabalho.length === 0) return null;
  if (!trabalho.every((s) => (s.reps ?? 0) >= repsAlvo)) return null;
  const cargas = trabalho.map((s) => s.cargaKg ?? 0);
  const carga = Math.max(...cargas);
  if (carga <= 0) return { tipo: 'reps', paraReps: repsAlvo + 1 };
  const inc = Math.min(2.5, Math.max(1, Math.round(carga * 0.05 * 2) / 2));
  return { tipo: 'carga', deKg: carga, paraKg: Math.round((carga + inc) * 2) / 2, incrementoKg: inc };
}
