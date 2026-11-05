/**
 * v0.12.1: onde o app está publicado. O endereço base vem de EXPO_PUBLIC_BASE_URL na hora do build:
 * "/quaru" no GitHub Pages (endereço antigo) e "" na Vercel (https://app.quaru.com.br, na raiz).
 */
export const BASE_PATH = process.env.EXPO_PUBLIC_BASE_URL ?? '/quaru';
/** Sempre termina com "/": "/quaru/" ou "/". */
export const BASE = `${BASE_PATH}/`;

/** Mudança de endereço: o antigo (GitHub Pages) leva os dados do aparelho para o novo (Vercel). */
export const ORIGEM_ANTIGA = 'https://otaviobmarques.github.io';
export const ORIGEM_NOVA = 'https://app.quaru.com.br';
export const URL_APP_NOVA = `${ORIGEM_NOVA}/`;
