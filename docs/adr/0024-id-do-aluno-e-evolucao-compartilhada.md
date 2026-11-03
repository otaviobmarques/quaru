# ADR-0024 – ID do aluno, convite e evolução compartilhada com o treinador

- Status: aceito (v0.10)
- Data: 2026-11-03
- Complementa: ADR-0023 (área do treinador)

## Contexto
O Otávio pediu que o aluno tenha um ID para o treinador vinculá-lo (com o aluno aceitando e podendo desvincular), que o
treinador coloque treinos na agenda do aluno, veja a agenda e a evolução, e que o aluno registre o peso.
Até a v0.9, treinos feitos, peso e agenda ficavam só no aparelho (ADR-0023, consequências).

## Decisão
1. **ID de aluno** em `perfis.codigo_aluno`: 7 caracteres sem 0/O/1/I/L (31^7 combinações), gerado no servidor.
2. **Convite pelo ID**: `convidar_aluno` (só treinador) cria o cadastro com `convidado_id`. O aluno vê em `meus_convites`
   e responde com `responder_convite` (aceitar com ou sem compartilhar, ou recusar). O treinador não consegue forjar
   convite, vínculo nem compartilhamento pela API (política de inserção e gatilho `proteger_vinculo`).
3. **Evolução compartilhada só com consentimento explícito**: os botões dizem "Aceitar e compartilhar" e "Aceitar sem
   compartilhar" (nada vem marcado). Exige também o consentimento de dados de saúde do app. Ligado, o app publica um
   **resumo mínimo** (`publicar_evolucao`, troca tudo a cada envio, só quando muda): peso (data, kg), treinos feitos
   (data, nome, séries, volume, exercícios, minutos) e a agenda dos próximos 60 dias (nome do treino). Último ano, até 1000
   itens. Sem notas, restrições, alimentação ou água.
4. **Leitura só por função**: `evolucao_aluno` e `agenda_aluno` não têm política nem permissão para `authenticated`.
   O treinador lê por `evolucao_do_aluno(aluno_ref)`, que confere se o aluno é dele e compartilha. Desligar o
   compartilhamento, desvincular ou o treinador excluir o cadastro param o acesso; se ninguém mais vê, o resumo é apagado.
5. **Agenda pelo treinador**: `treinos_atribuidos.datas`. No app, as datas entram em dias livres (ou que já eram do
   treinador); o que o aluno mudou fica como ele deixou (`agenda.treinador` guarda o que foi colocado, para tirar depois).

## Consequências
- O peso já era registrado no app (Início → Peso); agora chega ao treinador quando o aluno compartilha.
- A Política de Privacidade (rascunho) precisa citar o compartilhamento com o treinador como finalidade com consentimento.
