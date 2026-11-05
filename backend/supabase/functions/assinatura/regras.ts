// Regras puras das assinaturas (sem Deno nem rede), testadas em test/assinatura-regras.test.ts.
// CÓPIA IDÊNTICA em assinatura/ e asaas-webhook/ (cada função é publicada sozinha); o teste confere que são iguais.
// Também usadas pela função asaas-webhook.

export type IdPlano = 'mensal' | 'trimestral' | 'anual';
export const PLANOS: Record<IdPlano, { nome: string; valor: number; meses: number; ciclo: 'MONTHLY' | 'QUARTERLY' | 'YEARLY' }> = {
  mensal: { nome: 'Mensal', valor: 19.9, meses: 1, ciclo: 'MONTHLY' },
  trimestral: { nome: 'Trimestral', valor: 49.9, meses: 3, ciclo: 'QUARTERLY' },
  anual: { nome: 'Anual', valor: 179.9, meses: 12, ciclo: 'YEARLY' },
};
export const ehPlano = (p: unknown): p is IdPlano => typeof p === 'string' && p in PLANOS;

/** CPF (11) ou CNPJ (14) com dígitos verificadores certos. Devolve só os dígitos, ou null. */
export function lerCpfCnpj(t: unknown): string | null {
  if (typeof t !== 'string') return null;
  const d = t.replace(/\D/g, '');
  if (!/^(\d{11}|\d{14})$/.test(d) || /^(\d)\1+$/.test(d)) return null;
  const n = d.split('').map(Number);
  if (d.length === 11) {
    const dv = (k: number) => { let s = 0; for (let i = 0; i < k; i++) s += n[i] * (k + 1 - i); const r = (s * 10) % 11; return r === 10 ? 0 : r; };
    return dv(9) === n[9] && dv(10) === n[10] ? d : null;
  }
  const dv = (k: number) => { const p = k === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]; let s = 0; for (let i = 0; i < k; i++) s += n[i] * p[i]; const r = s % 11; return r < 2 ? 0 : 11 - r; };
  return dv(12) === n[12] && dv(13) === n[13] ? d : null;
}

export type Pedido =
  | { acao: 'status' }
  | { acao: 'assinar'; plano: IdPlano; cpfCnpj: string; nome: string }
  | { acao: 'pagar' }
  | { acao: 'cancelar' };

export function lerPedido(c: unknown): Pedido | { erro: string } {
  if (!c || typeof c !== 'object') return { erro: 'Pedido inválido.' };
  const p = c as Record<string, unknown>;
  switch (p.acao) {
    case 'status': case 'pagar': case 'cancelar': return { acao: p.acao };
    case 'assinar': {
      if (!ehPlano(p.plano)) return { erro: 'Escolha um plano.' };
      const doc = lerCpfCnpj(p.cpfCnpj);
      if (!doc) return { erro: 'Confira o CPF (ou CNPJ): ele é exigido para emitir a cobrança.' };
      const nome = typeof p.nome === 'string' ? p.nome.trim().replace(/\s+/g, ' ').slice(0, 100) : '';
      if (nome.length < 3) return { erro: 'Digite o seu nome completo.' };
      return { acao: 'assinar', plano: p.plano, cpfCnpj: doc, nome };
    }
    default: return { erro: 'Ação desconhecida.' };
  }
}

/** Data de hoje no fuso de Brasília (AAAA-MM-DD), que é como o Asaas trata vencimentos. */
export const hojeBr = (agora = new Date()) => new Date(agora.getTime() - 3 * 3600000).toISOString().slice(0, 10);

/** Soma meses a uma data AAAA-MM-DD (31/01 + 1 mês = 28/02 ou 29/02). */
export function somarMeses(dia: string, meses: number): string {
  const [a, m, d] = dia.split('-').map(Number);
  const alvo = new Date(Date.UTC(a, m - 1 + meses, 1));
  const fimMes = new Date(Date.UTC(alvo.getUTCFullYear(), alvo.getUTCMonth() + 1, 0)).getUTCDate();
  alvo.setUTCDate(Math.min(d, fimMes));
  return alvo.toISOString().slice(0, 10);
}

/** Primeiro vencimento de uma assinatura nova: hoje, ou o fim do período já pago (troca de plano sem cobrar em dobro). */
export function primeiroVencimento(validoAte: string | null, agora = new Date()): string {
  const hoje = hojeBr(agora);
  if (!validoAte) return hoje;
  const fim = hojeBr(new Date(validoAte));
  return fim > hoje ? fim : hoje;
}

/** O acesso pago vale até o fim do dia (Brasília) do vencimento + o período do plano, com 1 dia de folga. */
export function validoAteDoPagamento(vencimento: string, meses: number): string {
  const fimDoDia = new Date(`${somarMeses(vencimento, meses)}T23:59:59-03:00`);
  return new Date(fimDoDia.getTime() + 86400000).toISOString();
}

export interface EventoAsaas { id?: string; event?: string; payment?: { id?: string; subscription?: string | null; dueDate?: string; status?: string; externalReference?: string | null }; subscription?: { id?: string; externalReference?: string | null } }
export type Mudanca =
  | { tipo: 'pago'; vencimento: string }
  | { tipo: 'atrasado' }
  | { tipo: 'estornado' }
  | { tipo: 'cancelado' }
  | { tipo: 'ignorar' };

/** O que um evento do Asaas muda na assinatura. */
export function mudancaDoEvento(ev: EventoAsaas): Mudanca {
  switch (ev.event) {
    case 'PAYMENT_CONFIRMED': case 'PAYMENT_RECEIVED':
      return ev.payment?.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(ev.payment.dueDate) ? { tipo: 'pago', vencimento: ev.payment.dueDate } : { tipo: 'ignorar' };
    case 'PAYMENT_OVERDUE': return { tipo: 'atrasado' };
    case 'PAYMENT_REFUNDED': case 'PAYMENT_CHARGEBACK_REQUESTED': case 'PAYMENT_RECEIVED_IN_CASH_UNDONE': return { tipo: 'estornado' };
    case 'SUBSCRIPTION_DELETED': case 'SUBSCRIPTION_INACTIVATED': return { tipo: 'cancelado' };
    default: return { tipo: 'ignorar' };
  }
}

/** Compara o token do webhook sem vazar tempo. */
export function tokenConfere(recebido: string | null, esperado: string): boolean {
  if (!recebido || !esperado || recebido.length !== esperado.length) return false;
  let x = 0; for (let i = 0; i < esperado.length; i++) x |= recebido.charCodeAt(i) ^ esperado.charCodeAt(i);
  return x === 0;
}
