// Função de borda assinatura (v0.12, ADR-0026): planos do Quaru cobrados pelo Asaas.
// O app chama com o token da pessoa:
//   status   → o plano dela (meu_plano) e os preços;
//   assinar  → cria (ou reaproveita) o cliente e a assinatura no Asaas e devolve o link da cobrança (Pix, boleto ou
//              cartão, na página do próprio Asaas: o app nunca vê dados de cartão);
//   pagar    → o link da cobrança em aberto (pendente ou atrasada);
//   cancelar → cancela a assinatura no Asaas; o acesso vale até o fim do que já foi pago.
// O pagamento confirmado chega pela função asaas-webhook, que libera o acesso.
//
// Segredos (Painel do Supabase → Edge Functions → Secrets):
//   ASAAS_API_KEY   chave da API do Asaas (sandbox ou produção). Sem ela, responde "nao_configurado".
//   ASAAS_AMBIENTE  "producao" para cobrar de verdade; qualquer outro valor usa o sandbox (testes).
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import { lerPedido, PLANOS, primeiroVencimento } from './regras.ts';

const env = (k: string) => Deno.env.get(k) ?? '';
const ORIGENS = (env('ORIGENS_ADMIN') || 'https://otaviobmarques.github.io,https://quaru.com.br,https://app.quaru.com.br').split(',').map((s) => s.trim()).filter(Boolean);
const API = env('ASAAS_AMBIENTE') === 'producao' ? 'https://api.asaas.com/v3' : 'https://api-sandbox.asaas.com/v3';

function cabecalhos(origem: string | null): Record<string, string> {
  const ok = origem && ORIGENS.includes(origem) ? origem : ORIGENS[0] ?? '';
  return { 'Access-Control-Allow-Origin': ok, 'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Vary': 'Origin', 'Content-Type': 'application/json; charset=utf-8' };
}
const resposta = (origem: string | null, status: number, corpo: unknown) => new Response(JSON.stringify(corpo), { status, headers: cabecalhos(origem) });
const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false, autoRefreshToken: false } });

class ErroAsaas extends Error { constructor(public status: number, public detalhe: string) { super(detalhe); } }
async function asaas<T = Record<string, unknown>>(metodo: string, caminho: string, corpo?: unknown): Promise<T> {
  const r = await fetch(`${API}${caminho}`, { method: metodo, headers: { access_token: env('ASAAS_API_KEY'), 'Content-Type': 'application/json', 'User-Agent': 'Quaru/0.12' },
    body: corpo ? JSON.stringify(corpo) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new ErroAsaas(r.status, JSON.stringify((j as { errors?: unknown }).errors ?? j).slice(0, 300));
  return j as T;
}
type Cobranca = { id: string; status: string; invoiceUrl: string; dueDate: string; value: number };
/** A cobrança em aberto mais antiga da assinatura (a que a pessoa precisa pagar agora). */
async function cobrancaEmAberto(assinaturaId: string): Promise<Cobranca | null> {
  const r = await asaas<{ data: Cobranca[] }>('GET', `/subscriptions/${assinaturaId}/payments?limit=20`);
  return (r.data ?? []).filter((p) => p.status === 'PENDING' || p.status === 'OVERDUE').sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))[0] ?? null;
}

