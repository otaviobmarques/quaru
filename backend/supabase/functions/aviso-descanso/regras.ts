// Regras puras da função aviso-descanso (sem Deno nem rede), testadas em test/aviso-descanso.test.ts.

/** Só serviços de push conhecidos (evita a função ser usada para chamar endereços quaisquer). */
const HOSTS = [/^fcm\.googleapis\.com$/, /^android\.googleapis\.com$/, /^(web\.)?push\.apple\.com$/, /\.push\.apple\.com$/,
  /^updates\.push\.services\.mozilla\.com$/, /\.notify\.windows\.com$/];
export function endpointValido(e: unknown): e is string {
  if (typeof e !== 'string' || e.length < 20 || e.length > 1000) return false;
  try { const u = new URL(e); return u.protocol === 'https:' && !u.port && HOSTS.some((h) => h.test(u.hostname)); } catch { return false; }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const MAX_SEGUNDOS = 900;

export type Pedido =
  | { acao: 'chave' }
  | { acao: 'inscrever' | 'remover'; endpoint: string }
  | { acao: 'agendar'; segundos: number; token: string }
  | { acao: 'continuar'; token: string }
  | { acao: 'cancelar' };

export function lerPedido(c: unknown): Pedido | { erro: string } {
  if (!c || typeof c !== 'object') return { erro: 'Pedido inválido.' };
  const p = c as Record<string, unknown>;
  switch (p.acao) {
    case 'chave': case 'cancelar': return { acao: p.acao };
    case 'inscrever': case 'remover':
      return endpointValido(p.endpoint) ? { acao: p.acao, endpoint: p.endpoint } : { erro: 'Endereço de push inválido.' };
    case 'agendar': {
      const s = Math.round(Number(p.segundos));
      if (!Number.isFinite(s) || s < 1 || s > MAX_SEGUNDOS) return { erro: 'Tempo inválido.' };
      if (typeof p.token !== 'string' || !UUID.test(p.token)) return { erro: 'Token inválido.' };
      return { acao: 'agendar', segundos: s, token: p.token };
    }
    case 'continuar':
      return typeof p.token === 'string' && UUID.test(p.token) ? { acao: 'continuar', token: p.token } : { erro: 'Token inválido.' };
    default: return { erro: 'Ação desconhecida.' };
  }
}

export const b64url = (b: ArrayBuffer | Uint8Array) => {
  const u = b instanceof Uint8Array ? b : new Uint8Array(b);
  let s = ''; for (const x of u) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const texto = (o: unknown) => b64url(new TextEncoder().encode(JSON.stringify(o)));

/** JWT VAPID (ES256) para o serviço de push. `sub` é o endereço do app (sem e-mail de ninguém). */
export async function jwtVapid(endpoint: string, privada: CryptoKey, agoraS = Math.floor(Date.now() / 1000), sub = 'https://app.quaru.com.br/') {
  const aud = new URL(endpoint).origin;
  const corpo = `${texto({ typ: 'JWT', alg: 'ES256' })}.${texto({ aud, exp: agoraS + 3600, sub })}`;
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privada, new TextEncoder().encode(corpo));
  return `${corpo}.${b64url(sig)}`;
}

/** Quanto dormir agora: até o fim, mas no máximo `passo` (a função tem limite de tempo; depois ela se chama de novo). */
export function proximoPasso(fimMs: number, agoraMs: number, inicioMs: number, passoMs = 100_000): { acao: 'enviar' } | { acao: 'dormir'; ms: number } | { acao: 'continuar' } {
  const falta = fimMs - agoraMs;
  if (falta <= 300) return { acao: 'enviar' };
  const usado = agoraMs - inicioMs;
  if (usado >= passoMs) return { acao: 'continuar' };
  return { acao: 'dormir', ms: Math.min(falta, passoMs - usado) };
}
