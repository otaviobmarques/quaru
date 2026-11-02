# ADR-0018 – Aplicação do design v2.1: paleta v0.3, cantos da Lorena e Lottie com fallback estático na web

- Status: aceito (v0.4.2, não publicado)
- Data: 2026-11-01

## Contexto
O design v2.1 da RedBox usa a paleta v0.3 do `tokens.ts` e acrescenta cores de apoio (marca, marca-escuro, energia, sobre-energia e folha), cantos maiores (cartão 20, destaque 24, botão 14), ilustrações com personagens, o mapa muscular com `data-musculo`/`data-lado`, o ícone em camadas e 5 animações Lottie. O pedido manda seguir a Lorena nos cantos, na fonte e nas cores.

## Decisão
1. **Cores**: mantemos os temas v0.3 de `tokens.ts` sem nenhuma mudança. As cores de apoio entram em `apoio` e `google`. O gerador (`scripts/gerar-design-v042.py`) para se algum SVG do design trouxer uma cor de tema diferente do `tokens.ts`. Os arquivos `design/tokens.ts` e `tokens.css` da Lorena (v0.1, paleta laranja do "Malhou") **não** são usados. A v0.3 já parte da base de neutros, espaçamento e tipografia da Lorena.
2. **Cantos e fonte**: seguem a Lorena (`raio` 8/12/16, Inter), e não os cantos 20/24/14 do design.
3. **Arte**: as ilustrações, as pessoas do login, o mapa, a logo branca e a assinatura da Domma são importados dos arquivos do design por script, sem redesenho, com as cores resolvidas por tema.
4. **Animações**: `lottie-react-native` no Android e no iOS. Na web, o quadro final em PNG (`animacao.web.tsx`), para não carregar o pacote dotLottie. Com "reduzir movimento" ligado, aparece o quadro final (`progress=1`). "carregando" para depois de 10 voltas.
5. **Navegação** (decisão do Otávio, 01/11/2026): abas do design, Início, Treinos, Alimentação, Água e Perfil. Rotinas e Histórico viraram seções da aba Treinos (Meus treinos, Sugeridos, Histórico); /rotinas e /historico continuam abrindo a seção correspondente.

## Consequências
- Novo build Android (módulo nativo do Lottie).
- As capturas diferem do design nos cantos, nas abas e na tela de login, por causa do "Continuar sem conta" e do "em breve".
