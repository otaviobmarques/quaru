// QA v0.2 – reteste das correções do banco (migração 0004). REG-03 era `it.fails`; corrigido na 0005.
import { beforeEach, describe, expect, it } from 'vitest';
import { como, criarBanco, criarUsuario, type Banco } from './banco';
const A = '00000000-0000-4000-8000-00000000000a', B = '00000000-0000-4000-8000-00000000000b';
const EXA = '10000000-0000-4000-8000-0000000000aa', EX = '10000000-0000-4000-8000-000000000001';
const SA = '30000000-0000-4000-8000-0000000000aa', SB = '30000000-0000-4000-8000-0000000000bb';
let db: Banco;
const consentir = (u: string) => como(db, u, (q) => q(`insert into public.consentimentos (usuario_id, finalidade, versao) values ($1,'dados_saude','v1')`, [u]));
const iniciar = (u: string, id: string) => como(db, u, (q) => q<{ r: any }>(`select public.iniciar_sessao($1,null,now()) as r`, [id])).then((x) => x.rows[0].r);
beforeEach(async () => {
  db = await criarBanco(); await criarUsuario(db, A); await criarUsuario(db, B);
  await db.query(`insert into public.exercicios (id, nome, grupo_muscular, equipamento) values ($1,'Supino','peito','barra')`, [EX]);
  await como(db, A, (q) => q(`insert into public.exercicios (id, usuario_id, nome, grupo_muscular, equipamento) values ($1,$2,'Meu','peito','halter')`, [EXA, A]));
});
describe('reteste migração 0004', () => {
  it('BUG-02: B não usa exercício de A nem em item de rotina', async () => {
    await como(db, B, (q) => q(`insert into public.rotinas (id, usuario_id, nome) values ($1,$2,'R')`, [SB, B]));
    await expect(como(db, B, (q) => q(`insert into public.rotina_exercicios (id, rotina_id, usuario_id, exercicio_id) values (gen_random_uuid(),$1,$2,$3)`, [SB, B, EXA]))).rejects.toThrow(/row-level security/);
  });
  it('BUG-02: B não troca (UPDATE) o exercício da própria série para o de A', async () => {
    await consentir(B); await iniciar(B, SB);
    const id = crypto.randomUUID();
    await como(db, B, (q) => q(`insert into public.series (id, sessao_id, usuario_id, exercicio_id, ordem) values ($1,$2,$3,$4,1)`, [id, SB, B, EX]));
    await expect(como(db, B, (q) => q(`update public.series set exercicio_id = $1 where id = $2`, [EXA, id]))).rejects.toThrow(/row-level security/);
  });
  it('BUG-02 (LGPD): exclusão de A funciona com referência antiga de B; registro de B pendurado é removido e o resto de B fica', async () => {
    await consentir(B); await iniciar(B, SB);
    const ruim = crypto.randomUUID(), boa = crypto.randomUUID();
    await db.query(`insert into public.series (id, sessao_id, usuario_id, exercicio_id, ordem) values ($1,$2,$3,$4,1),($5,$2,$3,$6,2)`, [ruim, SB, B, EXA, boa, EX]); // legado, sem RLS
    await como(db, A, (q) => q(`select public.excluir_minha_conta()`));
    expect((await db.query(`select 1 from auth.users where id=$1`, [A])).rows).toHaveLength(0);
    expect((await db.query(`select id from public.series where usuario_id=$1`, [B])).rows.map((r: any) => r.id)).toEqual([boa]);
  });
  it('BUG-02: usuário B não consegue chamar excluir_minha_conta para apagar A (só a própria)', async () => {
    await como(db, B, (q) => q(`select public.excluir_minha_conta()`));
    expect((await db.query(`select 1 from auth.users where id=$1`, [A])).rows).toHaveLength(1);
  });
  it('BUG-03: B não move série para sessão de A', async () => {
    await consentir(A); await consentir(B); await iniciar(A, SA); await iniciar(B, SB);
    const id = crypto.randomUUID();
    await como(db, B, (q) => q(`insert into public.series (id, sessao_id, usuario_id, exercicio_id, ordem) values ($1,$2,$3,$4,1)`, [id, SB, B, EX]));
    await expect(como(db, B, (q) => q(`update public.series set sessao_id=$1 where id=$2`, [SA, id]))).rejects.toThrow(/row-level security/);
  });
  it('BUG-04: B com id de A recebe id_invalido', async () => {
    await consentir(A); await consentir(B); await iniciar(A, SA);
    expect((await iniciar(B, SA)).resultado).toBe('id_invalido');
  });
  it('BUG-07: peso 4 min no futuro aceito (tolerância), 10 min recusado', async () => {
    await consentir(A);
    const p = (min: number) => como(db, A, (q) => q(`insert into public.pesos_corporais (id, usuario_id, peso_kg, medido_em) values (gen_random_uuid(),$1,80, now() + ($2 || ' minutes')::interval)`, [A, String(min)]));
    await expect(p(4)).resolves.toBeDefined();
    await expect(p(10)).rejects.toThrow(/row-level security/);
  });
  it('REG-03 (corrigido, migração 0005): nome de rotina só com NBSP/tabulação é recusado', async () => {
    await expect(como(db, A, (q) => q(`insert into public.rotinas (id, usuario_id, nome) values (gen_random_uuid(),$1,$2)`, [A, '\u00a0\t']))).rejects.toThrow(/check constraint/);
  });
  it.each([['NBSP', '\u00a0'], ['tab', '\t\t'], ['ideográfico', '\u3000'], ['largura zero', '\u200b'], ['BOM', '\ufeff'], ['em-space+NNBSP', '\u2003\u202f'], ['quebra de linha', '\n']])('0005: nome só com espaço %s é recusado (rotina e exercício)', async (_n, nome) => {
    await expect(como(db, A, (q) => q(`insert into public.rotinas (id, usuario_id, nome) values (gen_random_uuid(),$1,$2)`, [A, nome]))).rejects.toThrow(/check constraint/);
    await expect(como(db, A, (q) => q(`insert into public.exercicios (id, usuario_id, nome, grupo_muscular, equipamento) values (gen_random_uuid(),$1,$2,'peito','barra')`, [A, nome]))).rejects.toThrow(/check constraint/);
  });
  it('0005: nome com letra entre espaços Unicode é aceito', async () => {
    await expect(como(db, A, (q) => q(`insert into public.rotinas (id, usuario_id, nome) values (gen_random_uuid(),$1,$2)`, [A, '\u00a0Treino A\u3000']))).resolves.toBeDefined();
  });
});
