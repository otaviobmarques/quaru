# ADR-0020 – Mídias do catálogo: animação WebP sob demanda, com cache do service worker

- Status: aceito (v0.4.4)
- Data: 2026-11-01
- Substitui em parte: ADR-0012 (as 22 fotos no pacote continuam)

## Contexto
A Biblioteca passou de 22 para 876 exercícios (free-exercise-db, Unlicense). Cada um tem duas fotos (início e fim do
movimento), 750×500 JPEG, 105 MB no total. O Otávio pediu uma animação por exercício, alternando início e fim.

## Decisão
1. **Formato**: WebP animado, 360×240, 6 quadros: início (800 ms), 2 quadros de transição (80 ms cada), fim (800 ms),
   2 quadros de volta. Qualidade 45, `method 6`; se passar de **60 KB**, o script baixa a qualidade de 5 em 5 (mín. 25).
   Mais um pôster parado (360×240, ~7 KB) e uma miniatura da lista (96×64, ~1 KB).
   Medido: animação mín. 3,6 KB, média 31,5 KB, máx. 58,9 KB, total **26,8 MB**; com pôsteres e miniaturas, **33,7 MB** (873 exercícios; 3 da fonte não têm fotos).
2. **Carga sob demanda (não no pacote)**: os arquivos ficam em `public/exercicios/` → `/quaru/exercicios/` no site.
   O service worker **não** os põe no pré-cache; guarda cada um na primeira vez que é aberto, no cache `quaru-midia-v1`,
   que não é apagado quando o app atualiza. A lista só carrega miniaturas das linhas visíveis (FlatList virtualizada).
3. As 22 fotos antigas seguem no pacote (funcionam sem internet desde a instalação).
4. **Nativo (Android)**: a origem vem de `EXPO_PUBLIC_MIDIA_URL`. Sem ela, o app nativo mostra só as 22 fotos do pacote
   e a tela diz que a fonte não tem foto. Nada é baixado sem essa configuração.
5. **Acessibilidade**: a animação repete sem fim, então sempre há "Pausar demonstração" (WCAG 2.2.2). Com
   "reduzir movimento" ligado, começa no pôster parado com "▶ Reproduzir demonstração". Falhou o download: fica a foto.

## Alternativas avaliadas
| Opção | Tamanho inicial | Offline | Problema |
|---|---|---|---|
| Tudo no pacote (pré-cache do SW) | +33,7 MB na instalação do PWA | total | instalar/atualizar baixa 34 MB a cada versão nova do SW; Android +34 MB no APK |
| **Sob demanda + cache em uso (escolhida)** | 0 | o que a pessoa já abriu | primeira abertura precisa de internet |
| GIF | ~3× maior que WebP | — | 256 cores, sem ganho |
| Vídeo MP4 | menor em 2 quadros? não: overhead de contêiner | — | precisa de player, sem ganho para 2 fotos |

## Consequências
- O pacote web só cresce com o JSON do catálogo (~1 MB, ~150 KB com gzip).
- O cache de mídia não tem limite de tamanho; no pior caso (abrir todos) chega a ~34 MB. A limpeza fica para depois.
- `scripts/importar-free-exercise-db.py` regenera tudo; só refaz o arquivo cuja origem ou parâmetros mudaram (manifesto com hash).
