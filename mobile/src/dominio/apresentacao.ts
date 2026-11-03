import type { NomeIlustracao } from '@/componentes/ilustracoes';

/** Passos da apresentação do primeiro acesso (v0.4.1). Textos curtos, em português claro. */
export interface PassoApresentacao { ilustracao: NomeIlustracao; titulo: string; texto: string; descricao: string }

export const PASSOS: readonly PassoApresentacao[] = [
  { ilustracao: 'boas-vindas', titulo: 'Bem-vindo ao Quaru', texto: 'Seu caderno de treinos no bolso. Funciona sem internet e os dados ficam neste aparelho.', descricao: 'Ilustração de um halter com brilhos' },
  { ilustracao: 'rotinas', titulo: 'Monte ou escolha seu treino', texto: 'Crie treinos como Treino A, B e C. O Quaru sugere o próximo da sequência a cada dia.', descricao: 'Ilustração de três cartões de treino, A, B e C, com o B em destaque' },
  { ilustracao: 'series', titulo: 'Registre séries e descanso', texto: 'Anote carga e repetições de cada série. O cronômetro de descanso avisa quando voltar.', descricao: 'Ilustração de uma lista de séries marcadas como feitas e um cronômetro' },
  { ilustracao: 'evolucao', titulo: 'Acompanhe sua evolução', texto: 'Veja o histórico, os recordes e o seu peso ao longo do tempo.', descricao: 'Ilustração de um gráfico de barras subindo e um troféu' },
];

/** Tour guiado (v0.4.1): explica cada área e, no caminho, faz perguntas que dá para pular. */
export type IdPassoTour = 'ola' | 'nome' | 'idade' | 'inicio' | 'objetivo' | 'experiencia' | 'tempo-local' | 'equipamentos' | 'treinos' | 'areas' | 'restricoes' | 'medidas' | 'alimentacao' | 'agua' | 'cidade' | 'perfil';
export interface PassoTour { id: IdPassoTour; titulo: string; texto: string; pergunta: boolean; area?: string; ilustracao?: NomeIlustracao; descricao?: string }
export const PASSOS_TOUR: readonly PassoTour[] = [
  { id: 'ola', titulo: 'Bem-vindo ao Quaru', texto: 'Vamos conhecer o app em poucos passos. No caminho, algumas perguntas ajudam a sugerir treinos para você. Todas podem ser puladas.', pergunta: false, ilustracao: 'boas-vindas', descricao: PASSOS[0].descricao },
  { id: 'nome', titulo: 'Como podemos te chamar?', texto: 'Nome ou apelido, só para o "Olá" do Início.', pergunta: true },
  { id: 'idade', titulo: 'Aniversário e faixa de idade', texto: 'Conta quando é o seu aniversário para o Quaru te dar parabéns no dia. O ano é opcional. A faixa de idade ajusta avisos, como o do IMC, que não vale para menores de 18.', pergunta: true },
  { id: 'inicio', area: 'Início', titulo: 'Início: o seu dia', texto: 'Aqui aparecem o próximo treino, os treinos recomendados para você e a água do dia.', pergunta: false, ilustracao: 'comece', descricao: 'Ilustração de uma lista com três passos numerados' },
  { id: 'objetivo', titulo: 'Seu objetivo', texto: 'Com isso, o Quaru ajusta repetições e descanso dos treinos sugeridos.', pergunta: true },
  { id: 'experiencia', titulo: 'Há quanto tempo você treina?', texto: 'Ajuda a começar no ritmo certo.', pergunta: true },
  { id: 'tempo-local', titulo: 'Tempo e lugar', texto: 'Quanto tempo você tem por treino e onde costuma treinar.', pergunta: true },
  { id: 'equipamentos', titulo: 'Seus equipamentos', texto: 'Marque o que você tem onde treina. Assim sugerimos treinos que dá para fazer.', pergunta: true },
  { id: 'treinos', area: 'Treinos', titulo: 'Treinos: os seus e os sugeridos', texto: 'Monte seus treinos ou use um treino sugerido com um toque. Durante o treino, registre séries e descanso.', pergunta: false, ilustracao: 'rotinas', descricao: PASSOS[1].descricao },
  { id: 'areas', titulo: 'Áreas de foco', texto: 'Quer dar atenção a alguma parte do corpo? Pode escolher mais de uma.', pergunta: true },
  { id: 'restricoes', titulo: 'Alguma dor ou lesão?', texto: 'Opcional. É dado de saúde e fica só neste aparelho.', pergunta: true },
  { id: 'medidas', titulo: 'Altura e peso', texto: 'Opcional. Servem para o IMC e para a meta de água. Ficam só neste aparelho.', pergunta: true },
  { id: 'alimentacao', area: 'Alimentação', titulo: 'Alimentação', texto: 'Guia de dietas e ideias de refeições, sem metas de calorias. Qual é a sua preferência?', pergunta: true, ilustracao: 'dieta-vegetal', descricao: 'Ilustração de um prato com folhas, grãos e legumes' },
  { id: 'agua', area: 'Água', titulo: 'Água', texto: 'Registre copos de 250 ou 500 ml e acompanhe a meta do dia. Quer lembretes?', pergunta: true, ilustracao: 'agua', descricao: 'Ilustração de um copo de água com gotas' },
  { id: 'cidade', titulo: 'Cidade e bairro', texto: 'Opcional.', pergunta: true },
  { id: 'perfil', area: 'Perfil', titulo: 'Perfil: tudo editável', texto: 'Em Perfil → Meus dados você muda ou apaga qualquer resposta. Exportar e Excluir tudo também estão lá.', pergunta: false, ilustracao: 'evolucao', descricao: PASSOS[3].descricao },
];

/** Lista "Comece aqui" do Início sem treino. */
export const COMECE_AQUI = [
  { titulo: 'Monte seu primeiro treino', texto: 'Dê um nome, como Treino A, e escolha os exercícios.' },
  { titulo: 'Inicie o treino', texto: 'Toque em "Iniciar treino" no Início quando chegar na academia.' },
  { titulo: 'Registre cada série', texto: 'Carga, repetições e descanso. O resumo aparece no fim.' },
] as const;
