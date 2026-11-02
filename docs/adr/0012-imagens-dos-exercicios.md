# ADR-0012: Imagens dos exercícios a partir do Free Exercise DB (domínio público)
## Status
Aceito para testes internos. **Publicação depende da validação da Jéssica** (ver Riscos).
## Data
2026-11-01
## Contexto
O Otávio decidiu que o MVP terá imagens dos exercícios, só de fontes gratuitas e com licença clara, sem geração paga. A ADR-0005 previa uma biblioteca sem mídia, e esta ADR a complementa. Havia dois candidatos: yuhonas/free-exercise-db (Unlicense) e wger (CC-BY-SA).
## Decisão
- **Fonte:** https://github.com/yuhonas/free-exercise-db (consultado em 01/11/2026). O `LICENSE.md` é o texto integral do Unlicense, e o README declara "Open Public Domain Exercise Dataset". O conjunto deriva de wrkout/exercises.json, que se declara "within the public domain".
- **Por que não o wger:** a CC-BY-SA exige atribuição por imagem e compartilhamento pela mesma licença das obras derivadas, e cada imagem tem um autor diferente. O domínio público evita essa obrigação no app.
- **Por imagem:** o repositório não traz metadado de licença ou autor por imagem, então cada uma está sob a licença do repositório. A correspondência exercício → pasta de origem está em `src/dominio/imagens-exercicios.ts`. Os 22 exercícios foram associados a: Barbell_Bench_Press_-_Medium_Grip, Incline_Dumbbell_Press, Butterfly, Pushups, Wide-Grip_Lat_Pulldown, Bent_Over_Barbell_Row, Seated_Cable_Rows, Pullups, Barbell_Squat, Leg_Press, Leg_Extensions, Lying_Leg_Curls, Barbell_Deadlift, Standing_Calf_Raises, Dumbbell_Shoulder_Press, Side_Lateral_Raise, Barbell_Curl, Dumbbell_Alternate_Bicep_Curl, Triceps_Pushdown, Standing_Dumbbell_Triceps_Extension, Plank e Crunches.
- **Otimização:** uma foto por exercício (0.jpg, posição inicial), de 850×567 reduzida para 480×320 em JPEG q72 progressivo. O total ficou em cerca de 451 KB, contra cerca de 1,5 MB no original. As imagens vão no pacote do app (funcionam offline, sem CDN).
- **Onde aparecem:** miniatura 64×43 na Biblioteca e foto 3:2 no detalhe do exercício, com a legenda "Imagem: Free Exercise DB · domínio público (Unlicense)". Os créditos estão em `THIRD_PARTY_NOTICES.md` e na tela Sobre e licenças.
## Riscos (para a Jéssica)
- As fotos mostram **pessoas identificáveis**. A dedicação ao domínio público feita pelo mantenedor do repositório não prova que ele detinha os direitos autorais das fotos, nem cobre o **direito de imagem** dos modelos (CF art. 5º, X; CC art. 20). A origem fotográfica não está documentada no repositório; há relatos públicos de que vieram de um site comercial, **não confirmado**.
- Recomendação: **não publicar na loja** sem confirmar a origem. Se não for possível confirmar, a troca prevista é por ilustrações próprias ou do wger com atribuição. O código já isola a fonte num único arquivo gerado.
