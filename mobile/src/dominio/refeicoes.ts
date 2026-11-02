/**
 * Ideias de refeições saudáveis (v0.4.1): comida brasileira do dia a dia, só informativo. Sem calorias, gramas
 * ou dados nutricionais; as etiquetas são qualitativas e combinam com o guia de dietas. Base: Guia Alimentar
 * para a População Brasileira (MS, 2014) – preferir alimentos in natura e minimamente processados.
 * PRECISA de revisão por nutricionista (CRN) e pela Jéssica antes de publicar.
 */
export type Momento = 'cafe' | 'almoco' | 'lanche' | 'jantar';
export type Etiqueta = 'vegetariana' | 'vegana' | 'low-carb' | 'rica-em-proteina' | 'mediterranea' | 'sem-gluten' | 'sem-lactose';

export const MOMENTOS: { id: Momento; nome: string }[] = [{ id: 'cafe', nome: 'Café da manhã' }, { id: 'almoco', nome: 'Almoço' }, { id: 'lanche', nome: 'Lanche' }, { id: 'jantar', nome: 'Jantar' }];
export const ETIQUETAS: { id: Etiqueta; nome: string; dieta?: string }[] = [
  { id: 'vegetariana', nome: 'Vegetariana', dieta: 'vegetariana' }, { id: 'vegana', nome: 'Vegana', dieta: 'vegana' },
  { id: 'low-carb', nome: 'Low-carb', dieta: 'low-carb' }, { id: 'mediterranea', nome: 'Mediterrânea', dieta: 'mediterranea' },
  { id: 'rica-em-proteina', nome: 'Rica em proteína' }, { id: 'sem-gluten', nome: 'Sem glúten' }, { id: 'sem-lactose', nome: 'Sem lactose' },
];

export interface IdeiaRefeicao { id: string; momento: Momento; nome: string; ingredientes: string[]; preparo: string; etiquetas: Etiqueta[] }

export const AVISO_REFEICOES = 'Ideias gerais, só informativas. Quantidades e combinações dependem de cada pessoa: procure um nutricionista.';

