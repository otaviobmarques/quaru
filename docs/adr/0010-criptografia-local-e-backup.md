# ADR-0010: Criptografia local (SQLCipher + SecureStore) e backup do Android desligado
## Status
Aceito e implementado na 0.3.0 (Android verificado em build local; iOS só no código, sem build)
## Data
2026-11-01
## Contexto
O treino e o peso são dados de saúde, ou seja, dados pessoais sensíveis (LGPD, art. 5º, II). Hoje eles ficam em JSON sem cifra no AsyncStorage. O **art. 46 da LGPD** exige "medidas de segurança, técnicas e administrativas aptas a proteger os dados pessoais de acessos não autorizados", e o art. 6º, VII (segurança) vai no mesmo sentido. Por isso a criptografia em repouso é a medida técnica que atende ao art. 46 neste app (revisão da Jéssica e `juridico/declaracao-seguranca-dados-google-play.md`, linhas 36 e 60). Além disso, o padrão do Expo é `android.allowBackup = true`. Com isso, o Android pode copiar esse JSON sem cifra para o backup do Google do usuário (linhas 25 e 54 da declaração).
## Decisão
1. **Já em vigor:** `app.json` define `expo.android.allowBackup: false`, que vale até a criptografia entrar.
2. **Criptografia (projeto):** banco local em `expo-sqlite` com SQLCipher (plugin `["expo-sqlite", { "useSQLCipher": true }]`).
   - A chave tem 32 bytes de `expo-crypto.getRandomBytes` e fica guardada no `expo-secure-store` (Keychain no iOS, Keystore no Android), com `keychainAccessible: WHEN_UNLOCKED_THIS_DEVICE_ONLY`.
   - Ao abrir o banco: `PRAGMA key`, depois `PRAGMA cipher_version`. Se a resposta vier vazia, o app se recusa a gravar dado de saúde.
   - Migração única do AsyncStorage para o SQLite, apagando a chave antiga em seguida.
   - "Excluir tudo" apaga o banco e a chave do SecureStore. Sem a chave, nenhum resto de arquivo pode ser lido.
   - Todos os pacotes são gratuitos (MIT).
3. **Por que não foi ativada nesta rodada:** o **Expo Go não inclui SQLCipher**. A opção `useSQLCipher` é um config plugin e exige código nativo, ou seja, um build de desenvolvimento (`npx expo prebuild` / `expo run:android`) ou o EAS Build. Isso precisa do Android SDK/Xcode, que não estão nesta máquina, e o EAS é um serviço externo, que a regra "não gaste nada / não publique" não deixa usar sem aprovação. Na web, o SQLCipher também não existe. Ativar só uma parte deixaria uma configuração impossível de testar aqui.
## Consequências
- Enquanto isso não for feito, os dados ficam sem cifra no aparelho, mas fora do backup do Google. **Bloqueia o lançamento:** não publicar sem a criptografia.
- Próximo passo (Rodrigo, com um aparelho ou emulador): instalar `expo-sqlite`, `expo-secure-store` e `expo-crypto`, gerar o build de desenvolvimento e implementar `servicos/armazenamento-cifrado.ts` atrás da interface atual do armazém. Na web e no Expo Go, o app continua no AsyncStorage com o aviso "modo de teste, sem cifra".
- Só depois de verificar a criptografia em aparelho real voltar a avaliar `allowBackup` (pode continuar `false`).

## Atualização 0.2.1 (01/11/2026) – backup no Android 12+ e no iPhone
- **Android 12 ou mais novo:** `allowBackup=false` não impede a transferência entre aparelhos (D2D) em alguns fabricantes. O plugin `mobile/plugins/sem-backup-android.js` (listado em `app.json`) faz duas coisas no prebuild:
  - acrescenta ao manifesto `android:dataExtractionRules="@xml/regras_extracao_dados"`, que exclui todos os domínios de `<cloud-backup>` e de `<device-transfer>`;
  - acrescenta `android:fullBackupContent="@xml/regras_backup"` para o Android 11 ou mais antigo.
  - Conferido com `npx expo config --type introspect`. Os XML só são gravados num build nativo, que não foi feito.
- **iPhone (planejado):** `allowBackup` não vale no iOS, e o AsyncStorage entra no backup do iCloud e do computador. Ao implementar o armazenamento cifrado:
  - marcar o diretório do banco (e o do AsyncStorage durante a migração) com `NSURLIsExcludedFromBackupKey = true`, por um módulo nativo pequeno ou um plugin com `URLResourceValues.isExcludedFromBackup`;
  - manter a chave com `keychainAccessible: WHEN_UNLOCKED_THIS_DEVICE_ONLY`, que não migra para outro aparelho;
  - confirmar que nenhuma gravação acontece com a tela bloqueada.
  - Verificar num backup real do iCloud/Finder que os arquivos não aparecem.
- **Efeito para o usuário:** sem servidor, quem troca de aparelho perde os dados. O app e a política devem lembrar que existe a exportação manual (Perfil → Exportar).

## Atualização 0.3.0 (01/11/2026): implementação
O Otávio aprovou gerar o build próprio sem custo. O JDK Temurin 21 e o Android SDK (cmdline-tools, platform 37, build-tools 37, NDK 27, CMake) foram instalados no box, sem conta e sem EAS. Depois rodaram `npx expo prebuild` e `./gradlew assembleDebug`.
- **`src/servicos/armazenamento.ts`:**
  - **Chave:** 32 bytes de `expo-crypto.getRandomBytes`, guardados em hex no SecureStore (`quaru.chave-banco.v1`, `WHEN_UNLOCKED_THIS_DEVICE_ONLY`).
  - **Abertura:** `openDatabaseAsync('quaru.db')`, depois `PRAGMA key = "x'<hex>'"` (chave crua, sem derivação PBKDF2) e em seguida `PRAGMA cipher_version`. Se a resposta vier vazia, o armazenamento é **bloqueado** em produção e não grava nada. Em desenvolvimento (Expo Go) usa `teste-sem-cifra`, e o Perfil mostra isso.
  - **Migração:** feita uma vez a partir do AsyncStorage (`app-academia:estado:v1`), que é apagado em seguida.
  - **"Excluir tudo":** fecha e apaga o banco, apaga a chave do SecureStore e a chave antiga do AsyncStorage.
- **`app.json`:** `["expo-sqlite", { "useSQLCipher": true }]` gera `expo.sqlite.useSQLCipher=true` em `gradle.properties`.
- **Regras de backup e qual plugin prevalece:** o `expo-secure-store` também mexe em `fullBackupContent`/`dataExtractionRules` (padrão `configureAndroidBackup: true`). Ele foi configurado com `configureAndroidBackup: false`, e o nosso `plugins/sem-backup-android` vem depois na lista. No manifesto final do prebuild **e do APK** ficaram `@xml/regras_extracao_dados` e `@xml/regras_backup` (os nossos), com `allowBackup="false"`.
- **iPhone (só no código):** o módulo local `modules/quaru-backup` (Swift, `URLResourceValues.isExcludedFromBackup`, isto é, `NSURLIsExcludedFromBackupKey`) é chamado depois de abrir o banco, para `quaru.db`, `-wal` e `-shm`.
  - **Não há build de iOS:** exige macOS com Xcode, impossível neste Linux.
  - **Falta verificar** num Mac: compilar, conferir que `estaExcluido` devolve true e fazer um backup real do iCloud/Finder.
