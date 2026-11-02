// Testes de QA v0.1 (01/11/2026): casos de abuso, bordas e LGPD. Dados fictícios.
// `it.fails` = documenta um BUG aberto (o teste descreve o comportamento ESPERADO e hoje falha).
import { beforeEach, describe, expect, it } from 'vitest';
import { como, criarBanco, criarUsuario, type Banco } from './banco';

const A = '00000000-0000-4000-8000-00000000000a';
const B = '00000000-0000-4000-8000-00000000000b';
const EX = '10000000-0000-4000-8000-000000000001';      // biblioteca
const EXA = '10000000-0000-4000-8000-0000000000aa';     // exercício próprio de A
const ROTA = '20000000-0000-4000-8000-0000000000aa';
const SESA = '30000000-0000-4000-8000-0000000000aa';
const SESB = '30000000-0000-4000-8000-0000000000bb';
const SERB = '40000000-0000-4000-8000-0000000000bb';
let db: Banco;

const consentir = (uid: string) =>
  como(db, uid, (q) => q(`insert into public.consentimentos (usuario_id, finalidade, versao) values ($1,'dados_saude','v1')`, [uid]));
const iniciar = (uid: string, id: string, rotina: string | null = null) =>
  como(db, uid, (q) => q<{ r: any }>(`select public.iniciar_sessao($1, $2, now()) as r`, [id, rotina])).then((x) => x.rows[0].r);
const serie = (uid: string, id: string, sessao: string, campos: Record<string, unknown> = {}, ex = EX) => {
  const c = { carga_kg: 60, reps: 8, rpe: null, ...campos };
  return como(db, uid, (q) => q(
    `insert into public.series (id, sessao_id, usuario_id, exercicio_id, ordem, carga_kg, reps, rpe, concluida_em)
     values ($1,$2,$3,$4,1,$5,$6,$7,now())`, [id, sessao, uid, ex, c.carga_kg, c.reps, c.rpe]));
};
const pesoA = (kg: number, quando = 'now()') =>
  como(db, A, (q) => q(`insert into public.pesos_corporais (id, usuario_id, peso_kg, medido_em) values (gen_random_uuid(), $1, $2, ${quando})`, [A, kg]));

beforeEach(async () => {
  db = await criarBanco();
  await criarUsuario(db, A);
  await criarUsuario(db, B);
  await db.query(`insert into public.exercicios (id, nome, grupo_muscular, equipamento) values ($1,'Supino reto','peito','barra')`, [EX]);
});

