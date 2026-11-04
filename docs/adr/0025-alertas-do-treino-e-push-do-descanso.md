# ADR-0025 – Alertas do treino (som sem parar a música) e push do fim do descanso na web

- Status: aceito (v0.11)
- Data: 2026-11-04
- Revê: ADR-0013 (som do descanso na web) e ADR-0011 (notificação local no aparelho)

## Contexto
Pedidos do Otávio: descanso padrão de 1 minuto, alerta no fim do descanso que não interrompa a música, aviso mesmo
com o celular bloqueado, alerta de treino concluído e sugestão de cardio. O app é usado principalmente pela web (PWA).

## Decisão
1. **Som na web pelo Web Audio**, sintetizado (sem arquivo), com `navigator.audioSession.type = 'transient'` (Safari
   16.4+). O `<audio>` anterior tomava a sessão de áudio do iPhone e pausava a música. No Android, o Web Audio não pede
   o foco de áudio. Limitação aceita: no iPhone, com a chave do silencioso, esse som não toca.
2. **Push do fim do descanso (web)**: o navegador não agenda notificação sozinho. A cada descanso, o app chama a
   função `aviso-descanso` (`agendar`, com um token novo); a função grava o fim em `avisos_descanso`, dorme e manda um
   **Web Push sem conteúdo** (só VAPID, sem criptografia de payload) para os aparelhos inscritos da pessoa. O service
   worker mostra "⏱ Acabou o tempo — Bora para a próxima série do seu treino!". Nada do treino vai no push.
   - Ajuste (±15 s), novo descanso ou "pular" trocam/apagam o token: o aviso antigo desiste ao acordar.
   - Limite de tempo da função: dorme em passos de até 100 s e se chama de novo (com o token do usuário) se precisar.
   - Par VAPID gerado pela própria função na primeira vez e guardado em `push_chaves` (só service_role): a chave privada
     nunca passa pelo app nem pelo repositório.
   - Endpoints só dos serviços de push conhecidos (Apple, Google, Mozilla, Microsoft), contra uso para chamar outros
     endereços. Até 5 aparelhos por pessoa; inscrição vencida (404/410) é apagada.
   - Com o app aberto e em foco no fim, o app cancela o push 2 s antes e toca o próprio alerta (sem aviso duplicado).
   - iPhone: só com o app instalado na Tela de Início (exigência da Apple); o app explica quando não está instalado.
3. **Aparelho (nativo)**: continua a notificação local (ADR-0011). Novo som `concluido.wav` (gerado, CC0) para o fim do
   treino, pela mesma via (toca por cima da música).
4. **Descanso padrão 60 s** (`perfil.descanso`), com Automático (regra da v0.7) como opção; treino do treinador manda.
5. **Cardio**: itens com `duracaoAlvoS`; séries viram blocos de tempo com cronômetro; recuperação entre blocos e sem
   pausa entre aquecimento, parte principal e volta à calma. Gerador `gerarCardio` (OMS/ACSM: moderado, conversável).

## Consequências
- O aviso com a tela bloqueada depende de conta logada e de rede no momento em que o descanso começa.
- Custo: uma chamada de função por descanso (e uma a mais a cada 100 s em descansos longos).
