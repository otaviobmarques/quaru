/**
 * v0.12 (ADR-0026): planos de assinatura. O servidor decide o acesso (public.meu_plano); o app guarda a última resposta
 * e reconfere as datas localmente (o teste acaba no 8º dia mesmo sem rede).
 * Sem plano: não começa treinos novos; histórico, evolução e exportação continuam.
 */
export type MotivoAcesso = 'livre' | 'isento' | 'assinante' | 'teste' | 'sem_plano';
export interface PlanoConta {
  acesso: boolean; motivo: MotivoAcesso; cobranca_ativa: boolean;
  status: 'teste' | 'pendente' | 'ativa' | 'atrasada' | 'cancelada';
  plano: IdPlano | null; teste_ate: string | null; valido_ate: string | null; cortesia: boolean;
}
export type IdPlano = 'mensal' | 'trimestral' | 'anual';

export const DIAS_TESTE = 7;
export const PLANOS: { id: IdPlano; nome: string; valor: number; meses: number; destaque?: string }[] = [
  { id: 'mensal', nome: 'Mensal', valor: 19.9, meses: 1 },
  { id: 'trimestral', nome: 'Trimestral', valor: 49.9, meses: 3 },
  { id: 'anual', nome: 'Anual', valor: 179.9, meses: 12, destaque: 'Melhor preço' },
];
export const reais = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const porMes = (p: { valor: number; meses: number }) => Math.floor((p.valor / p.meses) * 100 + 1e-6) / 100;
/** Desconto em relação a pagar o mensal pelo mesmo período (arredondado para baixo, para não exagerar). */
export const economia = (p: { valor: number; meses: number }) => (p.meses === 1 ? 0 : Math.floor((1 - p.valor / (PLANOS[0].valor * p.meses)) * 100));

/** Pode começar um treino agora? Sem informação do servidor (modo local, ainda sem resposta): pode. */
export function podeTreinar(p: PlanoConta | null | undefined, agora = new Date()): boolean {
  if (!p || !p.cobranca_ativa || p.motivo === 'isento' || p.motivo === 'livre') return true;
  const t = agora.getTime();
  if (p.valido_ate && +new Date(p.valido_ate) > t) return true;
  if (p.teste_ate && +new Date(p.teste_ate) > t) return true;
  return false;
}

/** Dias que faltam do teste (arredonda para cima: "falta 1 dia" até o fim). */
export function diasDeTeste(p: PlanoConta | null | undefined, agora = new Date()): number | null {
  if (!p?.teste_ate || p.valido_ate && +new Date(p.valido_ate) > agora.getTime()) return null;
  const ms = +new Date(p.teste_ate) - agora.getTime();
  return ms > 0 ? Math.ceil(ms / 86400000) : 0;
}

export const nomeDoPlano = (id: IdPlano | null | undefined) => PLANOS.find((p) => p.id === id)?.nome ?? null;
export const dataCurtaBr = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo' });

/** CPF/CNPJ com dígitos verificadores (mesma regra do servidor). */
export function cpfCnpjValido(t: string): boolean {
  const d = t.replace(/\D/g, '');
  if (!/^(\d{11}|\d{14})$/.test(d) || /^(\d)\1+$/.test(d)) return false;
  const n = d.split('').map(Number);
  if (d.length === 11) {
    const dv = (k: number) => { let s = 0; for (let i = 0; i < k; i++) s += n[i] * (k + 1 - i); const r = (s * 10) % 11; return r === 10 ? 0 : r; };
    return dv(9) === n[9] && dv(10) === n[10];
  }
  const dv = (k: number) => { const pe = k === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]; let s = 0; for (let i = 0; i < k; i++) s += n[i] * pe[i]; const r = s % 11; return r < 2 ? 0 : 11 - r; };
  return dv(12) === n[12] && dv(13) === n[13];
}
/** Máscara de CPF/CNPJ enquanto digita. */
export function mascararCpfCnpj(t: string): string {
  const d = t.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 11) return d.replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
  return d.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}