describe('IDOR: trocar ids para alcançar dados de outro usuário', () => {
  it('B não lê série de A nem pelo id exato', async () => {
    await consentir(A); await iniciar(A, SESA);
    await serie(A, SERB, SESA);
    const r = await como(db, B, (q) => q(`select * from public.series where id = $1`, [SERB]));
    expect(r.rows).toHaveLength(0);
  });
  it('B não grava linha com usuario_id de A', async () => {
    await expect(como(db, B, (q) => q(`insert into public.rotinas (id, usuario_id, nome) values ($1,$2,'x')`, [ROTA, A])))
      .rejects.toThrow(/row-level security/);
  });
  it('B não "doa" a própria rotina para A trocando usuario_id', async () => {
    await como(db, B, (q) => q(`insert into public.rotinas (id, usuario_id, nome) values ($1,$2,'x')`, [ROTA, B]));
    await expect(como(db, B, (q) => q(`update public.rotinas set usuario_id = $1 where id = $2`, [A, ROTA])))
      .rejects.toThrow(/row-level security/);
  });
  it('B não exclui (logicamente) a rotina de A pelo id', async () => {
    await como(db, A, (q) => q(`insert into public.rotinas (id, usuario_id, nome) values ($1,$2,'Treino A')`, [ROTA, A]));
    const u = await como(db, B, (q) => q(`update public.rotinas set excluido_em = now() where id = $1`, [ROTA]));
    expect(u.affectedRows).toBe(0);
  });
  it('iniciar_sessao com id de sessão de A, chamado por B, não altera a sessão de A', async () => {
    await consentir(A); await consentir(B);
    await iniciar(A, SESA);
    await expect(iniciar(B, SESA)).resolves.toBeDefined().catch(() => undefined);
    const r = await db.query<{ usuario_id: string }>(`select usuario_id from public.sessoes_treino where id = $1`, [SESA]);
    expect(r.rows[0].usuario_id).toBe(A);
  });
  it('BUG-04 (corrigido, migração 0004): iniciar_sessao de B com o id da sessão de A não deveria responder "iniciada"', async () => {
    await consentir(A); await consentir(B);
    await iniciar(A, SESA);
    const r = await iniciar(B, SESA);
    expect(r.resultado).not.toBe('iniciada');
  });
  it('BUG-03 (corrigido, migração 0004): B não deveria mover a própria série para a sessão de A (UPDATE não confere a sessão)', async () => {
    await consentir(A); await consentir(B);
    await iniciar(A, SESA); await iniciar(B, SESB);
    await serie(B, SERB, SESB);
    await expect(como(db, B, (q) => q(`update public.series set sessao_id = $1 where id = $2`, [SESA, SERB])))
      .rejects.toThrow(/row-level security/);
  });
  it('BUG-02 (corrigido, migração 0004): B não deveria referenciar o exercício PRÓPRIO de A (FK ignora RLS)', async () => {
    await como(db, A, (q) => q(`insert into public.exercicios (id, usuario_id, nome, grupo_muscular, equipamento) values ($1,$2,'Meu exercício','peito','halter')`, [EXA, A]));
    await consentir(B); await iniciar(B, SESB);
    await expect(serie(B, SERB, SESB, {}, EXA)).rejects.toThrow();
  });
});

describe('exclusão de conta (RF10/LGPD)', () => {
  it('apaga também exercícios próprios, rotinas, itens e registros já excluídos logicamente', async () => {
    await consentir(A);
    await como(db, A, (q) => q(`insert into public.exercicios (id, usuario_id, nome, grupo_muscular, equipamento) values ($1,$2,'Meu','peito','halter')`, [EXA, A]));
    await como(db, A, (q) => q(`insert into public.rotinas (id, usuario_id, nome, excluido_em) values ($1,$2,'Velha', now())`, [ROTA, A]));
    await como(db, A, (q) => q(`insert into public.rotina_exercicios (id, rotina_id, usuario_id, exercicio_id) values (gen_random_uuid(),$1,$2,$3)`, [ROTA, A, EXA]));
    await iniciar(A, SESA, ROTA);
    await serie(A, SERB, SESA, {}, EXA); // série usando o exercício próprio
    await como(db, A, (q) => q(`select public.excluir_minha_conta()`));
    for (const t of ['exercicios', 'rotinas', 'rotina_exercicios', 'sessoes_treino', 'series', 'pesos_corporais', 'consentimentos']) {
      const r = await db.query(`select 1 from public.${t} where usuario_id = $1`, [A]);
      expect(r.rows, t).toHaveLength(0);
    }
    const u = await db.query(`select 1 from auth.users where id = $1`, [A]);
    expect(u.rows).toHaveLength(0);
  });
  it('BUG-02 (efeito LGPD, corrigido na 0004): conta de A é excluída mesmo se houver referência antiga de B ao exercício de A', async () => {
    await como(db, A, (q) => q(`insert into public.exercicios (id, usuario_id, nome, grupo_muscular, equipamento) values ($1,$2,'Meu','peito','halter')`, [EXA, A]));
    await consentir(B); await iniciar(B, SESB);
    // A RLS agora barra essa série; simula dado legado gravado antes da correção (sem RLS).
    await db.query(`insert into public.series (id, sessao_id, usuario_id, exercicio_id, ordem, carga_kg, reps) values ($1,$2,$3,$4,1,60,8)`, [SERB, SESB, B, EXA]);
    await como(db, A, (q) => q(`select public.excluir_minha_conta()`)); // hoje: erro de FK (on delete restrict)
    const u = await db.query(`select 1 from auth.users where id = $1`, [A]);
    expect(u.rows).toHaveLength(0);
  });
  it('anônimo não chama excluir_minha_conta', async () => {
    await expect(como(db, null, (q) => q(`select public.excluir_minha_conta()`))).rejects.toThrow();
  });
  it('excluir a conta de A duas vezes não afeta B (idempotente)', async () => {
    await consentir(B);
    await como(db, A, (q) => q(`select public.excluir_minha_conta()`));
    await como(db, A, (q) => q(`select public.excluir_minha_conta()`));
    const r = await db.query(`select 1 from auth.users`);
    expect(r.rows).toHaveLength(1);
  });
});

