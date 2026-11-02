/**
 * Conteúdo INFORMATIVO sobre estilos de alimentação (v0.4.1). Arquivo de dados separado para revisão por
 * nutricionista (CRN) e pela Jéssica. Genérico, sem calorias, metas ou recomendação personalizada.
 * Fontes públicas em docs/fontes/dietas.md (as chaves de `fontes` apontam para lá).
 */
export type IdDieta = 'vegetariana' | 'vegana' | 'mediterranea' | 'paleo' | 'cetogenica' | 'low-carb' | 'jejum-intermitente' | 'atkins';
export type IlustracaoDieta = 'dieta-vegetal' | 'dieta-mediterranea' | 'dieta-proteina' | 'dieta-relogio';

export interface Dieta {
  id: IdDieta; nome: string; ilustracao: IlustracaoDieta; descricaoIlustracao: string;
  oQueE: string; comer: string[]; evitar: string[];
  cardapio: { refeicao: string; exemplo: string }[];
  naoIndicada: string[];
  /** Alerta reforçado (cetogênica, jejum e Atkins). */
  alerta?: string;
  fontes: string[];
}

/** Nomes curtos das fontes (URLs e datas de acesso em docs/fontes/dietas.md). */
export const FONTES: Record<string, string> = {
  'guia-alimentar': 'Ministério da Saúde – Guia Alimentar para a População Brasileira (2014)',
  'nhs-vegetariana': 'NHS (Reino Unido) – The vegetarian diet', 'nhs-vegana': 'NHS (Reino Unido) – The vegan diet',
  'harvard-mediterranea': 'Harvard T.H. Chan – Diet Review: Mediterranean', 'harvard-paleo': 'Harvard T.H. Chan – Diet Review: Paleo',
  'harvard-cetogenica': 'Harvard T.H. Chan – Diet Review: Ketogenic', 'harvard-jejum': 'Harvard T.H. Chan – Diet Review: Intermittent Fasting',
  'harvard-carboidratos': 'Harvard T.H. Chan – Carbohydrates', 'mayo-mediterranea': 'Mayo Clinic – Mediterranean diet',
  'mayo-paleo': 'Mayo Clinic – Paleo diet', 'mayo-lowcarb': 'Mayo Clinic – Low-carb diet', 'mayo-atkins': 'Mayo Clinic – Atkins diet',
};

export const AVISO_DIETAS = 'Conteúdo informativo, não é uma recomendação para você. Antes de mudar sua alimentação, consulte um nutricionista.';

export const ALERTA_RESTRITIVA = 'Atenção: não é indicada sem acompanhamento profissional para gestantes, lactantes, pessoas com diabetes (principalmente em uso de insulina ou remédios que baixam o açúcar), pessoas com transtorno alimentar ou histórico dele, pessoas com doença renal e menores de 18 anos.';

