# ADR-0013: Versão web (PWA no GitHub Pages) – armazenamento no navegador sem criptografia
## Status
Aceito (0.4.0). Pedido como "ADR-0012"; esse número já é das imagens dos exercícios, então esta decisão ficou como 0013 (a numeração não é reiniciada).
## Data
2026-11-01
## Contexto
O Otávio quer uma versão web do Quaru, instalável como PWA e publicada como site estático no GitHub Pages em subcaminho (`https://otaviobmarques.github.io/quaru/`). O app nativo grava em SQLite cifrado com SQLCipher e chave no Keychain/Keystore (ADR-0010). Nada disso existe no navegador. O Supabase continua desligado (ADR-0004) e o GitHub Pages só serve arquivos estáticos.
## Decisão
- **Export estático** do Expo (`output: single`) com `experiments.baseUrl = "/quaru"`. O `scripts/pos-export-web.mjs` coloca manifest, ícones e registro do service worker no `<head>`, gera `sw.js`, copia `index.html` para `404.html` (rotas da SPA no Pages) e cria `.nojekyll` (a pasta `_expo/` começa com `_`).
- **Armazenamento por plataforma:** `servicos/armazenamento.web.ts` (o Metro escolhe pela extensão) grava o estado no `localStorage` do navegador, modo `web`. O Android/iPhone continuam usando `armazenamento.ts` (SQLCipher). Não há chave, token nem senha no navegador nem no bundle.
- **Sem criptografia na web, dito na tela:** Perfil mostra "Dados salvos neste navegador, sem criptografia do aparelho" e um aviso; o "Excluir tudo" explica que apaga só os dados deste navegador.
- **Fim do descanso na web:** `servicos/alerta-descanso.web.ts` toca `descanso.wav` (HTMLAudio, destravado no toque "Concluir série") e chama `navigator.vibrate([0,400,200,400])` quando existe. Sem notificações push e sem pedido de permissão.
- **Offline:** service worker simples, cache-first dos arquivos do app (lista gerada no build e versão por hash). Ele nunca guarda dados do usuário.
## Alternativas consideradas
- **Cifrar no navegador (WebCrypto com chave no IndexedDB):** a chave ficaria no mesmo navegador que os dados, então a proteção contra quem tem acesso ao computador seria quase nula e daria uma falsa sensação de segurança. Sem senha do usuário (não há login no modo local), não há onde guardar a chave com segurança. Rejeitado por enquanto.
- **IndexedDB:** o estado é um JSON pequeno; o `localStorage` resolve e é síncrono e simples. Se o volume crescer (fotos de refeição), migrar para IndexedDB.
- **SQLite WASM (expo-sqlite web):** exige cabeçalhos COOP/COEP que o GitHub Pages não permite configurar. Rejeitado.
## Consequências
- Os dados de saúde ficam **sem criptografia** no perfil do navegador: qualquer pessoa com acesso a esse navegador/computador pode lê-los; extensões e outros apps do mesmo domínio `otaviobmarques.github.io` (outros repositórios Pages do mesmo usuário) dividem a mesma origem e podem ler o `localStorage`. Mitigação futura: domínio próprio só para o Quaru.
- Limpar dados do site, modo anônimo ou o Safari (que pode apagar dados de sites não usados por 7 dias, salvo app instalado na tela inicial) apaga tudo. A tela recomenda exportar.
- **iPhone/Safari:** não há `navigator.vibrate`, então não vibra; o som só toca se a página estiver aberta e o som do aparelho permitir. Na web o som **não** segue o modo silencioso do Android como a notificação nativa (ADR-0011): segue o volume de mídia.
- Com a aba em segundo plano ou a tela bloqueada, o navegador pode atrasar o timer: o aviso pode não tocar. Sem push, não há aviso com o app fechado.
- A política de privacidade e os textos de consentimento ("somente neste aparelho") precisam de ajuste jurídico para a web (nota em `juridico/nota-versao-web-0.4.md`).
