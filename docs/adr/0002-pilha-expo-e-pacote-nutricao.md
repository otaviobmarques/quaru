# ADR-0002: Reusar a pilha do Pratolino (Expo SDK 58) e adiar a integração do @domma/nutricao
## Status
Aceito para a pilha; **Proposto** para o formato do pacote (monorepo vs. pacote versionado — decidir com o Nícolas)
## Data
2026-11-01
## Contexto
A especificação manda alinhar ao Pratolino (`/home/box/domma/app-calorias`): Expo 58, expo-router, TypeScript, jest-expo, PGlite + Vitest. O diário alimentar viria de `@domma/nutricao`, que ainda não foi extraído.
## Decisão
Mesmas versões do Pratolino (dependências copiadas do lockfile dele). A aba Alimentação mostra "em breve" e não grava nada até o pacote existir.
## Alternativas consideradas
### Copiar o código do diário do Pratolino para cá
Duplicaria RLS e consentimento de IA em dois lugares; contraria a proposta do Nícolas.
### Next.js web
Fora: a especificação pede app de celular; web está fora do MVP (só usada para pré-visualização e capturas).
## Consequências
RF08 fica pendente do Nícolas. Web via react-native-web serve só para desenvolvimento.
