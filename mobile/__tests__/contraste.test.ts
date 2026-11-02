// Paleta Quaru: pares de cor usados nas telas têm contraste WCAG AA (≥ 4,5:1 texto; ≥ 3:1 componentes).
// v0.4.4: tokens v3.2 (fundo rosa) — pares da tabela da RedBox (telas-v3.2/tokens-v3.2.md §3) e cores proibidas (§4).
import { paletaSobreFundo } from '@/tema/tema';
import { temas } from '@/tema/tokens';

const lum = (h: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contraste = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

// Pares dentro de bloco (superfície) — os de antes, sem os que ficavam direto no fundo.
const TEXTO: [string, string][] = [
  ['texto', 'superficie'], ['texto-suave', 'superficie'], ['texto-suave', 'superficie-2'],
  ['sobre-primaria', 'primaria'], ['primaria-texto', 'superficie'], ['primaria-texto', 'primaria-suave'],
  ['sobre-secundaria', 'secundaria'], ['erro', 'superficie'], ['sucesso', 'superficie'], ['alerta', 'superficie'],
  // v3.2 sobre o rosa
  ['texto-sobre-fundo', 'fundo'], ['texto-suave-sobre-fundo', 'fundo'], ['primaria-texto-sobre-fundo', 'fundo'],
  ['sobre-acao-sobre-fundo', 'acao-sobre-fundo'], ['texto', 'fundo'],
];
const COMPONENTE: [string, string][] = [
  ['primaria', 'superficie'], ['foco', 'superficie'], ['texto-suave', 'superficie'], ['borda-campo', 'superficie'],
  ['borda', 'fundo'], ['tinta', 'fundo'], ['acao-sobre-fundo', 'fundo'], ['primaria-sobre-fundo', 'fundo'], ['foco', 'fundo'], ['foco-sobre-fundo', 'fundo'],
];

describe.each(['claro', 'escuro'] as const)('tema %s', (nome) => {
  const t = temas[nome] as Record<string, string>;
  it.each(TEXTO)('texto %s sobre %s ≥ 4,5', (a, b) => expect(contraste(t[a], t[b])).toBeGreaterThanOrEqual(4.5));
  it.each(COMPONENTE)('componente %s sobre %s ≥ 3', (a, b) => expect(contraste(t[a], t[b])).toBeGreaterThanOrEqual(3));
  it('paleta usada dentro de <Tela> (sobre o rosa): todo texto ≥ 4,5 no rosa e na superfície', () => {
    const p = paletaSobreFundo(t as never, nome === 'escuro') as Record<string, string>;
    for (const k of ['texto', 'texto-suave', 'primaria-texto', 'erro', 'sucesso', 'alerta', 'secundaria']) {
      expect(contraste(p[k], t.fundo)).toBeGreaterThanOrEqual(4.5);
      expect(contraste(p[k], t.superficie)).toBeGreaterThanOrEqual(4.5);
    }
    for (const k of ['primaria', 'foco', 'borda-campo', 'divisoria']) expect(contraste(p[k], t.fundo)).toBeGreaterThanOrEqual(3);
    expect(contraste(p['sobre-primaria'], p.primaria)).toBeGreaterThanOrEqual(4.5);
  });
});

const T = (n: 'claro' | 'escuro') => temas[n] as Record<string, string>;
it('7 trocas da v3.2', () => {
  expect([T('claro').fundo, T('claro').borda, T('claro').foco]).toEqual(['#F2A0B0', '#14141A', '#0F2E4D']);
  expect([T('escuro').fundo, T('escuro').superficie, T('escuro').borda, T('escuro').foco]).toEqual(['#B03A56', '#1A0E12', '#1A0E12', '#FFFFFF']);
});
it('8 tokens "-sobre-fundo" nos dois temas, com os valores da tabela', () => {
  expect(['texto-sobre-fundo', 'texto-suave-sobre-fundo', 'primaria-sobre-fundo', 'primaria-texto-sobre-fundo', 'tinta', 'acao-sobre-fundo', 'sobre-acao-sobre-fundo', 'foco-sobre-fundo'].map((k) => [T('claro')[k], T('escuro')[k]]))
    .toEqual([['#14141A', '#FFFFFF'], ['#3D1520', '#FFF0F3'], ['#8A1226', '#FFD6DE'], ['#5C0A18', '#FFE3E9'], ['#14141A', '#1A0E12'], ['#14141A', '#1A0E12'], ['#FFFFFF', '#FFFFFF'], ['#0F2E4D', '#FFFFFF']]);
});
it.each([
  ['claro', '#14141A', 9.11], ['claro', '#3D1520', 7.86], ['claro', '#8A1226', 4.75], ['claro', '#5C0A18', 6.90], ['claro', '#0F2E4D', 6.87],
  ['escuro', '#1A0E12', 3.21], ['escuro', '#FFFFFF', 5.86], ['escuro', '#FFF0F3', 5.30], ['escuro', '#FFD6DE', 4.44], ['escuro', '#FFE3E9', 4.86],
] as const)('tabela §3 (%s): %s sobre o rosa = %s', (n, cor, r) => expect(contraste(cor, T(n).fundo)).toBeCloseTo(r, 2));
it('escuro: primaria-sobre-fundo (4,44) só para ícone, borda e texto grande — não serve para texto normal', () => {
  const r = contraste(T('escuro')['primaria-sobre-fundo'], T('escuro').fundo);
  expect(r).toBeGreaterThanOrEqual(3); expect(r).toBeLessThan(4.5);
  expect(paletaSobreFundo(T('escuro') as never, true)['primaria-texto']).toBe('#FFE3E9');
});
it.each(['erro', 'sucesso', 'alerta', 'secundaria', 'primaria', 'primaria-texto', 'texto-suave'])('proibida sobre o rosa (§4): %s < 4,5 nos dois temas; dentro de <Tela> é trocada', (k) => {
  for (const n of ['claro', 'escuro'] as const) {
    expect(contraste(T(n)[k], T(n).fundo)).toBeLessThan(4.5);
    expect((paletaSobreFundo(T(n) as never, n === 'escuro') as Record<string, string>)[k]).not.toBe(T(n)[k]);
  }
});
it('§5: no escuro a borda some dentro do card (1:1); campo e divisória no card usam #75716B (3,88)', () => {
  expect(contraste(T('escuro').borda, T('escuro').superficie)).toBeCloseTo(1, 2);
  expect(contraste('#75716B', T('escuro').superficie)).toBeCloseTo(3.88, 2);
});
it('cores do logotipo: vermelho #E0263F com branco passa AA (4,65)', () => expect(contraste('#E0263F', '#FFFFFF')).toBeGreaterThanOrEqual(4.5));
