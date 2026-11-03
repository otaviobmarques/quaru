// v0.7 – "Treino" no lugar de "Rotina", começar pelo Meus treinos e pelo editor, card Hoje com tempo e descanso calculado.
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Inicio from '@/app/(abas)/inicio';
import Treinos from '@/app/(abas)/treinos';
import EditarRotina from '@/app/rotina/[id]';
import { acoes, estadoInicial, ProvedorEstado, useEstado, type Estado } from '@/estado/armazem';

let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({ router: { navigate: jest.fn(), push: jest.fn(), replace: jest.fn(), back: jest.fn() }, useLocalSearchParams: () => mockParams }));
const router = jest.requireMock('expo-router').router as Record<string, jest.Mock>;

const comExemplo = () => acoes.carregarExemplo(acoes.consentir(acoes.entrar(estadoInicial()), { dadosSaude: true }));
let ultimo: Estado;
function Espiao() { ultimo = useEstado().estado; return null; }
const montar = (ui: React.ReactElement, e: Estado) => render(
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
    <ProvedorEstado inicial={e}>{ui}<Espiao /></ProvedorEstado>
  </SafeAreaProvider>);
beforeEach(() => { jest.clearAllMocks(); mockParams = {}; });

describe('Meus treinos', () => {
  it('cada treino tem Começar e Editar, com exercícios e tempo estimado', async () => {
    const e = comExemplo();
    await montar(<Treinos />, e);
    const r = e.rotinas.filter((x) => !x.excluidoEm)[0];
    expect(await screen.findByTestId(`comecar-${r.id}`)).toBeTruthy();
    expect(screen.getAllByText(/exercícios · ~\d+ min/).length).toBeGreaterThan(0);
    expect(screen.getByText('Próximo da sequência')).toBeTruthy();
    await fireEvent.press(screen.getByTestId(`editar-${r.id}`));
    expect(router.push).toHaveBeenCalledWith(`/rotina/${r.id}`);
  });
  it('Começar inicia o treino e abre a tela de treino', async () => {
    const e = comExemplo();
    const r = e.rotinas.filter((x) => !x.excluidoEm)[1];
    await montar(<Treinos />, e);
    await fireEvent.press(await screen.findByTestId(`comecar-${r.id}`));
    expect(router.push).toHaveBeenCalledWith('/treino');
    expect(ultimo.sessoes.find((s) => !s.finalizadaEm)?.rotinaId).toBe(r.id);
  });
});

describe('editor do treino', () => {
  it('mostra o tempo, recalcula os descansos e começa o treino', async () => {
    const e = comExemplo();
    const r = e.rotinas.filter((x) => !x.excluidoEm)[0];
    mockParams = { id: r.id };
    await montar(<EditarRotina />, e);
    expect(screen.getByText(/tempo estimado ~\d+ min/)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('recalcular-descansos'));
    const depois = ultimo.rotinas.find((x) => x.id === r.id)!;
    expect(depois.itens.every((i) => i.descansoS % 15 === 0 && i.descansoS >= 30 && i.descansoS <= 180)).toBe(true);
    await fireEvent.press(screen.getByTestId('comecar-treino'));
    expect(router.push).toHaveBeenCalledWith('/treino');
  });
});

describe('card Hoje no Início', () => {
  it('nome do treino, quantidade de exercícios, tempo estimado e nomes dos exercícios', async () => {
    await montar(<Inicio />, comExemplo());
    expect(await screen.findByTestId('resumo-hoje')).toBeTruthy();
    expect(screen.getByText(/^\d+ exercícios$/)).toBeTruthy();
    expect(screen.getByText(/Tempo estimado: \d+ min/)).toBeTruthy();
  });
});
