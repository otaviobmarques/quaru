// Função de borda aviso-descanso (v0.11, ADR-0025): avisa o fim do descanso com a tela bloqueada (web/PWA).
// Quem chama manda o próprio token. O app: pega a chave pública, inscreve o aparelho e, a cada descanso, agenda o aviso.
// A função dorme até o fim e manda um push SEM conteúdo para os aparelhos da pessoa (o service worker mostra
// "Descanso terminou"). Um descanso novo, um ajuste (±15 s) ou "pular" trocam/apagam o token e o aviso antigo desiste.
// Limite de tempo da função: dorme em passos de até 100 s e, se precisar, chama a si mesma para continuar.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import { b64url, jwtVapid, lerPedido, proximoPasso } from './regras.ts';

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void };
const env = (k: string) => Deno.env.get(k) ?? '';
const ORIGENS = (env('ORIGENS_ADMIN') || 'https://otaviobmarques.github.io').split(',').map((s) => s.trim()).filter(Boolean);
const URL_FUNCAO = `${env('SUPABASE_URL')}/functions/v1/aviso-descanso`;
const MAX_INSCRICOES = 5;

function cabecalhos(origem: string | null): Record<string, string> {
  const ok = origem && ORIGENS.includes(origem) ? origem : ORIGENS[0] ?? '';
  return { 'Access-Control-Allow-Origin': ok, 'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Vary': 'Origin', 'Content-Type': 'application/json; charset=utf-8' };
}
const resposta = (origem: string | null, status: number, corpo: unknown) => new Response(JSON.stringify(corpo), { status, headers: cabecalhos(origem) });
const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false, autoRefreshToken: false } });

let chavesCache: { publica: string; privada: CryptoKey } | null = null;
async function chaves() {
  if (chavesCache) return chavesCache;
  let { data } = await admin.from('push_chaves').select('publica, privada').eq('id', 1).maybeSingle();
  if (!data) {
    const par = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']) as CryptoKeyPair;
    const publica = b64url(await crypto.subtle.exportKey('raw', par.publicKey));
    const privada = await crypto.subtle.exportKey('jwk', par.privateKey);
    await admin.from('push_chaves').upsert({ id: 1, publica, privada }, { onConflict: 'id', ignoreDuplicates: true });
    ({ data } = await admin.from('push_chaves').select('publica, privada').eq('id', 1).maybeSingle());
    if (!data) throw new Error('sem_chaves');
  }
  const privada = await crypto.subtle.importKey('jwk', data.privada as JsonWebKey, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  chavesCache = { publica: data.publica as string, privada };
  return chavesCache;
}

async function enviarPara(usuario: string) {
  const { publica, privada } = await chaves();
  const { data: subs } = await admin.from('push_inscricoes').select('endpoint').eq('usuario_id', usuario);
  await Promise.all((subs ?? []).map(async ({ endpoint }) => {
    try {
      const r = await fetch(endpoint, { method: 'POST', headers: { TTL: '120', Urgency: 'high', Topic: 'descanso',
        Authorization: `vapid t=${await jwtVapid(endpoint, privada)}, k=${publica}`, 'Content-Length': '0' } });
      if (r.status === 404 || r.status === 410) await admin.from('push_inscricoes').delete().eq('endpoint', endpoint); // inscrição vencida
      await r.body?.cancel();
    } catch (e) { console.error('[aviso-descanso] push', (e as Error).message); }
  }));
}

/** Dorme até o fim do descanso. Se o token mudou (novo descanso, ajuste, pular), desiste. */
async function vigiar(usuario: string, token: string, autorizacao: string) {
  const inicio = Date.now();
  for (;;) {
    const { data } = await admin.from('avisos_descanso').select('token, fim_em').eq('usuario_id', usuario).maybeSingle();
    if (!data || data.token !== token) return;
    const passo = proximoPasso(+new Date(data.fim_em), Date.now(), inicio);
    if (passo.acao === 'dormir') { await dormir(passo.ms); continue; }
    if (passo.acao === 'continuar') {
      await fetch(URL_FUNCAO, { method: 'POST', headers: { Authorization: autorizacao, apikey: env('SUPABASE_ANON_KEY'), 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'continuar', token }) }).then((r) => r.body?.cancel()).catch(() => {});
      return;
    }
    const { data: apagado } = await admin.from('avisos_descanso').delete().eq('usuario_id', usuario).eq('token', token).select('token');
    if (apagado?.length) await enviarPara(usuario); // só um envio, mesmo se duas cópias acordarem juntas
    return;
  }
}

Deno.serve(async (req) => {
  const origem = req.headers.get('Origin');
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cabecalhos(origem) });
  if (req.method !== 'POST') return resposta(origem, 405, { erro: 'Use POST.' });
  if (origem && !ORIGENS.includes(origem)) return resposta(origem, 403, { erro: 'Origem não autorizada.' });
  const autorizacao = req.headers.get('Authorization') ?? '';
  const token = autorizacao.replace(/^Bearer\s+/i, '');
  if (!token) return resposta(origem, 401, { erro: 'Entre de novo.' });
  const { data: quem, error } = await admin.auth.getUser(token);
  if (error || !quem?.user) return resposta(origem, 401, { erro: 'Sessão expirada. Entre de novo.' });
  const usuario = quem.user.id;

  let corpo: unknown = null;
  try { corpo = await req.json(); } catch { /* vazio */ }
  const p = lerPedido(corpo);
  if ('erro' in p) return resposta(origem, 400, p);
  try {
    switch (p.acao) {
      case 'chave': return resposta(origem, 200, { publica: (await chaves()).publica });
      case 'inscrever': {
        await admin.from('push_inscricoes').upsert({ endpoint: p.endpoint, usuario_id: usuario, criado_em: new Date().toISOString() });
        const { data } = await admin.from('push_inscricoes').select('endpoint').eq('usuario_id', usuario).order('criado_em', { ascending: false });
        const sobra = (data ?? []).slice(MAX_INSCRICOES).map((x) => x.endpoint);
        if (sobra.length) await admin.from('push_inscricoes').delete().in('endpoint', sobra);
        return resposta(origem, 200, { ok: true });
      }
      case 'remover':
        await admin.from('push_inscricoes').delete().eq('endpoint', p.endpoint).eq('usuario_id', usuario);
        return resposta(origem, 200, { ok: true });
      case 'agendar': {
        const fim = new Date(Date.now() + p.segundos * 1000).toISOString();
        await admin.from('avisos_descanso').upsert({ usuario_id: usuario, token: p.token, fim_em: fim, atualizado_em: new Date().toISOString() });
        EdgeRuntime.waitUntil(vigiar(usuario, p.token, autorizacao));
        return resposta(origem, 200, { ok: true, fim_em: fim });
      }
      case 'continuar':
        EdgeRuntime.waitUntil(vigiar(usuario, p.token, autorizacao));
        return resposta(origem, 200, { ok: true });
      case 'cancelar':
        await admin.from('avisos_descanso').delete().eq('usuario_id', usuario);
        return resposta(origem, 200, { ok: true });
    }
  } catch (e) {
    console.error('[aviso-descanso]', p.acao, (e as Error).message);
    return resposta(origem, 500, { erro: 'Algo deu errado.' });
  }
});
