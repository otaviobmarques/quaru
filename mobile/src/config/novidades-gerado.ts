// GERADO por scripts/gerar-novidades.mjs a partir do CHANGELOG.md. Não edite à mão.
export const VERSAO_NOVIDADES = "0.8.0";
export const NOVIDADES: string[] = [
  "### Adicionado",
  "- Área do treinador: o treinador cadastra os alunos, manda um link para cada um e monta os treinos de cada aluno (exercícios do catálogo, séries, repetições, descanso calculado pelo objetivo, recado e dias da semana).",
  "- Vincular ao treinador: o aluno abre o link no celular, entra na conta e confirma. Os treinos do treinador aparecem em Meus treinos (com o selo \"Do seu treinador\") e entram na agenda nos dias marcados, sem apagar os treinos que o aluno já tinha planejado.",
  "- O treinador pode criar a conta do aluno com senha, já vinculada a ele.",
  "- Perfil → Meu treinador, com Desvincular.",
  "- Painel de administração: o papel de cada usuário (Admin, Treinador ou Usuário) é escolhido numa lista.",
  "### Segurança",
  "- O treinador só vê os próprios alunos e o e-mail de quem aceitou o vínculo. Cada link vale para uma conta só. Registros de treino, peso e água continuam só no aparelho do aluno."
];
