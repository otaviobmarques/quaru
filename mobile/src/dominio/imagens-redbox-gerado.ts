// GERADO por scripts/importar-imagens-redbox.mjs — não edite à mão.
import type { ImageSourcePropType } from 'react-native';

type Img = { foto: ImageSourcePropType; mini: ImageSourcePropType; alt?: string };
/** provisoria = true: imagem provisória (gerada por IA na 0.4.3) até a RedBox entregar a final. */
export const IMAGENS_DIETAS: Record<string, Img & { provisoria: boolean }> = {
  'vegetariana': { foto: require('../../assets/dietas/vegetariana.webp'), mini: require('../../assets/dietas/vegetariana_mini.webp'), provisoria: false, alt: "Foto de feijão vermelho, arroz e vinagrete em prato branco" },
  'vegana': { foto: require('../../assets/dietas/vegana.webp'), mini: require('../../assets/dietas/vegana_mini.webp'), provisoria: false, alt: "Foto de bowl com tofu, arroz, feijão preto e legumes" },
  'mediterranea': { foto: require('../../assets/dietas/mediterranea.webp'), mini: require('../../assets/dietas/mediterranea_mini.webp'), provisoria: false, alt: "Foto de peixe assado com tomates, azeitonas, limão e manjericão" },
  'paleo': { foto: require('../../assets/dietas/paleo.webp'), mini: require('../../assets/dietas/paleo_mini.webp'), provisoria: false, alt: "Foto de salada de folhas e tomate com peito de frango grelhado" },
  'cetogenica': { foto: require('../../assets/dietas/cetogenica.webp'), mini: require('../../assets/dietas/cetogenica_mini.webp'), provisoria: false, alt: "Foto de salada de salmão, abacate, rúcula e tomate-cereja" },
  'low-carb': { foto: require('../../assets/dietas/low-carb.webp'), mini: require('../../assets/dietas/low-carb_mini.webp'), provisoria: false, alt: "Foto de frango grelhado em cubos com brócolis e abobrinha grelhada" },
  'jejum-intermitente': { foto: require('../../assets/dietas/jejum-intermitente.webp'), mini: require('../../assets/dietas/jejum-intermitente_mini.webp'), provisoria: false, alt: "Foto de café preto, despertador antigo e vela, luz quente" },
  'atkins': { foto: require('../../assets/dietas/atkins.webp'), mini: require('../../assets/dietas/atkins_mini.webp'), provisoria: false, alt: "Foto de ovos fritos com bacon na frigideira, sem pão" },
};
/** Créditos copiados do LEIAME.md da RedBox, só das fotos que entraram no app. */
export const CREDITOS_FOTOS: { arquivo: string; descricao: string; origem: string; autor: string; licenca: string; licencaUrl: string | null }[] = [
  {
    "arquivo": "dieta-atkins",
    "descricao": "Atkins: ovos fritos com bacon na frigideira, sem pão",
    "origem": "https://www.pexels.com/photo/13376483/",
    "autor": "Mateusz Feliksik",
    "licenca": "Pexels License",
    "licencaUrl": "https://www.pexels.com/license/"
  },
  {
    "arquivo": "dieta-cetogenica",
    "descricao": "Cetogênica: salada de salmão, abacate, rúcula e tomate-cereja",
    "origem": "https://www.pexels.com/photo/7708515/",
    "autor": "Kiro Wang",
    "licenca": "Pexels License",
    "licencaUrl": "https://www.pexels.com/license/"
  },
  {
    "arquivo": "dieta-jejum-intermitente",
    "descricao": "Jejum intermitente: café preto, despertador antigo e vela, luz quente",
    "origem": "https://www.pexels.com/photo/34640388/",
    "autor": "betül nur akyürek",
    "licenca": "Pexels License",
    "licencaUrl": "https://www.pexels.com/license/"
  },
  {
    "arquivo": "dieta-low-carb",
    "descricao": "Low-carb: frango grelhado em cubos com brócolis e abobrinha grelhada (sem milho, batata, arroz ou pão)",
    "origem": "https://www.pexels.com/photo/8872309/",
    "autor": "Алеся Горбунова",
    "licenca": "Pexels License",
    "licencaUrl": "https://www.pexels.com/license/"
  },
  {
    "arquivo": "dieta-mediterranea",
    "descricao": "Mediterrânea: peixe assado com tomates, azeitonas, limão e manjericão",
    "origem": "https://www.pexels.com/photo/27294733/",
    "autor": "Valeria Boltneva",
    "licenca": "Pexels License",
    "licencaUrl": "https://www.pexels.com/license/"
  },
  {
    "arquivo": "dieta-paleo",
    "descricao": "Paleo: salada de folhas e tomate com peito de frango grelhado",
    "origem": "https://www.pexels.com/photo/13312316/",
    "autor": "Nadin Sh",
    "licenca": "Pexels License",
    "licencaUrl": "https://www.pexels.com/license/"
  },
  {
    "arquivo": "dieta-vegana",
    "descricao": "Vegana: bowl com tofu, arroz, feijão preto e legumes",
    "origem": "https://www.pexels.com/photo/34429488/",
    "autor": "Laura oliveira",
    "licenca": "Pexels License",
    "licencaUrl": "https://www.pexels.com/license/"
  },
  {
    "arquivo": "dieta-vegetariana",
    "descricao": "Vegetariana: feijão vermelho, arroz e vinagrete em prato branco",
    "origem": "https://www.pexels.com/photo/8992843/",
    "autor": "I Own My Food Art",
    "licenca": "Pexels License",
    "licencaUrl": "https://www.pexels.com/license/"
  },
  {
    "arquivo": "refeicao-fruta-castanha",
    "descricao": "Fruta com castanhas: uvas, pistache e amêndoas",
    "origem": "https://www.pexels.com/photo/5202100/",
    "autor": "https://kaboompics.com/",
    "licenca": "Pexels License",
    "licencaUrl": "https://www.pexels.com/license/"
  },
  {
    "arquivo": "refeicao-iogurte-fruta",
    "descricao": "Iogurte natural com fruta e aveia (granola, mirtilo, morango)",
    "origem": "https://www.pexels.com/photo/17834128/",
    "autor": "Sofía Nuñez",
    "licenca": "Pexels License",
    "licencaUrl": "https://www.pexels.com/license/"
  },
  {
    "arquivo": "refeicao-mingau-aveia",
    "descricao": "Mingau de aveia com banana (e framboesas, chia)",
    "origem": "https://www.pexels.com/photo/4725737/",
    "autor": "Polina Tankilevitch",
    "licenca": "Pexels License",
    "licencaUrl": "https://www.pexels.com/license/"
  },
  {
    "arquivo": "refeicao-ovo-cozido",
    "descricao": "Ovo cozido com tomate-cereja e folhas (1x1 e 16x9 sem presunto)",
    "origem": "https://www.pexels.com/photo/10520136/",
    "autor": "Kristina Paukshtite",
    "licenca": "Pexels License",
    "licencaUrl": "https://www.pexels.com/license/"
  },
  {
    "arquivo": "refeicao-ovos-abacate",
    "descricao": "Ovos mexidos com abacate, folhas e pão",
    "origem": "https://www.pexels.com/photo/19745150/",
    "autor": "Sai Kuen Leung",
    "licenca": "Pexels License",
    "licencaUrl": "https://www.pexels.com/license/"
  },
  {
    "arquivo": "refeicao-pao-pasta-amendoim",
    "descricao": "Pão com pasta de amendoim e banana",
    "origem": "https://www.pexels.com/photo/6659698/",
    "autor": "https://kaboompics.com/",
    "licenca": "Pexels License",
    "licencaUrl": "https://www.pexels.com/license/"
  },
  {
    "arquivo": "refeicao-sopa-legumes",
    "descricao": "Sopa de legumes com feijão em tigela rústica",
    "origem": "https://www.pexels.com/photo/28286253/",
    "autor": "Nic Wood",
    "licenca": "Pexels License",
    "licencaUrl": "https://www.pexels.com/license/"
  },
  {
    "arquivo": "refeicao-tofu-legumes",
    "descricao": "Tofu grelhado com legumes salteados e brotos",
    "origem": "https://www.pexels.com/photo/5182130/",
    "autor": "Anna Tarazevich",
    "licenca": "Pexels License",
    "licencaUrl": "https://www.pexels.com/license/"
  }
];
/** Fotos das receitas (ideias de refeições) já entregues pela RedBox. Sem foto: a tela mostra o espaço provisório. */
export const IMAGENS_RECEITAS: Record<string, Img> = {
  'mingau-aveia': { foto: require('../../assets/receitas/mingau-aveia_16x9.webp'), mini: require('../../assets/receitas/mingau-aveia_1x1.webp'), alt: "Foto de mingau de aveia com banana" },
  'ovos-abacate': { foto: require('../../assets/receitas/ovos-abacate_16x9.webp'), mini: require('../../assets/receitas/ovos-abacate_1x1.webp'), alt: "Foto de ovos mexidos com abacate, folhas e pão" },
  'iogurte-fruta': { foto: require('../../assets/receitas/iogurte-fruta_16x9.webp'), mini: require('../../assets/receitas/iogurte-fruta_1x1.webp'), alt: "Foto de iogurte natural com fruta e aveia" },
  'fruta-castanha': { foto: require('../../assets/receitas/fruta-castanha_16x9.webp'), mini: require('../../assets/receitas/fruta-castanha_1x1.webp'), alt: "Foto de uvas, pistache e amêndoas" },
  'ovo-cozido': { foto: require('../../assets/receitas/ovo-cozido_16x9.webp'), mini: require('../../assets/receitas/ovo-cozido_1x1.webp'), alt: "Foto de ovo cozido com tomate-cereja e folhas" },
  'pao-pasta-amendoim': { foto: require('../../assets/receitas/pao-pasta-amendoim_16x9.webp'), mini: require('../../assets/receitas/pao-pasta-amendoim_1x1.webp'), alt: "Foto de pão com pasta de amendoim e banana" },
  'sopa-legumes': { foto: require('../../assets/receitas/sopa-legumes_16x9.webp'), mini: require('../../assets/receitas/sopa-legumes_1x1.webp'), alt: "Foto de sopa de legumes com feijão em tigela rústica" },
  'tofu-legumes': { foto: require('../../assets/receitas/tofu-legumes_16x9.webp'), mini: require('../../assets/receitas/tofu-legumes_1x1.webp'), alt: "Foto de tofu grelhado com legumes salteados e brotos" },
};
