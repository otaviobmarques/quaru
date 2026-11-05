import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { hojeBr, lerCpfCnpj, lerPedido, mudancaDoEvento, PLANOS, primeiroVencimento, somarMeses, tokenConfere, validoAteDoPagamento } from '../supabase/functions/assinatura/regras';

describe('assinaturas: regras (v0.12)', () => {
  it('as duas funções usam exatamente as mesmas regras', () => {
    const f = (n: string) => readFileSync(join(__dirname, `../supabase/functions/${n}/regras.ts`), 'utf8');
    expect(f('asaas-webhook')).toBe(f('assinatura'));
  });
  it('preços e ciclos iguais aos do banco', () => {
    expect(PLANOS).toEqual({
      mensal: { nome: 'Mensal', valor: 19.9, meses: 1, ciclo: 'MONTHLY' },
      trimestral: { nome: 'Trimestral', valor: 49.9, meses: 3, ciclo: 'QUARTERLY' },
      anual: { nome: 'Anual', valor: 179.9, meses: 12, ciclo: 'YEARLY' },
    });
  });
  it('CPF e CNPJ com dígitos verificadores', () => {
    expect(lerCpfCnpj('529.982.247-25')).toBe('52998224725');
    expect(lerCpfCnpj('529.982.247-24')).toBeNull();
    expect(lerCpfCnpj('111.111.111-11')).toBeNull();
    expect(lerCpfCnpj('11.222.333/0001-81')).toBe('11222333000181');
    expect(lerCpfCnpj('11.222.333/0001-80')).toBeNull();
    expect(lerCpfCnpj(123)).toBeNull();
  });
  it('valida o pedido de assinatura', () => {
    expect(lerPedido({ acao: 'assinar', plano: 'anual', cpfCnpj: '529.982.247-25', nome: '  Bia   Santos ' })).toEqual({ acao: 'assinar', plano: 'anual', cpfCnpj: '52998224725', nome: 'Bia Santos' });
    expect(lerPedido({ acao: 'assinar', plano: 'vitalicio', cpfCnpj: '52998224725', nome: 'Bia' })).toHaveProperty('erro');
    expect(lerPedido({ acao: 'assinar', plano: 'mensal', cpfCnpj: '1', nome: 'Bia Santos' })).toHaveProperty('erro');
    expect(lerPedido({ acao: 'assinar', plano: 'mensal', cpfCnpj: '52998224725', nome: 'B' })).toHaveProperty('erro');
    expect(lerPedido({ acao: 'cancelar' })).toEqual({ acao: 'cancelar' });
  });
  it('datas: hoje em Brasília, meses no fim do mês, vencimento após o período pago', () => {
    expect(hojeBr(new Date('2026-11-05T02:00:00Z'))).toBe('2026-11-04');
    expect(somarMeses('2026-01-31', 1)).toBe('2026-02-28');
    expect(somarMeses('2026-11-05', 12)).toBe('2027-11-05');
    expect(primeiroVencimento(null, new Date('2026-11-05T15:00:00Z'))).toBe('2026-11-05');
    expect(primeiroVencimento('2026-12-01T10:00:00Z', new Date('2026-11-05T15:00:00Z'))).toBe('2026-12-01');
    expect(primeiroVencimento('2026-10-01T10:00:00Z', new Date('2026-11-05T15:00:00Z'))).toBe('2026-11-05');
    expect(validoAteDoPagamento('2026-11-05', 1)).toBe('2026-12-07T02:59:59.000Z'); // 05/12 23:59 em Brasília + 1 dia de folga
    expect(validoAteDoPagamento('2026-11-05', 3)).toBe('2027-02-07T02:59:59.000Z');
  });
  it('eventos do Asaas viram mudanças na assinatura', () => {
    expect(mudancaDoEvento({ event: 'PAYMENT_RECEIVED', payment: { dueDate: '2026-11-05' } })).toEqual({ tipo: 'pago', vencimento: '2026-11-05' });
    expect(mudancaDoEvento({ event: 'PAYMENT_CONFIRMED', payment: { dueDate: '2026-11-05' } })).toEqual({ tipo: 'pago', vencimento: '2026-11-05' });
    expect(mudancaDoEvento({ event: 'PAYMENT_OVERDUE' })).toEqual({ tipo: 'atrasado' });
    expect(mudancaDoEvento({ event: 'PAYMENT_REFUNDED' })).toEqual({ tipo: 'estornado' });
    expect(mudancaDoEvento({ event: 'SUBSCRIPTION_DELETED' })).toEqual({ tipo: 'cancelado' });
    expect(mudancaDoEvento({ event: 'PAYMENT_CREATED' })).toEqual({ tipo: 'ignorar' });
    expect(mudancaDoEvento({ event: 'PAYMENT_RECEIVED', payment: {} })).toEqual({ tipo: 'ignorar' });
  });
  it('token do webhook', () => {
    expect(tokenConfere('abc123', 'abc123')).toBe(true);
    expect(tokenConfere('abc124', 'abc123')).toBe(false);
    expect(tokenConfere(null, 'abc123')).toBe(false);
    expect(tokenConfere('abc123', '')).toBe(false);
  });
});
