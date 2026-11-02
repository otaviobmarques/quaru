import { randomUUID } from 'expo-crypto';
/** uuid v4 gerado no aparelho (offline-first, ADR-0003). */
export const novoId = () => randomUUID();