export const DIETAS: Dieta[] = [
  {
    id: 'vegetariana', nome: 'Vegetariana', ilustracao: 'dieta-vegetal', descricaoIlustracao: 'Ilustração de um prato com folhas, grãos e um ovo',
    oQueE: 'Alimentação sem carnes (vermelha, aves e peixes). A versão mais comum mantém ovos e laticínios (ovolactovegetariana).',
    comer: ['Feijões, lentilha, grão-de-bico e ervilha', 'Ovos, leite, iogurte e queijos', 'Arroz, aveia, pães e massas, de preferência integrais', 'Verduras, legumes e frutas', 'Castanhas e sementes'],
    evitar: ['Carnes, aves, peixes e frutos do mar', 'Excesso de ultraprocessados, mesmo os sem carne'],
    cardapio: [
      { refeicao: 'Café da manhã', exemplo: 'Pão integral com ovo mexido e uma fruta' },
      { refeicao: 'Almoço', exemplo: 'Arroz, feijão, omelete de legumes e salada' },
      { refeicao: 'Lanche', exemplo: 'Iogurte natural com aveia' },
      { refeicao: 'Jantar', exemplo: 'Macarrão com molho de tomate, lentilha e legumes refogados' },
    ],
    naoIndicada: ['Quem tem alergia ou restrição a ovo e leite precisa de ajuste com profissional', 'Fases de maior necessidade (gestação, infância) pedem acompanhamento para ferro e vitamina B12'],
    fontes: ['guia-alimentar', 'nhs-vegetariana'],
  },
  {
    id: 'vegana', nome: 'Vegana', ilustracao: 'dieta-vegetal', descricaoIlustracao: 'Ilustração de um prato com folhas, grãos e legumes',
    oQueE: 'Alimentação só com alimentos de origem vegetal: sem carnes, ovos, laticínios e mel.',
    comer: ['Feijões, lentilha, grão-de-bico, ervilha, soja e tofu', 'Cereais integrais, mandioca e batatas', 'Verduras, legumes e frutas', 'Castanhas, sementes e pastas delas', 'Bebidas vegetais enriquecidas'],
    evitar: ['Carnes, peixes, ovos, leite e derivados, mel', 'Excesso de ultraprocessados veganos'],
    cardapio: [
      { refeicao: 'Café da manhã', exemplo: 'Mingau de aveia com bebida vegetal, banana e pasta de amendoim' },
      { refeicao: 'Almoço', exemplo: 'Arroz, feijão, tofu grelhado e salada' },
      { refeicao: 'Lanche', exemplo: 'Fruta e um punhado de castanhas' },
      { refeicao: 'Jantar', exemplo: 'Grão-de-bico com legumes assados e quinoa' },
    ],
    naoIndicada: ['Sem planejamento, pode faltar vitamina B12 (que costuma precisar de suplemento), ferro, cálcio e ômega-3', 'Gestantes, lactantes, crianças e adolescentes precisam de acompanhamento profissional'],
    fontes: ['guia-alimentar', 'nhs-vegana'],
  },
  {
    id: 'mediterranea', nome: 'Mediterrânea', ilustracao: 'dieta-mediterranea', descricaoIlustracao: 'Ilustração de um prato com peixe, azeite e legumes',
    oQueE: 'Padrão alimentar inspirado em países do Mediterrâneo: muitos vegetais, grãos integrais, azeite de oliva, peixes e pouca carne vermelha.',
    comer: ['Verduras, legumes e frutas todos os dias', 'Grãos integrais e feijões', 'Azeite de oliva como gordura principal', 'Peixes e frutos do mar algumas vezes por semana', 'Castanhas, ervas e temperos naturais'],
    evitar: ['Muita carne vermelha e embutidos', 'Doces, refrigerantes e ultraprocessados', 'Excesso de sal'],
    cardapio: [
      { refeicao: 'Café da manhã', exemplo: 'Iogurte natural com fruta e nozes' },
      { refeicao: 'Almoço', exemplo: 'Peixe assado com azeite, arroz integral e salada' },
      { refeicao: 'Lanche', exemplo: 'Pão integral com tomate e azeite' },
      { refeicao: 'Jantar', exemplo: 'Sopa de legumes com grão-de-bico' },
    ],
    naoIndicada: ['Em geral é bem aceita; quem tem alergia a peixes ou castanhas precisa adaptar com profissional'],
    fontes: ['harvard-mediterranea', 'mayo-mediterranea'],
  },
  {
    id: 'paleo', nome: 'Paleo', ilustracao: 'dieta-proteina', descricaoIlustracao: 'Ilustração de um prato com carne, legumes e frutas',
    oQueE: 'Inspirada no que se imagina ser a alimentação de antes da agricultura: carnes, peixes, ovos, vegetais, frutas e castanhas, sem grãos, laticínios e industrializados.',
    comer: ['Carnes magras, peixes e ovos', 'Verduras, legumes e frutas', 'Castanhas e sementes', 'Azeite e outras gorduras naturais'],
    evitar: ['Cereais (arroz, trigo, aveia) e feijões', 'Leite e derivados', 'Açúcar, sal em excesso e ultraprocessados'],
    cardapio: [
      { refeicao: 'Café da manhã', exemplo: 'Ovos mexidos com tomate e uma fruta' },
      { refeicao: 'Almoço', exemplo: 'Frango grelhado com abóbora assada e salada' },
      { refeicao: 'Lanche', exemplo: 'Castanhas e uma fruta' },
      { refeicao: 'Jantar', exemplo: 'Peixe com legumes refogados no azeite' },
    ],
    naoIndicada: ['Por cortar grãos, feijões e laticínios, pode faltar fibra e cálcio sem acompanhamento', 'Pessoas com doença renal devem ter cuidado com o alto consumo de proteína'],
    fontes: ['harvard-paleo', 'mayo-paleo'],
  },
  {
    id: 'cetogenica', nome: 'Cetogênica', ilustracao: 'dieta-proteina', descricaoIlustracao: 'Ilustração de um prato com carne, ovo, abacate e folhas',
    oQueE: 'Alimentação com muito pouco carboidrato e muita gordura, para o corpo passar a usar gordura como principal fonte de energia (cetose). Também é usada como tratamento médico em alguns casos de epilepsia, sempre com equipe de saúde.',
    comer: ['Carnes, peixes e ovos', 'Abacate, azeite, castanhas e sementes', 'Queijos e manteiga', 'Verduras e legumes com pouco amido (folhas, brócolis, abobrinha)'],
    evitar: ['Pães, arroz, massas, batata e mandioca', 'Açúcar, doces, sucos e a maioria das frutas', 'Feijões e outros grãos'],
    cardapio: [
      { refeicao: 'Café da manhã', exemplo: 'Ovos com queijo e abacate' },
      { refeicao: 'Almoço', exemplo: 'Carne assada com brócolis no azeite e salada de folhas' },
      { refeicao: 'Lanche', exemplo: 'Um punhado de castanhas' },
      { refeicao: 'Jantar', exemplo: 'Peixe com abobrinha refogada na manteiga' },
    ],
    naoIndicada: ['Gestantes e lactantes', 'Pessoas com diabetes, principalmente em uso de insulina ou remédios que baixam o açúcar', 'Pessoas com transtorno alimentar', 'Pessoas com doença renal, no fígado ou no pâncreas', 'Menores de 18 anos (fora de tratamento médico)'],
    alerta: ALERTA_RESTRITIVA,
    fontes: ['harvard-cetogenica', 'mayo-lowcarb'],
  },
  {
    id: 'low-carb', nome: 'Low-carb', ilustracao: 'dieta-proteina', descricaoIlustracao: 'Ilustração de um prato com proteína, legumes e pouco carboidrato',
    oQueE: 'Redução dos carboidratos, principalmente açúcar e farinhas refinadas, com mais proteínas, gorduras e vegetais. É menos restritiva que a cetogênica.',
    comer: ['Verduras e legumes à vontade', 'Carnes, peixes, ovos e laticínios', 'Castanhas, azeite e abacate', 'Frutas e grãos integrais em porções menores'],
    evitar: ['Açúcar, doces e refrigerantes', 'Pães, massas e farinhas brancas', 'Ultraprocessados'],
    cardapio: [
      { refeicao: 'Café da manhã', exemplo: 'Iogurte natural com morangos e sementes' },
      { refeicao: 'Almoço', exemplo: 'Frango, porção pequena de arroz integral, feijão e salada' },
      { refeicao: 'Lanche', exemplo: 'Queijo branco e tomate-cereja' },
      { refeicao: 'Jantar', exemplo: 'Omelete de legumes e salada' },
    ],
    naoIndicada: ['Pessoas com diabetes em uso de remédios precisam de acompanhamento, pelo risco de açúcar baixo', 'Gestantes, lactantes, menores de 18 anos e pessoas com doença renal ou transtorno alimentar devem falar com um profissional antes'],
    fontes: ['mayo-lowcarb', 'harvard-carboidratos'],
  },
  {
    id: 'jejum-intermitente', nome: 'Jejum intermitente', ilustracao: 'dieta-relogio', descricaoIlustracao: 'Ilustração de um relógio ao lado de um prato',
    oQueE: 'Não é uma lista de alimentos, e sim uma forma de organizar os horários: alternar períodos sem comer com períodos de alimentação (por exemplo, comer só numa janela de horas do dia).',
    comer: ['Na janela de alimentação, refeições equilibradas: vegetais, proteínas, grãos integrais e frutas', 'Água e bebidas sem açúcar durante o jejum'],
    evitar: ['Compensar com excesso de ultraprocessados na janela de alimentação', 'Treinos intensos em jejum sem orientação'],
    cardapio: [
      { refeicao: 'Manhã (jejum)', exemplo: 'Água, café ou chá sem açúcar' },
      { refeicao: 'Primeira refeição', exemplo: 'Arroz, feijão, carne ou ovo e salada' },
      { refeicao: 'Lanche', exemplo: 'Fruta com iogurte natural' },
      { refeicao: 'Última refeição', exemplo: 'Peixe com legumes e batata' },
    ],
    naoIndicada: ['Gestantes e lactantes', 'Pessoas com diabetes, principalmente em uso de insulina ou remédios que baixam o açúcar', 'Pessoas com transtorno alimentar ou histórico dele', 'Pessoas com doença renal', 'Menores de 18 anos'],
    alerta: ALERTA_RESTRITIVA,
    fontes: ['harvard-jejum'],
  },
  {
    id: 'atkins', nome: 'Atkins', ilustracao: 'dieta-proteina', descricaoIlustracao: 'Ilustração de um prato com carne, ovo e folhas',
    oQueE: 'Dieta low-carb dividida em fases: começa com muito pouco carboidrato e vai reintroduzindo aos poucos, com bastante proteína e gordura.',
    comer: ['Carnes, peixes e ovos', 'Queijos, azeite, manteiga e abacate', 'Verduras e legumes com pouco amido', 'Nas fases seguintes: castanhas, frutas vermelhas e alguns grãos'],
    evitar: ['Açúcar e doces', 'Pães, massas, arroz e batata, principalmente no início', 'Bebidas açucaradas'],
    cardapio: [
      { refeicao: 'Café da manhã', exemplo: 'Omelete com espinafre e queijo' },
      { refeicao: 'Almoço', exemplo: 'Bife com salada de folhas e azeite' },
      { refeicao: 'Lanche', exemplo: 'Ovo cozido' },
      { refeicao: 'Jantar', exemplo: 'Frango assado com couve-flor e brócolis' },
    ],
    naoIndicada: ['Gestantes e lactantes', 'Pessoas com diabetes em uso de remédios que baixam o açúcar', 'Pessoas com transtorno alimentar', 'Pessoas com doença renal', 'Menores de 18 anos'],
    alerta: ALERTA_RESTRITIVA,
    fontes: ['mayo-atkins', 'mayo-lowcarb'],
  },
];
