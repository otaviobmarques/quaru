import { autenticacaoDisponivel } from '@/config/marca';
import { supabase } from '@/servicos/supabase';

/**
 * Encerramento da sessão remota (ADR-0017, ligado na v0.6). Os botões "Sair" e "Sair e apagar meus dados deste
 * aparelho" chamam esta função. Encerra só NESTE aparelho (scope 'local'); as outras sessões da conta seguem.
 */
export async function encerrarSessaoRemota(): Promise<'sem-autenticacao' | 'encerrada'> {
  const sb = supabase();
  if (!autenticacaoDisponivel || !sb) return 'sem-autenticacao';
  await sb.auth.signOut({ scope: 'local' }).catch(() => {});
  return 'encerrada';
}
