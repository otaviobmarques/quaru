import { describe, expect, it } from 'vitest';
import { endpointValido, jwtVapid, lerPedido, proximoPasso } from '../supabase/functions/aviso-descanso/regras';

const TOKEN = '3f1d2c3b-4a5e-4f60-8a7b-9c0d1e2f3a4b';

describe('aviso-descanso: regras', () => {
  it('só aceita endpoints dos serviços de push conhecidos (sem chamar endereços quaisquer)', () => {
    for (const ok of ['https://fcm.googleapis.com/fcm/send/abc123def456', 'https://web.push.apple.com/QGx_abc-123456', 'https://updates.push.services.mozilla.com/wpush/v2/abc',
      'https://wns2-bl2p.notify.windows.com/w/?token=abc']) expect(endpointValido(ok)).toBe(true);
    for (const ruim of ['http://fcm.googleapis.com/fcm/send/abc123def456', 'https://fcm.googleapis.com.evil.com/x/aaaaaaaa', 'https://evil.com/fcm.googleapis.com/aaaa',
      'https://fcm.googleapis.com:8443/fcm/send/abc123', 'https://169.254.169.254/latest/meta-data/xx', 'javascript:alert(1)//aaaaaaaaaaaa', 42, null]) expect(endpointValido(ruim)).toBe(false);
  });
  it('valida os pedidos', () => {
    expect(lerPedido({ acao: 'agendar', segundos: 60.4, token: TOKEN })).toEqual({ acao: 'agendar', segundos: 60, token: TOKEN });
    expect(lerPedido({ acao: 'agendar', segundos: 0, token: TOKEN })).toHaveProperty('erro');
    expect(lerPedido({ acao: 'agendar', segundos: 5000, token: TOKEN })).toHaveProperty('erro');
    expect(lerPedido({ acao: 'agendar', segundos: 60, token: 'x' })).toHaveProperty('erro');
    expect(lerPedido({ acao: 'inscrever', endpoint: 'https://evil.com/aaaaaaaaaaaaaaaaaaaa' })).toHaveProperty('erro');
    expect(lerPedido({ acao: 'cancelar' })).toEqual({ acao: 'cancelar' });
    expect(lerPedido({ acao: 'qualquer' })).toHaveProperty('erro');
  });
  it('passos: dorme até o fim, no máximo 100 s por vez, e depois continua em outra chamada', () => {
    expect(proximoPasso(60_000, 0, 0)).toEqual({ acao: 'dormir', ms: 60_000 });
    expect(proximoPasso(300_000, 0, 0)).toEqual({ acao: 'dormir', ms: 100_000 });
    expect(proximoPasso(300_000, 100_000, 0)).toEqual({ acao: 'continuar' });
    expect(proximoPasso(60_000, 59_900, 0)).toEqual({ acao: 'enviar' });
  });
  it('JWT VAPID ES256 válido, com aud do serviço e validade de 1 hora', async () => {
    const par = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']) as CryptoKeyPair;
    const jwt = await jwtVapid('https://web.push.apple.com/QGx_abc', par.privateKey, 1000);
    const [h, c, s] = jwt.split('.');
    const dec = (x: string) => JSON.parse(Buffer.from(x, 'base64url').toString());
    expect(dec(h)).toEqual({ typ: 'JWT', alg: 'ES256' });
    expect(dec(c)).toEqual({ aud: 'https://web.push.apple.com', exp: 4600, sub: 'https://otaviobmarques.github.io/quaru/' });
    const ok = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, par.publicKey, Buffer.from(s, 'base64url'), new TextEncoder().encode(`${h}.${c}`));
    expect(ok).toBe(true);
  });
});