Deno.serve(async (req) => {
  const origem = req.headers.get('Origin');
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cabecalhos(origem) });
  if (req.method !== 'POST') return resposta(origem, 405, { erro: 'Use POST.' });
  if (origem && !ORIGENS.includes(origem)) return resposta(origem, 403, { erro: 'Origem não autorizada.' });
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return resposta(origem, 401, { erro: 'Entre de novo.' });
  const { data: quem, error } = await admin.auth.getUser(token);
  if (error || !quem?.user) return resposta(origem, 401, { erro: 'Sessão expirada. Entre de novo.' });
  const usuario = quem.user;

  let corpo: unknown = null;
  try { corpo = await req.json(); } catch { /* vazio */ }
  const p = lerPedido(corpo);
  if ('erro' in p) return resposta(origem, 400, p);

  const comoUsuario = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
  const { data: a } = await admin.from('assinaturas').select('*').eq('usuario_id', usuario.id).maybeSingle();

  try {
    if (p.acao === 'status') {
      const { data: plano } = await comoUsuario.rpc('meu_plano');
      return resposta(origem, 200, { plano, configurado: !!env('ASAAS_API_KEY'), planos: PLANOS });
    }
    if (!env('ASAAS_API_KEY')) return resposta(origem, 503, { erro: 'A cobrança ainda não está configurada. Tente mais tarde.', codigo: 'nao_configurado' });
    if (!a) return resposta(origem, 404, { erro: 'Conta sem cadastro de plano. Fale com o suporte.' });

    if (p.acao === 'assinar') {
      const pago = a.valido_ate && new Date(a.valido_ate) > new Date();
      // Já tem assinatura ativa no mesmo plano: não cria outra.
      if (a.asaas_assinatura_id && a.status !== 'cancelada' && a.plano === p.plano) {
        const aberta = await cobrancaEmAberto(a.asaas_assinatura_id);
        if (aberta) return resposta(origem, 200, { url: aberta.invoiceUrl, plano: p.plano });
        if (pago) return resposta(origem, 409, { erro: 'Você já assina este plano.', codigo: 'ja_assinante' });
      }
      // Trocando de plano: cancela a anterior (o novo plano começa quando acabar o período já pago).
      if (a.asaas_assinatura_id && a.status !== 'cancelada') await asaas('DELETE', `/subscriptions/${a.asaas_assinatura_id}`).catch(() => null);
      let cliente = a.asaas_cliente_id as string | null;
      if (cliente) await asaas('POST', `/customers/${cliente}`, { name: p.nome, cpfCnpj: p.cpfCnpj }).catch(() => { cliente = null; });
      if (!cliente) {
        const c = await asaas<{ id: string }>('POST', '/customers', { name: p.nome, cpfCnpj: p.cpfCnpj, email: usuario.email, externalReference: usuario.id, notificationDisabled: false });
        cliente = c.id;
      }
      const plano = PLANOS[p.plano];
      const s = await asaas<{ id: string }>('POST', '/subscriptions', {
        customer: cliente, billingType: 'UNDEFINED', value: plano.valor, cycle: plano.ciclo, nextDueDate: primeiroVencimento(a.valido_ate),
        description: `Quaru · Plano ${plano.nome}`, externalReference: usuario.id,
      });
      await admin.from('assinaturas').update({ asaas_cliente_id: cliente, asaas_assinatura_id: s.id, plano: p.plano, status: pago ? 'ativa' : 'pendente', atualizado_em: new Date().toISOString() }).eq('usuario_id', usuario.id);
      const aberta = await cobrancaEmAberto(s.id);
      return resposta(origem, 200, { url: aberta?.invoiceUrl ?? null, plano: p.plano, vencimento: aberta?.dueDate ?? null });
    }

    if (p.acao === 'pagar') {
      if (!a.asaas_assinatura_id) return resposta(origem, 404, { erro: 'Você ainda não escolheu um plano.' });
      const aberta = await cobrancaEmAberto(a.asaas_assinatura_id);
      return aberta ? resposta(origem, 200, { url: aberta.invoiceUrl, vencimento: aberta.dueDate }) : resposta(origem, 404, { erro: 'Nenhuma cobrança em aberto.' });
    }

    // cancelar
    if (!a.asaas_assinatura_id || a.status === 'cancelada') return resposta(origem, 200, { ok: true });
    await asaas('DELETE', `/subscriptions/${a.asaas_assinatura_id}`);
    await admin.from('assinaturas').update({ status: 'cancelada', atualizado_em: new Date().toISOString() }).eq('usuario_id', usuario.id);
    return resposta(origem, 200, { ok: true, valido_ate: a.valido_ate });
  } catch (e) {
    console.error('[assinatura]', p.acao, e instanceof ErroAsaas ? `${e.status} ${e.detalhe}` : (e as Error).message);
    return resposta(origem, 502, { erro: 'Não deu para falar com o sistema de pagamento agora. Tente de novo em instantes.' });
  }
});
