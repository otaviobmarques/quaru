// Regras puras do painel de administração (sem Deno nem rede), testadas em test/admin-regras.test.ts.

export type Papel = 'admin' | 'usuario';
export interface PerfilResumo { usuario_id: string; papel: Papel; ativo: boolean }

export type Pedido =
  | { acao: 'listar' }
  | { acao: 'convidar'; email: string; nome?: string; papel?: Papel }
  | { acao: 'bloquear' | 'desbloquear' | 'remover' | 'reenviar'; usuario_id: string }
  | { acao: 'papel'; usuario_id: string; papel: Papel };

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Valida o corpo do pedido. Retorna o pedido normalizado ou uma mensagem de erro em português. */
export function lerPedido(corpo: unknown): Pedido | { erro: string } {
  if (!corpo || typeof corpo !== 'object') return { erro: 'Pedido inválido.' };
  const c = corpo as Record<string, unknown>;
  switch (c.acao) {
    case 'listar': return { acao: 'listar' };
    case 'convidar': {
      const email = typeof c.email === 'string' ? c.email.trim().toLowerCase() : '';
      if (!EMAIL.test(email)) return { erro: 'Digite um e-mail válido.' };
      const nome = typeof c.nome === 'string' ? c.nome.trim().slice(0, 80) : '';
      const papel = c.papel === 'admin' ? 'admin' : 'usuario';
      return { acao: 'convidar', email, nome: nome || undefined, papel };
    }
    case 'bloquear': case 'desbloquear': case 'remover': case 'reenviar':
      if (typeof c.usuario_id !== 'string' || !UUID.test(c.usuario_id)) return { erro: 'Usuário inválido.' };
      return { acao: c.acao, usuario_id: c.usuario_id };
    case 'papel':
      if (typeof c.usuario_id !== 'string' || !UUID.test(c.usuario_id)) return { erro: 'Usuário inválido.' };
      if (c.papel !== 'admin' && c.papel !== 'usuario') return { erro: 'Papel inválido.' };
      return { acao: 'papel', usuario_id: c.usuario_id, papel: c.papel };
    default: return { erro: 'Ação desconhecida.' };
  }
}

/**
 * Proteções: ninguém bloqueia, remove ou rebaixa a si mesmo, e o sistema nunca fica sem administrador ativo.
 * Retorna a mensagem de recusa ou null se pode seguir.
 */
export function recusar(p: Pedido, quem: string, perfis: PerfilResumo[]): string | null {
  if (p.acao === 'listar' || p.acao === 'convidar' || p.acao === 'reenviar' || p.acao === 'desbloquear') return null;
  const alvo = perfis.find((x) => x.usuario_id === p.usuario_id);
  if (!alvo) return 'Usuário não encontrado.';
  const tiraAdmin = (p.acao === 'papel' && p.papel === 'usuario') || p.acao === 'bloquear' || p.acao === 'remover';
  if (p.usuario_id === quem && tiraAdmin) return 'Você não pode bloquear, remover nem tirar o seu próprio acesso de administrador.';
  const adminsAtivos = perfis.filter((x) => x.papel === 'admin' && x.ativo);
  if (tiraAdmin && alvo.papel === 'admin' && alvo.ativo && adminsAtivos.length <= 1) return 'Precisa haver pelo menos um administrador ativo.';
  return null;
}
