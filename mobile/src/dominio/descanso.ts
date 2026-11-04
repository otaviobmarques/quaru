import { FORCA_AVANCADO, REGRAS, type PerfilTreino } from './objetivo';
import type { ItemRotina } from './tipos';

/**
 * Descanso calculado (v0.7). Referência geral do ACSM, a mesma dos treinos sugeridos:
 * - base pelo objetivo (força 2 min; massa, saúde e emagrecer 90 s; condicionamento 60 s; força avançado 3 min);
 * - multiarticular (agachamento, supino, levantamentos) +30 s; isolado (rosca, extensora) −30 s; mínimo 45 s;
 * - alongamento e cardio: 30 s;
 * - entre um exercício e o próximo: o descanso das séries + 30 s (de 90 s a 3 min), para trocar de aparelho.
 * Sempre arredondado a 15 s. É uma referência: a pessoa pode ajustar no cronômetro (±15 s).
 */
export interface InfoExercicio { categoria?: string; musculosSecundarios?: string[]; grupoMuscular?: string }

const MULTI_CATEGORIAS = ['powerlifting', 'levantamento olímpico', 'strongman'];
const arred15 = (s: number) => Math.round(s / 15) * 15;

export function ehMultiarticular(ex?: InfoExercicio | null): boolean {
  if (!ex) return false;
  if (ex.categoria && MULTI_CATEGORIAS.includes(ex.categoria)) return true;
  return (ex.musculosSecundarios?.length ?? 0) >= 2;
}

export function descansoBase(treino?: PerfilTreino | null): number {
  if (!treino) return 90;
  if (treino.objetivo === 'forca' && treino.nivel === 'avancado') return FORCA_AVANCADO.descansoS;
  return REGRAS[treino.objetivo].descansoS;
}

/** Descanso entre as séries de um mesmo exercício, em segundos. */
export function descansoEntreSeries(ex?: InfoExercicio | null, treino?: PerfilTreino | null): number {
  if (ex?.categoria === 'alongamento' || ex?.categoria === 'cardio') return 30;
  const base = descansoBase(treino);
  const s = ehMultiarticular(ex) ? Math.min(180, base + 30) : Math.max(45, base - 30);
  return arred15(s);
}

/** Descanso ao terminar um exercício, antes do próximo (troca de aparelho), em segundos. */
export function descansoEntreExercicios(entreSeries: number): number {
  return arred15(Math.min(180, Math.max(90, entreSeries + 30)));
}

/**
 * v0.11: preferência de descanso da pessoa. Padrão: 60 s fixos entre as séries (o que ela pediu), com troca de
 * exercício de 90 s. "auto" volta ao cálculo pelo objetivo e pelo exercício. O treinador manda no treino dele.
 */
export type PreferenciaDescanso = { modo: 'fixo'; segundos: number } | { modo: 'auto' };
export const DESCANSO_PADRAO_S = 60;
export const OPCOES_DESCANSO_S = [30, 45, 60, 90, 120, 180];
export const preferenciaDescanso = (p?: PreferenciaDescanso | null): PreferenciaDescanso => p ?? { modo: 'fixo', segundos: DESCANSO_PADRAO_S };
export const rotuloDescanso = (s: number) => (s < 60 ? `${s} s` : s % 60 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${s / 60} min`);

/** Descanso entre as séries no cronômetro: treino do treinador usa o dele; senão a preferência (fixo ou calculado). */
export function descansoDaSerie(pref: PreferenciaDescanso | null | undefined, item: Pick<ItemRotina, 'descansoS'> | undefined, ex: InfoExercicio | null | undefined,
  treino: PerfilTreino | null | undefined, doTreinador: boolean): number {
  if (doTreinador && item) return item.descansoS;
  const p = preferenciaDescanso(pref);
  if (p.modo === 'fixo') return Math.max(10, Math.min(600, Math.round(p.segundos)));
  return item?.descansoS ?? descansoEntreSeries(ex, treino);
}

const SEG_POR_REP = 3;
/** Tempo estimado (min, de 5 em 5) de um treino: séries × reps × 3 s + descansos entre séries + troca entre exercícios. */
export function tempoEstimadoTreino(itens: ItemRotina[]): number {
  if (!itens.length) return 0;
  // v0.11: exercício por tempo (cardio) conta a duração dos blocos e a recuperação entre eles, sem troca de aparelho.
  const s = itens.reduce((t, i, k) => t + (i.duracaoAlvoS
    ? i.seriesAlvo * i.duracaoAlvoS + (i.seriesAlvo - 1) * i.descansoS
    : i.seriesAlvo * (i.repsAlvo ?? 10) * SEG_POR_REP + (i.seriesAlvo - 1) * i.descansoS + (k < itens.length - 1 ? descansoEntreExercicios(i.descansoS) : 0)), 0);
  return Math.max(5, Math.round(s / 60 / 5) * 5);
}
