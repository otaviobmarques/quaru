import type { ImageSourcePropType } from 'react-native';

import type { IdDieta } from '@/dominio/dietas';
import { IMAGENS_DIETAS } from '@/dominio/imagens-redbox-gerado';

/**
 * Fotos das dietas (v0.4.3). As FINAIS são da RedBox, importadas com `node scripts/importar-imagens-redbox.mjs`
 * (dieta-<id>_1x1.webp para a lista, dieta-<id>_16x9.webp para o detalhe). Enquanto não chegam, ficam as
 * PROVISÓRIAS geradas por IA (sem pessoas, marcas ou texto; docs/fontes/fotos-dietas.md), com `provisoria: true`.
 */
/** Texto alternativo das antigas provisórias (IA); só vale se faltar o da RedBox. */
const ALT_PROVISORIA: Record<IdDieta, string> = {
  'vegetariana': 'Foto de um prato com arroz, feijão-preto, couve refogada, ovo frito, tomate e banana-da-terra',
  'vegana': 'Foto de uma tigela com arroz integral, feijão-preto, abóbora assada, couve, grão-de-bico, abacate e sementes',
  'mediterranea': 'Foto de um prato com peixe grelhado com limão, salada de grão-de-bico, tomate, pepino, azeitonas, pão integral e azeite',
  'paleo': 'Foto de um prato com carne grelhada, batata-doce assada, abobrinha, brócolis, folhas verdes, manga e mamão',
  'cetogenica': 'Foto de um prato com salmão grelhado, ovos cozidos, meio abacate, espinafre refogado e queijo coalho',
  'low-carb': 'Foto de um prato com frango grelhado, arroz de couve-flor, legumes refogados e salada de alface e tomate',
  'jejum-intermitente': 'Foto de um relógio ao lado de um prato simples com ovo cozido, mamão e castanhas, e uma xícara de café preto',
  'atkins': 'Foto de um prato com carne grelhada, ovo frito, couve refogada e salada de alface com tomate-cereja',
};
export const FOTOS_DIETAS: Record<IdDieta, { foto: ImageSourcePropType; mini: ImageSourcePropType; alt: string; provisoria: boolean }> =
  Object.fromEntries((Object.keys(ALT_PROVISORIA) as IdDieta[]).map((id) => {
    const g = IMAGENS_DIETAS[id];
    return [id, { foto: g.foto, mini: g.mini, provisoria: g.provisoria, alt: g.alt ?? ALT_PROVISORIA[id] }];
  })) as Record<IdDieta, { foto: ImageSourcePropType; mini: ImageSourcePropType; alt: string; provisoria: boolean }>;
