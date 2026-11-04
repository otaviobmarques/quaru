// GERADO por scripts/gerar-novidades.mjs a partir do CHANGELOG.md. Não edite à mão.
export const VERSAO_NOVIDADES = "0.11.0";
export const NOVIDADES: string[] = [
  "### Adicionado",
  "- Descanso padrão de 1 minuto, configurável: na tela do treino (\"Descanso entre séries · Mudar\") ou em Perfil, com 30 s, 45 s, 1 min, 1 min 30 s, 2 min, 3 min ou Automático (calculado pelo exercício e objetivo, como antes). Treino do treinador usa o descanso dele.",
  "- Bipes nos 3 últimos segundos e alerta no fim do descanso.",
  "- Aviso com a tela bloqueada na versão web: ative uma vez (\"Avisar com a tela bloqueada?\") e, a cada descanso, o servidor manda uma notificação na hora certa, com som e vibração do sistema. Android: no navegador ou instalado. iPhone: com o Quaru instalado na Tela de Início (iOS 16.4+). No app de celular, a notificação local já fazia isso.",
  "- Alerta de treino concluído: ao finalizar, toca um som de comemoração, vibra e o resumo abre com o mascote: \"Treino concluído! 🎉\".",
  "- Cardio no Treino do dia: escolha Musculação ou Cardio. Iniciante faz contínuo leve (caminhada rápida, bike ou elíptico); os demais alternam contínuo e intervalado. Sem esteira/bike, vira caminhada ou circuito em casa. Lesões tiram o que tem impacto na região. Sempre com aquecimento e volta à calma.",
  "- Exercícios por tempo: cardio tem campo de minutos e cronômetro (▶). No fim do bloco, o app avisa, registra o tempo e começa a recuperação.",
  "### Corrigido",
  "- O alerta do descanso pausava a música (Spotify etc.) no iPhone. Agora o som toca por cima da música, sem interromper. Observação: no iPhone com a chave do silencioso ligada, o som com o app aberto não toca; a notificação segue as regras do sistema."
];
