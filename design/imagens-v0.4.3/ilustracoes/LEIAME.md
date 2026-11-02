# Quaru 0.4.3 · ilustrações (equipamentos e tela "Sair")

Estilo da v2.1/v2.2 (Lorena) com as cores e os nomes de token da paleta **v0.3** do Rodrigo, lidos direto de `app/mobile/src/tema/tokens.ts`. Os dados de exemplo levam o selo SIMULAÇÃO. O nome Quaru está aprovado; **INPI pendente**.

## Origem de todos os arquivos
**Todos foram desenhados em código pela RedBox** (Python, que gera SVG e HTML/CSS, renderizados no Chromium via Playwright). **Não usei banco de imagem, foto, IA paga nem geração de imagem.**

Arquivos oficiais apenas copiados:
- logotipos Quaru (`identidade/logo-oficial-quaru/`);
- assinatura Domma (`logo/final-sinal/domma_sinal_fundo-claro.svg` e `domma_sinal_fundo-escuro.svg`).

Fonte: Inter (SIL OFL 1.1).

Gerador: `gerador/gerar_v0.4.3.py`. Usa `base.py`, `telas.py` e `ilustracoes.py`, copiados do `telas-v0.4.1/gerador-v2.2/` sem mudança de regra (o `animacoes.py` veio junto na cópia, mas não é usado aqui). Rodar: `python3 gerador/gerar_v0.4.3.py`.

| Arquivo | Origem |
|---|---|
| `equipamentos/svg/equipamento-{halteres,barra,banco,polia,maquinas,elastico,kettlebell,barra-fixa,esteira-ou-bike,peso-do-corpo}.svg` | desenhados em código (`EQUIP` no gerador); `peso-do-corpo` usa a personagem sem rosto do `base.py` |
| `equipamentos/png/equipamento-<item>_{claro,escuro}.png` | prévias 192 px @2x renderizadas dos SVGs |
| `tela-sair/ilustracao-sair.svg` | desenhada em código (`ilu_sair`): personagem acenando ao lado de uma porta aberta |
| `tela-sair/html/` (6 HTML + `quaru-v2.css` + `sair.css` + `recursos/`) | HTML/CSS gerados; os recursos são cópias dos arquivos oficiais |
| `tela-sair/png/tela-05b-sair_{celular,computador}_{claro,escuro}_{normal,saindo,erro}.png` | renders dos HTML (390×844 e 1440×900 @2x) |
| `tela-sair/validacao/` | renders a 360×800 e com fonte a 130% (normal e erro, dois temas) |
| `prancha-equipamentos.png`, `prancha-tela-sair.png` | montadas com PIL a partir dos PNG acima |
| `verificacao-v0.4.3.json` | resultado das verificações |

## Equipamentos
- viewBox 96×96; ficam bem a partir de 24 px.
- Sem `<text>`, `<image>` nem filtros. Tamanho de 1,3 a 2,4 KB cada.
- `role="img"` + `<title>`, com os desenhos em `<g aria-hidden="true">`.
- Cores em variáveis `--q-*`; o tema escuro entra por `[data-tema=escuro]`.
- Peças (`texto`, `texto-suave`, `primaria`, `secundaria`) sobre o círculo `primaria-suave` ficam acima de 3:1 nos dois temas (menor: 4,98:1).

## Tela "Sair" (Perfil › Sair)
- Estados:
  - **normal**: título "Sair da conta?", explicação, botões **Sair** e **Cancelar**;
  - **saindo**: indicador "Saindo…", os dois botões `disabled` e o status em texto;
  - **erro**: aviso com ícone, título e texto ("Não foi possível sair… nada foi perdido") e o botão "Tentar sair de novo".
- Barra de abas com Perfil ativo; abas e botões são `<button>`.
- Botão destrutivo **sólido**, como pede a regra da Lorena para a confirmação:
  - claro: fundo `erro` #C62828 com texto branco (5,62:1);
  - escuro: fundo #F87171 com texto #1A0E12 (6,81:1);
  - o texto do botão usa a variável `--cor-sobre-erro`, que **não existe no tokens.ts** (pendência).
- Web: coluna de 480 px.

## Verificações
- Gerador: 20 renders (12 telas e 8 de validação), **0 problemas**. Em cada render ele confere:
  - rolagem horizontal, "Malhou" e ids repetidos;
  - alvos de toque menores que 44×44;
  - ilustração sem `<title>`;
  - erro sem ícone e texto;
  - botões desativados no estado "saindo".
- Contraste: 97 pares, todos AA.
- Testes do app, `npx jest __tests__/contraste.test.ts __tests__/v041-contraste.test.ts`: **2 suítes, 84/84 passam** (`tokens.ts` sem alteração).

## Pendências
1. Criar o token `sobre-erro` no `tokens.ts` (#FFFFFF claro / #1A0E12 escuro), com teste, junto com o Rodrigo.
2. Confirmar com o Otávio se "esteira ou bike" fica num ícone só (é o que está entregue) ou em dois.
3. INPI do nome Quaru.
4. Layout próprio para computador (por enquanto, coluna de 480 px).
