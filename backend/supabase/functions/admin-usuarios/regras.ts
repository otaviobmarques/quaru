// Regras puras do painel de administração (sem Deno nem rede), testadas em test/admin-regras.test.ts.

export type Papel = 'admin' | 'treinador' | 'usuario';
const PAPEIS: Papel[] = ['admin', 'treinador', 'usuario'];
export interface PerfilResumo { usuario_id: string; papel: Papel; ativo: boolean }

export type Pedido =
  | { acao: 'listar' }
  | { acao: 'convidar'; email: string; nome?: string; papel?: Papel }
  | { acao: 'criar'; email: string; nome?: string; papel?: Papel; senha: string; trocar: boolean; aluno_ref?: string }
  | { acao: 'senha'; usuario_id: string; senha: string; trocar: boolean }
  | { acao: 'bloquear' | 'desbloquear' | 'remover' | 'reenviar'; usuario_id: string }
  | { acao: 'papel'; usuario_id: string; papel: Papel };

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const SENHA_MIN = 8;
export const SENHA_MAX = 72; // limite do bcrypt usado pelo Supabase Auth

/** Senha aceita: 8 a 72 caracteres, com letra e número, sem espaço nas pontas. Devolve a mensagem de erro ou null. */
export function problemaSenha(senha: unknown): string | null {
  if (typeof senha !== 'string' || senha.length < SENHA_MIN) return `A senha precisa ter pelo menos ${SENHA_MIN} caracteres.`;
  if (senha.length > SENHA_MAX) return `A senha pode ter no máximo ${SENHA_MAX} caracteres.`;
  if (senha !== senha.trim()) return 'A senha não pode começar nem terminar com espaço.';
  if (!/[A-Za-zÀ-ÿ]/.test(senha) || !/\d/.test(senha)) return 'Use letras e números na senha.';
  return null;
}

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
      const papel: Papel = PAPEIS.includes(c.papel as Papel) ? (c.papel as Papel) : 'usuario';
      return { acao: 'convidar', email, nome: nome || undefined, papel };
    }
    case 'criar': {
      const email = typeof c.email === 'string' ? c.email.trim().toLowerCase() : '';
      if (!EMAIL.test(email)) return { erro: 'Digite um e-mail válido.' };
      const erroSenha = problemaSenha(c.senha);
      if (erroSenha) return { erro: erroSenha };
      const nome = typeof c.nome === 'string' ? c.nome.trim().slice(0, 80) : '';
      if (c.aluno_ref !== undefined && (typeof c.aluno_ref !== 'string' || !UUID.test(c.aluno_ref))) return { erro: 'Aluno inválido.' };
      return { acao: 'criar', email, nome: nome || undefined, papel: PAPEIS.includes(c.papel as Papel) ? (c.papel as Papel) : 'usuario', senha: c.senha as string, trocar: c.trocar !== false, aluno_ref: c.aluno_ref as string | undefined };
    }
    case 'senha': {
      if (typeof c.usuario_id !== 'string' || !UUID.test(c.usuario_id)) return { erro: 'Usuário inválido.' };
      const erroSenha = problemaSenha(c.senha);
      if (erroSenha) return { erro: erroSenha };
      return { acao: 'senha', usuario_id: c.usuario_id, senha: c.senha as string, trocar: c.trocar !== false };
    }
    case 'bloquear': case 'desbloquear': case 'remover': case 'reenviar':
      if (typeof c.usuario_id !== 'string' || !UUID.test(c.usuario_id)) return { erro: 'Usuário inválido.' };
      return { acao: c.acao, usuario_id: c.usuario_id };
    case 'papel':
      if (typeof c.usuario_id !== 'string' || !UUID.test(c.usuario_id)) return { erro: 'Usuário inválido.' };
      if (!PAPEIS.includes(c.papel as Papel)) return { erro: 'Papel inválido.' };
      return { acao: 'papel', usuario_id: c.usuario_id, papel: c.papel as Papel };
    default: return { erro: 'Ação desconhecida.' };
  }
}

/**
 * Proteções: ninguém bloqueia, remove ou rebaixa a si mesmo, e o sistema nunca fica sem administrador ativo.
 * Retorna a mensagem de recusa ou null se pode seguir.
 */
export function recusar(p: Pedido, quem: string, perfis: PerfilResumo[]): string | null {
  if (p.acao === 'listar' || p.acao === 'convidar' || p.acao === 'criar' || p.acao === 'reenviar' || p.acao === 'desbloquear') return null;
  if (p.acao === 'senha') return perfis.some((x) => x.usuario_id === p.usuario_id) ? null : 'Usuário não encontrado.';
  const alvo = perfis.find((x) => x.usuario_id === p.usuario_id);
  if (!alvo) return 'Usuário não encontrado.';
  const tiraAdmin = (p.acao === 'papel' && p.papel !== 'admin') || p.acao === 'bloquear' || p.acao === 'remover';
  if (p.usuario_id === quem && tiraAdmin) return 'Você não pode bloquear, remover nem tirar o seu próprio acesso de administrador.';
  const adminsAtivos = perfis.filter((x) => x.papel === 'admin' && x.ativo);
  if (tiraAdmin && alvo.papel === 'admin' && alvo.ativo && adminsAtivos.length <= 1) return 'Precisa haver pelo menos um administrador ativo.';
  return null;
}

/**
 * v0.8: o treinador (sem ser admin) só pode criar a conta de um aluno: papel usuário, ligada a um aluno dele.
 * Retorna a mensagem de recusa ou null.
 */
export function recusarTreinador(p: Pedido): string | null {
  if (p.acao !== 'criar') return 'Só administradores podem fazer isso.';
  if (p.papel && p.papel !== 'usuario') return 'Treinador só cria contas de aluno.';
  if (!p.aluno_ref) return 'Escolha o aluno.';
  return null;
}