describe('valores negativos, absurdos e limites', () => {
  beforeEach(async () => { await consentir(A); await iniciar(A, SESA); });
  const casos: [string, Record<string, unknown>, boolean][] = [
    ['carga 0', { carga_kg: 0 }, true],
    ['carga 1000 (limite)', { carga_kg: 1000 }, true],
    ['carga 1000,01', { carga_kg: 1000.01 }, false],
    ['carga 99999', { carga_kg: 99999 }, false],
    ['carga -0,01', { carga_kg: -0.01 }, false],
    ['reps -1', { reps: -1 }, false],
    ['reps 1001', { reps: 1001 }, false],
    ['rpe 0', { rpe: 0 }, false],
    ['rpe 10,5', { rpe: 10.5 }, false],
    ['carga NaN', { carga_kg: 'NaN' }, false],
  ];
  for (const [nome, campos, aceita] of casos) {
    it(`série: ${nome} → ${aceita ? 'aceita' : 'recusada'}`, async () => {
      const p = serie(A, crypto.randomUUID(), SESA, campos);
      if (aceita) await expect(p).resolves.toBeDefined(); else await expect(p).rejects.toThrow();
    });
  }
  it('peso fora de 20–400 kg é recusado; limites aceitos', async () => {
    await expect(pesoA(19.99)).rejects.toThrow(/check constraint/);
    await expect(pesoA(400.01)).rejects.toThrow(/check constraint/);
    await expect(pesoA(20)).resolves.toBeDefined();
    await expect(pesoA(400)).resolves.toBeDefined();
  });
  it('carga com 3 casas decimais é arredondada para 2 (numeric(6,2))', async () => {
    const id = crypto.randomUUID();
    await serie(A, id, SESA, { carga_kg: 52.555 });
    const r = await db.query<{ carga_kg: string }>(`select carga_kg::text from public.series where id = $1`, [id]);
    expect(r.rows[0].carga_kg).toBe('52.56');
  });
  it('BUG-07 (corrigido, migração 0004): peso com data no futuro deveria ser recusado', async () => {
    await expect(pesoA(80, `now() + interval '10 years'`)).rejects.toThrow();
  });
  it('sessão finalizada antes de iniciada é recusada', async () => {
    await expect(como(db, A, (q) => q(`update public.sessoes_treino set finalizada_em = iniciada_em - interval '1 hour' where id = $1`, [SESA])))
      .rejects.toThrow(/check constraint/);
  });
});

