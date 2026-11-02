/**
 * ADR-0013: armazenamento da VERSÃO WEB (PWA). O Metro escolhe este arquivo na web; o Android/iPhone usam
 * armazenamento.ts (SQLCipher, ADR-0010). Na web não há SQLCipher nem Keychain: o estado fica no localStorage
 * DESTE navegador, SEM criptografia do aparelho. Nenhuma chave, token ou senha é gravada aqui.
 */
export const CHAVE_ASYNC = 'app-academia:estado:v1'; // mesma chave usada pelas capturas e pela versão anterior
export type Modo = 'cifrado' | 'teste-sem-cifra' | 'web' | 'bloqueado';
export interface Armazenamento { modo: Modo; ler(): Promise<string | null>; gravar(texto: string): Promise<void>; apagarTudo(): Promise<void> }

function local(): Storage | null {
  try { return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null; } catch { return null; } // modo privado pode bloquear
}

export function criarArmazenamentoWeb(ls: Storage | null = local()): Armazenamento {
  return {
    modo: 'web',
    ler: async () => ls?.getItem(CHAVE_ASYNC) ?? null,
    gravar: async (t) => { ls?.setItem(CHAVE_ASYNC, t); },
    apagarTudo: async () => {
      if (!ls) return;
      // Apaga tudo o que o app gravou neste navegador (chaves do app), sem tocar em outros sites do mesmo domínio.
      for (const k of Object.keys(ls)) if (k.startsWith('app-academia:') || k.startsWith('quaru')) ls.removeItem(k);
    },
  };
}

export async function criarArmazenamento(_dev?: boolean): Promise<Armazenamento> { return criarArmazenamentoWeb(); }
