import type { Momento } from './refeicoes';

/**
 * Diário alimentar simples (v0.5): para cada refeição do dia, a pessoa marca como foi, sem contar calorias
 * nem registrar alimentos. Fica só no aparelho e é tratado como dado de saúde (exige o consentimento, como a água).
 */
export type Avaliacao = 'bem' | 'mais-ou-menos' | 'pulei';
export interface RegistroDiario { dia: string; momento: Momento; avaliacao: Avaliacao; atualizadoEm: string }

export const AVALIACOES: { id: Avaliacao; nome: string; emoji: string }[] = [
  { id: 'bem', nome: 'Comi bem', emoji: '😋' },
  { id: 'mais-ou-menos', nome: 'Mais ou menos', emoji: '😐' },
  { id: 'pulei', nome: 'Pulei', emoji: '⏭️' },
];

/** Marca (ou desmarca, com null) a refeição de um dia. Um registro por dia e momento. */
export function marcar(lista: RegistroDiario[], dia: string, momento: Momento, avaliacao: Avaliacao | null, agora: string): RegistroDiario[] {
  const resto = lista.filter((r) => !(r.dia === dia && r.momento === momento));
  return avaliacao ? [...resto, { dia, momento, avaliacao, atualizadoEm: agora }] : resto;
}

export const doDia = (lista: RegistroDiario[], dia: string) => lista.filter((r) => r.dia === dia);
