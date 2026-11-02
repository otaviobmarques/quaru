import { beforeEach, describe, expect, it } from 'vitest';
import { como, criarBanco, criarUsuario, type Banco } from './banco';

const A = '00000000-0000-4000-8000-00000000000a';
const B = '00000000-0000-4000-8000-00000000000b';
const EX = '10000000-0000-4000-8000-000000000001';
const ROT = '20000000-0000-4000-8000-000000000001';
const SES = '30000000-0000-4000-8000-000000000001';
const SER = '40000000-0000-4000-8000-000000000001';
let db: Banco;

const consentir = (uid: string) =>
  como(db, uid, (q) => q(`insert into public.consentimentos (usuario_id, finalidade, versao) values ($1,'dados_saude','v1')`, [uid]));
const iniciar = (uid: string, id: string) =>
  como(db, uid, (q) => q<{ r: any }>(`select public.iniciar_sessao($1, null, now()) as r`, [id])).then((x) => x.rows[0].r);
const gravarSerie = (uid: string, id: string, carga: number, sessao = SES) =>
  como(db, uid, (q) => q(
    `insert into public.series (id, sessao_id, usuario_id, exercicio_id, ordem, carga_kg, reps, concluida_em)
     values ($1,$2,$3,$4,1,$5,8,now())
     on conflict (id) do update set carga_kg = excluded.carga_kg, reps = excluded.reps`, [id, sessao, uid, EX, carga]));

beforeEach(async () => {
  db = await criarBanco();
  await criarUsuario(db, A);
  await criarUsuario(db, B);
  // Exercício da biblioteca (usuario_id null) – dado de teste.
  await db.query(`insert into public.exercicios (id, nome, grupo_muscular, equipamento) values ($1,'Supino reto','peito','barra')`, [EX]);
});

describe('RLS e privilégios', () => {
  it('todas as tabelas públicas têm RLS ativo', async () => {
    const r = await db.query<{ relname: string; relrowsecurity: boolean }>(
      `select relname, relrowsecurity from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r'`);
    expect(r.rows.length).toBe(7);
    r.rows.forEach((t) => expect(t.relrowsecurity, t.relname).toBe(true));
  });

  it('usuário B não lê nem altera as séries de A (IDOR)', async () => {
    await consentir(A);
    await iniciar(A, SES);
    await gravarSerie(A, SER, 60);
    for (const t of ['series', 'sessoes_treino', 'consentimentos']) {
      const r = await como(db, B, (q) => q(`select * from public.${t}`));
      expect(r.rows, t).toHaveLength(0);
    }
    const upd = await como(db, B, (q) => q(`update public.series set carga_kg = 1`));
    expect(upd.affectedRows).toBe(0);
  });

  it('B não pendura série na sessão de A', async () => {
    await consentir(A); await consentir(B);
    await iniciar(A, SES);
    await expect(gravarSerie(B, SER, 50)).rejects.toThrow(/row-level security/);
  });

  it('biblioteca Domma é visível a todos, mas só leitura', async () => {
    const r = await como(db, B, (q) => q(`select nome from public.exercicios`));
    expect(r.rows).toHaveLength(1);
    const upd = await como(db, B, (q) => q(`update public.exercicios set nome = 'x'`));
    expect(upd.affectedRows).toBe(0);
  });

  it('anônimo não acessa nada', async () => {
    await expect(como(db, null, (q) => q(`select * from public.series`))).rejects.toThrow(/permission denied/);
  });

  it('app não apaga fisicamente (só exclusão lógica)', async () => {
    await consentir(A);
    await expect(como(db, A, (q) => q(`delete from public.consentimentos`))).rejects.toThrow(/permission denied/);
  });

  it('chaves estrangeiras têm índice', async () => {
    const r = await db.query<{ falta: string }>(`
      select c.conrelid::regclass || '.' || a.attname as falta
        from pg_constraint c join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
       where c.contype = 'f' and c.connamespace = 'public'::regnamespace
         and not exists (select 1 from pg_index i where i.indrelid = c.conrelid and i.indkey[0] = c.conkey[1])`);
    expect(r.rows).toEqual([]);
  });
});

