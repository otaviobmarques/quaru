// GERADO por scripts/gerar-novidades.mjs a partir do CHANGELOG.md. Não edite à mão.
export const VERSAO_NOVIDADES = "0.5.0";
export const NOVIDADES: string[] = [
  "Identidade v3.2 aplicada no app inteiro e recursos para voltar todo dia.",
  "### Adicionado",
  "- Telas novas (identidade v3.2): login, Início, Treinos, Alimentação, Água, Perfil e Tour seguem o design v3.2, com cartões de contorno e sombra, títulos em Bricolage Grotesque e adesivos amarelos.",
  "- Barra de abas nova: ícones desenhados, rótulos inteiros (sem \"Alimenta...\") e a aba atual destacada.",
  "- Selo SIMULAÇÃO no topo quando há dados de exemplo (substitui a faixa amarela); tocar leva ao Perfil.",
  "- Sequência de dias e a semana com os dias treinados no Início.",
  "- Calendário do mês e volume por semana (últimas 8 semanas) no Histórico.",
  "- Gráficos de evolução em linha no Peso, no IMC e em cada exercício (melhor carga, volume e 1RM estimado). Toque para ver cada valor ou abra a tabela.",
  "- Mapa dos músculos trabalhados no detalhe do exercício e no \"Escolha o foco de hoje\" dos treinos sugeridos.",
  "- Sugestão de progressão: quando você bate as repetições-alvo em todas as séries, o treino sugere a próxima carga (ou +1 repetição no peso do corpo), com o botão \"Usar\".",
  "- Diário alimentar simples: \"Como foi hoje?\" para café, almoço, lanche e jantar (comi bem, mais ou menos, pulei), sem calorias. Entra na exportação como diario_alimentar.csv.",
  "- Água: anel de progresso, botões rápidos e a lista do que você bebeu hoje.",
  "- Lembretes de treino e água funcionando: no celular, notificações diárias no horário escolhido; na web, aviso enquanto o Quaru está aberto. O de treino não aparece se você já treinou no dia.",
  "- Compartilhar treino: no resumo, manda um texto com séries, volume, recordes e sequência (sem dados de saúde).",
  "- Proteção dos dados na web: o app pede ao navegador para não apagar os dados sozinho, e o Início lembra de exportar uma cópia a cada 14 dias (dá para adiar 7 dias).",
  "### Corrigido",
  "- Slogan do login caía em fonte serifada no Windows (a fonte Inter não era carregada).",
  "- Categorias dos treinos sugeridos e das refeições ficavam escondidas no computador; agora quebram linha. Na Biblioteca, a faixa rola com o mouse.",
  "- No tema escuro, contornos dentro dos blocos não sumiam mais.",
  "### Mudado",
  "- Cor do navegador e do app instalado na web: rosa da identidade (#F2A0B0)."
];
