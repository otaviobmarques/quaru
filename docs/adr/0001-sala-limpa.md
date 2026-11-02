# ADR-0001: Construir do zero (sala limpa); openGym só como referência funcional
## Status
Aceito (herda F001 da especificação)
## Data
2026-11-01
## Contexto
O openGym é AGPL. Copiar código, textos, layout, OpenAPI ou mídias obrigaria a abrir o código do app e criaria risco jurídico (parecer da Jéssica).
## Decisão
Todo o código foi escrito do zero a partir da especificação e do design da Lorena. Nenhum arquivo do openGym foi lido ou usado nesta implementação.
## Alternativas consideradas
### Fork do openGym
Mais rápido, mas AGPL e uso do nome/logo proibidos.
## Consequências
Antes do lançamento: checagem de semelhança de código e histórico git preservado (exigência jurídica).
