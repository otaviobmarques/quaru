# Modelo de ameaças (MVP local) · 01/11/2026
**Ativos:** dados de saúde (treinos, peso), consentimentos, e-mail. **Fronteiras:** aparelho ↔ (futuro) Supabase; build de capturas.

| STRIDE | Ameaça | Controle | Teste |
|---|---|---|---|
| Falsificação | Gravar em nome de outro usuário | RLS `usuario_id = auth.uid()` em insert/update | `banco.test.ts` "B não pendura série…" |
| Adulteração | Edição atrasada ressuscitar registro excluído | Gatilho: exclusão vence edição; relógio do servidor | "exclusão vence edição…" |
| Repúdio | Negar consentimento | Tabela `consentimentos` com versão e datas | — (revisar texto com Jéssica) |
| Vazamento | Ler séries de outro usuário (IDOR) | RLS em todas as tabelas; anônimo sem acesso | "usuário B não lê…", "anônimo…" |
| Vazamento | Carga/peso na tela bloqueada | Texto da notificação sem dados de saúde | `notificacao.test.ts` |
| Negação de serviço | Fila travada por item inválido | 422 marca item e segue | `sincronizacao.test.ts` |
| Elevação | App apagar fisicamente/alterar biblioteca Domma | Sem `DELETE` concedido; biblioteca só leitura | "app não apaga…", "biblioteca…" |
| Exposição | Parâmetros de exemplo num build real | Só com `__DEV__` ou `EXPO_PUBLIC_CAPTURAS=1` | revisão de build |

**Pendente:** limite de requisições e login (Supabase), cabeçalhos/CSP (só se houver web), armazenamento local não criptografado (AsyncStorage) — avaliar `expo-secure-store`/SQLCipher com Heloísa. **Auditoria de dependências** (`npm audit --omit=dev`, 01/11/2026): 0 críticas, 0 altas, 32 moderadas e 1 baixa, todas em ferramentas de build da cadeia do Expo/Jest (`glob`, `minimatch`, `deepmerge`); correção exige `--force` com troca de versão do SDK — não aplicada.

## Atualização 0.2.0 (01/11/2026)
- **Referência cruzada (BUG-02/03):** a RLS de `series` e `rotina_exercicios` agora confere o exercício (próprio ou da biblioteca) e a sessão (própria) no INSERT e no UPDATE (migração 0004).
- **Injeção em planilha (BUG-11):** o CSV exportado neutraliza campos começando com `= + - @`.
- **Dados em repouso:** continuam sem cifra no aparelho, mas `android.allowBackup: false` evita cópia no backup do Google. Criptografia SQLCipher + SecureStore decidida na ADR-0010 (LGPD art. 46). É bloqueante para o lançamento.
- **Minimização:** o modo local não coleta e-mail (ADR-0009).
