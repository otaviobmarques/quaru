import type { IdPlano, PlanoConta } from '@/dominio/plano';
import { supabase } from '@/servicos/supabase';

/** v0.12: o plano da conta (null = sem servidor ou sem rede). */
export async function buscarPlano(): Promise<PlanoConta | null> {
  const sb = supabase();
  if (!sb) return null;
  const { data, error } = await sb.rpc('meu_plano');
  if (error) throw error;
  return (data ?? null) as PlanoConta | null;
}

type Resultado = { url?: string | null; erro?: string; codigo?: string; vencimento?: string | null; valido_ate?: string | null };
async function chamar(corpo: Record<string, unknown>): Promise<Resultado> {
  const sb = supabase();
  if (!sb) return { erro: 'A assinatura precisa de conta no Quaru.' };
  const { data, error } = await sb.functions.invoke('assinatura', { body: corpo });
  if (error) {
    const ctx = (error as { context?: Response }).context;
    const j = ctx && typeof ctx.json === 'function' ? await ctx.json().catch(() => null) : null;
    return { erro: (j as Resultado | null)?.erro ?? 'Não deu para falar com o pagamento agora. Confira a internet e tente de novo.', codigo: (j as Resultado | null)?.codigo };
  }
  return data as Resultado;
}
/** Cria a assinatura no Asaas e devolve o link da cobrança (Pix, boleto ou cartão, na página do Asaas). */
export const assinar = (plano: IdPlano, cpfCnpj: string, nome: string) => chamar({ acao: 'assinar', plano, cpfCnpj, nome });
export const linkDePagamento = () => chamar({ acao: 'pagar' });
export const cancelarAssinatura = () => chamar({ acao: 'cancelar' });
