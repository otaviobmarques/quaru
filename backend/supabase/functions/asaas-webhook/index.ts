// Função de borda asaas-webhook (v0.12, ADR-0026): o Asaas avisa aqui quando um pagamento é confirmado, atrasa,
// é estornado, ou quando a assinatura é cancelada. Sem login (verify_jwt = false): quem chama prova que é o Asaas
// pelo cabeçalho asaas-access-token, igual ao segredo ASAAS_WEBHOOK_TOKEN (o mesmo cadastrado no painel do Asaas).
// Cada evento é processado uma vez só (tabela eventos_asaas). Responde 200 rápido para o Asaas não pausar a fila.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import { mudancaDoEvento, PLANOS, tokenConfere, validoAteDoPagamento, type EventoAsaas, type IdPlano } from './regras.ts';

const env = (k: string) => Deno.env.get(k) ?? '';
const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false, autoRefreshToken: false } });
const ok = (corpo: unknown = { ok: true }, status = 200) => new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return ok({ erro: 'Use POST.' }, 405);
  if (!env('ASAAS_WEBHOOK_TOKEN') || !tokenConfere(req.headers.get('asaas-access-token'), env('ASAAS_WEBHOOK_TOKEN'))) return ok({ erro: 'Não autorizado.' }, 401);
  let ev: EventoAsaas;
  try { ev = await req.json(); } catch { return ok({ erro: 'Corpo inválido.' }, 400); }
  if (!ev?.id || !ev.event) return ok({ ignorado: true });

  const m = mudancaDoEvento(ev);
  if (m.tipo === 'ignorar') return ok({ ignorado: true });
  // Idempotência: o mesmo evento não é aplicado duas vezes.
  const { data: novo, error: e1 } = await admin.from('eventos_asaas').upsert({ id: ev.id, evento: ev.event }, { onConflict: 'id', ignoreDuplicates: true }).select('id');
  if (e1) return ok({ erro: 'Banco indisponível.' }, 500);
  if (!novo?.length) return ok({ repetido: true });

  try {
    const idAssinatura = ev.payment?.subscription ?? ev.subscription?.id ?? null;
    const ref = ev.payment?.externalReference ?? ev.subscription?.externalReference ?? null;
    let q = admin.from('assinaturas').select('usuario_id, plano, valido_ate, asaas_assinatura_id');
    q = idAssinatura ? q.eq('asaas_assinatura_id', idAssinatura) : q.eq('usuario_id', ref ?? '00000000-0000-0000-0000-000000000000');
    const { data: a } = await q.maybeSingle();
    if (!a) { console.warn('[asaas-webhook] assinatura não encontrada', ev.event, idAssinatura); return ok({ sem_assinatura: true }); }
    const agora = new Date().toISOString();
    let mudar: Record<string, unknown> = { atualizado_em: agora };
    if (m.tipo === 'pago') {
      const meses = PLANOS[(a.plano ?? 'mensal') as IdPlano]?.meses ?? 1;
      const novoFim = validoAteDoPagamento(m.vencimento, meses);
      const fim = a.valido_ate && a.valido_ate > novoFim ? a.valido_ate : novoFim;
      mudar = { ...mudar, status: 'ativa', valido_ate: fim };
    } else if (m.tipo === 'atrasado') mudar = { ...mudar, status: 'atrasada' };
    else if (m.tipo === 'estornado') mudar = { ...mudar, status: 'cancelada', valido_ate: a.valido_ate && a.valido_ate < agora ? a.valido_ate : agora };
    else if (m.tipo === 'cancelado' && (!idAssinatura || idAssinatura === a.asaas_assinatura_id)) mudar = { ...mudar, status: 'cancelada' };
    await admin.from('assinaturas').update(mudar).eq('usuario_id', a.usuario_id);
    return ok();
  } catch (e) {
    await admin.from('eventos_asaas').delete().eq('id', ev.id); // deixa o Asaas reenviar
    console.error('[asaas-webhook]', ev.event, (e as Error).message);
    return ok({ erro: 'Falha ao processar.' }, 500);
  }
});