describe('consentimento (RF11)', () => {
  it('sem consentimento de saúde, não grava treino nem peso', async () => {
    await expect(iniciar(A, SES)).rejects.toThrow(/row-level security/);
    await expect(como(db, A, (q) => q(`insert into public.pesos_corporais (id, usuario_id, peso_kg, medido_em) values (gen_random_uuid(), $1, 80, now())`, [A])))
      .rejects.toThrow(/row-level security/);
  });
  it('consentimento revogado volta a bloquear', async () => {
    await consentir(A);
    await como(db, A, (q) => q(`update public.consentimentos set revogado_em = now()`));
    await expect(iniciar(A, SES)).rejects.toThrow(/row-level security/);
  });
});

describe('validação no banco', () => {
  it('recusa carga negativa', async () => {
    await consentir(A); await iniciar(A, SES);
    await expect(gravarSerie(A, SER, -5)).rejects.toThrow(/check constraint/);
  });
});

describe('sincronização (L2)', () => {
  it('envio duplicado da mesma série não duplica (idempotente por id)', async () => {
    await consentir(A); await iniciar(A, SES);
    await gravarSerie(A, SER, 60);
    await gravarSerie(A, SER, 60);
    const r = await como(db, A, (q) => q(`select * from public.series`));
    expect(r.rows).toHaveLength(1);
  });

  it('dois aparelhos editando a mesma rotina: vence a última gravação recebida', async () => {
    const up = (nome: string) => como(db, A, (q) => q(
      `insert into public.rotinas (id, usuario_id, nome) values ($1,$2,$3) on conflict (id) do update set nome = excluded.nome`, [ROT, A, nome]));
    await up('Treino A');           // aparelho 1
    await up('Treino A – pernas');  // aparelho 2, chega depois
    const r = await como(db, A, (q) => q<{ nome: string }>(`select nome from public.rotinas`));
    expect(r.rows[0].nome).toBe('Treino A – pernas');
  });

  it('exclusão vence edição atrasada de outro aparelho', async () => {
    await como(db, A, (q) => q(`insert into public.rotinas (id, usuario_id, nome) values ($1,$2,'Treino B')`, [ROT, A]));
    await como(db, A, (q) => q(`update public.rotinas set excluido_em = now() where id = $1`, [ROT]));          // aparelho 1 exclui
    await como(db, A, (q) => q(`update public.rotinas set nome = 'Treino B2', excluido_em = null where id = $1`, [ROT])); // aparelho 2, atrasado
    const r = await como(db, A, (q) => q<{ nome: string; excluido_em: string | null }>(`select nome, excluido_em from public.rotinas`));
    expect(r.rows[0].nome).toBe('Treino B');
    expect(r.rows[0].excluido_em).not.toBeNull();
  });

  it('séries de dois aparelhos (ids diferentes) ficam as duas', async () => {
    await consentir(A); await iniciar(A, SES);
    await gravarSerie(A, SER, 60);
    await gravarSerie(A, '40000000-0000-4000-8000-000000000002', 62.5);
    const r = await como(db, A, (q) => q(`select * from public.series`));
    expect(r.rows).toHaveLength(2);
  });

  it('só uma sessão ativa: segundo aparelho recebe conflito com o id da ativa', async () => {
    await consentir(A);
    expect((await iniciar(A, SES)).resultado).toBe('iniciada');
    const r = await iniciar(A, '30000000-0000-4000-8000-000000000002');
    expect(r).toEqual({ resultado: 'conflito', sessao_ativa: SES });
    expect((await iniciar(A, SES)).resultado).toBe('iniciada'); // repetir é idempotente
  });
});

describe('exclusão de conta (RF10)', () => {
  it('apaga todos os dados do usuário e preserva os de outros', async () => {
    await consentir(A); await consentir(B);
    await iniciar(A, SES); await gravarSerie(A, SER, 60);
    await como(db, A, (q) => q(`insert into public.pesos_corporais (id, usuario_id, peso_kg, medido_em) values (gen_random_uuid(), $1, 80, now())`, [A]));
    await como(db, A, (q) => q(`select public.excluir_minha_conta()`));
    for (const t of ['consentimentos', 'sessoes_treino', 'series', 'pesos_corporais', 'rotinas']) {
      const r = await db.query(`select 1 from public.${t} where usuario_id = $1`, [A]);
      expect(r.rows, t).toHaveLength(0);
    }
    const b = await db.query(`select 1 from public.consentimentos where usuario_id = $1`, [B]);
    expect(b.rows).toHaveLength(1);
  });
});
