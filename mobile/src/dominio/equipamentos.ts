import { BIBLIOTECA, doCatalogo, doCatalogoPorNome, type ExercicioCatalogo } from './biblioteca';
import type { Exercicio } from './tipos';
import { MODELOS, regioesDoExercicio, type Modelo } from './treinos-sugeridos';
import type { LocalTreino } from './tour';

/**
 * Equipamentos disponíveis no lugar de treino (v0.4.3). Só no aparelho, como as outras respostas do tour.
 * Os treinos sugeridos e o "Recomendado para você" usam esta lista para priorizar modelos e trocar exercícios
 * que pedem algo que a pessoa não tem por outro DO CATÁLOGO (nada é inventado). Sem troca possível: aviso.
 */
export type Equipamento = 'peso-corpo' | 'halteres' | 'barra-anilhas' | 'banco' | 'polia' | 'maquinas' | 'elastico' | 'kettlebell' | 'barra-fixa' | 'esteira-bike';
export const EQUIPAMENTOS_LISTA: { id: Equipamento; nome: string }[] = [
  { id: 'peso-corpo', nome: 'Peso do corpo' }, { id: 'halteres', nome: 'Halteres' }, { id: 'barra-anilhas', nome: 'Barra e anilhas' },
  { id: 'banco', nome: 'Banco' }, { id: 'polia', nome: 'Polia/cabo' }, { id: 'maquinas', nome: 'Máquinas de musculação' },
  { id: 'elastico', nome: 'Elástico' }, { id: 'kettlebell', nome: 'Kettlebell' }, { id: 'barra-fixa', nome: 'Barra fixa' }, { id: 'esteira-bike', nome: 'Esteira/bike' },
];
const TODOS = EQUIPAMENTOS_LISTA.map((e) => e.id);

/** Padrão por local (sempre editável): academia marca tudo; em casa e ao ar livre, só o peso do corpo. */
export function equipamentosPadrao(local?: LocalTreino | null): Equipamento[] {
  return local === 'academia' ? [...TODOS] : ['peso-corpo'];
}

/** O que cada exercício do catálogo precisa. Exceções por nome; o resto vem do campo "equipamento". */
const POR_NOME: Record<string, Equipamento[]> = {
  'Barra fixa': ['barra-fixa'],
  'Supino reto com barra': ['barra-anilhas', 'banco'],
  'Supino inclinado com halteres': ['halteres', 'banco'],
};
const POR_CAMPO: Record<string, Equipamento[]> = { Barra: ['barra-anilhas'], Halteres: ['halteres'], 'Máquina': ['maquinas'], Polia: ['polia'], 'Peso corporal': ['peso-corpo'] };
/** v0.4.4: exercícios do catálogo trazem a lista (importação); os próprios do usuário seguem o campo "equipamento". */
export const equipamentosDoExercicio = (e: Exercicio): Equipamento[] =>
  (doCatalogo(e.id)?.equipamentos as Equipamento[] | undefined) ?? POR_NOME[e.nome] ?? POR_CAMPO[e.equipamento] ?? [];
/** Precisa de lista conhecida: "não informado na fonte" (lista vazia) nunca conta como "dá para fazer". */
export const temEquipamento = (e: Exercicio, tem: Equipamento[]) => { const l = equipamentosDoExercicio(e); return l.length > 0 && l.every((x) => tem.includes(x)); };

const TREINAVEL = new Set(['força', 'powerlifting']);
const ORDEM_NIVEL = { iniciante: 0, intermediario: 1, avancado: 2 } as const;
/** Candidatos a substituto: exercícios de força do catálogo, com foto, fora alongamentos/pliometria/olímpicos. */
const CANDIDATOS: ExercicioCatalogo[] = BIBLIOTECA.filter((x) => TREINAVEL.has(x.categoria) && x.midia && x.nivel !== 'avancado');

/**
 * Alternativa do catálogo para um exercício sem equipamento: mesmo grupo muscular e mais regiões em comum.
 * Retorna null quando o catálogo não tem opção (v0.4.4: ainda bíceps e ombros só com o peso do corpo; ver especificação 0.4.4).
 */
