import type { Aniversario } from './aniversario';
import { equipamentosPadrao, itensCompativeis, type Equipamento } from './equipamentos';
import type { IdDieta } from './dietas';
import { recomendar, type PerfilTreino } from './objetivo';
import type { Etiqueta } from './refeicoes';
import { MODELOS, modeloDaArea, tempoEstimadoMin, type Area, type Modelo } from './treinos-sugeridos';

/**
 * Tour guiado (v0.4.1): dados que a pessoa pode informar no primeiro acesso. Todos opcionais ("Pular"),
 * editáveis em Perfil → Meus dados e guardados só no aparelho. Não pedimos documento, gênero, data de nascimento
 * nem localização em tempo real (ADR-0016).
 */
export type FaixaIdade = 'menos-18' | '18-29' | '30-44' | '45-59' | '60-mais';
export type Experiencia = 'nunca' | 'parado' | 'menos-1' | '1-3' | 'mais-3';
export type TempoTreino = 30 | 45 | 60;
export type LocalTreino = 'academia' | 'casa' | 'ar-livre';
export type Restricao = 'joelho' | 'coluna' | 'ombro' | 'outro';
export type PrefAlimentar = 'sem-restricao' | 'vegetariana' | 'vegana' | 'low-carb' | 'mediterranea' | 'sem-lactose' | 'sem-gluten';
export interface Lembretes { treinoHora: string | null; agua: boolean }

export const FAIXAS_IDADE: { id: FaixaIdade; nome: string }[] = [
  { id: 'menos-18', nome: 'Menos de 18' }, { id: '18-29', nome: '18 a 29' }, { id: '30-44', nome: '30 a 44' }, { id: '45-59', nome: '45 a 59' }, { id: '60-mais', nome: '60 ou mais' },
];
export const EXPERIENCIAS: { id: Experiencia; nome: string }[] = [
  { id: 'nunca', nome: 'Nunca treinei' }, { id: 'parado', nome: 'Parado há um tempo' }, { id: 'menos-1', nome: 'Menos de 1 ano' }, { id: '1-3', nome: '1 a 3 anos' }, { id: 'mais-3', nome: 'Mais de 3 anos' },
];
export const TEMPOS: { id: TempoTreino; nome: string }[] = [{ id: 30, nome: '30 min' }, { id: 45, nome: '45 min' }, { id: 60, nome: '60 min ou mais' }];
export const LOCAIS: { id: LocalTreino; nome: string }[] = [{ id: 'academia', nome: 'Academia' }, { id: 'casa', nome: 'Em casa' }, { id: 'ar-livre', nome: 'Ao ar livre' }];
export const RESTRICOES: { id: Restricao; nome: string }[] = [{ id: 'joelho', nome: 'Joelho' }, { id: 'coluna', nome: 'Coluna' }, { id: 'ombro', nome: 'Ombro' }, { id: 'outro', nome: 'Outro' }];
export const PREFERENCIAS: { id: PrefAlimentar; nome: string; dieta?: IdDieta; etiqueta?: Etiqueta }[] = [
  { id: 'sem-restricao', nome: 'Sem restrição' },
  { id: 'vegetariana', nome: 'Vegetariana', dieta: 'vegetariana', etiqueta: 'vegetariana' },
  { id: 'vegana', nome: 'Vegana', dieta: 'vegana', etiqueta: 'vegana' },
  { id: 'low-carb', nome: 'Low-carb', dieta: 'low-carb', etiqueta: 'low-carb' },
  { id: 'mediterranea', nome: 'Mediterrânea', dieta: 'mediterranea', etiqueta: 'mediterranea' },
  { id: 'sem-lactose', nome: 'Sem lactose', etiqueta: 'sem-lactose' },
  { id: 'sem-gluten', nome: 'Sem glúten', etiqueta: 'sem-gluten' },
];

export const AVISO_RESTRICAO = 'Se você tem dor ou lesão, procure um médico ou fisioterapeuta antes de treinar. O Quaru não faz diagnóstico: só usa esta informação para mostrar avisos e deixar por último os treinos que forçam a região.';
export const AVISO_MENOR = 'Menores de 18 anos devem treinar com acompanhamento de um profissional de educação física e com autorização dos responsáveis.';
export const MOTIVO_CIDADE = 'Para, no futuro, indicar academias perto de você. Digite à mão: o Quaru não usa a sua localização.';
export const LIMITE_TEXTO_LOCAL = 60;

