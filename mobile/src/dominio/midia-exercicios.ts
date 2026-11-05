import { Platform, type ImageSourcePropType } from 'react-native';
import { BASE } from '@/config/endereco';

import { doCatalogo } from './biblioteca';
import { imagemDoExercicio } from './imagens-exercicios';

/**
 * Mídias do catálogo (v0.4.4, ADR-0020): animação WebP (início ↔ fim), pôster parado e miniatura, geradas de
 * free-exercise-db por scripts/importar-free-exercise-db.py. Não vão no pacote: ficam em /quaru/exercicios/ e são
 * baixadas sob demanda (o service worker guarda as que a pessoa abriu). As 22 fotos antigas seguem no pacote.
 * No app nativo, a origem vem de EXPO_PUBLIC_MIDIA_URL; sem ela, só as 22 fotos do pacote aparecem.
 */
const BASE_WEB = `${BASE}exercicios/`;
let baseForcada: string | null | undefined;
/** Só para testes e capturas: força a origem das mídias (undefined volta ao padrão). */
export const definirBaseMidia = (b: string | null | undefined) => { baseForcada = b; };
const baseMidia = (): string | null => {
  if (baseForcada !== undefined) return baseForcada;
  const env = process.env.EXPO_PUBLIC_MIDIA_URL?.trim();
  if (env) return env.endsWith('/') ? env : env + '/';
  return Platform.OS === 'web' ? BASE_WEB : null;
};

export interface MidiaExercicio { animacao: ImageSourcePropType | null; poster: ImageSourcePropType | null; mini: ImageSourcePropType | null }

export function midiaDoExercicio(id: string): MidiaExercicio {
  const local = imagemDoExercicio(id)?.fonte ?? null;
  const e = doCatalogo(id);
  const b = baseMidia();
  if (!e?.midia || !b) return { animacao: null, poster: local, mini: local };
  const u = (suf: string) => ({ uri: `${b}${encodeURIComponent(e.midia!)}${suf}.webp` });
  return { animacao: u(''), poster: local ?? u('-p'), mini: local ?? u('-m') };
}
