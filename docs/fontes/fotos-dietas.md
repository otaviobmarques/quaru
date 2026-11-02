# Fotos das dietas e das ideias de refeições (v0.4.3)

## Situação
- **Fotos reais**, selecionadas pela RedBox no Pexels e no Pixabay e aprovadas pelo Henriquiano (lote rev. 3, pasta `fotos/` da entrega). Os créditos abaixo foram copiados do `LEIAME.md` da RedBox; nada foi acrescentado.
- Licenças: [Pexels License](https://www.pexels.com/license/) e [Pixabay Content License](https://pixabay.com/service/license-summary/). As duas permitem uso comercial gratuito e não exigem crédito; mesmo assim, o app mostra o crédito no detalhe da dieta, nas ideias de refeições e em Perfil → Sobre o app.
- Formato: WebP, 1:1 = 640×640 (lista) e 16:9 = 1280×720 (detalhe), todos com até 80 KB, conferidos pelo script.
- As fotos provisórias geradas por IA (versão anterior desta 0.4.3) foram **todas substituídas** e não estão mais no app.
- `fotos/descartadas/` não foi usada.

## Como atualizar
`node scripts/importar-imagens-redbox.mjs --verificar` e depois sem a opção. O script lê só `fotos/` (sem subpastas), aceita `dieta-<id>_1x1|16x9.webp` e `refeicao-<id>_1x1|16x9.webp`, confere WebP, tamanho e proporção, copia para `mobile/assets/dietas/` e `mobile/assets/receitas/` e gera `mobile/src/dominio/imagens-redbox-gerado.ts` (imagens, textos alternativos e créditos). Os arquivos da RedBox não são alterados.

## Créditos (16 pares de arquivos)
| Arquivo (RedBox) | Descrição | Autor | Origem | Licença |
|---|---|---|---|---|
| dieta-atkins | Atkins: ovos fritos com bacon na frigideira, sem pão | Mateusz Feliksik | https://www.pexels.com/photo/13376483/ | [Pexels License](https://www.pexels.com/license/) |
| dieta-cetogenica | Cetogênica: salada de salmão, abacate, rúcula e tomate-cereja | Kiro Wang | https://www.pexels.com/photo/7708515/ | [Pexels License](https://www.pexels.com/license/) |
| dieta-jejum-intermitente | Jejum intermitente: café preto, despertador antigo e vela, luz quente | betül nur akyürek | https://www.pexels.com/photo/34640388/ | [Pexels License](https://www.pexels.com/license/) |
| dieta-low-carb | Low-carb: frango grelhado em cubos com brócolis e abobrinha grelhada (sem milho, batata, arroz ou pão) | Алеся Горбунова | https://www.pexels.com/photo/8872309/ | [Pexels License](https://www.pexels.com/license/) |
| dieta-mediterranea | Mediterrânea: peixe assado com tomates, azeitonas, limão e manjericão | Valeria Boltneva | https://www.pexels.com/photo/27294733/ | [Pexels License](https://www.pexels.com/license/) |
| dieta-paleo | Paleo: salada de folhas e tomate com peito de frango grelhado | Nadin Sh | https://www.pexels.com/photo/13312316/ | [Pexels License](https://www.pexels.com/license/) |
| dieta-vegana | Vegana: bowl com tofu, arroz, feijão preto e legumes | Laura oliveira | https://www.pexels.com/photo/34429488/ | [Pexels License](https://www.pexels.com/license/) |
| dieta-vegetariana | Vegetariana: feijão vermelho, arroz e vinagrete em prato branco | I Own My Food Art | https://www.pexels.com/photo/8992843/ | [Pexels License](https://www.pexels.com/license/) |
| refeicao-fruta-castanha | Fruta com castanhas: uvas, pistache e amêndoas | https://kaboompics.com/ | https://www.pexels.com/photo/5202100/ | [Pexels License](https://www.pexels.com/license/) |
| refeicao-iogurte-fruta | Iogurte natural com fruta e aveia (granola, mirtilo, morango) | Sofía Nuñez | https://www.pexels.com/photo/17834128/ | [Pexels License](https://www.pexels.com/license/) |
| refeicao-mingau-aveia | Mingau de aveia com banana (e framboesas, chia) | Polina Tankilevitch | https://www.pexels.com/photo/4725737/ | [Pexels License](https://www.pexels.com/license/) |
| refeicao-ovo-cozido | Ovo cozido com tomate-cereja e folhas (1x1 e 16x9 sem presunto) | Kristina Paukshtite | https://www.pexels.com/photo/10520136/ | [Pexels License](https://www.pexels.com/license/) |
| refeicao-ovos-abacate | Ovos mexidos com abacate, folhas e pão | Sai Kuen Leung | https://www.pexels.com/photo/19745150/ | [Pexels License](https://www.pexels.com/license/) |
| refeicao-pao-pasta-amendoim | Pão com pasta de amendoim e banana | https://kaboompics.com/ | https://www.pexels.com/photo/6659698/ | [Pexels License](https://www.pexels.com/license/) |
| refeicao-sopa-legumes | Sopa de legumes com feijão em tigela rústica | Nic Wood | https://www.pexels.com/photo/28286253/ | [Pexels License](https://www.pexels.com/license/) |
| refeicao-tofu-legumes | Tofu grelhado com legumes salteados e brotos | Anna Tarazevich | https://www.pexels.com/photo/5182130/ | [Pexels License](https://www.pexels.com/license/) |

## Não entraram (conteúdo não bate com a receita do app)
Registrado em `mobile/scripts/imagens-redbox-excecoes.json`:
- `refeicao-peixe-pirao`: a foto é moqueca com pirão, farofa e arroz; a receita do app é "Peixe assado com legumes e azeite".
- `refeicao-omelete`: a foto é omelete com tomate e torrada; a receita do app é "Omelete de espinafre com salada".

## Sem foto (visual de reserva)
Listadas pela RedBox: tapioca com ovo e tomate, cuscuz nordestino com ovo, pão integral com queijo branco e mamão, arroz/feijão/ovo/couve, ensopado de grão-de-bico com abóbora, carne moída com abobrinha, frango desfiado com mandioca e PF de frango. Somam-se as 2 acima. A reserva é um fundo nas cores do DS com o ícone da refeição (café, almoço, lanche ou jantar), oculto ao leitor de tela. Nenhuma foto foi gerada por IA (depende de decisão do Otávio).