export function alternativaPara(e: Exercicio, tem: Equipamento[]): Exercicio | null {
  const reg = regioesDoExercicio(e.nome);
  const cand = CANDIDATOS.filter((x) => x.id !== e.id && x.grupoMuscular === e.grupoMuscular && temEquipamento(x, tem));
  // Mais regiões em comum, depois mais músculos principais em comum; empate: instrução já traduzida, depois nível mais leve, depois nome (determinístico).
  const o = doCatalogo(e.id);
  const acima = (x: ExercicioCatalogo) => Number(!!o && ORDEM_NIVEL[x.nivel] > ORDEM_NIVEL[o.nivel]); // evita trocar por algo mais difícil
  const mus = o ? [...o.musculos, ...o.musculosSecundarios] : [];
  return cand.map((x) => ({ x, n: regioesDoExercicio(x.nome).filter((r) => reg.includes(r)).length, m: [...x.musculos, ...x.musculosSecundarios].filter((u) => mus.includes(u)).length }))
    .filter((a) => a.n > 0 || !reg.length) // v0.4.4: com 870 opções, a troca precisa trabalhar ao menos uma região em comum
    .sort((a, b) => b.n - a.n || acima(a.x) - acima(b.x) || b.m - a.m || Number(!!b.x.instrucoes) - Number(!!a.x.instrucoes) || ORDEM_NIVEL[a.x.nivel] - ORDEM_NIVEL[b.x.nivel] || a.x.nome.localeCompare(b.x.nome))[0]?.x ?? null;
}

export type ItemAdaptado = { original: string; usar: string | null; troca: boolean };
/** Cada item do modelo: mantém, troca por alternativa do catálogo, ou fica sem opção (usar = null → aviso). */
export function adaptarModelo(m: Modelo, tem: Equipamento[]): ItemAdaptado[] {
  return m.itens.map((i) => {
    const e = doCatalogoPorNome(i.nome)!;
    if (temEquipamento(e, tem)) return { original: i.nome, usar: i.nome, troca: false };
    const alt = alternativaPara(e, tem);
    return { original: i.nome, usar: alt?.nome ?? null, troca: true };
  });
}

/** Modelo com as trocas aplicadas (itens sem opção saem; o aviso fica na tela). Repetições e descanso mantidos. */
export function modeloAdaptado(m: Modelo, tem: Equipamento[]): Modelo {
  const ad = adaptarModelo(m, tem);
  const vistos = new Set<string>();
  const itens = m.itens.flatMap((i, k) => {
    const u = ad[k].usar;
    if (!u || vistos.has(u)) return [];
    vistos.add(u);
    return [{ ...i, nome: u }];
  });
  // Sem nenhum exercício possível, mantém o original (a tela avisa e o botão diz isso).
  return itens.length ? { ...m, itens } : m;
}

/** Quantos itens o modelo consegue fazer com o equipamento (sem troca), para ordenar sugestões. */
export const itensCompativeis = (m: Modelo, tem: Equipamento[]) => adaptarModelo(m, tem).filter((a) => !a.troca).length / m.itens.length;

/** Grupos sem nenhum exercício do catálogo com o equipamento dado (lacunas a registrar). */
export function lacunasDoCatalogo(tem: Equipamento[]): string[] {
  const grupos = [...new Set(CANDIDATOS.map((e) => e.grupoMuscular))];
  return grupos.filter((g) => !CANDIDATOS.some((e) => e.grupoMuscular === g && temEquipamento(e, tem)));
}
/** Equipamentos do perfil: a resposta, ou o padrão do local; null se não há nenhum dos dois. */
export const equipamentosDoPerfil = (p?: { equipamentos?: Equipamento[] | null; local?: LocalTreino | null } | null): Equipamento[] | null =>
  p?.equipamentos ?? (p?.local ? equipamentosPadrao(p.local) : null);
export const AVISO_SEM_ALTERNATIVA = 'O catálogo ainda não tem uma opção para este exercício com o equipamento que você marcou. Ele fica de fora do treino adicionado.';
export { MODELOS };
