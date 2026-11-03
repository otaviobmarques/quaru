import { beforeEach, describe, expect, it } from 'vitest';
import { como, criarBanco, criarUsuario, type Banco } from './banco';

const A = '00000000-0000-4000-8000-00000000000a';
const B = '00000000-0000-4000-8000-00000000000b';
let db: Banco;

beforeEach(async () => {
  db = await criarBanco();
  for (const u of [A, B]) await criarUsuario(db, u);
  await db.query(`update public.perfis set ativo = true`);
});

const definir = (u: string, dia: number | null, mes: number | null, ano: number | null = null) =>
  como(db, u, (q) => q(`select public.definir_aniversario($1, $2, $3) as ok`, [dia, mes, ano]));
const ler = async (u: string) => (await db.query<{ aniversario_dia: number | null; aniversario_mes: number | null; aniversario_ano: number | null }>(
  `select aniversario_dia, aniversario_mes, aniversario_ano from public.perfis where usuario_id = $1`, [u])).rows[0];

describe('aniversário (v0.9)', () => {
  it('cada um grava só o próprio; o ano é opcional; null apaga', async () => {
    await definir(A, 5, 11);
    expect(await ler(A)).toEqual({ aniversario_dia: 5, aniversario_mes: 11, aniversario_ano: null });
    expect(await ler(B)).toEqual({ aniversario_dia: null, aniversario_mes: null, aniversario_ano: null });
    await definir(A, 29, 2, 2000);
    expect(await ler(A)).toEqual({ aniversario_dia: 29, aniversario_mes: 2, aniversario_ano: 2000 });
    await definir(A, null, null);
    expect((await ler(A)).aniversario_mes).toBeNull();
  });
  it('recusa data impossível e data no futuro', async () => {
    await expect(definir(A, 31, 2)).rejects.toThrow(/data_invalida/);
    await expect(definir(A, 29, 2, 2001)).rejects.toThrow(/data_invalida/);
    await expect(definir(A, 1, 13)).rejects.toThrow(/data_invalida/);
    await expect(definir(A, 1, 1, 2999)).rejects.toThrow(/data_invalida/);
    await expect(definir(A, 1, 1, 1800)).rejects.toThrow(/data_invalida/);
  });
  it('ninguém escreve o aniversário de outra pessoa pela tabela', async () => {
    await como(db, B, (q) => q(`update public.perfis set aniversario_dia = 1, aniversario_mes = 1 where usuario_id = $1`, [A])).catch(() => null);
    expect((await ler(A)).aniversario_mes).toBeNull();
  });
});
