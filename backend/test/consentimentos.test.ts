import { beforeEach, describe, expect, it } from 'vitest';
import { como, criarBanco, criarUsuario, type Banco } from './banco';

const A = '00000000-0000-4000-8000-00000000000a';
const B = '00000000-0000-4000-8000-00000000000b';
let db: Banco;
type Linha = { id: string; finalidade: string; versao: string; aceito_em: string; revogado_em: string | null };
const conceder = (uid: string, f: string, v: string) => como(db, uid, (q) => q<{ r: Linha }>(`select row_to_json(public.conceder_consentimento($1,$2)) as r`, [f, v])).then((x) => x.rows[0].r);
const revogar = (uid: string, f: string) => como(db, uid, (q) => q<{ n: number }>(`select public.revogar_consentimento($1) as n`, [f])).then((x) => x.rows[0].n);
const linhas = (uid: string) => como(db, uid, (q) => q<Linha>(`select * from public.consentimentos order by aceito_em, id`)).then((x) => x.rows);

beforeEach(async () => { db = await criarBanco(); await criarUsuario(db, A); await criarUsuario(db, B); });

describe('consentimentos: versão, data/hora e histórico por finalidade', () => {
  it('cada finalidade tem registro próprio, com versão e data do servidor', async () => {
    await conceder(A, 'dados_saude', 'saude-2026-11-v1-rascunho');
    await conceder(A, 'ia_visao_eua', 'ia-eua-2026-11-v1-rascunho');
    const l = await linhas(A);
    expect(l.map((x) => [x.finalidade, x.versao, x.revogado_em])).toEqual(expect.arrayContaining([
      ['dados_saude', 'saude-2026-11-v1-rascunho', null], ['ia_visao_eua', 'ia-eua-2026-11-v1-rascunho', null]]));
    l.forEach((x) => expect(x.aceito_em).toBeTruthy());
  });
  it('conceder de novo na mesma versão é idempotente', async () => {
    await conceder(A, 'dados_saude', 'v1'); await conceder(A, 'dados_saude', 'v1');
    expect(await linhas(A)).toHaveLength(1);
  });
  it('revogar fecha a linha sem apagar; conceder depois cria nova linha (histórico)', async () => {
    await conceder(A, 'dados_saude', 'v1');
    expect(await revogar(A, 'dados_saude')).toBe(1);
    expect(await revogar(A, 'dados_saude')).toBe(0); // nada ativo
    await conceder(A, 'dados_saude', 'v1');
    const l = (await linhas(A)).filter((x) => x.finalidade === 'dados_saude');
    expect(l).toHaveLength(2);
    expect(l.filter((x) => x.revogado_em)).toHaveLength(1);
  });
  it('revogar uma finalidade não afeta a outra', async () => {
    await conceder(A, 'dados_saude', 'v1'); await conceder(A, 'ia_visao_eua', 'v1');
    await revogar(A, 'ia_visao_eua');
    const r = await como(db, A, (q) => q<{ ok: boolean }>(`select public.tem_consentimento_saude() as ok`));
    expect(r.rows[0].ok).toBe(true);
  });
  it('nova versão do texto encerra a anterior e abre outra', async () => {
    await conceder(A, 'dados_saude', 'v1'); await conceder(A, 'dados_saude', 'v2');
    const l = await linhas(A);
    expect(l.find((x) => x.versao === 'v1')?.revogado_em).toBeTruthy();
    expect(l.find((x) => x.versao === 'v2')?.revogado_em).toBeNull();
  });
  it('só uma linha ativa por finalidade (inserção direta duplicada é recusada)', async () => {
    await conceder(A, 'dados_saude', 'v1');
    await expect(como(db, A, (q) => q(`insert into public.consentimentos (usuario_id, finalidade, versao) values ($1,'dados_saude','v9')`, [A]))).rejects.toThrow(/duplicate key|unique/);
  });
  it('data de aceite não pode ser forjada nem alterada', async () => {
    await como(db, A, (q) => q(`insert into public.consentimentos (usuario_id, finalidade, versao, aceito_em) values ($1,'dados_saude','v1','2000-01-01')`, [A]));
    expect(new Date((await linhas(A))[0].aceito_em).getFullYear()).toBeGreaterThan(2020);
    const antes = (await linhas(A))[0];
    await como(db, A, (q) => q(`update public.consentimentos set aceito_em = '2000-01-01', versao = 'outra', finalidade = 'ia_visao_eua'`));
    const depois = (await linhas(A))[0];
    expect([depois.aceito_em, depois.versao, depois.finalidade]).toEqual([antes.aceito_em, antes.versao, antes.finalidade]);
  });
  it('não se insere consentimento já revogado nem se "desrevoga"', async () => {
    await como(db, A, (q) => q(`insert into public.consentimentos (usuario_id, finalidade, versao, revogado_em) values ($1,'dados_saude','v1', now())`, [A]));
    expect((await linhas(A))[0].revogado_em).toBeNull();
    await revogar(A, 'dados_saude');
    const u = await como(db, A, (q) => q(`update public.consentimentos set revogado_em = null`));
    expect(u.affectedRows).toBe(0);
  });
  it('app não apaga histórico; B não vê nem revoga o de A', async () => {
    await conceder(A, 'dados_saude', 'v1');
    await expect(como(db, A, (q) => q(`delete from public.consentimentos`))).rejects.toThrow(/permission denied/);
    expect(await revogar(B, 'dados_saude')).toBe(0);
    expect(await linhas(B)).toHaveLength(0);
    expect((await linhas(A))[0].revogado_em).toBeNull();
  });
  it('excluir a conta apaga também o histórico de consentimentos', async () => {
    await conceder(A, 'dados_saude', 'v1'); await revogar(A, 'dados_saude');
    await como(db, A, (q) => q(`select public.excluir_minha_conta()`));
    expect((await db.query(`select 1 from public.consentimentos where usuario_id = $1`, [A])).rows).toHaveLength(0);
  });
});
