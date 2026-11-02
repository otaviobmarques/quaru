// ADR-0010: armazenamento cifrado (SQLCipher + SecureStore) com módulos nativos simulados.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { CHAVE_ASYNC, CHAVE_SEGREDO, NOME_BANCO, criarArmazenamento, obterChave } from '@/servicos/armazenamento';

const abrir = SQLite.openDatabaseAsync as jest.Mock;
function bancoFalso(cifra = '4.6.1 community') {
  const kv = new Map<string, string>(); const sql: string[] = [];
  const db = {
    databasePath: '/dados/SQLite/quaru.db',
    execAsync: jest.fn(async (s: string) => { sql.push(s); }),
    getFirstAsync: jest.fn(async (s: string, ...p: string[]) => {
      if (s.startsWith('PRAGMA cipher_version')) return cifra ? { cipher_version: cifra } : null;
      return kv.has(p[0]) ? { valor: kv.get(p[0]) } : null;
    }),
    runAsync: jest.fn(async (_s: string, k: string, v: string) => { kv.set(k, v); }),
    closeAsync: jest.fn(async () => {}),
  };
  return { db, kv, sql };
}
const mapaSegredo = (SecureStore as unknown as { __mapa: Map<string, string> }).__mapa;

beforeEach(async () => { jest.clearAllMocks(); mapaSegredo.clear(); await AsyncStorage.clear(); });

describe('chave do banco', () => {
  it('gera 32 bytes aleatórios (64 hex), guarda no SecureStore só neste aparelho e reutiliza', async () => {
    const k1 = await obterChave();
    expect(k1).toMatch(/^[0-9a-f]{64}$/);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(CHAVE_SEGREDO, k1, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
    expect(await obterChave()).toBe(k1);
    expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(1);
  });
});

describe('banco cifrado', () => {
  it('abre com PRAGMA key (chave crua) e confere cipher_version', async () => {
    const f = bancoFalso(); abrir.mockResolvedValueOnce(f.db);
    const a = await criarArmazenamento(false);
    expect(a.modo).toBe('cifrado');
    expect(abrir).toHaveBeenCalledWith(NOME_BANCO);
    expect(f.sql[0]).toMatch(/^PRAGMA key = "x'[0-9a-f]{64}'";$/);
  });
  it('migra do AsyncStorage uma vez e apaga o JSON antigo', async () => {
    await AsyncStorage.setItem(CHAVE_ASYNC, '{"versao":2}');
    const f = bancoFalso(); abrir.mockResolvedValueOnce(f.db);
    const a = await criarArmazenamento(false);
    expect(await a.ler()).toBe('{"versao":2}');
    expect(f.kv.get('estado')).toBe('{"versao":2}');
    expect(await AsyncStorage.getItem(CHAVE_ASYNC)).toBeNull();
    await a.gravar('{"versao":2,"x":1}');
    expect(await a.ler()).toBe('{"versao":2,"x":1}');
  });
  it('"Excluir tudo" apaga o banco e a chave', async () => {
    const f = bancoFalso(); abrir.mockResolvedValueOnce(f.db);
    const a = await criarArmazenamento(false);
    await a.apagarTudo();
    expect(f.db.closeAsync).toHaveBeenCalled();
    expect(SQLite.deleteDatabaseAsync).toHaveBeenCalledWith(NOME_BANCO);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(CHAVE_SEGREDO, expect.anything());
    expect(mapaSegredo.has(CHAVE_SEGREDO)).toBe(false);
  });
  it('sem SQLCipher (cipher_version vazio): produção bloqueia, desenvolvimento usa modo de teste sem cifra', async () => {
    abrir.mockResolvedValueOnce(bancoFalso('').db);
    const p = await criarArmazenamento(false);
    expect(p.modo).toBe('bloqueado');
    await p.gravar('{"saude":1}');
    expect(await AsyncStorage.getItem(CHAVE_ASYNC)).toBeNull(); // nada sem cifra
    abrir.mockResolvedValueOnce(bancoFalso('').db);
    expect((await criarArmazenamento(true)).modo).toBe('teste-sem-cifra');
  });
  it('módulo nativo ausente (Expo Go) em desenvolvimento cai no modo de teste', async () => {
    expect((await criarArmazenamento(true)).modo).toBe('teste-sem-cifra');
  });
  it('web usa o armazenamento do navegador (demonstração)', async () => {
    const antes = Platform.OS; (Platform as { OS: string }).OS = 'web';
    try { expect((await criarArmazenamento(false)).modo).toBe('web'); } finally { (Platform as { OS: string }).OS = antes; }
  });
});
