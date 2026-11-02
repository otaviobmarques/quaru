# ADR-0021 – Catálogo completo do free-exercise-db e tradução própria pendente de revisão CREF

- Status: aceito (v0.4.4)
- Data: 2026-11-01

## Contexto
O catálogo de 22 exercícios deixava lacunas sem equipamento (costas, pernas, ombros, braços; especificação 0.4.3).
A fonte das fotos (yuhonas/free-exercise-db, Unlicense) tem 876 exercícios com nome, músculos, equipamento, nível,
categoria e instruções em inglês. A Tess não é usada; a tradução é feita pela Domma.

## Decisão
- Importar os 876 (o Otávio falou em ~870; a contagem real é 876) no commit fixado `f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5`.
- **Ids**: os 22 antigos mantêm o id `00000000-0000-4000-a000-0000000000NN`, nome, grupo e equipamento; os novos recebem
  uuid v5 do id da fonte (estável entre importações). O id da fonte fica em `fonteId`. Sem mudança de esquema (versão 2).
- **Mapeamento**: grupo (músculo principal → Peito, Costas, Pernas, Ombros, Bíceps, Tríceps, Abdômen, Antebraço, Pescoço),
  equipamento (10 ids do app + extras `bola-medicinal`, `bola-suica`, `rolo-espuma`, `outro`; "Não informado" quando a fonte
  não diz), área (superiores, inferiores, core), nível (iniciante, intermediário, avançado) e tipo (carga e reps, tempo, peso corporal).
- **Nomes**: 97 fixos à mão (nomes de academia no Brasil: supino, puxada, remada cavalinho, cadeira extensora, stiff…),
  276 por glossário completo, 367 por glossário parcial (termos sem tradução ficam de fora do nome; o original aparece embaixo)
  e 136 continuam no original. Nome repetido recebe o original entre parênteses.
- **Instruções**: traduzidas, fiéis ao texto da fonte, só para 41 exercícios: os 22 antigos e os usados nos treinos sugeridos
  e nas trocas. Os outros mostram o texto original em inglês com o selo "Tradução pendente".
- Tudo marcado `revisao: "pendente de revisão CREF"`, com aviso visível no detalhe e na Biblioteca.
- Nada fora da fonte: o app não acrescenta dicas, cargas nem contraindicações.

## Consequências
- Revisão por profissional CREF precisa cobrir nomes e as 41 instruções antes de publicar.
- A fonte tem afirmações datadas (ex.: joelho não passar da ponta do pé no agachamento). A tradução diz que é a orientação da
  fonte; a revisão CREF decide se fica.
