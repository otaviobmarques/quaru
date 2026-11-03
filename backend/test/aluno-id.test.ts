import { beforeEach, describe, expect, it } from 'vitest';
import { como, criarBanco, criarUsuario, type Banco } from './banco';

const T = '00000000-0000-4000-8000-0000000000c1'; // treinador
const T2 = '00000000-0000-4000-8000-0000000000c2';
const A = '00000000-0000-4000-8000-00000000000a'; // aluno
const B = '00000000-0000-4000-8000-00000000000b';
let db: Banco;

beforeEach(async () => {
  db = await criarBanco();
  for (const u of [T, T2, A, B]) await criarUsuario(db, u);
  await db.query(`update public.perfis set ativo = true`);
  await db.query(`update public.perfis set papel = 'treinador', nome = 'Coach Ana' where usuario_id = $1`, [T]);
  await db.query(`update public.perfis set papel = 'treinador' where usuario_id = $1`, [T2]);
});

const rpc = async <R = unknown>(u: string | null, sql: string, args: unknown[] = []) => (await como(db, u, (q) => q<{ r: R }>(`select ${sql} as r`, args))).rows[0].r;
const codigo = (u: string) => rpc<string>(u, 'public.meu_codigo_aluno()');
const convidar = (t: string, c: string, nome = 'Bia') => rpc<{ resultado: string; aluno_ref?: string }>(t, 'public.convidar_aluno($1, $2)', [c, nome]);
const convites = (u: string) => como(db, u, (q) => q<{ aluno_ref: string; treinador: string }>(`select * from public.meus_convites()`)).then((r) => r.rows);
const responder = (u: string, ref: string, aceitar: boolean, comp = false) => rpc<string>(u, 'public.responder_convite($1, $2, $3)', [ref, aceitar, comp]);
const publicar = (u: string, itens: unknown[], agenda: object = {}) => rpc<number>(u, 'public.publicar_evolucao($1::jsonb, $2::jsonb)', [JSON.stringify(itens), JSON.stringify(agenda)]);
const evolucao = (t: string, ref: string) => rpc<{ itens: { tipo: string; dados: { kg?: number } }[]; agenda: Record<string, unknown> } | null>(t, 'public.evolucao_do_aluno($1)', [ref]);
const PESO = { origem_id: 'p1', tipo: 'peso', quando: '2026-11-01T10:00:00Z', dados: { kg: 80.5 } };

describe('ID do aluno e convite (v0.10)', () => {
  it('toda conta tem um ID de 7 caracteres, fácil de ditar', async () => {
    const c = await codigo(A);
    expect(c).toMatch(/^[A-HJKMNP-Z2-9]{7}$/);
    expect(await codigo(B)).not.toBe(c);
  });
  it('treinador convida pelo ID (aceita minúsculas e traço); o aluno vê o convite e aceita', async () => {
    const c = await codigo(A);
    const r = await convidar(T, `${c.slice(0, 3).toLowerCase()}-${c.slice(3)}`);
    expect(r.resultado).toBe('convidado');
    expect(await convidar(T, c)).toMatchObject({ resultado: 'ja_convidado' });
    expect(await convites(A)).toEqual([expect.objectContaining({ aluno_ref: r.aluno_ref, treinador: 'Coach Ana' })]);
    expect(await convites(B)).toEqual([]);
    expect(await responder(B, r.aluno_ref!, true)).toBe('nao_encontrado'); // não é o convidado
    expect(await responder(A, r.aluno_ref!, true, true)).toBe('vinculado');
    expect(await convites(A)).toEqual([]);
    const tr = await como(db, A, (q) => q<{ treinador: string; compartilha: boolean }>(`select * from public.meus_treinadores()`));
    expect(tr.rows).toEqual([expect.objectContaining({ treinador: 'Coach Ana', compartilha: true })]);
    expect(await convidar(T, c)).toMatchObject({ resultado: 'ja_vinculado' });
  });
  it('recusar, ID errado, o próprio ID e quem não é treinador', async () => {
    const r = await convidar(T, await codigo(A));
    expect(await responder(A, r.aluno_ref!, false)).toBe('recusado');
    const lista = await como(db, T, (q) => q<{ recusado_em: string | null; pendente: boolean }>(`select * from public.meus_alunos()`));
    expect(lista.rows[0]).toMatchObject({ pendente: false });
    expect(lista.rows[0].recusado_em).not.toBeNull();
    expect(await convidar(T, 'ZZZZZZZ')).toMatchObject({ resultado: 'nao_encontrado' });
    expect(await convidar(T, await codigo(T))).toMatchObject({ resultado: 'proprio' });
    await expect(convidar(A, await codigo(B))).rejects.toThrow();
  });
  it('o treinador não forja convite nem compartilhamento pela tabela', async () => {
    await expect(como(db, T, (q) => q(`insert into public.alunos_treinador (treinador_id, nome, convidado_id) values ($1, 'x', $2)`, [T, A]))).rejects.toThrow();
    const r = await convidar(T, await codigo(A));
    await responder(A, r.aluno_ref!, true, false);
    await como(db, T, (q) => q(`update public.alunos_treinador set compartilha_evolucao = true where id = $1`, [r.aluno_ref]));
    expect(await evolucao(T, r.aluno_ref!)).toBeNull();
  });
});

