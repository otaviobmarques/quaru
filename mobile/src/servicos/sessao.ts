import { autenticacaoDisponivel } from '@/config/marca';

/**
 * Encerramento da sessão remota (v0.4.3, ADR-0017). Hoje não há autenticação real: nada a encerrar.
 * Quando o Supabase for ligado, este é o ÚNICO ponto a completar, por exemplo:
 *   await supabase.auth.signOut({ scope: 'local' });
 * Os botões "Sair" e "Sair e apagar meus dados deste aparelho" do Perfil já chamam esta função.
 */
export async function encerrarSessaoRemota(): Promise<'sem-autenticacao' | 'encerrada'> {
  if (!autenticacaoDisponivel) return 'sem-autenticacao';
  // Futuro: chamar o signOut do cliente Supabase aqui (ver ADR-0017).
  return 'encerrada';
}
