# ADR-0016 – Tour guiado e dados do perfil coletados no primeiro acesso

- Status: aceito (v0.4.1, não publicado)
- Data: 2026-11-01

## Contexto
O Otávio aprovou trocar a apresentação de 6 passos por um tour que explica cada área do app e coleta dados para personalizar as sugestões. Os dados novos incluem dado pessoal (faixa de idade, cidade e bairro) e dado de saúde (restrições ou lesões).

## Decisão
1. Todas as perguntas são opcionais: "Pular esta pergunta" não grava nada, "Sair do tour" encerra. Tudo é editável em Perfil → Meus dados.
2. Minimização: faixa de idade em vez de data de nascimento; cidade e bairro digitados à mão, sem geolocalização; não coletamos documentos, gênero nem localização em tempo real.
3. Restrições ou lesões são dado de saúde (LGPD, art. 11): só são gravadas com o consentimento "dados de saúde" ativo (`acoes.atualizarPerfil` recusa sem ele), vêm com aviso para procurar um médico e só servem para avisos e para a ordem dos treinos.
4. Armazenamento só no aparelho, no mesmo estado cifrado (SQLCipher no Android, ADR-0010; localStorage na web). Nada vai para o Supabase. Entram em Exportar (`dados.json`) e são apagados em Excluir tudo.
5. Lembretes: a preferência é salva; a permissão de notificação só é pedida quando a pessoa liga um lembrete. Web: `Notification.requestPermission`. Android: sem `expo-notifications` nesta versão (o agendamento entra no próximo build nativo); nenhuma permissão é pedida.
6. Uso dos dados (`dominio/tour.ts`, `recomendarPara`): local → ordem dos modelos; tempo → marca o que cabe; restrição → leva para o fim os modelos da região (joelho → inferiores, ombro → ombros, coluna → core), sem esconder; faixa de idade → aviso para menores e IMC sem faixa adulta; preferência alimentar → dieta destacada e filtro inicial das refeições.

## Consequências
- Política de Privacidade, inventário de dados (ROPA) e declaração de segurança de dados do Google Play precisam incluir: faixa de idade, experiência, tempo/local de treino, restrições ou lesões, preferência alimentar, lembretes, cidade e bairro.
- Lembretes no Android dependem de nova dependência e de novo build.
- Cidade e bairro, se um dia forem usados para indicar academias, exigem nova base legal e aviso antes de qualquer envio a servidor.
