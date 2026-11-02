# ADR-0003: Offline-first com estado local em AsyncStorage e fila de sincronização
## Status
Aceito para o MVP local (resolve F003 provisoriamente)
## Data
2026-11-01
## Contexto
Registrar série sem sinal na academia (RF09). A biblioteca de banco local estava "a decidir".
## Decisão
Estado inteiro do usuário num JSON versionado (`versao: 1`) no AsyncStorage; ids uuid gerados no aparelho (expo-crypto); cada gravação entra numa fila que mantém só a última versão de cada registro, enviada em ordem, onde 422 marca o item e não trava os demais; o servidor é a fonte de verdade e exclusão nunca é desfeita (`mesclar`).
## Alternativas consideradas
### expo-sqlite
Melhor para históricos grandes e consultas; mais complexo. Recomendado quando o histórico passar de alguns milhares de séries [a medir].
### WatermelonDB / PowerSync
Sincronização pronta, mas dependência maior ou serviço pago.
## Consequências
Simples e testável. Limite: todo o estado é carregado na memória; migrar para SQLite numa versão futura (mudança local, interface `acoes` mantida). O envio real da fila depende do Supabase (ADR-0004).
