import { beforeEach, describe, expect, it } from 'vitest';
import { como, criarBanco, criarUsuario, type Banco } from './banco';

const ADMIN = '00000000-0000-4000-8000-0000000000ad';
const T = '00000000-0000-4000-8000-0000000000c1';
const A = '00000000-0000-4000-8000-00000000000a';
const B = '00000000-0000-4000-8000-00000000000b';
let db: Banco;
type Plano = { acesso: boolean; motivo: string; status: string; plano: string | null; cortesia: boolean; cobranca_ativa: boolean };

beforeEach(async () => {
  db = await criarBanco();
  for (const u of [ADMIN, T, A, B]) await criarUsuario(db, u);
  await db.query(`update public.perfis set papel = 'admin' where usuario_id = $1`, [ADMIN]);
  await db.query(`update public.perfis set papel = 'treinador' where usuario_id = $1`, [T]);
});
const plano = (u: string) => como(db, u, (q) => q<{ p: Plano }>(`select public.meu_plano() as p`)).then((r) => r.rows[0].p);
const ligar = (v: boolean, u = ADMIN) => como(db, u, (q) => q(`select public.admin_definir_cobranca($1)`, [v]));

describe('assinaturas (v0.12)', () => {
  it('toda conta nova ganha 7 dias de teste; com a cobrança desligada, ninguém é bloqueado', async () => {
    const r = await db.query<{ dias: number; status: string }>(`select round(extract(epoch from teste_ate - now()) / 86400)::int as dias, status from public.assinaturas where usuario_id = $1`, [A]);
    expect(r.rows[0]).toEqual({ dias: 7, status: 'teste' });
    await db.query(`update public.assinaturas set teste_ate = now() - interval '1 day' where usuario_id = $1`, [A]);
    expect(await plano(A)).toMatchObject({ acesso: true, motivo: 'livre', cobranca_ativa: false });
  });
  it('cobrança ligada: teste válido dá acesso; teste vencido sem pagamento bloqueia; pago dá acesso até a data', async () => {
    await ligar(true);
    expect(await plano(A)).toMatchObject({ acesso: true, motivo: 'teste' });
    await db.query(`update public.assinaturas set teste_ate = now() - interval '1 day' where usuario_id = $1`, [A]);
    expect(await plano(A)).toMatchObject({ acesso: false, motivo: 'sem_plano' });
    await db.query(`update public.assinaturas set status = 'ativa', plano = 'mensal', valido_ate = now() + interval '30 days' where usuario_id = $1`, [A]);
    expect(await plano(A)).toMatchObject({ acesso: true, motivo: 'assinante', plano: 'mensal' });
    await db.query(`update public.assinaturas set status = 'cancelada', valido_ate = now() + interval '3 days' where usuario_id = $1`, [A]);
    expect(await plano(A)).toMatchObject({ acesso: true, motivo: 'assinante' }); // cancelou: vale até o fim do que pagou
  });
  it('ligar a cobrança dá pelo menos 7 dias a quem ainda está no teste', async () => {
    await db.query(`update public.assinaturas set teste_ate = now() - interval '30 days'`);
    await ligar(true);
    expect(await plano(B)).toMatchObject({ acesso: true, motivo: 'teste' });
  });
  it('admin e treinador não pagam; cortesia libera qualquer conta', async () => {
    await ligar(true);
    await db.query(`update public.assinaturas set teste_ate = now() - interval '1 day'`);
    expect(await plano(ADMIN)).toMatchObject({ acesso: true, motivo: 'isento' });
    expect(await plano(T)).toMatchObject({ acesso: true, motivo: 'isento' });
    expect(await plano(A)).toMatchObject({ acesso: false });
    await como(db, ADMIN, (q) => q(`select public.admin_definir_cortesia($1, true)`, [A]));
    expect(await plano(A)).toMatchObject({ acesso: true, motivo: 'isento', cortesia: true });
  });
  it('só o admin liga a cobrança, dá cortesia ou lista as assinaturas; ninguém escreve na tabela', async () => {
    await expect(ligar(true, A)).rejects.toThrow(/so_admin/);
    await expect(como(db, A, (q) => q(`select public.admin_definir_cortesia($1, true)`, [A]))).rejects.toThrow(/so_admin/);
    const l = await como(db, A, (q) => q(`select * from public.admin_assinaturas()`));
    expect(l.rows).toEqual([]);
    expect((await como(db, ADMIN, (q) => q(`select * from public.admin_assinaturas()`))).rows).toHaveLength(4);
    await expect(como(db, A, (q) => q(`update public.assinaturas set valido_ate = now() + interval '1 year' where usuario_id = $1`, [A]))).rejects.toThrow();
    await expect(como(db, A, (q) => q(`select * from public.assinaturas`))).rejects.toThrow();
  });
  it('os preços dos planos são públicos (para a tela de planos e o site)', async () => {
    const r = await como(db, null, (q) => q<{ id: string; valor: string }>(`select id, valor::text from public.planos order by ordem`));
    expect(r.rows).toEqual([{ id: 'mensal', valor: '19.90' }, { id: 'trimestral', valor: '49.90' }, { id: 'anual', valor: '179.90' }]);
  });
});
