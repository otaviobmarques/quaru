# Changelog
Formato Keep a Changelog.

## [0.6.1] – 2026-11-02
### Adicionado
- **Painel: criar usuário com senha**, além do convite por e-mail. O painel gera uma senha fácil de ler e mostra os dados de acesso para copiar e enviar.
- **Painel: Definir senha** em cada usuário.
- **Troca no primeiro acesso**: quem recebeu a senha do administrador cria a própria logo ao entrar.
- **Pré-visualização do link**: ao compartilhar o endereço do Quaru no WhatsApp, Instagram, Facebook, X ou Telegram, aparece o banner com o título e a descrição.
- **Favicon nítido** do símbolo do Quaru.
- **Instalar o app**: no Android, o botão "Instalar o app" coloca o Quaru na tela inicial, abrindo em tela cheia. No iPhone, o app explica como adicionar à Tela de Início. O instalador mostra telas do app e atalhos para Treinos e Água.

## [0.6.0] – 2026-11-02
Login por convite e painel de administração. Liga quando o Supabase estiver configurado (docs/supabase-passo-a-passo.md).
### Adicionado
- **Login com e-mail e senha**: só entra quem foi convidado pelo administrador. Sem "Continuar sem conta", "Criar conta" nem Google.
- **Esqueci minha senha** e a tela **Crie sua senha**, que abre pelo link do convite ou do e-mail de nova senha.
- **Painel de administração** em site separado (/quaru/admin/): cadastrar por convite, reenviar convite, redefinir senha, bloquear e desbloquear, tornar ou tirar admin, remover.
- Conta bloqueada pelo administrador é desconectada e vê o aviso.
- No primeiro login, os dados que já estavam no aparelho passam a ser da conta. Dados de outra conta no mesmo aparelho nunca se misturam.
### Segurança
- A chave secreta do Supabase fica só no servidor. A sessão fica no Keychain/Keystore no celular e na sessão da aba na web.
- O painel não usa CDN e tem política de conteúdo restrita.
- Permissões do banco fechadas: o Supabase libera por padrão TRUNCATE, DELETE e toda função nova para qualquer pessoa. Agora só fica liberado o que o app usa logado.
- Conta criada fora do convite (por exemplo, com o cadastro público ligado por engano) nasce bloqueada.
### Observação
- Os treinos continuam guardados no aparelho. A sincronização com o servidor vem na próxima versão.

