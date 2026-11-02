import { doCatalogoPorNome } from './biblioteca';
import type { ItemRotina, Rotina } from './tipos';

/**
 * Treinos sugeridos (v0.4.1) para quem está começando. Só exercícios do catálogo do app (biblioteca.ts).
 * Volumes conservadores dentro das faixas gerais do ACSM para iniciantes e intermediários
 * (1–3 séries, 8–12 repetições, descanso de 1 a 3 min; ver docs/fontes/treinos-sugeridos.md).
 * A revisar por profissional de educação física (CREF) antes de publicar.
 */
export type Nivel = 'iniciante' | 'intermediario';
export type Regiao = 'peito' | 'ombros' | 'biceps' | 'abdomen' | 'quadriceps' | 'costas' | 'triceps' | 'gluteos' | 'posterior' | 'panturrilha';

const ex = (nome: string) => {
  const e = doCatalogoPorNome(nome);
  if (!e) throw new Error(`exercício fora do catálogo: ${nome}`);
  return e;
};

const MUSCULO_REGIAO: Record<string, Regiao | undefined> = {
  peitoral: 'peito', ombros: 'ombros', 'bíceps': 'biceps', 'abdômen': 'abdomen', 'quadríceps': 'quadriceps', dorsais: 'costas',
  'meio das costas': 'costas', lombar: 'costas', 'trapézio': 'costas', 'tríceps': 'triceps', 'glúteos': 'gluteos',
  'posterior de coxa': 'posterior', panturrilhas: 'panturrilha', adutores: 'quadriceps', abdutores: 'gluteos',
};
/** Regiões do mapa muscular por exercício do catálogo. */
export function regioesDoExercicio(nome: string): Regiao[] {
  const e = ex(nome);
  switch (e.nome) {
    case 'Cadeira extensora': return ['quadriceps'];
    case 'Mesa flexora': return ['posterior'];
    case 'Panturrilha em pé': return ['panturrilha'];
    case 'Levantamento terra': return ['posterior', 'gluteos', 'costas'];
    case 'Flexão de braço': return ['peito', 'triceps', 'ombros'];
    default: break;
  }
  if (!e.id.startsWith('00000000-0000-4000-a000-')) {
    // v0.4.4: exercícios novos do catálogo usam os músculos principais da fonte.
    const r = [...new Set(e.musculos.map((m) => MUSCULO_REGIAO[m]).filter(Boolean))] as Regiao[];
    if (r.length) return r;
  }
  const g: Record<string, Regiao[]> = { Peito: ['peito'], Costas: ['costas'], Pernas: ['quadriceps', 'gluteos'], Ombros: ['ombros'], 'Bíceps': ['biceps'], 'Tríceps': ['triceps'], 'Abdômen': ['abdomen'] };
  return g[e.grupoMuscular] ?? [];
}

type ItemModelo = { nome: string; series: number; reps: number | null; descansoS: number; segundosPorSerie?: number };
export interface Modelo { id: string; nome: string; nivel: Nivel; descricao: string; itens: ItemModelo[] }

// Iniciante: 2 séries de 12, descanso 90 s. Intermediário: 3 séries de 10, 120 s nos multiarticulares e 90 s nos isolados.
const I = (nome: string, reps: number | null = 12, seg?: number): ItemModelo => ({ nome, series: 2, reps, descansoS: 90, segundosPorSerie: seg });
const M = (nome: string, reps: number | null = 10, seg?: number): ItemModelo => ({ nome, series: 3, reps, descansoS: 120, segundosPorSerie: seg });
const Mi = (nome: string, reps: number | null = 12, seg?: number): ItemModelo => ({ nome, series: 3, reps, descansoS: 90, segundosPorSerie: seg });

