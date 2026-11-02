# ADR-0019: botão desativado continua focável (equivalente ao aria-disabled)
Data: 01/11/2026 · Status: aceito · Versão: 0.4.3

## Contexto
Na revisão do perfil.tsx, a folha "Sair e apagar" pedia que "Apagar e sair" ficasse bloqueado até a pessoa digitar EXCLUIR, sem sumir para quem usa leitor de tela ou teclado. O `Botao` usava a propriedade `disabled` do Pressable. Na web, isso tira o botão da ordem de tabulação; no celular, o leitor de tela pula o botão ou só diz "desativado", sem explicar o motivo.

## Decisão
No app todo, o `Botao` com `desabilitado` (ou `carregando`):
- **continua focável**: não passa `disabled` ao Pressable;
- anuncia o estado com `accessibilityState={{ disabled: true }}` e `aria-disabled`. Na web, vira `aria-disabled="true"`;
- **barra o clique no código**: `onPress` só roda quando o botão está ativo;
- mantém o visual atual (opacidade 0,4).

## Por que no app todo
- Os botões desativados do app (Entrar, Criar conta e Google em "em breve", Salvar sem dados, Apagar e sair) sempre têm um texto por perto que explica o motivo. Com o foco no botão, o leitor de tela chega até ele e a pessoa entende o que falta.
- Fica igual ao padrão da RedBox (r2) e às práticas do WAI-ARIA para controles desativados que ainda devem ser encontrados.
- Um único comportamento evita botões que às vezes somem do foco e às vezes não.

## Consequências
- A tecla Tab passa pelos botões desativados. Ativá-los não faz nada, e o leitor de tela diz "desativado".
- Testes conferem: `accessibilityState.disabled`, `focusable` diferente de false e `onPress` não chamado (`__tests__/v043-sair.test.tsx`).
- Variante nova `perigo`: vermelho sólido (`erro`), usada só dentro da confirmação de apagar. O texto é branco no tema claro e escuro (#14141A) no tema escuro, com contraste de pelo menos 4,5:1.
