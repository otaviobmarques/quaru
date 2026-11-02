# ADR-0007: Nome do app em um único ponto de configuração
## Status
Aceito
## Data
2026-11-01
## Contexto
Risco alto no INPI para o nome anterior; o nome vai mudar.
## Decisão
Nome exibido só em `mobile/src/config/marca.ts` (`app-academia`, provisório). `tokens.ts` do app não tem mais `marca`. Identificadores técnicos neutros em `app.json` (`app-academia`, `br.com.domma.academia`, a confirmar). Teste automatizado confere o valor.
## Consequências
Trocar o nome = editar `marca.ts` (e, se quiser, `name` em `app.json`). Identificadores de loja só mudam antes de criar as contas.
