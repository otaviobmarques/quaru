# Pesquisa: vídeos e animações de exercícios para o Quaru

Data: 01/11/2026 (horário de Brasília). Preços em USD conforme as páginas consultadas (não converti para BRL para não inventar câmbio). Nenhuma conta foi criada e nada foi pago.

> Sobre "copiar o que já vimos em outros apps": as animações desses apps em geral vêm de bancos pagos (ExerciseDB/AscendAPI, MuscleWiki etc.) ou são produção própria, com direitos autorais. Copiá-las seria infração. O caminho legal é licenciar uma das fontes abaixo ou produzir o próprio material.

## 1. ExerciseDB (AscendAPI): versão gratuita V1 e versão paga no RapidAPI
- **O que oferece:** GIFs animados (animação 3D estilizada). Versão gratuita: 1.500 exercícios, GIF em 180p. Versão paga: mais de 2.000 exercícios, GIFs e imagens de 360p a 1080p. Só em inglês; não encontrei suporte a português.
  Fontes: https://oss.exercisedb.dev/docs · https://docs.ascendapi.com/products/edb-v1/overview
- **Preço (RapidAPI):** Basic US$ 0 (690 requisições/mês, só 180p); Ultra US$ 18,99/mês (8.625 requisições/mês). O preço dos planos Pro e Mega não apareceu no texto que consegui ler, então não está confirmado. A página também cita uma taxa de banda de US$ 0,001 por MB acima de 10.240 MB/mês.
  Fonte: https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb/pricing
