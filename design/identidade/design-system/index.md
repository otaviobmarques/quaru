# Quaru · Design System v1.0 (01/11/2026)

**Resumo da marca:**
- **Cores:** Carmim #E0263F, Vinho #1A0E12, Grafite #14141A e Branco.
- **Fonte:** Outfit, licença OFL 1.1.
- **Logo:** `../logo-oficial-quaru/` (Q-cronômetro).
- **Tom:** parceiro de treino, direto e sem promessas.
- **Oferta:** app de registro de treino com timer de descanso, histórico, peso corporal e diário alimentar.
- **Fotos de origem:** nenhuma. Todas as peças são vetoriais e ilustrativas, com dados genéricos.

## Arquivos
| Arquivo | Conteúdo |
|---|---|
| `quaru_design-system_v1.0.pdf` | Design System, 14 páginas, texto pesquisável |
| `quaru_design-system_v1.0.html`, `estilo.css` | Fonte do PDF |
| `svg/` | Logos, ícones, cronômetro, telas, loja, post e story |
| `tokens.json` | Cores, temas, tipografia, espaço, raios, grade e contraste |
| `gerar_ds.py` | Script que gera tudo (`python3 gerar_ds.py`) |
| `quaru_ds_previa.png` | Prévia da capa |
| `previas/` | Prévias de todas as páginas em PNG |

## Pendências
- **Nome:** provisório até a análise da advogada e a busca no INPI.
- **CMYK e Pantone:** valores aproximados; precisam de prova de cor na gráfica.
- **Fotos e vídeos reais:** as peças de anúncio precisam de material real (pessoas treinando, app em uso), que a skill exige mas esta entrega não tem. As referências da Meta Ad Library e do Google Ads Transparency Center ficam para o lote de anúncios.
- **Tela ilustrativa:** não substitui o desenho das telas da Lorena; os tokens precisam ser aplicados ao `tokens.css` e `tokens.ts` do app (hoje com a paleta Malhou).
- **Aprovação:** como primeira versão do Design System, precisa de aprovação do Otávio.

## v1.1 (01/11/2026), em `v1.1/` (a v1.0 não foi alterada)
Arquivos: `v1.1/quaru_design-system_v1.1.pdf` (15 páginas), `quaru_design-system_v1.1.html`, `estilo.css`, `svg/`, `tokens_v1.1.json`, `gerar_ds_v1.1.py`, `quaru_ds_previa_v1.1.png` e `previas_v1.1/`.

**Alterações:**
- **Cor de erro:** #A8201A → **#C2410C** (claro) e #FF8F85 → **#FF8A5B** (escuro), um vermelho-laranja distinto do Carmim.
  - Contraste: 4,85:1 sobre o fundo claro, 5,18:1 sobre branco, branco sobre o erro 5,18:1, erro escuro sobre o Vinho 8,10:1, sobre a superfície escura 7,21:1 e Vinho sobre o erro escuro 8,10:1.
- **Componentes:** a página agora repete que Carmim sobre Vinho (4,05:1) só vale para texto grande, ícones e bordas.
  - Os botões do tema escuro estão documentados com as razões de contraste.
  - Os botões secundário e de texto passam a usar Carmim 300 (7,06:1).
  - A aba ativa do tema escuro passou para Carmim 300; antes era Carmim em 11 px sobre o Vinho, com 4,05:1.
  - O texto Carmim no tema claro passou para Carmim 600 #BC2035 (6,18:1).
- **Aplicações:** as páginas de aplicação (agora 13 e 14) estão marcadas com o selo amarelo "SIMULAÇÃO · ILUSTRATIVO" e uma nota explicativa.
- **Componentes em 2 páginas:** os ícones e os componentes foram separados em duas páginas, por isso a v1.1 tem 15 páginas.
