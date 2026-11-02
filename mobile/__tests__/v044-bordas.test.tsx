// Tokens borda-campo (contorno de campo, WCAG 1.4.11 ≥ 3:1) e divisoria (só decorativa).
import { render, screen } from '@testing-library/react-native';

import { Dimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Campo, Tela } from '@/componentes/ui';
import { estadoInicial, ProvedorEstado } from '@/estado/armazem';
import { ProvedorSobreFundo } from '@/tema/tema';
import { temas } from '@/tema/tokens';
import { contraste } from './contraste.test';

describe.each(['claro', 'escuro'] as const)('tema %s', (t) => {
  it('borda-campo ≥ 3:1 contra a superfície (campo dentro de bloco); sobre o rosa o campo usa tinta (≥ 3:1)', () => {
    expect(temas[t]['borda-campo']).toBe('#75716B');
    expect(contraste(temas[t]['borda-campo'], temas[t].superficie)).toBeGreaterThanOrEqual(3);
    // v3.2: contra o rosa #75716B não chega a 3:1 no claro (2,42); por isso, direto no fundo, o contorno é tinta.
    expect(contraste(temas[t].tinta, temas[t].fundo)).toBeGreaterThanOrEqual(3);
  });
  it('divisoria: #DED8DA no claro e #75716B no escuro', () => {
    expect(temas[t].divisoria).toBe(t === 'claro' ? '#DED8DA' : '#75716B');
  });
});

it('Campo usa borda-campo no contorno (sem foco e sem erro) dentro de bloco', async () => {
  await render(<Campo rotulo="Nome" value="" onChangeText={() => {}} testID="c" />);
  const st = [screen.getByTestId('c').props.style].flat(9).reduce((a: object, b: object) => ({ ...a, ...(b || {}) }), {}) as Record<string, string>;
  expect(st.borderColor).toBe('#75716B');
});

it('Campo direto sobre o rosa (dentro de Tela) usa tinta no contorno', async () => {
  await render(<ProvedorSobreFundo><Campo rotulo="Nome" value="" onChangeText={() => {}} testID="c" /></ProvedorSobreFundo>);
  const st = [screen.getByTestId('c').props.style].flat(9).reduce((a: object, b: object) => ({ ...a, ...(b || {}) }), {}) as Record<string, string>;
  expect(st.borderColor).toBe(temas.claro.tinta);
});

describe('topo v3.2', () => {
  it('título do topo quebra linha (sem numberOfLines) e usa 1,25rem até 400 px', async () => {
    Dimensions.set({ window: { width: 360, height: 800, scale: 2, fontScale: 1 }, screen: { width: 360, height: 800, scale: 2, fontScale: 1 } });
    await render(<SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}><ProvedorEstado inicial={estadoInicial()}><Tela titulo="Alimentação e um título bem comprido"><></></Tela></ProvedorEstado></SafeAreaProvider>);
    const h = screen.getByTestId('titulo-topo');
    expect(h.props.numberOfLines).toBeUndefined();
    const st = [h.props.style].flat(9).reduce((a: object, b: object) => ({ ...a, ...(b || {}) }), {}) as Record<string, number>;
    expect(st.fontSize).toBe(20);
  });
});
