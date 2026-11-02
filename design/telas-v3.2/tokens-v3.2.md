# Quaru · tokens v3.2 para o Rodrigo

Referência oficial dos tokens da v3.2. A base é o `src/tema/tokens.ts` atual, que não foi alterado. Contrastes calculados pela fórmula do WCAG 2.x, com duas casas decimais.

## 1. Tokens que mudam (7 trocas)

| token | tema | antes | depois |
|---|---|---|---|
| fundo | claro | #F7F6F6 | #F2A0B0 |
| borda | claro | #DED8DA | #14141A |
| foco | claro | #346EA1 | #0F2E4D |
| fundo | escuro | #1A0E12 | #B03A56 |
| superficie | escuro | #2A1C21 | #1A0E12 |
| borda | escuro | #3D2C32 | #1A0E12 |
| foco | escuro | #84AED3 | #FFFFFF |

## 2. Tokens novos (8)

| token | tema | antes | depois |
|---|---|---|---|
| texto-sobre-fundo | claro | — | #14141A |
| texto-sobre-fundo | escuro | — | #FFFFFF |
| texto-suave-sobre-fundo | claro | — | #3D1520 |
| texto-suave-sobre-fundo | escuro | — | #FFF0F3 |
| primaria-sobre-fundo | claro | — | #8A1226 |
| primaria-sobre-fundo | escuro | — | #FFD6DE |
| primaria-texto-sobre-fundo | claro | — | #5C0A18 |
| primaria-texto-sobre-fundo | escuro | — | #FFE3E9 |
| tinta | claro | — | #14141A |
| tinta | escuro | — | #1A0E12 |
| acao-sobre-fundo | claro | — | #14141A |
| acao-sobre-fundo | escuro | — | #1A0E12 |
| sobre-acao-sobre-fundo | claro | — | #FFFFFF |
| sobre-acao-sobre-fundo | escuro | — | #FFFFFF |
| foco-sobre-fundo | claro | — | #0F2E4D |
| foco-sobre-fundo | escuro | — | #FFFFFF |

## 3. Contraste dos pares

| tema | frente | fundo | razão | mínimo |
|---|---|---|---|---|
| claro | borda / tinta / acao-sobre-fundo #14141A | fundo #F2A0B0 | 9.11 | 3.0 |
| claro | texto-sobre-fundo #14141A | fundo #F2A0B0 | 9.11 | 4.5 |
| claro | texto-suave-sobre-fundo #3D1520 | fundo #F2A0B0 | 7.86 | 4.5 |
| claro | primaria-sobre-fundo #8A1226 | fundo #F2A0B0 | 4.75 | 3.0 |
| claro | primaria-texto-sobre-fundo #5C0A18 | fundo #F2A0B0 | 6.90 | 4.5 |
| claro | sobre-acao-sobre-fundo #FFFFFF | acao-sobre-fundo #14141A | 18.35 | 4.5 |
| claro | foco / foco-sobre-fundo #0F2E4D | fundo #F2A0B0 | 6.87 | 3.0 |
| claro | foco #0F2E4D | superficie #FFFFFF | 13.83 | 3.0 |
| escuro | superficie / borda / tinta / acao-sobre-fundo #1A0E12 | fundo #B03A56 | 3.21 | 3.0 |
| escuro | texto-sobre-fundo #FFFFFF | fundo #B03A56 | 5.86 | 4.5 |
| escuro | texto-suave-sobre-fundo #FFF0F3 | fundo #B03A56 | 5.30 | 4.5 |
| escuro | primaria-sobre-fundo #FFD6DE | fundo #B03A56 | 4.44 | 3.0 |
| escuro | primaria-texto-sobre-fundo #FFE3E9 | fundo #B03A56 | 4.86 | 4.5 |
| escuro | sobre-acao-sobre-fundo #FFFFFF | acao-sobre-fundo #1A0E12 | 18.83 | 4.5 |
| escuro | foco / foco-sobre-fundo #FFFFFF | fundo #B03A56 | 5.86 | 3.0 |
| escuro | foco #FFFFFF | superficie #1A0E12 | 18.83 | 3.0 |

## 4. Cores proibidas direto sobre o rosa

Estes tokens só podem ser usados dentro de bloco (superfície), nunca direto sobre o fundo rosa. Todos ficam abaixo de 4.5 para texto e a maioria abaixo de 3.0.

| tema | token | frente | fundo | razão |
|---|---|---|---|---|
| claro | erro | #C62828 | #F2A0B0 | 2.79 |
| claro | sucesso | #15803D | #F2A0B0 | 2.49 |
| claro | alerta | #A75A07 | #F2A0B0 | 2.54 |
| claro | secundaria | #285884 | #F2A0B0 | 3.70 |
| claro | primaria | #C81E36 | #F2A0B0 | 2.82 |
| claro | primaria-texto | #A3172C | #F2A0B0 | 3.84 |
| claro | texto-suave | #5C5257 | #F2A0B0 | 3.73 |
| escuro | erro | #F87171 | #B03A56 | 2.12 |
| escuro | sucesso | #4ADE80 | #B03A56 | 3.36 |
| escuro | alerta | #FBBF24 | #B03A56 | 3.51 |
| escuro | secundaria | #84AED3 | #B03A56 | 2.50 |
| escuro | primaria | #FF7085 | #B03A56 | 2.21 |
| escuro | primaria-texto | #FF8A9B | #B03A56 | 2.61 |
| escuro | texto-suave | #C9BDC1 | #B03A56 | 3.22 |

Sobre o rosa, use os tokens "-sobre-fundo" da seção 2.

## 5. Aviso: borda no tema escuro

No escuro, borda #1A0E12 é igual à superficie #1A0E12 (1.00:1). Ela só funciona como contorno por fora do bloco, contra o rosa #B03A56 (3.21:1). Dentro do card ela some.

Para contorno de campo e divisória dentro do card no escuro, a recomendação é #75716B (neutra-500, já existe na paleta do tokens.ts): 3.88:1 contra a superficie #1A0E12. Alternativas existentes, mais claras: #9B9790 (neutra-400, 6.48) e texto-suave #C9BDC1 (10.34). Não servem: superficie-2 #3D2C32 (1.44) e a superficie antiga #2A1C21 (1.15).

Situação nas telas v3.2: os campos (`.inp`) usam texto-suave #C9BDC1 (10.34), então estão corretos. A divisória "conta com login" do formulário de login (`.ou`, linha de 1 px) usa `--cor-borda` dentro do bloco e fica invisível no escuro (1.00:1). As telas não foram alteradas; no app, essa linha deve usar #75716B.

## 6. Variáveis --cor-*-bloco (não são tokens novos)

No CSS da v3.2, as variáveis abaixo só repetem os valores atuais do tokens.ts para uso dentro dos blocos. Não precisam entrar no tokens.ts.

| variável | tema | valor (token atual) |
|---|---|---|
| texto-bloco | claro | #14141A (texto) |
| texto-bloco | escuro | #F7F3F4 (texto) |
| texto-suave-bloco | claro | #5C5257 (texto-suave) |
| texto-suave-bloco | escuro | #C9BDC1 (texto-suave) |
| primaria-bloco | claro | #C81E36 (primaria) |
| primaria-bloco | escuro | #FF7085 (primaria) |
| primaria-texto-bloco | claro | #A3172C (primaria-texto) |
| primaria-texto-bloco | escuro | #FF8A9B (primaria-texto) |
