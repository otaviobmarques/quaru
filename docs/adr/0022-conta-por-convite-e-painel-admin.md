# ADR-0022 – Conta obrigatória por convite e painel de administração

- Status: aceito (v0.6)
- Data: 2026-11-02
- Substitui, quando o Supabase estiver configurado: ADR-0004 e ADR-0009 (modo local sem e-mail) e o item 2 do ADR-0017 ("Continuar sem conta").

## Contexto
O Otávio pediu para tirar o "Continuar sem conta" e ter um usuário administrativo que cadastra quem usa o app.
O projeto já tinha o banco preparado para o Supabase (`backend/supabase/`), mas nada ligado.

## Decisão
1. **Só o administrador cadastra.** O cadastro público fica desligado no Supabase Auth. O admin convida por e-mail
   e a pessoa cria a própria senha pelo link (tela `/definir-senha`). O app não tem "Criar conta" nem Google.
2. **Perfis** (`public.perfis`): papel `admin` ou `usuario`, e `ativo`. Um gatilho cria o perfil de todo usuário
   novo. A RLS deixa cada um ler o próprio perfil, e o admin ler todos. Ninguém altera perfis pela API pública.
3. **Painel em site separado** (`admin/`, publicado em `/quaru/admin/`), estático, sem CDN (supabase-js empacotado
   no repositório) e com CSP restrita. Ele chama a função de borda `admin-usuarios`, que confere no servidor se
   quem pede é admin ativo e só então usa a `service_role`, que nunca sai do Supabase.
4. **Proteções**: ninguém bloqueia, remove ou rebaixa a si mesmo, e sempre sobra um admin ativo
   (`regras.ts`, com testes). Bloquear = `ban_duration` no Auth (corta login e renovação do token) + `ativo = false`.
5. **Sessão**: no aparelho, Keychain/Keystore em pedaços (`expo-secure-store`); na web, `sessionStorage`. Nada de
   token no `localStorage` (ADR-0017). O app confere `meu_acesso()` ao entrar; conta bloqueada ou sem perfil é
   desconectada. Sem rede, deixa usar offline com a última sessão válida.
6. **Dados do aparelho**: no primeiro login, o que já está no aparelho passa a ser da conta. Se o aparelho tem dados
   de **outra** conta, o app recusa até a pessoa sair e apagar os dados deste aparelho (nada se mistura).
7. **Ativação gradual**: tudo liga sozinho quando as variáveis `EXPO_PUBLIC_SUPABASE_URL` e
   `EXPO_PUBLIC_SUPABASE_ANON_KEY` existem no build. Sem elas, o app segue no modo local (desenvolvimento, testes
   e o site publicado até a configuração terminar).

## Fora desta versão
- Sincronizar treinos, peso e água com o servidor (a fila `dominio/sincronizacao.ts` ainda não envia).
- Links de convite abrindo direto no app nativo (hoje abrem a versão web para criar a senha).

## Consequências
- A Política de Privacidade precisa mencionar o e-mail e a conta antes de convidar usuários reais (Jéssica).
- O envio de e-mail padrão do Supabase tem limite baixo: configurar SMTP próprio para uso real.
- Passo a passo de configuração: `docs/supabase-passo-a-passo.md`.
