# Quaru · proposta v3.2
É só proposta: nada foi publicado e não houve custo. A v3.1 (`../telas-v3.1/`) e o `tokens.ts` não foram alterados.
Base: a v3.1, com os seis obrigatórios aprovados pelo Henriquiano. Inclui a decisão do Otávio de 01/11/2026 às 22:53 (BRT).

## O que mudou em relação à v3.1
1. **Título do topo sem corte** (`.topo .ola`):
   - Sem `text-overflow: ellipsis`. O título quebra linha, sem quebrar no meio da palavra.
   - 1,25rem até 400 px, com o selo SIMULAÇÃO menor.
   - O topo passa a quebrar linha: se faltar espaço, o selo desce para uma segunda linha, alinhado à direita.
   - "Alimentação" e "Treinos" aparecem inteiros em 360, 390 e com fonte a 130%.
   - Com o novo verificador, apareceu outro corte: "Mediterrânea" vazava do card a 130%. Os cards de dieta agora empilham quando não cabem.
2. **Fundo do tema claro: #FF7A93 → #F2A0B0** (decisão do Otávio). Todos os pares foram recalculados e todos passam, então **nenhum tom "-sobre-fundo" precisou mudar**.
3. **Tema escuro:** fica o rosa médio da v3.1 (#B03A56, blocos e contorno #1A0E12). O tema escuro-alt (#5A1426) do Henriquiano foi **descartado** por decisão do Otávio: arquivos apagados e sem prancha.
4. **Opcionais:**
   - faixa "EXEMPLO" atravessando o QR;
   - selo SIMULAÇÃO com texto para o leitor de tela, "Simulação: dados de exemplo" (o texto visual fica oculto ao leitor);
   - #346EA1 e #84AED3 fora do JSON como foco. O gerador barra isso. O #84AED3 continua só como `secundaria` do escuro, que é um token legítimo.

## Tokens propostos para o Rodrigo
Referência oficial de tokens: [`tokens-v3.2.md`](tokens-v3.2.md).

## Verificações (`verificacao-v3.2.json`)
- 65 renders com 0 problemas. Jest de contraste do app: 84/84.
- **Nova:** o gerador barra texto truncado em todas as telas e larguras, inclusive com fonte a 130%:
  - reticências, `scrollWidth > clientWidth` com overflow oculto ou `line-clamp`;
  - texto que vaza da própria caixa;
  - título do topo sobreposto ao selo ou ao sino.
  - Testado contra a v3.1: ele acusa "Alimentação".
- Mantidas da v3.1:
  - AA de cada texto contra o fundo real, contando a opacidade;
  - toque ≥ 44 px, avisos ≥ 16 px, `<title>` nos SVGs, ids únicos, nenhum "Malhou", símbolo da Domma;
  - 360×800 e fonte a 130%;
  - foco ≥ 3:1, blocos e contorno ≥ 3:1, botões de conta desativados;
  - fotos só aprovadas, barrando `descartadas/`.

## Imagens
São as mesmas da v3.1, com créditos em `../telas-v3.1/LEIAME.md`:
- fotos Pexels: Vegetariana (I Own My Food Art), Mediterrânea (Valeria Boltneva), Ovos mexidos com abacate (Sai Kuen Leung) e Iogurte (Sofía Nuñez);
- visual de reserva do app em Tapioca e Almoço;
- nossas ilustrações v2.1, ícones r1 e QR de exemplo gerado em código.

## Arquivos
- `html/` (com `quaru-v3.2.css`), `png/celular|computador|validacao|foco|alternativa`.
- Pranchas:
  - `prancha-v3.2-celular-claro.png`, `prancha-v3.2-celular-escuro.png`;
  - `prancha-v3.2-computador-claro.png`, `prancha-v3.2-computador-escuro.png`;
  - `prancha-v3.2-validacao.png`, `prancha-v3.2-foco.png`;
  - `prancha-v3.2-comparativa-rosa.png` (v3.1 #FF7A93 × v3.2 #F2A0B0).
- Gerador: `gerador/gerar_v3.2.py`.

## Pendências
- O Rodrigo precisa aprovar a tabela de tokens. Se for aceita, os pares sobre o rosa precisam virar testes no app.
- No app, o título do topo precisa da mesma regra: quebrar linha, `numberOfLines` sem limite e 1,25rem até 400 px.
