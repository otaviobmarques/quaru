# Quaru 0.4.3 r1 — ícones de equipamento e Perfil › Sair
A versão 0.4.3 original (`../ilustracoes/`) não foi alterada.

## Obrigatórios
1. Textos do Sair exatamente como pedido (o principal e o de erro). Não há menção a conta, e-mail, senha ou conexão; o gerador confere isso.
2. Nova opção "Sair e apagar meus dados deste aparelho" (spec v0.4.3:25 e perfil.tsx 103-114). Na tela, é um botão de perigo com contorno na cor de erro. Ela abre uma folha de confirmação com o texto do app no celular e o texto web no computador. O campo pede "Digite EXCLUIR para confirmar", e "Apagar e sair" fica desativado até a palavra ser digitada. Estados: normal, confirmado, saindo ("Apagando…") e erro.
3. O texto dos botões usa `--cor-sobre-primaria`. Não sobrou nenhum `--cor-sobre-erro`; o gerador confere.
4. `esteira-bike` continua sendo um ícone só: esteira com lona, coluna e guidão. Veja a prova em 24 e 48 px em `prancha-prova-24-48px-r1.png` e `equipamentos/prova-24-48/`.
5. Padrão dos ícones, conferido pelo gerador (`checa_icone`): grade 96, só contorno, traços de 6 e 4, raio 4, sem preenchimento, sem texto e sem imagem.
6. Os arquivos se chamam `equipamento-<id>.svg/png`, com os ids lidos direto de `equipamentos.ts`.

## Opcionais (todos feitos)
- Elástico legível em 24 px.
- Mãos do peso-corpo dentro da área.
- Títulos com os nomes do código ("Equipamento: <nome>").
- Selo SIMULAÇÃO retirado do Sair, porque a tela não tem dado de exemplo.

## Mudança de decisão
Antes, o "Sair" era destrutivo. Agora ele é a ação principal, já que não apaga nada. O vermelho cheio aparece só na confirmação de apagar (regra da Lorena).

## Verificação
- 44 renders: celular 390×844, web 1440×900, 360×800 e fonte a 130%. Nenhum problema.
- Itens conferidos: rolagem lateral, toque ≥ 44 px, ids, "malhou", títulos dos SVGs, textos exigidos, selo e folha cabendo na tela.
- 99 pares de contraste AA.
- Jest de contraste do app: 84/84.
- Gerador: `gerador/gerar_r1.py`. Resultado em `verificacao-r1.json`.
