# ADR-0011: Fim do descanso – vibração com o app aberto, notificação local em segundo plano
## Status
Aceito (substitui o comportamento da 0.2.0 para o BUG-17; revisado na 0.3.0: som curto com o app aberto)
## Data
2026-11-01
## Contexto
A especificação L5 diz que, com o app em primeiro plano, o fim do descanso não mostra notificação: o aparelho vibra e a barra do timer avisa. A correção do BUG-17 na 0.2.0 mostrava banner e som também com o app aberto, e a Heloísa (QA v0.2) apontou a divergência.
## Decisão
- **App aberto:** `Notifications.setNotificationHandler` devolve `shouldShowBanner/List/PlaySound/SetBadge = false` (`comportamentoPrimeiroPlano` em `servicos/notificacao.ts`). A tela de treino chama `Vibration.vibrate([0, 400, 200, 400])` quando o tempo restante chega a zero.
- **App em segundo plano ou fechado:** a notificação local agendada ao concluir a série (`agendarFimDescanso`) é exibida pelo sistema normalmente, porque o handler só é consultado com o app em primeiro plano.
- Pular, encerrar o treino, mudar ±15 s ou excluir tudo continuam cancelando ou reagendando o aviso (no máximo um agendado).
## Consequências
- Com o app aberto não há som. Quem estiver com o aparelho no modo silencioso sem vibração só vê a barra do timer.
- A vibração e a supressão do banner só podem ser verificadas em aparelho real (a Heloísa vai retestar). Na web, nada acontece.

## Revisão 0.3.0 (01/11/2026): som curto com o app aberto
**Decisão do Otávio:** com o app aberto, o fim do descanso tem vibração **e** um som curto e suave, e o som não toca no modo silencioso.
- **Som:** `mobile/assets/sons/descanso.wav`. São dois toques senoidais (Lá5 e Mi6), 0,7 s, pico em cerca de −9 dBFS, gerados por `mobile/scripts-gerar-som.py`. É obra própria (CC0), sem amostra de terceiros.
- **Como toca:** pela notificação local já agendada. O handler de primeiro plano agora é `shouldPlaySound: true`, com banner, lista e selo em `false`. O arquivo entra no app pelo plugin `expo-notifications` (`sounds`). No Android 8+, o som fica no canal `descanso` (importância padrão, com vibração); no iOS vai em `content.sound`.
- **Modo silencioso:** foi escolhida a via de notificação, e não um player de áudio, porque o sistema já aplica a regra do silencioso. No Android, o modo silencioso ou vibrar cala o canal. No iPhone, a chave lateral cala os sons de notificação. Um player (expo-audio) exigiria detectar o silencioso, o que o iOS não oferece por API pública.
- **Vibração:** a tela de treino continua chamando `Vibration` ao chegar a zero, como antes.
- **Limites:** sem permissão de notificação não há som, só vibração. Mudar o som de um canal Android já criado exige um novo id de canal (regra do Android). O comportamento real ainda precisa ser confirmado pela Heloísa em aparelho físico (silencioso, vibrar, Não perturbe).
- **Testes:** `som-descanso.test.ts`; `qa-v021`, `correcoes-v021` e `qa-notificacao` foram atualizados para o novo handler e o canal.
