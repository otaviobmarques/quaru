import { beforeEach, describe, expect, it } from 'vitest';
import { como, criarBanco, criarUsuario, type Banco } from './banco';

const T = '00000000-0000-4000-8000-0000000000c1'; // treinador
const T2 = '00000000-0000-4000-8000-0000000000c2'; // outro treinador
const A = '00000000-0000-4000-8000-00000000000a'; // aluno
const B = '00000000-0000-4000-8000-00000000000b'; // outra pessoa
let db: Banco;

beforeEach(async () => {
  db = await criarBanco();
  for (const u of [T, T2, A, B]) await criarUsuario(db, u);
  await db.query(`update public.perfis set ativo = true`);
  await db.query(`update public.perfis set papel = 'treinador', nome = 'Coach Ana' where usuario_id = $1`, [T]);
  await db.query(`update public.perfis set papel = 'treinador' where usuario_id = $1`, [T2]);
});

const criarAluno = (t: string, nome: string) => como(db, t, (q) => q<{ id: string; codigo: string }>(
  `insert into public.alunos_treinador (treinador_id, nome) values ($1, $2) returning id, codigo`, [t, nome])).then((r) => r.rows[0]);
const aceitar = (u: string, c: string) => como(db, u, (q) => q<{ r: { resultado: string; treinador?: string } }>(`select public.aceitar_vinculo($1) as r`, [c])).then((r) => r.rows[0].r);
const atribuir = (t: string, ref: string, nome = 'Treino A') => como(db, t, (q) => q<{ id: string }>(
  `insert into public.treinos_atribuidos (aluno_ref, treinador_id, nome, itens, dias) values ($1, $2, $3, $4::jsonb, '{1,3}') returning id`,
  [ref, t, nome, JSON.stringify([{ exercicioId: '00000000-0000-4000-a000-000000000001', series: 3, reps: 10, descansoS: 90 }])])).then((r) => r.rows[0]);

describe('treinadores (v0.8)', () => {
  it('só treinador ativo cadastra aluno; usuário comum não', async () => {
    const a = await criarAluno(T, 'Bia');
    expect(a.codigo).toMatch(/^[0-9a-f]{32}$/);
    await expect(criarAluno(A, 'Alguém')).rejects.toThrow();
  });
  it('aluno aceita o link uma vez; vê o nome do treinador; o código não serve para outra pessoa', async () => {
    const a = await criarAluno(T, 'Bia');
    expect(await aceitar(A, a.codigo)).toEqual({ resultado: 'vinculado', treinador: 'Coach Ana', aluno_ref: a.id });
    expect(await aceitar(A, a.codigo)).toMatchObject({ resultado: 'vinculado' }); // idempotente
    expect(await aceitar(B, a.codigo)).toEqual({ resultado: 'ja_usado' });
    expect(await aceitar(T, a.codigo)).toEqual({ resultado: 'proprio_treinador' });
    expect(await aceitar(A, 'f'.repeat(32))).toEqual({ resultado: 'codigo_invalido' });
  });
  it('o aluno só lê os treinos dele; outra pessoa e outro treinador não veem nada', async () => {
    const a = await criarAluno(T, 'Bia');
    await aceitar(A, a.codigo);
    await atribuir(T, a.id);
    const doAluno = await como(db, A, (q) => q(`select nome, dias from public.treinos_atribuidos`));
    expect(doAluno.rows).toEqual([{ nome: 'Treino A', dias: [1, 3] }]);
    expect((await como(db, B, (q) => q(`select 1 from public.treinos_atribuidos`))).rows).toHaveLength(0);
    expect((await como(db, T2, (q) => q(`select 1 from public.treinos_atribuidos`))).rows).toHaveLength(0);
    expect((await como(db, T2, (q) => q(`select 1 from public.alunos_treinador`))).rows).toHaveLength(0);
  });
  it('aluno não altera nem cria treino; outro treinador não atribui treino ao aluno de outro', async () => {
    const a = await criarAluno(T, 'Bia');
    await aceitar(A, a.codigo);
    const t = await atribuir(T, a.id);
    const r = await como(db, A, (q) => q(`update public.treinos_atribuidos set nome = 'hack' where id = $1`, [t.id]));
    expect(r.affectedRows ?? 0).toBe(0);
    await expect(como(db, A, (q) => q(`insert into public.treinos_atribuidos (aluno_ref, treinador_id, nome) values ($1, $2, 'x')`, [a.id, A]))).rejects.toThrow();
    await expect(atribuir(T2, a.id)).rejects.toThrow();
  });
  it('o treinador não consegue se ligar a outra conta mexendo no cadastro (só pelo link)', async () => {
    const a = await criarAluno(T, 'Bia');
    await como(db, T, (q) => q(`update public.alunos_treinador set aluno_id = $1, vinculado_em = now(), nome = 'Bia S.' where id = $2`, [B, a.id]));
    const r = await db.query<{ aluno_id: string | null; nome: string }>(`select aluno_id, nome from public.alunos_treinador where id = $1`, [a.id]);
    expect(r.rows[0]).toEqual({ aluno_id: null, nome: 'Bia S.' }); // o nome muda; o vínculo não
  });
  it('treinador bloqueado perde o acesso aos alunos', async () => {
    await criarAluno(T, 'Bia');
    await db.query(`update public.perfis set ativo = false where usuario_id = $1`, [T]);
    expect((await como(db, T, (q) => q(`select 1 from public.alunos_treinador`))).rows).toHaveLength(0);
  });
  it('meus_treinadores e meus_alunos; desvincular troca o código', async () => {
    const a = await criarAluno(T, 'Bia');
    await aceitar(A, a.codigo);
    const tr = await como(db, A, (q) => q<{ treinador: string }>(`select treinador from public.meus_treinadores()`));
    expect(tr.rows).toEqual([{ treinador: 'Coach Ana' }]);
    const al = await como(db, T, (q) => q<{ nome: string; email: string }>(`select nome, email from public.meus_alunos()`));
    expect(al.rows).toEqual([{ nome: 'Bia', email: '0000@exemplo.test' }]);
    expect((await como(db, B, (q) => q(`select * from public.meus_alunos()`))).rows).toHaveLength(0);
    const n = await como(db, A, (q) => q<{ n: number }>(`select public.desvincular_treinador($1) as n`, [a.id]));
    expect(n.rows[0].n).toBe(1);
    const depois = await db.query<{ aluno_id: string | null; codigo: string }>(`select aluno_id, codigo from public.alunos_treinador where id = $1`, [a.id]);
    expect(depois.rows[0].aluno_id).toBeNull();
    expect(depois.rows[0].codigo).not.toBe(a.codigo);
  });
  it('anônimo não lê nem chama nada', async () => {
    await expect(como(db, null, (q) => q(`select 1 from public.alunos_treinador`))).rejects.toThrow();
    await expect(como(db, null, (q) => q(`select public.aceitar_vinculo('x')`))).rejects.toThrow();
  });
});
