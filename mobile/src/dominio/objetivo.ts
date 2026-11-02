import { MODELOS, modeloDaArea, type Area, type Modelo } from './treinos-sugeridos';

/**
 * Objetivo, nível e dias por semana (v0.4.1) → treinos sugeridos com repetições e descanso ajustados.
 * Regras gerais do ACSM (Position Stand "Progression models in resistance training", 2009; ver
 * docs/fontes/treinos-sugeridos.md e a tabela em docs/especificacao/objetivo.md). Iniciante sempre usa 8–12
 * repetições, como o ACSM indica para quem está começando; o objetivo muda a prescrição só a partir do intermediário.
 */
export type Objetivo = 'emagrecer' | 'massa' | 'condicionamento' | 'saude' | 'forca';
export type NivelPessoa = 'iniciante' | 'intermediario' | 'avancado';
export interface PerfilTreino { objetivo: Objetivo; nivel: NivelPessoa; dias: number; /** áreas de foco (opcional) */ areas?: Area[] }

export const OBJETIVOS: { id: Objetivo; nome: string; descricao: string }[] = [
  { id: 'emagrecer', nome: 'Emagrecer', descricao: 'Treino de força junto com alimentação e água' },
  { id: 'massa', nome: 'Ganhar massa muscular', descricao: 'Mais volume, repetições moderadas' },
  { id: 'condicionamento', nome: 'Condicionamento', descricao: 'Mais repetições e descanso curto' },
  { id: 'saude', nome: 'Saúde e disposição', descricao: 'Treino equilibrado para o dia a dia' },
  { id: 'forca', nome: 'Força', descricao: 'Menos repetições e descanso longo' },
];
export const NIVEIS: { id: NivelPessoa; nome: string }[] = [{ id: 'iniciante', nome: 'Iniciante' }, { id: 'intermediario', nome: 'Intermediário' }, { id: 'avancado', nome: 'Avançado' }];
export const DIAS_MIN = 2;
export const DIAS_MAX = 6;

/** Repetições-alvo e descanso (s) por objetivo, para intermediário e avançado. */
export const REGRAS: Record<Objetivo, { reps: number; descansoS: number; faixa: string }> = {
  // ACSM: novato e intermediário 8–12 reps; avançado com ênfase em 1–6 (ver FORCA_AVANCADO).
  forca: { reps: 8, descansoS: 120, faixa: 'intermediário 8–12 reps, 2–3 min nos multiarticulares (usamos 8 reps e 2 min)' },
  massa: { reps: 10, descansoS: 90, faixa: '6–12 reps, 1–2 min (usamos 10 reps e 90 s)' },
  condicionamento: { reps: 15, descansoS: 60, faixa: '10–15 reps, até 1–2 min (usamos 15 reps e 60 s)' },
  saude: { reps: 12, descansoS: 90, faixa: '8–12 reps, 1–2 min (usamos 12 reps e 90 s)' },
  emagrecer: { reps: 12, descansoS: 90, faixa: '8–12 reps, 1–2 min (usamos 12 reps e 90 s)' },
};

/** Força no avançado: ACSM indica ênfase em 1–6 reps e 2–3 min; usamos o lado conservador (6 reps, 3 min). */
export const FORCA_AVANCADO = { reps: 6, descansoS: 180, faixa: 'avançado 1–6 reps, 2–3 min (usamos 6 reps e 3 min)' };

export const regraDe = (o: Objetivo, n: NivelPessoa) => (o === 'forca' && n === 'avancado' ? FORCA_AVANCADO : REGRAS[o]);

export const DICA_EMAGRECER = 'Combine o treino com a parte de Alimentação (guia de dietas, sem metas de calorias) e com o registro de água. Para um plano alimentar, procure um nutricionista.';

/** Divisão pelos dias: 2–3 Full Body; 4 Superiores + Inferiores; 5–6 Empurrar, Puxar e Pernas. */
export function divisaoPorDias(dias: number): string[] {
  const d = Math.min(DIAS_MAX, Math.max(DIAS_MIN, Math.round(dias)));
  if (d <= 3) return ['Full Body'];
  if (d === 4) return ['Superiores', 'Inferiores'];
  return ['Empurrar', 'Puxar', 'Pernas'];
}

/** Modelos ajustados ao objetivo. Avançado usa os modelos intermediários (não há modelo avançado). */
export function recomendar(p: PerfilTreino): Modelo[] {
  const nivelModelo = p.nivel === 'iniciante' ? 'iniciante' : 'intermediario';
  const base = divisaoPorDias(p.dias).map((nome) => MODELOS.find((x) => x.nome === nome && x.nivel === nivelModelo)!);
  // Áreas de foco: até 2 modelos extras do mesmo nível que sejam da área (sem repetir os da divisão; "em casa" fica de fora).
  const extras = (p.areas ?? []).length
    ? MODELOS.filter((m) => m.nivel === nivelModelo && !m.id.startsWith('casa') && !base.includes(m) && (p.areas ?? []).some((a) => modeloDaArea(m, a))).slice(0, 2)
    : [];
  return [...base, ...extras].map((m) => {
    if (p.nivel === 'iniciante') return m;
    const r = regraDe(p.objetivo, p.nivel);
    return { ...m, id: `${m.id}-${p.objetivo}`, itens: m.itens.map((i) => (i.reps == null ? i : { ...i, reps: i.nome === 'Panturrilha em pé' || i.nome === 'Abdominal supra' ? Math.max(r.reps, 12) : r.reps, descansoS: r.descansoS })) };
  });
}
