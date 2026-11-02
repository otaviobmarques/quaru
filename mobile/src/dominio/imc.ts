/**
 * IMC (índice de massa corporal) = peso (kg) ÷ altura (m)². Faixas da OMS para ADULTOS, com rótulos neutros
 * (sem termos que envergonhem). A faixa é decidida pelo valor já arredondado a 1 casa, o mesmo que a pessoa vê,
 * para não haver "buracos" entre 24,9 e 25.
 */
export const ALTURA_MIN_CM = 100;
export const ALTURA_MAX_CM = 250;

export type FaixaImc = 'abaixo' | 'referencia' | 'acima' | 'bem-acima';
export const ROTULO_FAIXA: Record<FaixaImc, string> = {
  abaixo: 'Abaixo de 18,5',
  referencia: 'De 18,5 a 24,9',
  acima: 'De 25 a 29,9',
  'bem-acima': '30 ou mais',
};

export const AVISO_IMC = 'O IMC é só uma referência geral para adultos. Não vale para atletas, gestantes, idosos e menores de 18 anos e não substitui uma avaliação profissional.';

export const alturaValida = (cm: number) => Number.isFinite(cm) && cm >= ALTURA_MIN_CM && cm <= ALTURA_MAX_CM;

/** IMC com 1 casa decimal, ou null se faltar dado válido. */
export function calcularImc(pesoKg: number | null | undefined, alturaCm: number | null | undefined): number | null {
  if (pesoKg == null || alturaCm == null || !(pesoKg > 0) || !alturaValida(alturaCm)) return null;
  const m = alturaCm / 100;
  return Math.round((pesoKg / (m * m)) * 10) / 10;
}

export function faixaImc(imc: number): FaixaImc {
  const v = Math.round(imc * 10) / 10;
  if (v < 18.5) return 'abaixo';
  if (v < 25) return 'referencia';
  if (v < 30) return 'acima';
  return 'bem-acima';
}

export const formatarImc = (imc: number) => imc.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
