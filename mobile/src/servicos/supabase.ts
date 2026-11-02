import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import { configServidor } from '@/config/servidor';
import './polyfill-url';

/**
 * Cliente do Supabase (v0.6, ADR-0022). Só existe quando EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY
 * estão configuradas; sem elas o app segue no modo local (desenvolvimento, testes e capturas).
 * Onde fica a sessão (ADR-0017: nada de token no localStorage):
 *  - aparelho: Keychain/Keystore (expo-secure-store), em pedaços, porque cada chave guarda até ~2 KB;
 *  - web: sessionStorage, que some ao fechar a aba (é preciso entrar de novo a cada visita).
 */
const PEDACO = 1800;
export const armazenamentoSeguro = {
  async getItem(k: string): Promise<string | null> {
    const n = Number(await SecureStore.getItemAsync(`${k}.n`));
    if (!n) return null;
    const partes: string[] = [];
    for (let i = 0; i < n; i++) { const p = await SecureStore.getItemAsync(`${k}.${i}`); if (p == null) return null; partes.push(p); }
    return partes.join('');
  },
  async setItem(k: string, v: string): Promise<void> {
    await armazenamentoSeguro.removeItem(k);
    const n = Math.ceil(v.length / PEDACO);
    for (let i = 0; i < n; i++) await SecureStore.setItemAsync(`${k}.${i}`, v.slice(i * PEDACO, (i + 1) * PEDACO));
    await SecureStore.setItemAsync(`${k}.n`, String(n));
  },
  async removeItem(k: string): Promise<void> {
    const n = Number(await SecureStore.getItemAsync(`${k}.n`)) || 0;
    for (let i = 0; i < n; i++) await SecureStore.deleteItemAsync(`${k}.${i}`);
    await SecureStore.deleteItemAsync(`${k}.n`);
  },
};

/** Tipo do link que abriu o app na web (#...&type=invite|recovery), lido ANTES de o cliente limpar o endereço. */
export const tipoLinkInicial: 'invite' | 'recovery' | null = (() => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const t = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('type');
  return t === 'invite' || t === 'recovery' ? t : null;
})();

let cliente: SupabaseClient | null = null;
export function supabase(): SupabaseClient | null {
  if (configServidor.modo !== 'supabase') return null;
  if (!cliente) {
    cliente = createClient(configServidor.url, configServidor.chaveAnon, {
      auth: {
        storage: Platform.OS === 'web' ? (typeof window !== 'undefined' ? window.sessionStorage : undefined) : armazenamentoSeguro,
        persistSession: true, autoRefreshToken: true, detectSessionInUrl: Platform.OS === 'web',
      },
    });
  }
  return cliente;
}