- **Licença:**
  - A versão gratuita **proíbe uso comercial**, SaaS e qualquer uso monetizado. Também exige crédito à AscendAPI (https://oss.exercisedb.dev/docs).
  - Na versão paga, a licença só vale enquanto a assinatura estiver ativa. Se ela acabar, é preciso apagar os dados.
  - **Cache é proibido**: não se pode armazenar, espelhar nem baixar em massa, e cada uso tem que buscar o conteúdo de novo na API. Isso impede o modo offline.
  - Não se pode redistribuir o conteúdo, criar um produto concorrente nem usar para treinar IA.
  - Fonte: https://edb-docs.up.railway.app/docs/api-terms-of-use
- **Qualidade e cobertura:** é o padrão visual mais comum nos apps de academia e cobre bem peso corporal e halteres (filtro por equipamento). O problema para o Quaru são as restrições de cache e de licença.

## 2. MuscleWiki API
- **O que oferece:** vídeos reais de exercícios, com a marca MuscleWiki embutida. Tem 14 idiomas a partir do plano Growth. Não confirmei se o português está entre eles, nem o número total de exercícios.
  Fonte: https://api.musclewiki.com/pricing
- **Preço:**
  - Playground grátis: 500 chamadas/mês.
  - Testing: US$ 10/mês, 1.000 chamadas, só em inglês.
  - Growth: US$ 39,99/mês, 30.000 chamadas.
  - Professional: US$ 99,99/mês, 100.000 chamadas.
  - Enterprise: US$ 199,99/mês, 300.000 chamadas.
  - Fonte: https://api.musclewiki.com/pricing
- **Licença:**
  - Todos os planos pagos permitem uso comercial, mas só em apps de fitness e saúde.
  - Os vídeos só podem ser transmitidos a partir das URLs da API. É **proibido baixar, guardar ou re-hospedar**; um proxy transparente, que não guarda nada, é permitido.
  - Cache: textos por até 30 dias, miniaturas por até 24 horas, vídeos apenas em cache transitório. Ou seja, **sem modo offline**.
  - É obrigatório incluir nos termos de uso do app o texto "Exercise data and videos provided by MuscleWiki.com" e não remover a marca dos vídeos.
  - Fontes: https://api.musclewiki.com/api-terms · https://api.musclewiki.com/llms-full.txt · https://api.musclewiki.com/faq
- **Qualidade e cobertura:** vídeo real e bem conhecido. Não verifiquei a cobertura de peso corporal e halteres em números.

## 3. API Ninjas (Exercises API)
- **O que oferece:** mais de 3.000 exercícios em texto (instruções e segurança). Nos planos premium, vem um campo de **imagens estáticas** (início e fim do movimento). Não há vídeo nem GIF, e o conteúdo é em inglês. Fonte: https://api-ninjas.com/api/exercises
- **Preço:** Free US$ 0 (só avaliação); Developer US$ 39/mês; Business US$ 99/mês; Professional US$ 199/mês. Fonte: https://api-ninjas.com/pricing
- **Licença:**
  - O plano gratuito não permite uso comercial e exige atribuição.
  - O Developer permite uso comercial, mas **não permite cache/armazenamento**.
  - Cache e armazenamento só a partir do Business.
  - Fonte: https://api-ninjas.com/pricing
- **Avaliação:** não resolve o pedido de vídeo/animação.

## 4. wger (projeto open source)
- **O que oferece:**
  - 78 vídeos reais de exercícios (1920×1080, HEVC/.MOV, cerca de 10 a 18 s) (https://wger.de/api/v2/video/?limit=3).
  - Cerca de 383 imagens (https://wger.de/api/v2/exerciseimage/).
  - Há traduções em vários idiomas. Não verifiquei quantas existem em português.
- **Preço:** gratuito.
- **Licença:** cada item tem a sua, entre CC-BY-SA 3, CC-BY-SA 4, CC-BY 4, CC0 e ODbL (https://wger.de/api/v2/license/). Os vídeos que vi estão em CC-BY-SA 4 (license=2).
  - CC-BY-SA permite uso comercial, mas exige crédito ao autor. Versões adaptadas (por exemplo, recortadas ou recomprimidas) precisam ser compartilhadas sob a mesma licença (https://creativecommons.org/cc-licenses/).
  - Download e cache offline são permitidos, desde que o crédito seja mantido.
  - O software é AGPL (https://wger.readthedocs.io/). Isso só importa se o código for reutilizado; não se aplica ao simples uso das mídias.
  - Não consegui ler os termos de serviço do site, que estão atrás de um bloqueio anti-bot.
- **Qualidade e cobertura:** os vídeos são enviados por voluntários, então a qualidade e o estilo variam e só cobrem uma pequena parte dos exercícios. Serve como complemento, não como base.

## 5. Free Exercise DB: segunda imagem
- **O que oferece:** mais de 800 exercícios, cada um com **duas fotos**: `0.jpg` (início) e `1.jpg` (fim do movimento). Só em inglês.
- **Licença:** Unlicense (domínio público), com uso comercial, offline e modificação livres e sem atribuição obrigatória. Fonte: https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/README.md
- **Uso sugerido:** alternar as duas fotos (cerca de 0,6 a 0,8 s cada, com transição suave) gera uma "animação" de dois quadros. Custo zero, funciona offline e já cobre todo o catálogo atual, inclusive peso corporal e halteres. Não é um vídeo de verdade, mas já mostra o movimento.

## 6. Bancos de vídeo stock
| Fonte | Preço | Licença | Observação |
|---|---|---|---|
| Pexels | grátis | Uso livre, inclusive em app; atribuição não é obrigatória. Proibido: vender cópias sem alteração, redistribuir em outro banco de imagens, usar como marca, sugerir endosso ou retratar pessoas de forma negativa. https://www.pexels.com/license/ | Tem muitos vídeos de academia, mas não há um vídeo por exercício nem padrão de ângulo ou fundo. |
| Pixabay | grátis | Uso livre sem atribuição. Proibido: vender ou distribuir o conteúdo "standalone" (sem alteração), uso comercial de conteúdo que mostre marcas e uso como marca. https://pixabay.com/service/license-summary/ | Mesma limitação de cobertura do Pexels. |
| Envato | Core US$ 16,50/mês; Plus US$ 39/mês (com IA); Ultimate US$ 168/mês | Uso comercial; licença por projeto registrada a cada download; o que já foi licenciado continua valendo após cancelar a assinatura. Proibido revender ou redistribuir sem agregar valor. https://elements.envato.com/pricing | Tem modelos 3D e Lottie; não verifiquei se existe um pacote de exercícios completo e consistente. |
| Storyblocks | Essentials US$ 21/mês; Unlimited US$ 30/mês; Small Business US$ 40/mês (cobrança anual) | Tem licença individual e para pequenas empresas, mas não li os termos detalhados (uso em app, o que acontece ao cancelar). Ponto não confirmado. https://www.storyblocks.com/pricing | Footage em 4K; a cobertura por exercício também não é garantida. |

**Problema comum aos bancos stock:** nenhum oferece um vídeo por exercício com estilo uniforme. Montar um catálogo de mais de 800 exercícios com eles é inviável.

## 7. Outras opções
- **Produção própria:** gravar um personal trainer (ou mais de um) em fundo neutro, num ângulo padrão, com clipes em loop de 3 a 5 s. A Domma fica dona dos direitos, pode usar offline e ter tudo em português. Para começar, bastam os cerca de 80 a 100 exercícios mais usados (peso corporal e halteres). Não fiz orçamento.
- **Animação 3D comprada ou encomendada:** é o padrão visual dos apps grandes. Não pesquisei preços de fornecedores específicos.
- **Vídeo gerado por IA** (ex.: Envato Plus, com licença comercial declarada na página de preços): o risco é de erros técnicos no movimento, o que é delicado num app de treino.

## Recomendação
**Para começar (grátis):**
1. Usar o **Free Exercise DB com as duas fotos alternando** em loop (domínio público, offline, cobre 100% do catálogo atual).
2. Somar os **vídeos CC-BY-SA do wger** onde houver, com uma tela de créditos no app.

Esse caminho tem custo zero e nenhum risco jurídico.

**Opção profissional:**
- Se o app precisar funcionar **offline**, o melhor caminho é a **produção própria em português** dos cerca de 100 exercícios principais. Nenhuma API paga verificada permite guardar as mídias.
- Se transmitir pela internet bastar, a **MuscleWiki API Growth (US$ 39,99/mês)** entrega vídeo real com uso comercial liberado. As condições são: streaming apenas, crédito obrigatório nos termos de uso e marca mantida nos vídeos.
- Evitar o ExerciseDB gratuito (proibido para uso comercial). Os planos pagos do ExerciseDB proíbem cache e fazem o direito de uso acabar quando a assinatura termina.
