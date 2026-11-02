import { CREDITOS_FOTOS } from '@/dominio/imagens-redbox-gerado';

/** Crédito de uma foto da RedBox ('dieta-<id>' ou 'refeicao-<id>'), copiado do LEIAME.md da entrega. */
export const creditoDe = (arquivo: string) => CREDITOS_FOTOS.find((c) => c.arquivo === arquivo) ?? null;
/** Linha curta para legenda: "Foto: Autor · Pexels License". Licenças Pexels/Pixabay não exigem crédito; damos assim mesmo. */
export const legendaCredito = (arquivo: string) => { const c = creditoDe(arquivo); return c ? `Foto: ${c.autor} · ${c.licenca}` : null; };
export { CREDITOS_FOTOS };
