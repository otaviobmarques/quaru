// v0.4.1: pares novos das ilustrações e componentes (≥ 3:1, WCAG 1.4.11) e do texto (≥ 4,5:1).
import { temas } from '@/tema/tokens';
import { contraste } from './contraste.test';

const COMPONENTE: [string, string][] = [
  ['primaria', 'superficie-2'], // mapa muscular: área trabalhada × não trabalhada
  ['secundaria', 'superficie-2'], // barra de água: preenchido × trilho
  ['texto-suave', 'superficie-2'], // contorno do trilho da água e do corpo
  ['primaria', 'primaria-suave'], // ícone de objetivo selecionado × fundo
  ['primaria-texto', 'primaria-suave'], // ícone de objetivo não selecionado
  ['texto-suave', 'fundo'], // pontos de passo da apresentação
];
describe.each(['claro', 'escuro'] as const)('contraste v0.4.1 (%s)', (t) => {
  it.each(COMPONENTE)('%s sobre %s ≥ 3:1', (a, b) => {
    const c = temas[t] as Record<string, string>;
    expect(contraste(c[a], c[b])).toBeGreaterThanOrEqual(3);
  });
  it('número do "Comece aqui" (primaria-texto sobre primaria-suave) ≥ 4,5:1', () => {
    expect(contraste(temas[t]['primaria-texto'], temas[t]['primaria-suave'])).toBeGreaterThanOrEqual(4.5);
  });
});
