// v0.4.4: tokens v3.2 da RedBox (fundo rosa; telas-v3.2/tokens-v3.2.md): 7 trocas e 8 tokens "-sobre-fundo".
// Sobre o rosa, só os tokens "-sobre-fundo" (tema.ts troca sozinho dentro de <Tela>); erro, sucesso, alerta, secundaria,
// primaria, primaria-texto e texto-suave só dentro de bloco. No escuro, primaria-sobre-fundo só em ícone, borda e texto grande.
// Tokens v0.3 – paleta Quaru (logo-rodada-2/quaru_v2: #E0263F, #1A0E12, #14141A) sobre a base v0.1 da Lorena · Domma Tecnologia
// Contrastes AA conferidos em __tests__/contraste.test.ts e design/paleta-quaru_v0.3.md.
// React Native + Expo. Fonte: Inter (SIL OFL 1.1). Ícones: Lucide (ISC). Contraste ≥ 4,5:1 conferido em contraste.md.
export const paleta = {
  "primaria": {
    "50": "#FDECEE",
    "100": "#FBD3D8",
    "200": "#F7A8B2",
    "300": "#FF8A9B",
    "400": "#FF7085",
    "500": "#E0263F",
    "600": "#C81E36",
    "700": "#A3172C",
    "800": "#7A1121",
    "900": "#3A1620"
  },
  "marca": { "vermelho": "#E0263F", "fundo-icone": "#1A0E12", "texto": "#14141A" },
  "secundaria": {
    "50": "#EFF5FA",
    "100": "#DCE8F3",
    "200": "#B6CFE6",
    "300": "#84AED3",
    "400": "#528ABC",
    "500": "#346EA1",
    "600": "#285884",
    "700": "#20466A",
    "800": "#1A3753",
    "900": "#11253A"
  },
  "neutra": {
    "50": "#F7F7F6",
    "100": "#EEEDEB",
    "200": "#DDDBD8",
    "300": "#C2BFBA",
    "400": "#9B9790",
    "500": "#75716B",
    "600": "#5A5752",
    "700": "#44413D",
    "800": "#2B2927",
    "900": "#1A1918"
  },
  "sucesso": {
    "claro": "#15803D",
    "escuro": "#4ADE80"
  },
  "alerta": {
    "claro": "#A75A07",
    "escuro": "#FBBF24"
  },
  "erro": {
    "claro": "#C62828",
    "escuro": "#F87171"
  }
} as const;

export const temas = {
  "claro": {
    "fundo": "#F2A0B0",
    "superficie": "#FFFFFF",
    "superficie-2": "#EFECED",
    "borda": "#14141A",
    "borda-campo": "#75716B",
    "divisoria": "#DED8DA",
    "texto": "#14141A",
    "texto-suave": "#5C5257",
    "primaria": "#C81E36",
    "primaria-texto": "#A3172C",
    "sobre-primaria": "#FFFFFF",
    "primaria-suave": "#FDECEE",
    "secundaria": "#285884",
    "sobre-secundaria": "#FFFFFF",
    "secundaria-suave": "#EFF5FA",
    "sucesso": "#15803D",
    "alerta": "#A75A07",
    "erro": "#C62828",
    "foco": "#0F2E4D",
    "texto-sobre-fundo": "#14141A",
    "texto-suave-sobre-fundo": "#3D1520",
    "primaria-sobre-fundo": "#8A1226",
    "primaria-texto-sobre-fundo": "#5C0A18",
    "tinta": "#14141A",
    "acao-sobre-fundo": "#14141A",
    "sobre-acao-sobre-fundo": "#FFFFFF",
    "foco-sobre-fundo": "#0F2E4D"
  },
  "escuro": {
    "fundo": "#B03A56",
    "superficie": "#1A0E12",
    "superficie-2": "#3D2C32",
    "borda": "#1A0E12",
    "borda-campo": "#75716B",
    "divisoria": "#75716B",
    "texto": "#F7F3F4",
    "texto-suave": "#C9BDC1",
    "primaria": "#FF7085",
    "primaria-texto": "#FF8A9B",
    "sobre-primaria": "#1A0E12",
    "primaria-suave": "#3A1620",
    "secundaria": "#84AED3",
    "sobre-secundaria": "#1A1918",
    "secundaria-suave": "#16283A",
    "sucesso": "#4ADE80",
    "alerta": "#FBBF24",
    "erro": "#F87171",
    "foco": "#FFFFFF",
    "texto-sobre-fundo": "#FFFFFF",
    "texto-suave-sobre-fundo": "#FFF0F3",
    "primaria-sobre-fundo": "#FFD6DE",
    "primaria-texto-sobre-fundo": "#FFE3E9",
    "tinta": "#1A0E12",
    "acao-sobre-fundo": "#1A0E12",
    "sobre-acao-sobre-fundo": "#FFFFFF",
    "foco-sobre-fundo": "#FFFFFF"
  }
} as const;

