import { doCatalogo, doCatalogoPorNome } from './biblioteca';
import { descansoEntreSeries, ehMultiarticular, tempoEstimadoTreino } from './descanso';
import { alternativaPara, temEquipamento, type Equipamento } from './equipamentos';
import { regraDe, type PerfilTreino } from './objetivo';
import type { Restricao, TempoTreino } from './tour';
import { MODELOS, regioesDoExercicio, type Regiao } from './treinos-sugeridos';
import { diaLocal } from './treino-de-hoje';
import type { ItemRotina, Serie, SessaoTreino } from './tipos';

/**
 * Treino do dia (v0.7): o app monta um treino para hoje com o que já sabe da pessoa. Funciona também para quem
 * não respondeu nada (começando do zero): iniciante, corpo inteiro, 45 min, equipamento de academia.
 *
 * - Foco: iniciante (ou até 3 dias por semana) treina o corpo inteiro; os outros alternam superiores e
 *   inferiores conforme o último treino feito.
 * - Exercícios: os mesmos dos treinos sugeridos (curados, com instruções em português e demonstração), um por
 *   "vaga" de região muscular; sem o equipamento, troca por uma alternativa do catálogo.
 * - Lesões informadas no tour tiram os exercícios de mais carga na região (joelho, coluna, ombro).
 * - Séries pelo nível, repetições pelo objetivo, descanso calculado, e corta exercícios até caber no tempo.
 * - `variacao` gera outra sugestão no mesmo dia ("Outra sugestão").
 * É uma sugestão geral, não uma prescrição (mesmo aviso dos treinos sugeridos).
 */
export type Foco = 'corpo-inteiro' | 'superiores' | 'inferiores';
export interface ItemDoDia { exercicioId: string; nome: string; seriesAlvo: number; repsAlvo: number | null; descansoS: number }
export interface TreinoDoDia { foco: Foco; titulo: string; motivo: string; itens: ItemDoDia[]; minutos: number }

const VAGAS: Record<Foco, Regiao[]> = {
  'corpo-inteiro': ['quadriceps', 'peito', 'costas', 'posterior', 'ombros', 'abdomen', 'gluteos'],
  superiores: ['peito', 'costas', 'ombros', 'costas', 'peito', 'biceps', 'triceps', 'abdomen'],
  inferiores: ['quadriceps', 'posterior', 'gluteos', 'quadriceps', 'panturrilha', 'abdomen'],
};
export const NOME_FOCO: Record<Foco, string> = { 'corpo-inteiro': 'Corpo inteiro', superiores: 'Superiores', inferiores: 'Inferiores' };

/** Exercícios de mais carga evitados por lesão informada (a pessoa deve procurar um profissional). */
const EVITAR: Record<Restricao, string[]> = {
  joelho: ['Agachamento livre', 'Agachamento com salto', 'Afundo com salto', 'Leg press 45°', 'Cadeira extensora'],
  coluna: ['Levantamento terra', 'Remada curvada com barra', 'Agachamento livre', 'Super-homem (extensão lombar no solo)'],
  ombro: ['Desenvolvimento com halteres', 'Desenvolvimento com elástico', 'Desenvolvimento com dois kettlebells', 'Elevação lateral', 'Elevação lateral com elástico', 'Supino reto com barra', 'Barra fixa', 'Barra fixa supinada'],
  outro: [],
};

