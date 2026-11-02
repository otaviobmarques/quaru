# Coordenação do MVP — quem é quem e o que falta de cada pessoa
Levantado nos arquivos de `/home/box/domma` em 01/11/2026. **Nenhuma mensagem foi enviada a ninguém**; esta lista é para o Otávio/Rodrigo repassarem.

| Pessoa | Papel (fonte) | O que já entregou para este app | O que precisamos agora |
|---|---|---|---|
| **Nícolas** | Programador do App de Calorias/Pratolino (`catalogo-skills/2026-11-01.md`); no plano, "base de dieta, autenticação e sync compartilhados" ~50% sem. 1–6 (`viabilidade-app-academia.md`) | Pilha do Pratolino que reusamos (Expo 58, PGlite+Vitest, `shim-supabase.sql`); proposta do pacote `@domma/nutricao` e desenho no ADR-0008 do Pratolino (status Proposto, nada extraído) | 1) Decidir monorepo pnpm vs. pacote versionado e extrair `@domma/nutricao` (RF08, aba Alimentação). 2) Confirmar se fotos de refeição ficam fora da exportação (L3). 3) Opinar sobre projeto Supabase compartilhado vs. separado (F004). 4) Padrão de login por código (RF01) para replicarmos |
| **Lorena** | Design de Interface Domma (catálogo) | Guia visual v0.1, tokens (`design/tokens.ts`), componentes, 12 telas v0.1 e v0.2 com L1–L5, contraste, entrega para programação | 1) Revisar as capturas em `capturas/` contra as telas v0.2 (desvios conhecidos abaixo). 2) Ícones Lucide e fonte Inter para o app nativo. 3) Calendário do Histórico (08) e gráfico de linha (09/10), que aqui saíram como lista e barras. 4) Ilustrações dos ~50 exercícios se o Otávio escolher a opção C da L4 |
| **Heloísa** | Qualidade e Testes Domma (catálogo); no plano ~30% sem. 3–10 e 100% sem. 11–12, inclui revisão técnica de LGPD | Nada específico deste app encontrado nos arquivos | 1) Rodar e ampliar os testes (`mobile: npm test`, `backend: npm test`). 2) Teste obrigatório da L2 com dois clientes simulados no PGlite (base já em `backend/test/banco.test.ts`) — e, quando houver servidor, com dois aparelhos reais. 3) Notificação de descanso em iOS e Android reais (tela bloqueada, segundo plano, modo silencioso, permissão negada — L5). 4) Acessibilidade (leitor de tela, foco, contraste) e uso com uma mão no treino. 5) Casos de abuso: IDOR, sync duplicada, carga negativa, exclusão de conta |
| **Jéssica** | Advogada Geral (catálogo); jurídico pontual: AGPL, LGPD, termos | Parecer de 01/11/2026 na especificação (Supabase só sa-east-1 + DPA, Vertex só `us`, sala limpa, não usar nome/logo openGym); lista [VERIFICAR] na viabilidade | 1) **Termos de uso e política de privacidade** (a tela Sobre diz "em elaboração"). 2) Revisar os textos dos dois consentimentos (tela 02, marcados como provisórios). 3) LGPD: projeto Supabase compartilhado com o Pratolino? notificação local dispensa listar provedor de push? 4) Procedência das imagens do free-exercise-db e CC BY-SA do wger (L4). 5) Nome final após o INPI. 6) Exclusão imediata vs. prazo de retenção de backups |

## Desvios conhecidos em relação às telas v0.2 (para Lorena)
- Sem fonte Inter e sem ícones Lucide (símbolos de texto). Histórico só em lista. Gráficos em barras.
- Folha "treino em outro aparelho" (06c) e avisos de sincronização (06b) só fazem sentido com servidor: regra no banco e na fila, sem tela ainda.
- Login com código (01b) não existe: só modo local.
- Arrastar para reordenar (04b) virou botões ↑/↓.

## Pendências após a 0.2.0 (01/11/2026)
- **Jéssica:** tirar da política em rascunho a linha "e-mail digitado na entrada (modo local)" (ADR-0009); revisar os textos de consentimento quando os rascunhos virarem versão final, sem o sufixo `-rascunho` em `VERSOES`.
- **Rodrigo:** criptografia local com SQLCipher + SecureStore num build de desenvolvimento (ADR-0010). Bloqueia o lançamento.
- **Heloísa:** reteste dos BUG-01 a BUG-18 em aparelho real. Notificação com o app aberto, vibração (BUG-17) e leitor de tela na chave web (BUG-15) só se verificam no aparelho e no navegador.
- **Otávio:** aprovar ou não um build de desenvolvimento/EAS (conta Expo, gratuita, mas é serviço externo).