export const espaco = {
  "0": 0,
  "1": 4,
  "2": 8,
  "3": 12,
  "4": 16,
  "5": 20,
  "6": 24,
  "8": 32,
  "10": 40,
  "12": 48,
  "16": 64
} as const; // múltiplos de 4 px

export const raio = {
  "pequeno": 8,
  "medio": 12,
  "grande": 16,
  "pilula": 999
} as const;

export const tipografia = {
  familia: 'Inter',
  'titulo-1': { tamanho: 28, alturaLinha: 34, peso: '700' },
  'titulo-2': { tamanho: 22, alturaLinha: 28, peso: '700' },
  'titulo-3': { tamanho: 18, alturaLinha: 24, peso: '600' },
  'corpo': { tamanho: 16, alturaLinha: 24, peso: '400' },
  'corpo-forte': { tamanho: 16, alturaLinha: 24, peso: '600' },
  'rotulo': { tamanho: 14, alturaLinha: 20, peso: '500' },
  'legenda': { tamanho: 12, alturaLinha: 16, peso: '500' },
  'numero-grande': { tamanho: 40, alturaLinha: 44, peso: '700' },
} as const;

// Sombras para React Native (iOS shadow*/Android elevation)
export const sombra = {
  '1': { shadowColor: '#1A1918', shadowOpacity: 0.08, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  '2': { shadowColor: '#1A1918', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  '3': { shadowColor: '#1A1918', shadowOpacity: 0.18, shadowRadius: 32, shadowOffset: { width: 0, height: 12 }, elevation: 8 },
} as const;

export const toque = { minimo: 44, treino: 56 } as const; // px (dp)
export const grade = { colunas: 4, margem: 16, espacamento: 16, larguraBase: 360 } as const;

// O nome da marca NÃO fica aqui: ver src/config/marca.ts.

/**
 * v0.4.2 (design v2.1): cores de apoio fora dos temas, todas já existentes na paleta v0.3 ou em documento da Lorena.
 * marca = vermelho do logotipo; marca-escuro = primaria-texto claro (fim do degradê dos destaques);
 * energia = alerta escuro (fundo dos selos amarelos); sobre-energia = texto claro; folha = verde das dietas (componentes.md).
 * Pares de contraste conferidos em __tests__/v042-design.test.tsx.
 */
export const apoio = {
  marca: '#E0263F',
  'marca-escuro': '#A3172C',
  energia: '#FBBF24',
  'sobre-energia': '#14141A',
  folha: '#2F855A',
} as const;

/** Cores fixas do botão "Continuar com o Google" (diretrizes de marca do Google: estilos Light e Neutral). */
export const google = {
  light: { fundo: '#FFFFFF', borda: '#747775', texto: '#1F1F1F' },
  neutral: { fundo: '#F2F2F2', borda: '#F2F2F2', texto: '#1F1F1F' },
} as const;
