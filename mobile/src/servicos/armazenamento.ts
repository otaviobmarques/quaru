import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

import { QuaruBackup } from '../../modules/quaru-backup/src';

/**
 * ADR-0010: armazenamento local do estado.
 * - Aparelho (build nativo): SQLite cifrado com SQLCipher; chave aleatória de 32 bytes (expo-crypto) no
 *   SecureStore (Keychain/Keystore, só neste aparelho). Migra uma vez do AsyncStorage e apaga o JSON antigo.
 * - Sem SQLCipher (Expo Go, testes): `teste-sem-cifra` só em desenvolvimento; em produção, `bloqueado`
 *   (não grava dado de saúde sem cifra).
 * - Web: AsyncStorage (localStorage), só para demonstração e capturas.
 */
export const CHAVE_ASYNC = 'app-academia:estado:v1'; // chave legada (mantida para migrar)
export const NOME_BANCO = 'quaru.db';
export const CHAVE_SEGREDO = 'quaru.chave-banco.v1';
const OPCOES_SEGREDO: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

export type Modo = 'cifrado' | 'teste-sem-cifra' | 'web' | 'bloqueado';
export interface Armazenamento { modo: Modo; ler(): Promise<string | null>; gravar(texto: string): Promise<void>; apagarTudo(): Promise<void> }

const hex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');

export async function obterChave(): Promise<string> {
  const atual = await SecureStore.getItemAsync(CHAVE_SEGREDO, OPCOES_SEGREDO);
  if (atual && /^[0-9a-f]{64}$/.test(atual)) return atual;
  const nova = hex(Crypto.getRandomBytes(32));
  await SecureStore.setItemAsync(CHAVE_SEGREDO, nova, OPCOES_SEGREDO);
  return nova;
}

/** Abre o banco com a chave e confere que o SQLCipher está ativo (cipher_version não vazio). */
export async function abrirBancoCifrado(): Promise<SQLite.SQLiteDatabase | null> {
  const chave = await obterChave();
  const db = await SQLite.openDatabaseAsync(NOME_BANCO);
  await db.execAsync(`PRAGMA key = "x'${chave}'";`); // chave crua de 256 bits; só hex, sem interpolação de entrada do usuário
  const v = await db.getFirstAsync<{ cipher_version?: string }>('PRAGMA cipher_version;');
  if (!v?.cipher_version) { await db.closeAsync(); return null; }
  await db.execAsync('CREATE TABLE IF NOT EXISTS kv (chave TEXT PRIMARY KEY NOT NULL, valor TEXT NOT NULL);');
  await excluirDoBackupIos(db);
  return db;
}

/** iPhone: banco (e arquivos -wal/-shm) fora do backup do iCloud/computador. */
async function excluirDoBackupIos(db: SQLite.SQLiteDatabase) {
  if (Platform.OS !== 'ios' || !QuaruBackup) return;
  for (const suf of ['', '-wal', '-shm']) await QuaruBackup.excluirDoBackup(db.databasePath + suf).catch(() => false);
}

function cifrado(db: SQLite.SQLiteDatabase): Armazenamento {
  return {
    modo: 'cifrado',
    async ler() {
      const r = await db.getFirstAsync<{ valor: string }>('SELECT valor FROM kv WHERE chave = ?', 'estado');
      if (r) return r.valor;
      const antigo = await AsyncStorage.getItem(CHAVE_ASYNC); // migração única
      if (antigo != null) {
        await db.runAsync('INSERT OR REPLACE INTO kv (chave, valor) VALUES (?, ?)', 'estado', antigo);
        await AsyncStorage.removeItem(CHAVE_ASYNC);
      }
      return antigo;
    },
    async gravar(texto) { await db.runAsync('INSERT OR REPLACE INTO kv (chave, valor) VALUES (?, ?)', 'estado', texto); },
    async apagarTudo() {
      await db.closeAsync().catch(() => {});
      await SQLite.deleteDatabaseAsync(NOME_BANCO).catch(() => {});
      await SecureStore.deleteItemAsync(CHAVE_SEGREDO, OPCOES_SEGREDO);
      await AsyncStorage.removeItem(CHAVE_ASYNC);
    },
  };
}

const assincrono = (modo: Modo): Armazenamento => ({
  modo,
  ler: () => AsyncStorage.getItem(CHAVE_ASYNC),
  gravar: (t) => AsyncStorage.setItem(CHAVE_ASYNC, t),
  apagarTudo: () => AsyncStorage.removeItem(CHAVE_ASYNC),
});

const bloqueado: Armazenamento = { modo: 'bloqueado', ler: async () => null, gravar: async () => {}, apagarTudo: () => AsyncStorage.removeItem(CHAVE_ASYNC) };

export async function criarArmazenamento(dev: boolean = __DEV__): Promise<Armazenamento> {
  if (Platform.OS === 'web') return assincrono('web');
  try {
    const db = await abrirBancoCifrado();
    if (db) return cifrado(db);
  } catch (e) {
    console.warn('[armazenamento] banco cifrado indisponível:', (e as Error).message);
  }
  return dev ? assincrono('teste-sem-cifra') : bloqueado;
}
