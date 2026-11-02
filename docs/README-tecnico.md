# Quaru (nome provisório) — MVP local

App de celular (React Native + Expo) para registrar treinos de academia em português: rotinas, séries com timer de descanso, "última vez", recordes, histórico, gráficos e peso corporal, funcionando sem internet. Domma Tecnologia · versão 0.3.0 · 01/11/2026.

> **Nome provisório: Quaru.** Aprovado pelo Otávio em 01/11/2026 para o código local; ainda depende da busca no INPI. O nome exibido vem de `mobile/src/config/marca.ts` e de `expo.name` em `app.json`. Slug `app-academia` e identificador `br.com.domma.academia` continuam neutros, aguardando decisão.

> **Sem servidor pago.** O Supabase da especificação depende de aprovação de custo do Otávio. Nesta versão o app roda em **modo local** (dados no aparelho, fila de sincronização guardada) e o banco é testado localmente com **PGlite** (Postgres em WebAssembly, sem Docker). Nada foi publicado, implantado ou enviado.

## Estrutura
| Pasta | O que é |
|---|---|
| `mobile/` | App Expo SDK 58 (expo-router, TypeScript). Telas em `src/app/`, regras puras em `src/dominio/`, estado local em `src/estado/`, tokens de design em `src/tema/tokens.ts` |
| `backend/` | Migrações SQL do Postgres/Supabase (`supabase/migrations/`) e testes de banco com PGlite + Vitest (`test/`) |
| `openapi.yaml` | Contrato das chamadas ao servidor (PostgREST + RPC) — a ativar quando houver Supabase |
| `docs/` | ADRs, diagramas Mermaid, modelo de ameaças, coordenação da equipe |
| `capturas.mjs`, `servir-estatico.mjs` | Capturas de tela com Chrome headless |
| `../capturas/` | PNGs das telas (celular 390×844 @2x e computador 1440×900) |

## Início rápido
Requisitos: Node 24 e npm. Nenhuma variável de ambiente é necessária no modo local.
```bash
cd mobile && npm install         # dependências do app
npm run web                      # abre em http://localhost:8081 (navegador)
npm start                        # QR code para Expo Go no celular (mesma rede)
cd ../backend && npm install && npm test   # testes do banco
```
Para ver o app com dados de **EXEMPLO** (fictícios): em Perfil → "Carregar dados de exemplo", ou, só em desenvolvimento na web, abrir `http://localhost:8081/inicio?exemplo=1`. Uma faixa laranja "Dados de EXEMPLO" aparece em todas as telas enquanto eles estiverem carregados.

### Privacidade no modo local (0.2.0)
- Sem cadastro e sem e-mail: a tela inicial só tem "Começar" (ADR-0009).
- Consentimento de dados de saúde na tela de consentimentos; consentimento de IA (EUA) só no primeiro uso da foto da refeição. Cada aceite guarda versão do texto e data/hora; revogar mantém o histórico.
- Termos e Política em **RASCUNHO** em Perfil → "Termos de uso e privacidade". Após editar `../juridico/*.md`, regenerar com `cd mobile && node scripts-gerar-juridico.mjs`.
- Backup do Android desligado (`allowBackup: false` + plugin `plugins/sem-backup-android.js` com `dataExtractionRules`/`fullBackupContent`, efetivo só num build nativo); iCloud e criptografia local planejados (ADR-0010; não rodam no Expo Go).
- Itens da fila recusados pelo servidor: Perfil → "Sincronização: itens com erro" (corrigir ou descartar).
- Fim do descanso: vibra com o app aberto, notificação local em segundo plano (ADR-0011).

## Comandos
| Onde | Comando | O que faz |
|---|---|---|
| mobile | `npm run web` / `npm start` | servidor de desenvolvimento (web / Expo Go) |
| mobile | `npm test` | testes (jest-expo): regras L1, L2, L3, L5, métricas, telas |
| mobile | `npm run typecheck` · `npm run lint` | TypeScript e ESLint |
| backend | `npm test` | testes do banco em PGlite: RLS, consentimento e histórico, sincronização, exclusão, abuso (QA). Roda um arquivo por vez (`vitest.config.ts`) |
| backend | `npm run typecheck` | TypeScript dos testes |
| mobile | `npm run web:export` | versão web estática para o GitHub Pages em `/quaru/` (ver "Versão web") |