describe('textos enormes e caracteres especiais', () => {
  beforeEach(async () => { await consentir(A); await iniciar(A, SESA); });
  const nomeRotina = (nome: string) =>
    como(db, A, (q) => q(`insert into public.rotinas (id, usuario_id, nome) values (gen_random_uuid(),$1,$2) returning nome`, [A, nome]));
  it('nome de rotina: 60 caracteres ok, 61 recusado, vazio recusado', async () => {
    await expect(nomeRotina('x'.repeat(60))).resolves.toBeDefined();
    await expect(nomeRotina('x'.repeat(61))).rejects.toThrow(/check constraint/);
    await expect(nomeRotina('')).rejects.toThrow(/check constraint/);
  });
  it('limite conta caracteres, não bytes (emoji e acentos)', async () => {
    await expect(nomeRotina('💪'.repeat(60))).resolves.toBeDefined();
    await expect(nomeRotina('ção'.repeat(20))).resolves.toBeDefined();
  });
  it('injeção de SQL e HTML são gravados como texto literal', async () => {
    const t = `'); drop table public.series; -- <script>alert(1)</script>`;
    const r = await nomeRotina(t);
    expect((r.rows[0] as { nome: string }).nome).toBe(t);
    const s = await db.query(`select count(*)::int as n from pg_tables where tablename = 'series'`);
    expect((s.rows[0] as { n: number }).n).toBe(1);
  });
  it('notas: 2000 caracteres ok, 2001 recusado', async () => {
    const up = (n: number) => como(db, A, (q) => q(`update public.sessoes_treino set notas = $1 where id = $2`, ['a'.repeat(n), SESA]));
    await expect(up(2000)).resolves.toBeDefined();
    await expect(up(2001)).rejects.toThrow(/check constraint/);
  });
  it('byte nulo (\\u0000) é recusado pelo Postgres', async () => {
    await expect(nomeRotina('abc\u0000def')).rejects.toThrow();
  });
  it('BUG-08 (corrigido, migração 0004): nome só com espaços é recusado', async () => {
    await expect(nomeRotina('   ')).rejects.toThrow(/check constraint/);
  });
});

describe('envio duplicado (idempotência)', () => {
  it('peso enviado duas vezes com o mesmo id e upsert fica uma linha', async () => {
    await consentir(A);
    const id = crypto.randomUUID();
    const up = () => como(db, A, (q) => q(`insert into public.pesos_corporais (id, usuario_id, peso_kg, medido_em) values ($1,$2,80,now()) on conflict (id) do update set peso_kg = excluded.peso_kg`, [id, A]));
    await up(); await up();
    const r = await db.query(`select 1 from public.pesos_corporais where id = $1`, [id]);
    expect(r.rows).toHaveLength(1);
  });
  it('B não sequestra o id de uma série de A via upsert', async () => {
    await consentir(A); await consentir(B);
    await iniciar(A, SESA); await iniciar(B, SESB);
    await serie(A, SERB, SESA);
    await expect(como(db, B, (q) => q(
      `insert into public.series (id, sessao_id, usuario_id, exercicio_id, ordem, carga_kg) values ($1,$2,$3,$4,1,1)
       on conflict (id) do update set carga_kg = excluded.carga_kg`, [SERB, SESB, B, EX]))).rejects.toThrow();
    const r = await db.query<{ carga_kg: string }>(`select carga_kg::text from public.series where id = $1`, [SERB]);
    expect(r.rows[0].carga_kg).toBe('60.00');
  });
  it('dois aparelhos iniciam sessões diferentes ao mesmo tempo: só uma fica ativa', async () => {
    await consentir(A);
    const r1 = await iniciar(A, SESA);
    const r2 = await iniciar(A, SESB);
    expect([r1.resultado, r2.resultado].sort()).toEqual(['conflito', 'iniciada']);
    const r = await db.query(`select 1 from public.sessoes_treino where usuario_id = $1 and finalizada_em is null`, [A]);
    expect(r.rows).toHaveLength(1);
  });
});

describe('consentimento (repúdio)', () => {
  it('BUG-05 (corrigido na migração 0003): usuário não deveria reescrever a data de aceite nem "desrevogar" o consentimento', async () => {
    await consentir(A);
    await como(db, A, (q) => q(`update public.consentimentos set revogado_em = now()`));
    const u = await como(db, A, (q) => q(`update public.consentimentos set revogado_em = null, aceito_em = '2000-01-01'`));
    expect(u.affectedRows).toBe(0);
  });
});
