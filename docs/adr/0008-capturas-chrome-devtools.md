# ADR-0008: Capturas de tela por build web estático + Chrome headless via protocolo DevTools
## Status
Aceito
## Data
2026-11-01
## Contexto
`google-chrome --screenshot` travava neste ambiente (o processo não terminava). O servidor de desenvolvimento do Expo mantém conexões abertas.
## Decisão
Build web estático com `EXPO_PUBLIC_CAPTURAS=1`, servidor local mínimo (`servir-estatico.mjs`, só 127.0.0.1) e `capturas.mjs` falando com o Chrome pelo protocolo DevTools (WebSocket nativo do Node 24), sem dependências.
## Consequências
As capturas são da versão web (react-native-web); a aparência no iOS/Android pode variar um pouco — conferir em aparelho real (Heloísa).
