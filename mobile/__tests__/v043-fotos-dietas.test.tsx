// v0.4.3 – fotos das dietas: uma por dieta, alt, tamanho, lista com selo "Restritiva" e foto no detalhe.
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Alimentacao from '@/app/(abas)/alimentacao';
import DietaTela from '@/app/dieta/[id]';
import { DIETAS } from '@/dominio/dietas';
import { FOTOS_DIETAS } from '@/dominio/fotos-dietas';
import { acoes, estadoInicial, ProvedorEstado } from '@/estado/armazem';
import { apoio, temas } from '@/tema/tokens';
import { contraste } from './contraste.test';

const { statSync, readFileSync } = require('fs') as { statSync: (p: string) => { size: number }; readFileSync: (p: string) => { subarray: (a: number, b: number) => { toString: () => string } } };
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() }, useLocalSearchParams: () => mockParams }));
const router = jest.requireMock('expo-router').router as Record<string, jest.Mock>;
const montar = (ui: React.ReactElement) => render(
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}><ProvedorEstado inicial={acoes.entrar(estadoInicial())}>{ui}</ProvedorEstado></SafeAreaProvider>);

const IDS = ['vegetariana', 'vegana', 'mediterranea', 'paleo', 'cetogenica', 'low-carb', 'jejum-intermitente', 'atkins'] as const;

describe('arquivos', () => {
  it('as 8 dietas pedidas têm foto e todas as dietas do guia estão cobertas', () => {
    expect(Object.keys(FOTOS_DIETAS).sort()).toEqual([...IDS].sort());
    for (const d of DIETAS) expect(FOTOS_DIETAS[d.id]).toBeTruthy();
  });
  it.each(IDS)('%s: WebP de até 80 KB (foto e miniatura)', (id) => {
    for (const f of [`assets/dietas/${id}.webp`, `assets/dietas/${id}_mini.webp`]) {
      expect(statSync(f).size).toBeLessThanOrEqual(80 * 1024);
      expect(readFileSync(f).subarray(8, 12).toString()).toBe('WEBP');
    }
  });
  it.each(IDS)('%s: texto alternativo descritivo, começando por "Foto de"', (id) => {
    expect(FOTOS_DIETAS[id].alt).toMatch(/^Foto de .{20,}/);
  });
});

describe('telas', () => {
  beforeEach(() => { jest.clearAllMocks(); mockParams = {}; });
  it('lista: um cartão com foto por dieta e o selo "Restritiva" nas que têm alerta', async () => {
    await montar(<Alimentacao />);
    expect(await screen.findAllByTestId(/^cartao-dieta-/)).toHaveLength(DIETAS.length);
    for (const d of DIETAS) expect(screen.getByLabelText(FOTOS_DIETAS[d.id].alt)).toBeTruthy();
    expect(screen.getAllByText('RESTRITIVA · LEIA OS ALERTAS')).toHaveLength(DIETAS.filter((d) => d.alerta).length);
  });
  it('tocar no cartão abre o detalhe', async () => {
    await montar(<Alimentacao />);
    await fireEvent.press(await screen.findByTestId('cartao-dieta-paleo'));
    expect(router.push).toHaveBeenCalledWith('/dieta/paleo');
  });
  it('detalhe: foto grande no topo, como imagem com descrição', async () => {
    mockParams = { id: 'jejum-intermitente' };
    await montar(<DietaTela />);
    const f = await screen.findByTestId('foto-dieta');
    expect(f.props.accessibilityRole).toBe('image');
    expect(f.props.accessibilityLabel).toBe(FOTOS_DIETAS['jejum-intermitente'].alt);
    // RedBox entrega o topo em 16:9 (1280×720).
    expect([f.props.style].flat(5).reduce((x: object, y: object) => ({ ...x, ...(y || {}) }), {}).aspectRatio).toBeCloseTo(16 / 9);
  });
});

describe.each(['claro', 'escuro'] as const)('contraste do selo "Restritiva" (%s)', (t) => {
  // O selo usa energia (amarelo) com texto sobre-energia e borda no tom do texto, igual nos dois temas.
  it('texto sobre-energia × energia ≥ 4,5:1', () => {
    expect(contraste(apoio['sobre-energia'], apoio.energia)).toBeGreaterThanOrEqual(4.5);
  });
  it('borda do selo (texto) × superficie do cartão ≥ 3:1', () => {
    expect(contraste(temas[t].texto, temas[t].superficie)).toBeGreaterThanOrEqual(3);
  });
});
