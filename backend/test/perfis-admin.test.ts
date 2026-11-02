import { beforeEach, describe, expect, it } from 'vitest';
import { como, criarBanco, criarUsuario, type Banco } from './banco';

const ADMIN = '00000000-0000-4000-8000-0000000000ad';
const A = '00000000-0000-4000-8000-00000000000a';
const B = '00000000-0000-4000-8000-00000000000b';
let db: Banco;

beforeEach(async () => {
  db = await criarBanco();
  for (const u of [ADMIN, A, B]) await criarUsuario(db, u);
  await db.query(`select public.tornar_admin($1)`, [`${ADMIN.slice(0, 4)}@exemplo.test`]);
});

describe('perfis e administrador (v0.6)', () => {
  it('todo usuário novo ganha perfil "usuario" ativo', async () => {
    const r = await db.query<{ papel: string; ativo: boolean }>(`select papel, ativo from public.perfis where usuario_id = $1`, [A]);
    expect(r.rows[0]).toEqual({ papel: 'usuario', ativo: true });
  });
  it('tornar_admin promove pelo e-mail e falha para e-mail não convidado', async () => {
    const r = await db.query<{ papel: string }>(`select papel from public.perfis where usuario_id = $1`, [ADMIN]);
    expect(r.rows[0].papel).toBe('admin');
    await expect(db.query(`select public.tornar_admin('ninguem@exemplo.test')`)).rejects.toThrow(/convide/);
  });
  it('meu_acesso devolve papel e situação do próprio perfil', async () => {
    const r = await como(db, A, (q) => q<{ a: { papel: string; ativo: boolean } }>(`select public.meu_acesso() as a`));
    expect(r.rows[0].a).toEqual({ papel: 'usuario', ativo: true });
    const adm = await como(db, ADMIN, (q) => q<{ ok: boolean }>(`select public.eh_admin() as ok`));
    expect(adm.rows[0].ok).toBe(true);
  });
  it('usuário comum só vê o próprio perfil; admin vê todos', async () => {
    const meu = await como(db, A, (q) => q<{ usuario_id: string }>(`select usuario_id from public.perfis`));
    expect(meu.rows.map((x) => x.usuario_id)).toEqual([A]);
    const todos = await como(db, ADMIN, (q) => q(`select usuario_id from public.perfis`));
    expect(todos.rows).toHaveLength(3);
  });
  it('ninguém altera perfil pela API pública, nem o admin (só a função de borda)', async () => {
    await expect(como(db, A, (q) => q(`update public.perfis set papel = 'admin' where usuario_id = $1`, [A]))).rejects.toThrow();
    await expect(como(db, ADMIN, (q) => q(`update public.perfis set ativo = false where usuario_id = $1`, [B]))).rejects.toThrow();
    await expect(como(db, A, (q) => q(`insert into public.perfis (usuario_id, papel) values ($1, 'admin')`, [B]))).rejects.toThrow();
  });
  it('app e anônimo não podem chamar tornar_admin', async () => {
    await expect(como(db, A, (q) => q(`select public.tornar_admin('0000@exemplo.test')`))).rejects.toThrow();
    await expect(como(db, null, (q) => q(`select public.tornar_admin('0000@exemplo.test')`))).rejects.toThrow();
  });
  it('admin bloqueado deixa de ser admin', async () => {
    await db.query(`update public.perfis set ativo = false where usuario_id = $1`, [ADMIN]);
    const r = await como(db, ADMIN, (q) => q<{ ok: boolean }>(`select public.eh_admin() as ok`));
    expect(r.rows[0].ok).toBe(false);
  });
  it('apagar o usuário do Auth apaga o perfil', async () => {
    await db.query(`delete from auth.users where id = $1`, [B]);
    const r = await db.query(`select 1 from public.perfis where usuario_id = $1`, [B]);
    expect(r.rows).toHaveLength(0);
  });
});
