# ADR-0023 – Área do treinador e vínculo com o aluno

- Status: aceito (v0.8)
- Data: 2026-11-03

## Contexto
O Otávio pediu uma área para treinadores e coaches cadastrarem os alunos, montarem os exercícios de cada um e mandarem
um link para o aluno ligar no próprio app.

## Decisão
1. **Papel `treinador`** em `public.perfis`, escolhido pelo admin no painel. A área do treinador é outro site estático
   (`treinador/`, publicado em `/quaru/treinador/`), com a mesma CSP e o supabase-js empacotado do painel.
2. **Alunos e link** (`alunos_treinador`): o treinador cria o aluno pelo nome; cada aluno tem um código aleatório de
   32 caracteres. O link é `…/quaru/vincular?codigo=…`. O app guarda o código se a pessoa ainda não entrou e, depois
   do login, pede confirmação. `aceitar_vinculo` (security definer) liga a conta uma vez só; o código não serve para
   outra conta nem para o próprio treinador.
3. **Treinos atribuídos** (`treinos_atribuidos`): nome, itens (até 40), dias da semana e recado. O aluno lê só os do
   vínculo dele (RLS); o treinador lê e escreve só os dos seus alunos. Um gatilho impede o treinador de mudar o vínculo
   (aluno, código, datas) pela API.
4. **No app**, os treinos do treinador são rotinas com `origem: 'treinador'`, só de leitura (dá para fazer uma cópia).
   A sincronização roda ao abrir o app e ao voltar para ele (no máximo a cada 60 s). Os dias do treinador entram no
   padrão da semana da agenda, sem sobrescrever o que o aluno já marcou.
5. **Conta do aluno pelo treinador**: a função `admin-usuarios` aceita treinador apenas na ação `criar`, com papel
   usuário e um `aluno_ref` dele; a conta já sai vinculada.

## Consequências
- O treinador vê o e-mail do aluno vinculado. Histórico, peso e água continuam locais.
- Desvincular apaga o vínculo no servidor e o app busca de novo, tirando só os treinos daquele treinador.