## [0.5.0] – 2026-11-02
Identidade v3.2 aplicada no app inteiro e recursos para voltar todo dia.
### Adicionado
- **Telas novas (identidade v3.2)**: login, Início, Treinos, Alimentação, Água, Perfil e Tour seguem o design v3.2, com cartões de contorno e sombra, títulos em Bricolage Grotesque e adesivos amarelos.
- **Barra de abas nova**: ícones desenhados, rótulos inteiros (sem "Alimenta...") e a aba atual destacada.
- **Selo SIMULAÇÃO** no topo quando há dados de exemplo (substitui a faixa amarela); tocar leva ao Perfil.
- **Sequência de dias** e a semana com os dias treinados no Início.
- **Calendário do mês** e **volume por semana** (últimas 8 semanas) no Histórico.
- **Gráficos de evolução em linha** no Peso, no IMC e em cada exercício (melhor carga, volume e 1RM estimado). Toque para ver cada valor ou abra a tabela.
- **Mapa dos músculos trabalhados** no detalhe do exercício e no "Escolha o foco de hoje" dos treinos sugeridos.
- **Sugestão de progressão**: quando você bate as repetições-alvo em todas as séries, o treino sugere a próxima carga (ou +1 repetição no peso do corpo), com o botão "Usar".
- **Diário alimentar simples**: "Como foi hoje?" para café, almoço, lanche e jantar (comi bem, mais ou menos, pulei), sem calorias. Entra na exportação como diario_alimentar.csv.
- **Água**: anel de progresso, botões rápidos e a lista do que você bebeu hoje.
- **Lembretes de treino e água funcionando**: no celular, notificações diárias no horário escolhido; na web, aviso enquanto o Quaru está aberto. O de treino não aparece se você já treinou no dia.
- **Compartilhar treino**: no resumo, manda um texto com séries, volume, recordes e sequência (sem dados de saúde).
- **Proteção dos dados na web**: o app pede ao navegador para não apagar os dados sozinho, e o Início lembra de exportar uma cópia a cada 14 dias (dá para adiar 7 dias).
### Corrigido
- Slogan do login caía em fonte serifada no Windows (a fonte Inter não era carregada).
- Categorias dos treinos sugeridos e das refeições ficavam escondidas no computador; agora quebram linha. Na Biblioteca, a faixa rola com o mouse.
- No tema escuro, contornos dentro dos blocos não sumiam mais.
### Mudado
- Cor do navegador e do app instalado na web: rosa da identidade (#F2A0B0).
- Testes: tempo limite de 20 s (a suíte completa estourava 5 s às vezes). Novo arquivo v05-melhorias.test.ts.

## [0.4.4] – 2026-11-01
Não publicado. Especificação: `docs/especificacao/v0.4.4.md`.
### Adicionado
- **Biblioteca com 876 exercícios** do Free Exercise DB (domínio público): busca sem acento em português (e pelo nome original), filtros por área, grupo muscular e equipamento, e lista que só desenha o que está na tela.
- **Demonstração animada**: em "Ver demonstração", a foto do início e a do fim do movimento se alternam (~0,8 s cada, com transição suave). Botão "Pausar demonstração" sempre. Com "reduzir movimento" ligado, começa parada, com "Reproduzir demonstração".
- **Como fazer**: instruções em português nos exercícios dos treinos sugeridos e nos 22 de antes; nos outros, o texto original em inglês, sinalizado. Músculos e nível em cada exercício.
- **Aviso de revisão**: nomes e instruções traduzidos estão em revisão por um profissional de educação física (CREF). O aviso aparece no exercício e na Biblioteca.
- **Treinos sugeridos novos**: Em casa com elástico, Kettlebell e Barra fixa em casa. Os treinos em casa agora têm pernas, glúteos, lombar e tríceps sem equipamento.
- **Trocas por equipamento** usam o catálogo todo: sem aparelho, Leg press vira Agachamento com peso do corpo e Tríceps na polia vira Flexão de braço fechada.
- Contorno dos campos mais visível (token borda-campo, contraste de pelo menos 3:1 nos dois temas) e divisória decorativa separada.
### Observação
- As animações são baixadas quando você abre o exercício e ficam guardadas para usar sem internet depois (ADR-0020).
- Ainda sem opção sem equipamento: bíceps, ombros e antebraço.

## [0.4.3] – 2026-11-01
Não publicado. Especificação: `docs/especificacao/v0.4.3.md`.
### Adicionado
- **Fotos reais das dietas**: cada uma das 8 dietas do guia tem uma foto (Pexels e Pixabay, selecionadas pela RedBox e aprovadas pelo Henriquiano). Na lista, uma miniatura de 80 px ao lado do nome, com o selo "Restritiva" mantido; no detalhe, a foto grande em 16:9 no topo, com o crédito logo abaixo. Todas têm texto alternativo para leitores de tela.
- **Fotos nas ideias de refeições**: 8 receitas com foto real e crédito. As outras 10 mostram um visual de reserva com o ícone da refeição (café, almoço, lanche ou jantar) nas cores do DS.
- **Créditos das fotos** em Perfil → Sobre o app.
- **Importação das imagens da RedBox**: o script `scripts/importar-imagens-redbox.mjs` traz as fotos das dietas e das receitas e as ilustrações, conferindo formato (WebP), tamanho (até 80 KB) e proporção, e traz os créditos do LEIAME da entrega.
- **Seus equipamentos**: pergunta nova no tour, logo depois de "onde treina", e em Perfil → Meus dados. Na academia vem tudo marcado; em casa, só o peso do corpo. Dá para mudar sempre. Fica só no aparelho.
- Os treinos sugeridos e o "Recomendado para você" colocam antes o que dá para fazer com o seu equipamento. Quando falta algo, o cartão mostra a troca por outro exercício do catálogo ou avisa que ainda não há opção.
- **Tela Sair** (design da RedBox, com ilustração): no Perfil, o botão principal "Sair" abre a tela. Lá, "Sair" volta para a tela de entrada e mantém seus dados no aparelho; "Continuar sem conta" retoma de onde você parou.
- **Sair e apagar meus dados deste aparelho**: abre uma folha de confirmação. O campo começa vazio ("Digite aqui"), aceita EXCLUIR em maiúsculas ou minúsculas e lembra de exportar antes, em Perfil › Exportar meus dados. "Apagar e sair" fica em vermelho e bloqueado até a confirmação. Substitui o botão "Excluir minha conta e dados".
- **Ícones dos equipamentos** (RedBox) na escolha do tour, em Meus dados e nos cartões de treino sugerido.
### Corrigido
- Exclusão dos dados mais segura: o app apaga os arquivos primeiro e só depois limpa a tela, tentando de novo uma vez. Se não der, avisa "Não foi possível concluir. Tente de novo.".
- Acessibilidade: botões desativados continuam alcançáveis pelo teclado e pelo leitor de tela, que diz "desativado" (ADR-0019). Com a folha de apagar aberta, a tela de trás não recebe foco.
- **Demonstração dos exercícios**: em Meus treinos (editar rotina), durante o treino e nos cartões dos treinos sugeridos, cada exercício agora tem a foto e o atalho "Ver demonstração", que abre o mesmo detalhe da Biblioteca. Os treinos já adicionados na 0.4.2 passam a mostrar a demonstração sem precisar fazer nada.
### Observação
- O app não tem vídeos dos exercícios: a demonstração é uma foto da posição inicial, de um banco de imagens em domínio público.

## [0.4.2] – 2026-11-01
Não publicado. Especificação: `docs/especificacao/v0.4.2.md`.
### Adicionado
- **Nova tela de login** (design v2.1): topo em degradê com a logo branca, o slogan "Seu treino, no seu ritmo." e duas pessoas ilustradas; e-mail, senha, Esqueci minha senha, Entrar, Criar conta e "Continuar com o Google".
- **Continuar sem conta**: o modo local de sempre, que guarda seus dados só no aparelho. Entrar, Criar conta e Google ainda não funcionam e aparecem como "em breve" (ADR-0017).
- Links para os Termos de uso e a Política de Privacidade na tela de login.
- **Ilustrações novas no tour**: 11 desenhos com personagens, um por pergunta, nos temas claro e escuro.
- **Mapa muscular novo**, com frente e costas mais detalhadas; as áreas trabalhadas ficam em vermelho.
- **Animações**: treino concluído, meta de água batida, carregando e progresso do tour. Com "reduzir movimento" ligado, aparece só o quadro final. Na web, a imagem é sempre parada.
- Ícone do app em camadas (fundo e símbolo) para o Android.
- **Abas novas**: Início, Treinos, Alimentação, Água e Perfil. Treinos reúne Meus treinos (antes Rotinas), Sugeridos e Histórico. Os endereços antigos /rotinas e /historico levam à seção certa.
- Testes: `v042-design.test.tsx` e `v042-abas.test.tsx`.
### Mudado
- Slogan no login conforme o login v2.2: logo abaixo do logo, em branco, Inter 18 px, peso 600.
- Água virou aba e não tem mais o botão Voltar.
- Visual do design v2.1 sobre a paleta v0.3: selos amarelos com borda, destaque "Comece aqui" no Início, só o símbolo no topo das abas e a assinatura da Domma no login.
- Versão 0.4.2. **Exige novo build Android**, porque entrou o módulo nativo lottie-react-native.
### Segurança
- A tela de login não envia nem guarda e-mail ou senha. Os campos ficam desativados até a autenticação real existir.

## [0.4.1] – 2026-11-01
Não publicado. Especificação: `docs/especificacao/v0.4.1.md`.
### Adicionado
- **Tour guiado no primeiro acesso** (`/boas-vindas`, substitui a apresentação de 6 passos): 15 passos que explicam Início, Treinos, Alimentação, Água e Perfil e, no caminho, perguntam nome ou apelido, faixa de idade (sem data de nascimento), objetivo, nível e dias, experiência, tempo por treino, onde treina, áreas do corpo, restrições ou lesões (dado de saúde, com aviso para procurar um médico), altura e peso, preferência alimentar, lembretes (permissão de notificação só ao ativar) e cidade/bairro digitados à mão (sem localização). Cada pergunta tem "Pular esta pergunta"; "Sair do tour" encerra a qualquer momento. Reabre em Perfil → Como usar o Quaru.
- **Perfil → Meus dados**: edita ou limpa cada resposta do tour. Tudo fica só no aparelho e entra em Exportar e em Excluir tudo.
- **Recomendações com os dados do tour**: em casa ou ao ar livre, o treino sem aparelhos vem primeiro; o que cabe no tempo por treino vem antes; treinos que forçam uma região com restrição vão para o fim (nada é escondido); avisos para menores de 18, para quem tem restrição e para quem está parado. A preferência alimentar marca a dieta correspondente no guia e já filtra as ideias de refeições. O IMC não mostra a faixa adulta da OMS para menores de 18.
- **Início vazio ilustrado** com "Comece aqui" (1, 2, 3), botão "Criar primeira rotina" e "Não sabe por onde começar?".
- **Logotipo oficial** (`quaru_v2`, sem redesenho) no cabeçalho de Início, Rotinas, Histórico, Alimentação e Perfil; destaque na tela Entrar e no passo 1; rodapé de Perfil e Sobre com a versão; favicon SVG na web. Não aparece no treino em andamento. `scripts/gerar-logo.mjs` copia os SVG oficiais.
- **Foto ou avatar no Perfil** (`/foto-perfil`): galeria ou câmera com permissão na hora, recorte quadrado e compressão (expo-image-picker + expo-image-manipulator), ou 10 avatares próprios. Nome opcional e "Olá, nome" no Início.
- **Altura e IMC** no Perfil (100–250 cm), faixas da OMS com rótulos neutros, evolução do IMC na tela de peso e aviso fixo.
- **Água do dia** (`/agua`): +250 ml, +500 ml, valor personalizado, desfazer, virada à meia-noite local, barra de progresso, 7 dias, meta de 35 ml/kg (múltiplos de 50 ml, editável) e aviso fixo. Atalho no Início e na Alimentação.
- **Guia de dietas** (8 dietas, `/dieta/[id]`) e **Ideias de refeições saudáveis** (`/refeicoes`, 18 ideias com filtro por etiqueta), só informativos, com aviso fixo de nutricionista. Textos em `dominio/dietas.ts` e `dominio/refeicoes.ts` para revisão.
- **Treinos sugeridos** (`/treinos-sugeridos`): 14 modelos com tempo estimado, equipamento e mapa muscular próprio (frente e costas), filtro por área do corpo e "Adicionar ao meu plano". Atalho em Rotinas e no Início.
- **Objetivo, nível, dias e áreas** (`/objetivo` e passos da apresentação) com "Recomendado para você" no Início (regras ACSM em tabela na especificação).
- **Atualizar o app** (web/PWA): quando sai uma versão nova, aparece "Nova versão disponível" com "Atualizar agora". No Perfil, "Verificar atualizações" mostra a versão e "O que há de novo". Seus dados continuam no navegador. No Android, por enquanto só a versão aparece; a atualização vem pela loja (ADR-0015).
- **Créditos da Domma Tecnologia**: tela "Sobre o app" (antes "Sobre e licenças") com o símbolo oficial da Domma (`logo/final-sinal`; claro: ícone; escuro: ícone de perfil), "Desenvolvido por Domma Tecnologia", a versão e o link para "O que há de novo"; mesma informação no rodapé do Perfil e uma linha discreta no fim do Início.
- Fontes em `docs/fontes/`. Notas: `../juridico/nota-jessica-0.4.1.md` e `../juridico/nota-revisao-nutricionista-0.4.1.md`.
- Testes: `v041-dominio.test.ts`, `v041-telas.test.tsx`, `v041-contraste.test.ts`. Capturas: `capturas-041.mjs`.
### Mudado
- Estado local ganhou `apresentacaoVistaEm`, `perfil` (nome, avatar/foto, altura, meta de água, objetivo) e `agua`; a migração preenche os campos sem mostrar a apresentação para quem já usava.
- Exportação: `agua.csv`, perfil no `dados.json` e `foto-perfil.jpg` quando houver. "Excluir tudo" apaga também foto, altura e água (texto da confirmação atualizado).
- Seletor segmentado com 44 px de altura (antes 40).
- Service worker: a versão nova espera o toque em "Atualizar agora" (mensagem ATUALIZAR → skipWaiting) em vez de assumir sozinha.
- `app.json`/`package.json`: versão 0.4.1; plugin `expo-image-picker` com textos de permissão em português e sem microfone. **Exige novo build Android** (módulos nativos novos: react-native-svg, image-picker, image-manipulator).
### Segurança
- Foto, nome, altura e água ficam só no aparelho/navegador; nenhum envio ao Supabase. Nenhuma chave no bundle.

## [0.4.0] – 2026-11-01
### Adicionado
- **Versão web (PWA)** para o GitHub Pages em `/quaru/` (ADR-0013): `npm run web:export` gera `mobile/dist` com manifest (nome Quaru, cores #1A0E12, ícones 192/512 e "maskable"), service worker para uso offline, `404.html` (rotas da SPA) e `.nojekyll`.
- `servicos/armazenamento.web.ts`: dados no `localStorage` deste navegador, **sem criptografia**. O Android e o iPhone continuam com SQLCipher (ADR-0010).
- `servicos/alerta-descanso(.web).ts`: na web, fim do descanso com `descanso.wav` e `navigator.vibrate` quando existir. Sem push.
- `servir-pages.mjs` (simula o Pages em `/quaru/`) e `verificar-web.mjs` (28 verificações no Chrome, celular e computador; capturas em `capturas/web/`).
- Testes `versao-web.test.ts` (4).
### Mudado
- Perfil na web: "Dados salvos neste navegador, sem criptografia do aparelho", com aviso; "Excluir tudo" explica que apaga só este navegador. Na web, não aparece mais o pedido nem o aviso de notificações.
- `app.json`: versão 0.4.0, `experiments.baseUrl = "/quaru"`, dados do PWA em `web`. Afeta só a web.
### Segurança
- Nenhuma chave, token ou senha no bundle (verificado com busca no `dist`). O Supabase continua desligado.

## [0.3.0] – 2026-11-01
### Mudado
- Nome do app: **Quaru** (`src/config/marca.ts` e `expo.name` em `app.json`; aprovado pelo Otávio só no código local, ainda sujeito ao INPI). O identificador `br.com.domma.academia` e o slug não mudaram.
- Ícone, ícone adaptável (frente, fundo #1A0E12 e monocromático), splash e favicon a partir de `identidade/logo-rodada-2/quaru_v2` (ícone 1024 e símbolo, convertidos com Pillow).
- **Paleta Quaru** no tema (cores do logotipo: #E0263F, #1A0E12, #14141A). Claro: botão #C81E36 com texto branco (5,68:1), texto vermelho #A3172C, texto #14141A. Escuro: fundo #1A0E12 e botão #FF7085 com texto #1A0E12 (7,09:1). Todos os pares passam WCAG AA: guia em `design/paleta-quaru_v0.3.md`, teste em `__tests__/contraste.test.ts`. A cor de destaque da notificação Android é #E0263F.
- Fim do descanso com o app aberto (ADR-0011 rev.): vibração mais o som curto `descanso.wav` (gerado localmente, CC0) pelo canal de notificação "descanso", que respeita o modo silencioso. Banner e lista continuam desligados.
### Adicionado
- `.env.example` com a URL do projeto Supabase gratuito (`gnmbrcdqljhtoxxkuekz`, sa-east-1). Não tem chave; as migrações estão prontas, mas **não foram aplicadas**.
- Criptografia local (ADR-0010): expo-sqlite com SQLCipher, chave do expo-crypto no expo-secure-store, migração do AsyncStorage, "Excluir tudo" apagando o banco e a chave, modo exibido no Perfil.
- Módulo local `modules/quaru-backup` (iOS) que tira o banco do backup do iCloud (`NSURLIsExcludedFromBackupKey`).
- Build Android local (prebuild + Gradle `assembleDebug`, sem EAS).
- Imagens dos 22 exercícios da biblioteca (Free Exercise DB, Unlicense / domínio público): miniatura na Biblioteca e foto no detalhe, créditos em THIRD_PARTY_NOTICES e na tela Sobre (ADR-0012). Antes de publicar, a Jéssica precisa validar a origem das fotos e o direito de imagem.
- Preparação para Supabase no plano gratuito, sem conta nem projeto: `.env.example` (`EXPO_PUBLIC_SUPABASE_URL` e a chave anon, vazias), `src/config/servidor.ts` (modo local por padrão), `backend/scripts/aplicar-migracoes.sh` (CLI oficial com `db push --db-url`, simulação por padrão) e passo a passo no README, com o aviso de pausa após 1 semana sem uso.
### Mantido
- O treino do dia continua na sequência rotativa A→B→C. O identificador `br.com.domma.academia` também continua.

## [0.2.2] – 2026-11-01
### Corrigido (relatório de QA v0.2.1 da Heloísa)
- REG-04 (média): quando uma regra do armazém recusava a série (por exemplo, consentimento de saúde revogado com o treino aberto), a série sumia sem aviso e o descanso e a notificação começavam mesmo assim. Agora a tela de treino checa a gravação antes de aplicá-la. Qualquer recusa mostra "Série não registrada" com um texto claro (`mensagemRecusa` em `dominio/validacao.ts`), a série continua pendente e não começam o descanso, a notificação nem o selo de recorde.

## [0.2.1] – 2026-11-01
### Corrigido (relatório de QA v0.2 da Heloísa)
- REG-01 (alta): carga acima de 1000 kg (ou mais de 1000 reps) derrubava a tela de treino. Agora a tela valida antes de gravar e mostra "Série não registrada · A carga máxima é 1000 kg"; o `aplicar` do armazém também não deixa mais um erro de regra derrubar a tela.
- BUG-08 / REG-03: nomes feitos só de espaço Unicode (U+00A0, tabulação, U+2000–U+200B, U+3000, U+FEFF...) são recusados no banco (migração `20261101000005_nome_espacos_unicode.sql`, função `nome_valido`) e no aparelho (`dominio/validacao.ts`).
- BUG-17: segue a especificação L5. Com o app aberto não há banner nem som e o aparelho vibra; em segundo plano continua a notificação local (ADR-0011).
- BUG-12: o parâmetro `pendentes` de `mesclar` passou a ser obrigatório.
### Adicionado
- Tela "Itens com erro" (Perfil → Sincronização: itens com erro) para corrigir o nome ou descartar o envio de cada item recusado.
- Plugin de config `plugins/sem-backup-android.js`: `dataExtractionRules` (Android 12+, nuvem e D2D) e `fullBackupContent`. Exclusão do backup do iCloud planejada na ADR-0010.

## [0.2.0] – 2026-11-01
### Jurídico (rascunhos da Jéssica)
- Consentimento de IA sai da tela de consentimentos e passa a ser pedido no primeiro uso da foto da refeição; textos novos (`revisao-consentimentos.md`, seção 3).
- Versão e data/hora por consentimento, com histórico de revogação no aparelho (estado v2) e no banco (migração 0003 + RPCs).
- Modo local sem e-mail (ADR-0009). Termos e Política no app como RASCUNHO (Perfil → Termos de uso e privacidade).
- `android.allowBackup: false` até haver criptografia; ADR-0010 (criptografia local, LGPD art. 46).
### Design (revisão da Lorena)
- P0/P1 e P2 simples: rodapé fixo do treino, botão principal "Concluir série N", BotaoIcone 44×44, Chave, Segmentado, Esqueleto, Toast de desfazer, estados de foco/carregando; capturas em modo escuro e de estados.
### Corrigido (relatório de QA v0.1 da Heloísa)
- BUG-01 ±15 s reagenda o aviso; BUG-02 série/item só com exercício próprio ou da biblioteca e exclusão de conta sempre funciona; BUG-03 UPDATE de série confere a sessão; BUG-04 `iniciar_sessao` devolve `id_invalido`; BUG-06 limites do servidor no aparelho; BUG-07 peso no futuro; BUG-08 nome só com espaços; BUG-09 uma sessão ativa no armazém; BUG-11 CSV neutraliza fórmula; BUG-12 download não sobrescreve pendente; BUG-13 notificações em série; BUG-14 agenda após "Ativar avisos"; BUG-15 chave acessível na web; BUG-16 ficha com 44 px; BUG-17 aviso com app aberto + vibração; BUG-18 excluir tudo cancela aviso.
- Migração `20261101000004_correcoes_qa.sql`.

## [0.1.0] – 2026-11-01
### Adicionado
- App Expo (modo local): entrar, consentimentos, Início com "treino de hoje" (L1), rotinas e edição, biblioteca com busca/filtros, treino em andamento (séries pré-preenchidas com a última vez, tipos A/N/F/D, timer −15/+15, recorde ao vivo, notificação local de descanso L5), resumo, histórico, detalhe do exercício (carga, volume, 1RM), peso corporal, exportação .zip (L3), perfil com exclusão (digitar EXCLUIR), sobre e licenças (MIT do MuscleMap).
- Fila de sincronização local (L2) e dados de exemplo marcados.
- Banco: migrações com RLS, consentimento, regras L2 e exclusão de conta; 16 testes PGlite.
- Documentação: README, ADRs 0001–0007, OpenAPI, diagramas, modelo de ameaças, coordenação.