/** Exercícios dos modelos sugeridos, sem repetição; os dos modelos de iniciante vêm primeiro (mais seguros para começar). */
const MODELOS_CASA = new Set(['casa-i', 'casa-m', 'elastico-i', 'kettlebell-m', 'barra-fixa-m']);
type ItemPool = { nome: string; iniciante: boolean; tempo: boolean; casa: boolean; reps: number | null };
const POOL: ItemPool[] = (() => {
  const vistos = new Map<string, ItemPool>();
  for (const m of [...MODELOS].sort((a, b) => Number(a.nivel !== 'iniciante') - Number(b.nivel !== 'iniciante'))) {
    for (const i of m.itens) {
      const ja = vistos.get(i.nome);
      if (ja) { ja.casa = ja.casa && MODELOS_CASA.has(m.id); continue; } // aparece em treino de academia também
      vistos.set(i.nome, { nome: i.nome, iniciante: m.nivel === 'iniciante', tempo: i.reps == null, casa: MODELOS_CASA.has(m.id), reps: i.reps });
    }
  }
  return [...vistos.values()];
})();
/** Na vaga de costas da parte de cima, só puxadas e remadas (a extensão lombar fica para o corpo inteiro em casa). */
const SO_LOMBAR = new Set(['Super-homem (extensão lombar no solo)']);

/** Número determinístico a partir do dia e da variação (mesmo dia → mesma sugestão; "Outra sugestão" muda). */
function semente(dia: string, variacao: number): number {
  let h = 2166136261;
  for (const c of `${dia}#${variacao}`) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}

/** Regiões do último treino feito (para alternar o foco). */
function regioesDoUltimo(sessoes: SessaoTreino[], series: Serie[]): Regiao[] {
  const ultima = sessoes.filter((s) => s.finalizadaEm && !s.excluidoEm).toSorted((a, b) => (a.finalizadaEm! < b.finalizadaEm! ? 1 : -1))[0];
  if (!ultima) return [];
  const ids = [...new Set(series.filter((s) => s.sessaoId === ultima.id && !s.excluidoEm).map((s) => s.exercicioId))];
  return ids.flatMap((id) => { const e = doCatalogo(id); return e ? regioesDoExercicio(e.nome) : []; });
}

export function escolherFoco(treino: PerfilTreino | null | undefined, sessoes: SessaoTreino[], series: Serie[]): { foco: Foco; motivo: string } {
  if (!treino || treino.nivel === 'iniciante' || treino.dias <= 3) return { foco: 'corpo-inteiro', motivo: treino ? 'Para quem treina até 3 vezes por semana ou está começando, o corpo inteiro em cada treino funciona melhor.' : 'Para começar do zero: um treino leve para o corpo todo.' };
  const ult = regioesDoUltimo(sessoes, series);
  const inf = ult.filter((r) => ['quadriceps', 'posterior', 'gluteos', 'panturrilha'].includes(r)).length;
  const sup = ult.filter((r) => ['peito', 'costas', 'ombros', 'biceps', 'triceps'].includes(r)).length;
  if (inf > sup) return { foco: 'superiores', motivo: 'Seu último treino foi de pernas: hoje é a vez da parte de cima.' };
  if (sup > 0) return { foco: 'inferiores', motivo: 'Seu último treino foi da parte de cima: hoje é a vez das pernas.' };
  return { foco: 'superiores', motivo: 'Para começar a semana: parte de cima hoje, pernas no próximo.' };
}