export const MODELOS: Modelo[] = [
  { id: 'superiores-i', nome: 'Superiores', nivel: 'iniciante', descricao: 'Peito, costas, ombros e braços, em máquinas e halteres.',
    itens: [I('Supino inclinado com halteres'), I('Puxada frontal'), I('Remada baixa'), I('Desenvolvimento com halteres'), I('Tríceps na polia'), I('Rosca alternada')] },
  { id: 'superiores-m', nome: 'Superiores', nivel: 'intermediario', descricao: 'Mais volume e exercícios livres para a parte de cima.',
    itens: [M('Supino reto com barra'), M('Remada curvada com barra'), M('Puxada frontal'), M('Desenvolvimento com halteres'), Mi('Elevação lateral'), Mi('Rosca direta'), Mi('Tríceps francês')] },
  { id: 'inferiores-i', nome: 'Inferiores', nivel: 'iniciante', descricao: 'Pernas em máquinas, com movimentos guiados.',
    itens: [I('Leg press 45°'), I('Cadeira extensora'), I('Mesa flexora'), I('Panturrilha em pé', 15)] },
  { id: 'inferiores-m', nome: 'Inferiores', nivel: 'intermediario', descricao: 'Agachamento livre e terra, com máquinas de apoio.',
    itens: [M('Agachamento livre', 8), M('Levantamento terra', 8), Mi('Leg press 45°'), Mi('Cadeira extensora'), Mi('Mesa flexora'), Mi('Panturrilha em pé', 15)] },
  { id: 'fullbody-i', nome: 'Full Body', nivel: 'iniciante', descricao: 'O corpo todo num treino só, 2 a 3 vezes por semana.',
    itens: [I('Leg press 45°'), I('Supino inclinado com halteres'), I('Puxada frontal'), I('Desenvolvimento com halteres'), I('Prancha', null, 20)] },
  { id: 'fullbody-m', nome: 'Full Body', nivel: 'intermediario', descricao: 'Básicos com barra para o corpo todo.',
    itens: [M('Agachamento livre', 8), M('Supino reto com barra', 8), M('Remada curvada com barra'), Mi('Desenvolvimento com halteres'), Mi('Prancha', null, 30)] },
  { id: 'empurrar-i', nome: 'Empurrar', nivel: 'iniciante', descricao: 'Peito, ombros e tríceps.',
    itens: [I('Supino inclinado com halteres'), I('Crucifixo na máquina'), I('Desenvolvimento com halteres'), I('Tríceps na polia')] },
  { id: 'empurrar-m', nome: 'Empurrar', nivel: 'intermediario', descricao: 'Peito, ombros e tríceps com mais volume.',
    itens: [M('Supino reto com barra', 8), M('Supino inclinado com halteres'), M('Desenvolvimento com halteres'), Mi('Elevação lateral'), Mi('Tríceps na polia'), Mi('Tríceps francês')] },
  { id: 'puxar-i', nome: 'Puxar', nivel: 'iniciante', descricao: 'Costas e bíceps.',
    itens: [I('Puxada frontal'), I('Remada baixa'), I('Rosca alternada'), I('Abdominal supra', 15)] },
  { id: 'puxar-m', nome: 'Puxar', nivel: 'intermediario', descricao: 'Costas e bíceps, com barra fixa.',
    itens: [M('Barra fixa', 6), M('Remada curvada com barra', 8), M('Puxada frontal'), Mi('Remada baixa'), Mi('Rosca direta')] },
  { id: 'pernas-i', nome: 'Pernas', nivel: 'iniciante', descricao: 'Pernas e abdômen, para a divisão Empurrar/Puxar/Pernas.',
    itens: [I('Leg press 45°'), I('Mesa flexora'), I('Cadeira extensora'), I('Panturrilha em pé', 15), I('Prancha', null, 20)] },
  { id: 'pernas-m', nome: 'Pernas', nivel: 'intermediario', descricao: 'Pernas completas e abdômen.',
    itens: [M('Agachamento livre', 8), M('Leg press 45°'), Mi('Mesa flexora'), Mi('Cadeira extensora'), Mi('Panturrilha em pé', 15), Mi('Abdominal supra', 15)] },
  // v0.4.4: com o catálogo novo, os treinos em casa cobrem pernas, glúteos, lombar e tríceps sem equipamento.
  { id: 'casa-i', nome: 'Iniciante em casa', nivel: 'iniciante', descricao: 'Sem equipamento, só com o peso do corpo: pernas, peito, lombar e abdômen.',
    itens: [I('Agachamento com peso do corpo'), I('Ponte de glúteo'), I('Flexão de braço', 8), I('Super-homem (extensão lombar no solo)', 10), I('Abdominal supra', 12), I('Prancha', null, 20)] },
  { id: 'casa-m', nome: 'Em casa', nivel: 'intermediario', descricao: 'Sem equipamento, com saltos e mais séries.',
    itens: [M('Agachamento com salto', 10), M('Afundo com salto', 8), Mi('Ponte de glúteo unilateral', 10), M('Flexão de braço', 12), Mi('Flexão de braço fechada (tríceps)', 10), Mi('Super-homem (extensão lombar no solo)', 12), Mi('Prancha', null, 40)] },
  { id: 'elastico-i', nome: 'Em casa com elástico', nivel: 'iniciante', descricao: 'Ombros, pernas e tríceps com um elástico de exercício.',
    itens: [I('Agachamento com elástico'), I('Desenvolvimento com elástico'), I('Elevação lateral com elástico'), I('Abertura com elástico (pull apart)'), I('Panturrilha com elástico', 15), I('Flexão de braço', 8)] },
  { id: 'kettlebell-m', nome: 'Kettlebell', nivel: 'intermediario', descricao: 'Corpo todo com kettlebell.',
    itens: [M('Agachamento goblet'), M('Remada unilateral com kettlebell'), M('Desenvolvimento com dois kettlebells'), Mi('Flexão de braço fechada (tríceps)', 10), Mi('Prancha', null, 30)] },
  { id: 'barra-fixa-m', nome: 'Barra fixa em casa', nivel: 'intermediario', descricao: 'Costas e bíceps com uma barra fixa, mais pernas sem equipamento.',
    itens: [M('Barra fixa', 6), M('Barra fixa supinada', 6), M('Agachamento com peso do corpo', 15), Mi('Ponte de glúteo', 12), Mi('Prancha', null, 30)] },
];