export const validarHora = (h: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(h);
/** Sem nível escolhido, a experiência sugere um: nunca/parado/menos de 1 ano → iniciante; 1–3 → intermediário; 3+ → avançado. */
export const nivelDaExperiencia = (x: Experiencia) => (x === 'mais-3' ? 'avancado' : x === '1-3' ? 'intermediario' : 'iniciante') as PerfilTreino['nivel'];

/** Região que cada restrição deixa para o fim da lista (não esconde nada). */
const AREA_DA_RESTRICAO: Partial<Record<Restricao, Area>> = { joelho: 'inferiores', ombro: 'ombros', coluna: 'core' };

export interface DadosTour {
  faixaIdade?: FaixaIdade | null; experiencia?: Experiencia | null; tempoTreinoMin?: TempoTreino | null; local?: LocalTreino | null;
  restricoes?: Restricao[] | null; prefAlimentar?: PrefAlimentar | null; lembretes?: Lembretes | null; cidade?: string | null; bairro?: string | null;
  /** v0.4.3: equipamentos no lugar de treino. null = ainda não respondido (usa o padrão do local). */
  equipamentos?: Equipamento[] | null;
  /** v0.9: aniversário (dia e mês; ano opcional), para o Quaru dar parabéns. */
  aniversario?: Aniversario | null;
}
export interface Recomendacao { modelos: (Modelo & { cabeNoTempo: boolean })[]; avisos: string[] }

/**
 * Recomendação com os dados do tour: em casa/ao ar livre o treino sem aparelhos vem primeiro; o que cabe no tempo
 * por treino vem antes; treinos que forçam uma região com restrição vão para o fim. Nada é escondido.
 */
export function recomendarPara(treino: PerfilTreino, d: DadosTour = {}): Recomendacao {
  let lista: Modelo[] = recomendar(treino);
  const temTudo = !d.equipamentos || d.equipamentos.length === equipamentosPadrao('academia').length;
  if (d.local === 'casa' || d.local === 'ar-livre' || !temTudo) {
    const semAparelho = MODELOS.filter((m) => m.id.startsWith('casa'));
    lista = [...semAparelho, ...lista.filter((m) => !m.id.startsWith('casa'))];
  }
  const areasEvitar = (d.restricoes ?? []).map((r) => AREA_DA_RESTRICAO[r]).filter(Boolean) as Area[];
  const peso = (m: Modelo) => (areasEvitar.some((a) => modeloDaArea(m, a)) ? 2 : 0) + (d.tempoTreinoMin && tempoEstimadoMin(m) > (d.tempoTreinoMin === 60 ? 999 : d.tempoTreinoMin) ? 1 : 0);
  // v0.4.3: com equipamento conhecido (resposta ou padrão do local), quem dá para fazer sem trocas vem antes.
  const tem = d.equipamentos ?? (d.local ? equipamentosPadrao(d.local) : null);
  const compat = (m: Modelo) => (tem ? itensCompativeis(m, tem) : 1);
  const modelos = lista.map((m, i) => ({ m, i })).sort((a, b) => Math.floor(peso(a.m) / 2) - Math.floor(peso(b.m) / 2) || compat(b.m) - compat(a.m) || peso(a.m) - peso(b.m) || a.i - b.i)
    .map(({ m }) => ({ ...m, cabeNoTempo: !d.tempoTreinoMin || d.tempoTreinoMin === 60 || tempoEstimadoMin(m) <= d.tempoTreinoMin }));
  const avisos: string[] = [];
  if (d.faixaIdade === 'menos-18') avisos.push(AVISO_MENOR);
  if ((d.restricoes ?? []).length) avisos.push(AVISO_RESTRICAO);
  if (d.experiencia === 'parado' || d.experiencia === 'nunca') avisos.push('Comece leve e aumente aos poucos. Na dúvida, peça ajuda a um profissional de educação física.');
  return { modelos, avisos };
}

export const dietaDaPreferencia = (p?: PrefAlimentar | null) => PREFERENCIAS.find((x) => x.id === p)?.dieta ?? null;
export const etiquetaDaPreferencia = (p?: PrefAlimentar | null) => PREFERENCIAS.find((x) => x.id === p)?.etiqueta ?? null;
/** O IMC adulto da OMS não vale para menores de 18: aí não mostramos faixa. */
export const imcSeAplica = (f?: FaixaIdade | null) => f !== 'menos-18';
