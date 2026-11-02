/**
 * Água do dia (v0.4.1). Meta padrão: 35 ml por kg do último peso (referência geral comum; fonte em
 * docs/fontes/agua.md), arredondada para múltiplos de 50 ml; a pessoa pode editar. O dia vira à meia-noite
 * no horário LOCAL do aparelho.
 */
export interface RegistroAgua { id: string; ml: number; registradoEm: string; atualizadoEm: string }

export const ML_POR_KG = 35;
export const AGUA_MIN_ML = 1;
export const AGUA_MAX_ML = 3000; // por registro (evita erro de digitação)
export const META_MIN_ML = 500;
export const META_MAX_ML = 10000;

export const AVISO_AGUA = 'A necessidade de água varia com o calor, os exercícios e a sua saúde. Quem tem doença renal ou cardíaca, ou restrição de líquidos, deve seguir a orientação médica.';

export const arredondar50 = (ml: number) => Math.round(ml / 50) * 50;
export const metaPadraoMl = (pesoKg: number | null | undefined) => (pesoKg && pesoKg > 0 ? arredondar50(pesoKg * ML_POR_KG) : null);

/** Chave AAAA-MM-DD do dia local. */
export function diaLocal(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const totalDoDia = (l: RegistroAgua[], agora: string | Date) => {
  const k = diaLocal(agora);
  return l.filter((r) => diaLocal(r.registradoEm) === k).reduce((t, r) => t + r.ml, 0);
};

/** Últimos 7 dias locais (o mais antigo primeiro), incluindo hoje. */
export function ultimos7Dias(l: RegistroAgua[], agora: string | Date): { dia: string; ml: number }[] {
  const base = typeof agora === 'string' ? new Date(agora) : agora;
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() - (6 - i), 12);
    return { dia: diaLocal(d), ml: totalDoDia(l, d) };
  });
}

export const formatarMl = (ml: number) => (ml >= 1000 ? `${(ml / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} L` : `${ml} ml`);