describe('evolução compartilhada (v0.10)', () => {
  const vincular = async (comp: boolean) => { const r = await convidar(T, await codigo(A)); await responder(A, r.aluno_ref!, true, comp); return r.aluno_ref!; };
  it('sem compartilhar, publicar não grava nada e o treinador não vê', async () => {
    const ref = await vincular(false);
    expect(await publicar(A, [PESO])).toBe(0);
    expect(await evolucao(T, ref)).toBeNull();
  });
  it('compartilhando, o treinador vinculado vê peso, treinos e agenda; outro treinador não', async () => {
    const ref = await vincular(true);
    expect(await publicar(A, [PESO, { origem_id: 's1', tipo: 'treino', quando: '2026-11-02T10:00:00Z', dados: { nome: 'Treino A', series: 12 } }], { '2026-11-05': 'Treino A' })).toBe(2);
    const ev = await evolucao(T, ref);
    expect(ev?.itens.map((i) => i.tipo)).toEqual(['peso', 'treino']);
    expect(ev?.agenda).toEqual({ '2026-11-05': 'Treino A' });
    expect(await evolucao(T2, ref)).toBeNull();
    // ninguém lê a tabela direto
    await expect(como(db, T, (q) => q(`select * from public.evolucao_aluno`))).rejects.toThrow();
    // publicar de novo troca tudo
    await publicar(A, [{ ...PESO, dados: { kg: 79 } }]);
    expect((await evolucao(T, ref))?.itens).toHaveLength(1);
  });
  it('desligar o compartilhamento ou desvincular apaga o resumo', async () => {
    const ref = await vincular(true);
    await publicar(A, [PESO]);
    expect(await rpc(A, 'public.definir_compartilhamento($1, false)', [ref])).toBe(true);
    expect((await db.query(`select count(*)::int as n from public.evolucao_aluno`)).rows[0]).toEqual({ n: 0 });
    await rpc(A, 'public.definir_compartilhamento($1, true)', [ref]);
    await publicar(A, [PESO]);
    expect(await rpc(A, 'public.desvincular_treinador($1)', [ref])).toBe(1);
    expect((await db.query(`select count(*)::int as n from public.evolucao_aluno`)).rows[0]).toEqual({ n: 0 });
    expect(await evolucao(T, ref)).toBeNull();
  });
  it('o treinador agenda datas no treino do aluno', async () => {
    const ref = await vincular(false);
    const t = await como(db, T, (q) => q<{ datas: string[] }>(`insert into public.treinos_atribuidos (aluno_ref, treinador_id, nome, datas) values ($1, $2, 'A', '{2026-11-05,2026-11-07}') returning datas::text[] as datas`, [ref, T]));
    expect(t.rows[0].datas).toEqual(['2026-11-05', '2026-11-07']);
    const lido = await como(db, A, (q) => q<{ datas: string[] }>(`select datas::text[] as datas from public.treinos_atribuidos`));
    expect(lido.rows[0].datas).toEqual(['2026-11-05', '2026-11-07']);
  });
});