export function gerarTreinoDoDia(p: {
  treino?: PerfilTreino | null; tem?: Equipamento[] | null; tempoMin?: TempoTreino | null; restricoes?: Restricao[];
  sessoes?: SessaoTreino[]; series?: Serie[]; agora: string; variacao?: number;
}): TreinoDoDia {
  const { foco, motivo } = escolherFoco(p.treino, p.sessoes ?? [], p.series ?? []);
  const nivel = p.treino?.nivel ?? 'iniciante';
  const regra = regraDe(p.treino?.objetivo ?? 'saude', nivel);
  const seriesAlvo = nivel === 'iniciante' ? 2 : nivel === 'intermediario' ? 3 : 4;
  const evitar = new Set((p.restricoes ?? []).flatMap((r) => EVITAR[r] ?? []));
  const orcamento = p.tempoMin ?? 45;
  const s0 = semente(diaLocal(p.agora), p.variacao ?? 0);
  const usados = new Set<string>();
  const itens: ItemDoDia[] = [];

  const emCasa = !!p.tem && !p.tem.includes('maquinas') && !p.tem.includes('polia');
  for (const [k, vaga] of VAGAS[foco].entries()) {
    const candidatos = POOL
      .filter((x) => !usados.has(x.nome) && !evitar.has(x.nome) && (nivel !== 'iniciante' || x.iniciante || !['Agachamento livre', 'Levantamento terra', 'Barra fixa', 'Barra fixa supinada'].includes(x.nome)))
      .filter((x) => !(foco === 'superiores' && SO_LOMBAR.has(x.nome)))
      .filter((x) => regioesDoExercicio(x.nome)[0] === vaga || (vaga === 'abdomen' && regioesDoExercicio(x.nome).includes('abdomen')))
      .map((x) => {
        const e = doCatalogoPorNome(x.nome);
        if (!e) return null;
        // Nível de preferência: 0 = do jeito certo para o lugar e o nível; números maiores só se faltar opção melhor.
        const lugar = Number(x.casa !== emCasa);
        const nivelOk = Number(nivel === 'iniciante' && !x.iniciante);
        if (!p.tem || temEquipamento(e, p.tem)) return { ...x, e, prioridade: lugar + nivelOk };
        const alt = alternativaPara(e, p.tem);
        return alt && !evitar.has(alt.nome) ? { ...x, e: alt, prioridade: 3 + lugar + nivelOk } : null; // troca por equipamento: por último
      })
      .filter((x): x is NonNullable<typeof x> => !!x && !usados.has(x.e.nome));
    if (!candidatos.length) continue;
    const melhor = Math.min(...candidatos.map((c) => c.prioridade));
    if (nivel === 'iniciante' && melhor >= 3) continue; // para quem começa, troca por equipamento pode ser difícil: pula a vaga
    const lista = candidatos.filter((c) => c.prioridade === melhor);
    const c = lista[(s0 + k * 7) % lista.length];
    usados.add(c.nome); usados.add(c.e.nome);
    // Repetições pelo objetivo; exercícios pesados (barra fixa, terra, agachamento livre) mantêm o número menor do modelo.
    const reps = c.tempo ? null : vaga === 'abdomen' || vaga === 'panturrilha' ? Math.max(regra.reps, 15) : Math.min(regra.reps, c.reps ?? regra.reps);
    const item: ItemDoDia = { exercicioId: c.e.id, nome: c.e.nome, seriesAlvo, repsAlvo: reps, descansoS: descansoEntreSeries(doCatalogo(c.e.id), p.treino) };
    // Cabe no tempo? (mínimo de 3 exercícios)
    const proximo = [...itens, item];
    if (itens.length >= 3 && tempoEstimadoTreino(comoItensRotina(proximo)) > orcamento) break;
    itens.push(item);
  }
  // Ordem do treino: multiarticulares primeiro, isolados depois, abdômen no fim.
  const peso = (i: ItemDoDia) => (regioesDoExercicio(i.nome)[0] === 'abdomen' || i.repsAlvo == null ? 2 : ehMultiarticular(doCatalogo(i.exercicioId)) ? 0 : 1);
  itens.sort((a, b) => peso(a) - peso(b));
  return { foco, motivo, itens, minutos: tempoEstimadoTreino(comoItensRotina(itens)), titulo: `Treino do dia · ${NOME_FOCO[foco]}` };
}

/** Converte para itens de treino (rotina) com ids gerados. */
export function comoItensRotina(itens: ItemDoDia[], ids: () => string = (() => { let n = 0; return () => `tmp-${n++}`; })()): ItemRotina[] {
  return itens.map((i, k) => ({ id: ids(), exercicioId: i.exercicioId, ordem: k, seriesAlvo: i.seriesAlvo, repsAlvo: i.repsAlvo, descansoS: i.descansoS }));
}
