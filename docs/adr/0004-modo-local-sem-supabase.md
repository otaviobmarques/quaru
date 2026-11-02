# ADR-0004: Sem servidor pago no MVP: modo local no app e banco testado em PGlite
## Status
Aceito até a aprovação de custo do Supabase (F004 continua **pendente do Otávio**)
## Data
2026-11-01
## Contexto
Regra do pedido: não gastar nada. Supabase é pago (plano não aprovado); login por código por e-mail (RF01) depende dele.
## Decisão
O app entra em "modo local" com o e-mail apenas como identificação no aparelho. O esquema completo (RLS, consentimento, regras L2, exclusão) está em `backend/supabase/migrations/` e é testado em PGlite com um simulador mínimo do Supabase (`test/shim-supabase.sql`, copiado do Pratolino). O contrato futuro está em `openapi.yaml`.
## Alternativas consideradas
### Postgres local em Docker + API própria
Mais trabalho e diverge da pilha do Pratolino.
### Plano gratuito do Supabase
Possível custo zero, mas criar conta e escolher região/plano é decisão do Otávio e da Jéssica (sa-east-1, DPA).
## Consequências
Sem sincronização real nem login real nesta versão. Projeto compartilhado ou separado do Pratolino continua em aberto (impacto LGPD).
