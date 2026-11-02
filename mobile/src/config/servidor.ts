/**
 * Configuração do servidor (Supabase, plano gratuito). Sem as duas variáveis, o app fica no MODO LOCAL (padrão).
 * As variáveis EXPO_PUBLIC_* entram no pacote do app: use só a chave anon (pública, protegida pela RLS),
 * nunca a service_role. A ligação da fila de sincronização ao Supabase é o próximo passo (ADR-0004).
 */
export type ConfigServidor = { modo: 'local' } | { modo: 'supabase'; url: string; chaveAnon: string };

const URL_SUPABASE = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/;

export function lerConfigServidor(env: Record<string, string | undefined> = {
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
}): ConfigServidor {
  const url = env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
  const chaveAnon = env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';
  if (!url || !chaveAnon) return { modo: 'local' };
  if (!URL_SUPABASE.test(url)) { console.warn('[servidor] EXPO_PUBLIC_SUPABASE_URL inválida; seguindo no modo local.'); return { modo: 'local' }; }
  return { modo: 'supabase', url: url.replace(/\/$/, ''), chaveAnon };
}

export const configServidor = lerConfigServidor();