/** Tempo de uma repetição (s) e de troca entre exercícios (s): premissas para a estimativa, não regra de treino. */
export const SEG_POR_REP = 3;
export const SEG_TROCA = 60;

/** Minutos estimados: Σ séries × (reps × 3 s ou tempo da série) + descanso entre séries + 1 min de troca. Arredonda para 5 min. */
export function tempoEstimadoMin(m: Modelo): number {
  const s = m.itens.reduce((t, i) => t + i.series * (i.reps != null ? i.reps * SEG_POR_REP : (i.segundosPorSerie ?? 30)) + (i.series - 1) * i.descansoS + SEG_TROCA, 0);
  return Math.max(5, Math.round(s / 60 / 5) * 5);
}

export const equipamentosDoModelo = (m: Modelo) => [...new Set(m.itens.map((i) => ex(i.nome).equipamento))];
export const regioesDoModelo = (m: Modelo) => [...new Set(m.itens.flatMap((i) => regioesDoExercicio(i.nome)))];

/** Rotina nova (editável) a partir do modelo. `ids` gera ids (novoId no app). */
export function rotinaDoModelo(m: Modelo, ordem: number, ids: () => string, agora: string): Rotina {
  const itens: ItemRotina[] = m.itens.map((i, k) => ({ id: ids(), exercicioId: ex(i.nome).id, ordem: k + 1, seriesAlvo: i.series, repsAlvo: i.reps, descansoS: i.descansoS }));
  return { id: ids(), nome: `${m.nome} (${m.nivel === 'iniciante' ? 'iniciante' : 'intermediário'})`, ordem, itens, atualizadoEm: agora };
}

export const AVISO_TREINO = 'Sugestões gerais, não uma prescrição. Procure um profissional de educação física para ajustar o treino a você e pare o exercício se sentir dor.';

/** Áreas do corpo (v0.4.1) para filtrar sugestões e focar a recomendação. */
export type Area = 'superiores' | 'inferiores' | 'corpo-inteiro' | 'core' | 'peito' | 'costas' | 'pernas' | 'bracos' | 'ombros';
const SUP: Regiao[] = ['peito', 'costas', 'ombros', 'biceps', 'triceps'];
const INF: Regiao[] = ['quadriceps', 'gluteos', 'posterior', 'panturrilha'];
export const AREAS: { id: Area; nome: string; regioes: Regiao[]; principal: boolean }[] = [
  { id: 'superiores', nome: 'Superiores', regioes: SUP, principal: true },
  { id: 'inferiores', nome: 'Inferiores', regioes: INF, principal: true },
  { id: 'corpo-inteiro', nome: 'Corpo inteiro', regioes: [...SUP, ...INF], principal: true },
  { id: 'core', nome: 'Abdômen/Core', regioes: ['abdomen'], principal: true },
  { id: 'peito', nome: 'Peito', regioes: ['peito'], principal: false },
  { id: 'costas', nome: 'Costas', regioes: ['costas'], principal: false },
  { id: 'pernas', nome: 'Pernas', regioes: INF, principal: false },
  { id: 'bracos', nome: 'Braços', regioes: ['biceps', 'triceps'], principal: false },
  { id: 'ombros', nome: 'Ombros', regioes: ['ombros'], principal: false },
];

/**
 * O modelo "é" da área quando pelo menos metade dos exercícios trabalha a área (Corpo inteiro: tem exercício
 * de cima E de baixo). Core: pelo menos um exercício de abdômen.
 */
export function modeloDaArea(m: Modelo, a: Area): boolean {
  const regs = m.itens.map((i) => regioesDoExercicio(i.nome));
  const toca = (lista: Regiao[]) => regs.filter((r) => r.some((x) => lista.includes(x))).length;
  if (a === 'corpo-inteiro') return toca(SUP) > 0 && toca(INF) > 0;
  if (a === 'core') return toca(['abdomen']) > 0;
  const area = AREAS.find((x) => x.id === a)!;
  return toca(area.regioes) * 2 >= m.itens.length;
}
