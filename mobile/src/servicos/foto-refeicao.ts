import type { Estado } from '@/estado/armazem';
import { temIa } from '@/estado/armazem';

/**
 * Fluxo preparado para a foto de refeição (diário alimentar ainda não integrado – @domma/nutricao).
 * Consentimento contextual: no primeiro uso, pede autorização (tela /consentimento-ia); sem ela, segue a busca manual.
 */
export type ProximoPasso = 'pedir_consentimento' | 'analisar_foto';
export const proximoPassoFoto = (e: Estado): ProximoPasso => (temIa(e) ? 'analisar_foto' : 'pedir_consentimento');
