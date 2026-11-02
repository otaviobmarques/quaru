// GERADO por scripts/gerar-novidades.mjs a partir do CHANGELOG.md. Não edite à mão.
export const VERSAO_NOVIDADES = "0.6.0";
export const NOVIDADES: string[] = [
  "Login por convite e painel de administração. Liga quando o Supabase estiver configurado (docs/supabase-passo-a-passo.md).",
  "### Adicionado",
  "- Login com e-mail e senha: só entra quem foi convidado pelo administrador. Sem \"Continuar sem conta\", \"Criar conta\" nem Google.",
  "- Esqueci minha senha e a tela Crie sua senha, que abre pelo link do convite ou do e-mail de nova senha.",
  "- Painel de administração em site separado (/quaru/admin/): cadastrar por convite, reenviar convite, redefinir senha, bloquear e desbloquear, tornar ou tirar admin, remover.",
  "- Conta bloqueada pelo administrador é desconectada e vê o aviso.",
  "- No primeiro login, os dados que já estavam no aparelho passam a ser da conta. Dados de outra conta no mesmo aparelho nunca se misturam.",
  "### Segurança",
  "- A chave secreta do Supabase fica só no servidor. A sessão fica no Keychain/Keystore no celular e na sessão da aba na web.",
  "- O painel não usa CDN e tem política de conteúdo restrita.",
  "### Observação",
  "- Os treinos continuam guardados no aparelho. A sincronização com o servidor vem na próxima versão."
];