## Build Android local (sem EAS, sem conta)
Ferramentas instaladas no box (gratuitas): JDK Temurin 21 em `/home/box/jdk`, Android SDK em `/home/box/android-sdk` (platform 37, build-tools 37, NDK 27.1, CMake 3.22). Variáveis em `/home/box/android-env.sh`.
```bash
source /home/box/android-env.sh
cd mobile && npx expo prebuild --platform android --clean
cd android && ./gradlew assembleDebug -PreactNativeArchitectures=x86_64,arm64-v8a
# APK: mobile/android/app/build/outputs/apk/debug/app-debug.apk
```
`android/` é gerada (CNG): não edite à mão, mude `app.json` ou os plugins e rode o prebuild de novo. Build de iOS só em macOS com Xcode.

## Ligar a um projeto Supabase (plano gratuito)
**Projeto criado pelo Otávio:** ref `gnmbrcdqljhtoxxkuekz`, URL `https://SEU-PROJETO.supabase.co`, região `sa-east-1`. A URL já está no `.env.example`. A chave anon e a senha do banco **não** ficam no repositório. As migrações 0001–0005 estão prontas e testadas no PGlite, mas **ainda não foram aplicadas**; esperam o aval do Otávio (use primeiro `aplicar-migracoes.sh` sem `--aplicar`, que só faz o dry-run).

O Otávio aprovou o plano gratuito. **Nenhuma conta ou projeto foi criado por nós.** **Sem as chaves, o app continua no modo local (padrão).**

> ⚠️ **O projeto gratuito pausa depois de 1 semana sem uso** (pouca atividade no banco em 7 dias). A Supabase avisa por e-mail antes. O projeto pode ser retomado no painel por até 1 ano, com os dados preservados. Planos pagos não pausam. Fontes: https://supabase.com/docs/guides/platform/free-project-pausing e https://supabase.com/pricing (consultados em 01/11/2026). Com o app em uso diário isso não deve acontecer, mas pode acontecer em fase de testes parada.

Passo a passo (quem tiver a conta da Domma):
1. Em https://supabase.com/dashboard, crie um projeto no plano **Free**, região **South America (São Paulo)**, com uma senha forte de banco guardada no cofre da Domma.
2. **Aplicar as migrações** (CLI oficial, gratuita, via npx, sem login):
   ```bash
   cd backend
   # Painel → Connect → "Session pooler" → copie a URI (com a senha). Não cole em chat nem em arquivo versionado.
   read -rs SUPABASE_DB_URL && export SUPABASE_DB_URL
   ./scripts/aplicar-migracoes.sh            # roda os testes PGlite e mostra o que seria aplicado (--dry-run)
   ./scripts/aplicar-migracoes.sh --aplicar  # aplica (pede confirmação digitando APLICAR)
   unset SUPABASE_DB_URL
   ```
3. **Configurar o app:** em `mobile/`, copie `.env.example` para `.env` (ignorado pelo controle de versão) e preencha `EXPO_PUBLIC_SUPABASE_URL` (Painel → Settings → API → Project URL) e `EXPO_PUBLIC_SUPABASE_ANON_KEY` (chave **anon/publishable**). **Nunca** use a `service_role`/secret no app: tudo o que é `EXPO_PUBLIC_*` vai dentro do pacote.
4. Reinicie o Expo (`npx expo start -c`). `src/config/servidor.ts` passa a informar `modo: 'supabase'`. Se as variáveis faltarem ou a URL for inválida, fica `modo: 'local'`.
5. Ainda falta, como próxima etapa (não faz parte desta versão): ligar a fila de sincronização (`dominio/sincronizacao.ts`) ao PostgREST, conforme o `openapi.yaml`, e o login por código no e-mail (Supabase Auth). Depois disso, revisar a política de privacidade (Parte B) com a Jéssica.