export const IDEIAS: IdeiaRefeicao[] = [
  { id: 'tapioca-ovo', momento: 'cafe', nome: 'Tapioca com ovo e tomate', ingredientes: ['Goma de tapioca', 'Ovo', 'Tomate', 'Orégano'], preparo: 'Espalhe a goma na frigideira quente até firmar. Recheie com ovo mexido e tomate picado e dobre.', etiquetas: ['vegetariana', 'sem-gluten', 'sem-lactose', 'rica-em-proteina'] },
  { id: 'cuscuz-ovo', momento: 'cafe', nome: 'Cuscuz nordestino com ovo', ingredientes: ['Flocão de milho', 'Água e sal', 'Ovo', 'Cebolinha'], preparo: 'Hidrate o flocão com água e sal, cozinhe no vapor na cuscuzeira e sirva com ovo cozido ou mexido.', etiquetas: ['vegetariana', 'sem-gluten', 'sem-lactose'] },
  { id: 'pao-queijo-branco', momento: 'cafe', nome: 'Pão integral com queijo branco e mamão', ingredientes: ['Pão integral', 'Queijo minas frescal', 'Mamão'], preparo: 'Monte o pão com fatias de queijo e sirva com o mamão picado.', etiquetas: ['vegetariana'] },
  { id: 'mingau-aveia', momento: 'cafe', nome: 'Mingau de aveia com banana', ingredientes: ['Aveia em flocos', 'Bebida vegetal ou água', 'Banana', 'Canela'], preparo: 'Cozinhe a aveia na bebida vegetal mexendo até engrossar. Finalize com banana amassada e canela.', etiquetas: ['vegetariana', 'vegana', 'sem-lactose'] },
  { id: 'ovos-abacate', momento: 'cafe', nome: 'Ovos mexidos com abacate', ingredientes: ['Ovos', 'Abacate', 'Sal e pimenta', 'Cheiro-verde'], preparo: 'Mexa os ovos em fogo baixo e sirva com fatias de abacate temperadas.', etiquetas: ['vegetariana', 'low-carb', 'sem-gluten', 'sem-lactose', 'rica-em-proteina'] },

  { id: 'pf-frango', momento: 'almoco', nome: 'Arroz, feijão, frango grelhado e salada', ingredientes: ['Arroz', 'Feijão', 'Filé de frango', 'Alface, tomate e cenoura'], preparo: 'Tempere o frango com alho, limão e sal e grelhe. Sirva com arroz, feijão e salada crua.', etiquetas: ['sem-gluten', 'sem-lactose', 'rica-em-proteina'] },
  { id: 'peixe-pirao', momento: 'almoco', nome: 'Peixe assado com legumes e azeite', ingredientes: ['Filé de peixe (tilápia ou pescada)', 'Batata', 'Abobrinha', 'Azeite e limão'], preparo: 'Arrume peixe e legumes em uma assadeira, regue com azeite e limão e asse até o peixe ficar opaco.', etiquetas: ['mediterranea', 'sem-gluten', 'sem-lactose', 'rica-em-proteina'] },
  { id: 'feijao-tropeiro-veg', momento: 'almoco', nome: 'Arroz, feijão, ovo e couve refogada', ingredientes: ['Arroz', 'Feijão', 'Ovo', 'Couve', 'Alho'], preparo: 'Refogue a couve fatiada fina no alho. Sirva com arroz, feijão e ovo.', etiquetas: ['vegetariana', 'sem-gluten', 'sem-lactose'] },
  { id: 'grao-de-bico', momento: 'almoco', nome: 'Ensopado de grão-de-bico com abóbora', ingredientes: ['Grão-de-bico cozido', 'Abóbora', 'Tomate', 'Cebola e alho', 'Arroz integral'], preparo: 'Refogue cebola, alho e tomate, junte abóbora e grão-de-bico com um pouco de água e cozinhe até a abóbora amaciar. Sirva com arroz.', etiquetas: ['vegetariana', 'vegana', 'mediterranea', 'sem-gluten', 'sem-lactose'] },
  { id: 'carne-legumes', momento: 'almoco', nome: 'Carne moída com abobrinha e salada', ingredientes: ['Patinho moído', 'Abobrinha', 'Tomate', 'Folhas'], preparo: 'Refogue a carne com cebola e alho, junte a abobrinha em cubos e o tomate. Sirva com salada de folhas.', etiquetas: ['low-carb', 'sem-gluten', 'sem-lactose', 'rica-em-proteina'] },

  { id: 'iogurte-fruta', momento: 'lanche', nome: 'Iogurte natural com fruta e aveia', ingredientes: ['Iogurte natural', 'Fruta da estação', 'Aveia'], preparo: 'Misture tudo numa tigela.', etiquetas: ['vegetariana', 'rica-em-proteina'] },
  { id: 'fruta-castanha', momento: 'lanche', nome: 'Fruta com castanhas', ingredientes: ['Banana, maçã ou outra fruta', 'Castanha-do-pará ou de caju'], preparo: 'Sirva a fruta com um punhado pequeno de castanhas.', etiquetas: ['vegetariana', 'vegana', 'sem-gluten', 'sem-lactose', 'mediterranea'] },
  { id: 'ovo-cozido', momento: 'lanche', nome: 'Ovo cozido com tomate-cereja', ingredientes: ['Ovo', 'Tomate-cereja', 'Sal'], preparo: 'Cozinhe o ovo por cerca de 10 minutos, descasque e sirva com os tomates.', etiquetas: ['vegetariana', 'low-carb', 'sem-gluten', 'sem-lactose', 'rica-em-proteina'] },
  { id: 'pao-pasta-amendoim', momento: 'lanche', nome: 'Pão integral com pasta de amendoim', ingredientes: ['Pão integral', 'Pasta de amendoim sem açúcar', 'Banana'], preparo: 'Passe a pasta no pão e cubra com rodelas de banana.', etiquetas: ['vegetariana', 'vegana', 'sem-lactose'] },

  { id: 'sopa-legumes', momento: 'jantar', nome: 'Sopa de legumes com feijão', ingredientes: ['Feijão cozido', 'Cenoura', 'Chuchu', 'Batata', 'Cheiro-verde'], preparo: 'Cozinhe os legumes picados em água com sal, junte o feijão e deixe apurar. Finalize com cheiro-verde.', etiquetas: ['vegetariana', 'vegana', 'sem-gluten', 'sem-lactose'] },
  { id: 'omelete', momento: 'jantar', nome: 'Omelete de espinafre com salada', ingredientes: ['Ovos', 'Espinafre', 'Queijo branco (opcional)', 'Folhas e tomate'], preparo: 'Bata os ovos, junte o espinafre picado e doure dos dois lados. Sirva com salada.', etiquetas: ['vegetariana', 'low-carb', 'sem-gluten', 'rica-em-proteina'] },
  { id: 'frango-mandioca', momento: 'jantar', nome: 'Frango desfiado com mandioca cozida', ingredientes: ['Peito de frango', 'Mandioca', 'Tomate e cebola', 'Salada'], preparo: 'Cozinhe e desfie o frango, refogue com tomate e cebola. Sirva com mandioca cozida e salada.', etiquetas: ['sem-gluten', 'sem-lactose', 'rica-em-proteina'] },
  { id: 'tofu-legumes', momento: 'jantar', nome: 'Tofu grelhado com legumes salteados', ingredientes: ['Tofu firme', 'Brócolis', 'Cenoura', 'Shoyu com pouco sódio'], preparo: 'Grelhe o tofu em cubos até dourar e salteie os legumes na mesma frigideira. Tempere com um pouco de shoyu.', etiquetas: ['vegetariana', 'vegana', 'low-carb', 'sem-lactose', 'rica-em-proteina'] },
];

export const filtrarIdeias = (momento: Momento, etiquetas: Etiqueta[]) => IDEIAS.filter((i) => i.momento === momento && etiquetas.every((e) => i.etiquetas.includes(e)));
