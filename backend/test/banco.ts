import { PGlite } from '@electric-sql/pglite';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const raiz = join(__dirname, '..');

export async function criarBanco() {
  const db = new PGlite();
  await db.exec(readFileSync(join(raiz, 'test/shim-supabase.sql'), 'utf8'));
  const pasta = join(raiz, 'supabase/migrations');
  for (const f of readdirSync(pasta).sort()) await db.exec(readFileSync(join(pasta, f), 'utf8'));
  return db;
}

export type Banco = Awaited<ReturnType<typeof criarBanco>>;

/** Executa como um usuário autenticado (papel authenticated + sub do JWT), como faria o PostgREST. */
export async function como<T>(db: Banco, uid: string | null, fn: (q: Banco['query']) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.query(`set local role ${uid ? 'authenticated' : 'anon'}`);
    await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [uid ?? '']);
    return fn(tx.query.bind(tx) as Banco['query']);
  });
}

export async function criarUsuario(db: Banco, id: string) {
  await db.query('insert into auth.users (id, email) values ($1, $2)', [id, `${id.slice(0, 4)}@exemplo.test`]);
}