## Versão web (PWA) e publicação no GitHub Pages (0.4.0)
A web roda **só no modo local**: os dados ficam no `localStorage` do navegador, **sem criptografia** (ADR-0013). Não há notificações; o fim do descanso toca `descanso.wav` e vibra onde o navegador permite (o iPhone não vibra).

1. Gerar: `cd mobile && npm run web:export` (export estático em `mobile/dist` com `baseUrl /quaru`, mais manifest, `sw.js`, `404.html` e `.nojekyll`). Não crie `.env` com chave para este build.
2. Testar localmente como no Pages: `node servir-pages.mjs mobile/dist 8091` e abra `http://localhost:8091/quaru/`. Para a verificação automática: `node verificar-web.mjs` (capturas em `../capturas/web/`).
3. Publicar (**só com o OK do Otávio**): o pacote pronto fica em `../publicacao-web/` (repositório git com um commit na `main`). Crie o repositório `quaru` na conta do GitHub, `git remote add origin …`, `git push -u origin main` e, em Settings → Pages, escolha "Deploy from a branch", `main`, pasta `/ (root)`. O endereço fica `https://<usuario>.github.io/quaru/`.
4. Outro nome de repositório ou domínio próprio: mude `experiments.baseUrl` no `app.json` **e** `BASE` em `mobile/scripts/pos-export-web.mjs` e `servir-pages.mjs`, e gere de novo.
5. Atualizações: cada build gera uma versão nova do cache do service worker; quem já tem o app recebe a nova versão na segunda abertura.

## Capturas de tela
```bash
cd mobile && EXPO_PUBLIC_CAPTURAS=1 npx expo export --platform web --output-dir dist-capturas
cd .. && node servir-estatico.mjs mobile/dist-capturas 8090 &   # servidor local só em 127.0.0.1
node capturas.mjs                                               # grava em ../capturas/
```
Capturas da 0.4.1 (pastas `capturas/boas-vindas`, `avatar`, `imc`, `agua`, `dietas`, `refeicoes`, `treinos-sugeridos`, `objetivo`, `area-do-corpo`, `logo`): `node mobile/scripts/pos-export-web.mjs mobile/dist-capturas && node servir-pages.mjs mobile/dist-capturas 8091 & node capturas-041.mjs` (parâmetros extras do build de capturas: `?novo=1`, `?avatar=`, `?altura=`, `?objetivo=`).

`EXPO_PUBLIC_CAPTURAS=1` liga os parâmetros `?exemplo=1`, `?vazio=1`, `?treino=1` e `?limpar=1` no build de capturas. **Nunca use essa variável num build para usuários.**

## Arquitetura
Ver `docs/diagramas/arquitetura.md` (C4, ER, sequência de sincronização, navegação) e `docs/adr/`.
- Offline-first: tudo grava primeiro no aparelho (AsyncStorage, versionado) com `id` uuid gerado no aparelho; cada gravação entra numa fila (`src/dominio/sincronizacao.ts`) que será enviada ao servidor quando existir.
- O banco aplica as regras de verdade: RLS por usuário, consentimento de saúde para gravar treino/peso, exclusão vence edição, relógio do servidor, uma sessão ativa.

## Variáveis de ambiente
| Nome | Obrigatória | Descrição |
|---|---|---|
| `EXPO_PUBLIC_CAPTURAS` | não | `1` só no build de capturas (dados de exemplo por URL) |
| `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` | não | projeto Supabase gratuito; vazias = modo local (padrão). Lidas por `src/config/servidor.ts` |
| `SUPABASE_DB_URL` | só no script | string de conexão do banco para `backend/scripts/aplicar-migracoes.sh`; nunca no app nem versionada |

## Implantação
**Não há.** Builds de loja (TestFlight/teste interno), projeto Supabase e qualquer publicação dependem de contas e de OK explícito do Otávio.

## Licenças de terceiros
`THIRD_PARTY_NOTICES.md` e a tela "Sobre e licenças".
