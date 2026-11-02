# Ligar o login por convite e o painel de administração (v0.6)

Guia para quem administra o projeto Quaru no Supabase. Tudo aqui é feito no painel do Supabase
(https://supabase.com/dashboard) e nas configurações do repositório no GitHub. **Nenhuma senha ou chave secreta
vai para o código.** Leva uns 20 minutos.

Enquanto os passos 6 e 7 não forem feitos, o app publicado continua como antes (modo local, com "Continuar sem
conta"). Assim ninguém fica trancado para fora no meio da configuração.

## 1. Criar as tabelas no banco

No projeto Quaru: **SQL Editor → New query**. Cole e rode, **na ordem**, cada arquivo de
`backend/supabase/migrations/`:

1. `20261101000001_esquema_inicial.sql`
2. `20261101000002_funcoes.sql`
3. `20261101000003_consentimentos_historico.sql`
4. `20261101000004_correcoes_qa.sql`
5. `20261101000005_nome_espacos_unicode.sql`
6. `20261102000006_perfis_admin.sql` ← novo: perfis, papel de administrador e bloqueio

Se em **Table Editor** já aparecem tabelas como `consentimentos` e `rotinas`, os cinco primeiros já foram
aplicados: rode só o 6.

Quem usa a linha de comando pode fazer o mesmo com `backend/scripts/aplicar-migracoes.sh`.

## 2. Fechar o cadastro: só entra quem for convidado

**Authentication → Sign In / Providers**:
- **Email**: deixe ligado.
- **Allow new users to sign up**: **desligue**. Sem isso, qualquer pessoa conseguiria criar conta sozinha.
- Google e os outros provedores: deixe desligados (o app não usa).

## 3. Endereços do app

**Authentication → URL Configuration**:
- **Site URL**: `https://otaviobmarques.github.io/quaru/`
- **Redirect URLs**: adicione `https://otaviobmarques.github.io/quaru/**`

É para onde o e-mail de convite e o de "Esqueci minha senha" levam a pessoa, que chega na tela "Crie sua senha".

## 4. Publicar a função do painel

**Edge Functions → Deploy a new function → Via editor**:
- Nome: `admin-usuarios`
- Crie dois arquivos com o conteúdo de `backend/supabase/functions/admin-usuarios/index.ts` e `regras.ts`.
- Deixe **Verify JWT** ligado.

Depois, em **Edge Functions → Secrets**, adicione:

| Nome | Valor |
|---|---|
| `ORIGENS_ADMIN` | `https://otaviobmarques.github.io` |
| `URL_APP` | `https://otaviobmarques.github.io/quaru/` |

A função já recebe a `SUPABASE_SERVICE_ROLE_KEY` do próprio Supabase. **Nunca copie essa chave para outro lugar.**

Pela linha de comando: `supabase functions deploy admin-usuarios --project-ref <id-do-projeto>`.

## 5. Criar o seu usuário administrador

1. **Authentication → Users → Add user → Send invitation**, com o seu e-mail.
2. Abra o e-mail, toque no link e crie a sua senha na tela "Crie sua senha" do app.
3. Volte ao **SQL Editor** e rode, trocando pelo seu e-mail:
   ```sql
   select public.tornar_admin('seu-email@exemplo.com');
   ```
   Essa função só roda pelo SQL Editor: o app e o painel não conseguem chamá-la.

## 6. Ligar o app e o painel ao projeto

No GitHub: **Settings → Secrets and variables → Actions → aba Variables → New repository variable**. Crie:

| Nome | Onde achar no Supabase |
|---|---|
| `SUPABASE_URL` | Project Settings → API → Project URL (`https://xxxx.supabase.co`) |
| `SUPABASE_ANON_KEY` | Project Settings → API → chave `anon` / `public` |
| `URL_APP` | `https://otaviobmarques.github.io/quaru/` |

São valores públicos: aparecem no app de qualquer jeito e são protegidos pelas regras do banco (RLS). Use
**Variables**, não Secrets. **Não** use a chave `service_role`.

## 7. Publicar

**Actions → Publicar no GitHub Pages → Run workflow** (ou faça qualquer merge no `main`). Depois disso:
- o app (`/quaru/`) passa a pedir e-mail e senha; "Continuar sem conta" some;
- o painel fica em **https://otaviobmarques.github.io/quaru/admin/**.

## Usando o painel

- **Cadastrar usuário**: e-mail, nome (opcional) e papel. A pessoa recebe o convite e cria a senha.
- **Reenviar convite / Redefinir senha**: manda o e-mail de novo.
- **Bloquear**: a pessoa não consegue mais entrar. Se estiver com o app aberto, sai na próxima vez que ele
  conferir o acesso (em até 1 hora). Dá para desbloquear.
- **Tornar admin / Tirar admin**.
- **Remover**: apaga a conta e os dados dela no servidor. Pede para digitar o e-mail.
- Proteções: ninguém bloqueia nem remove a si mesmo, e sempre sobra pelo menos um administrador ativo.

## Avisos importantes

- **E-mails**: o envio de e-mail que já vem com o Supabase tem limite baixo (poucos por hora) e é só para teste.
  Antes de convidar muita gente, configure um SMTP próprio em **Authentication → Emails → SMTP Settings**.
  Em **Emails → Templates** dá para traduzir as mensagens de convite e de nova senha.
- **Privacidade**: com conta, o Quaru passa a guardar o e-mail das pessoas no servidor. A Política de Privacidade
  (hoje em rascunho) precisa dizer isso antes de convidar usuários reais. **Pendência com a Jéssica.**
- **Treinos ainda no aparelho**: nesta versão, o login controla quem entra, mas os treinos continuam guardados
  no aparelho (e na web, no navegador). A sincronização com o servidor é a próxima etapa.
- **Quem já usava o app**: ao entrar com a conta pela primeira vez no mesmo navegador ou celular, os dados que
  já estavam ali passam a ser dessa conta.
- **Na web, a sessão some ao fechar a aba** (fica no sessionStorage, por segurança). Basta entrar de novo.
