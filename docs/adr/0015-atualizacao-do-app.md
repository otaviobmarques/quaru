# ADR-0015: Atualização do app – PWA com aviso; Android pela loja (EAS Update no futuro)

## Status
Aceito (v0.4.1)

## Data
2026-11-01

## Contexto
O Otávio pediu um botão para atualizar o app. Na web/PWA o service worker da 0.4.0 assumia a versão nova sozinho (skipWaiting no install), sem avisar. No Android não há loja publicada nem EAS configurado (sem conta, sem custo).

## Decisão
- **Web/PWA:** o service worker novo instala e fica em espera. O app mostra "Nova versão disponível" com "Atualizar agora" (mensagem `ATUALIZAR` → `skipWaiting` → `controllerchange` → recarregar) e "Depois". Perfil → Verificar atualizações chama `registration.update()`. Os dados ficam no localStorage, que o service worker não toca; ao abrir, `migrarEstado()` converte o esquema (0.4.0 → 0.4.1 testado).
- **Android/iOS nativo:** só mostra a versão e "O que há de novo". A atualização vem pela loja (Google Play) quando publicada. **Futuro:** avaliar EAS Update (OTA para mudanças só de JavaScript), que exige conta Expo e definição de canal e política de *runtime version*; mudanças nativas continuam exigindo build novo. Nada disso foi configurado.
- "O que há de novo" vem do CHANGELOG (`scripts/gerar-novidades.mjs`, roda no `npm run web:export`).

## Alternativas consideradas
- Manter o skipWaiting automático: troca de versão sem aviso no meio de um treino. Rejeitada.
- Checar versão num arquivo `version.json` próprio: duplica o que o service worker já faz. Rejeitada.
- EAS Update já agora: exige conta e configuração; fora do escopo e sem OK de custo.

## Consequências
Quem não tocar em "Atualizar agora" segue na versão antiga até fechar todas as abas. Builds nativos continuam manuais.
