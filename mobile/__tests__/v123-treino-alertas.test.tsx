// v0.12.3 – alerta do descanso em qualquer tela, "Treino concluído" na última série e excluir treino feito.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import { Vibration } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Treino from '@/app/treino';
import Resumo from '@/app/resumo/[id]';
import { VigiaDescanso } from '@/componentes/vigia-descanso';
import { BIBLIOTECA } from '@/dominio/biblioteca';
import { acoes, estadoInicial, ProvedorEstado, useEstado, type Estado } from '@/estado/armazem';
import { definirDescanso, lerDescanso } from '@/estado/descanso-atual';

let mockCaminho = '/treino';
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), navigate: jest.fn(), back: jest.fn(), canGoBack: () => false }, usePathname: () => mockCaminho, useLocalSearchParams: () => mockParams }));
const router = jest.requireMock('expo-router').router as Record<string, jest.Mock>;
afterEach(async () => { await cleanup(); jest.clearAllMocks(); mockCaminho = '/treino'; mockParams = {}; });

let ultimo: Estado;
function Espiao() { ultimo = useEstado().estado; return null; } // eslint-disable-line react-hooks/globals
const montar = (ui: React.ReactElement, e: Estado) => render(
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}><ProvedorEstado inicial={e}>{ui}<Espiao /></ProvedorEstado></SafeAreaProvider>);
const EX = BIBLIOTECA.find((x) => x.categoria !== 'cardio')!.id;
function comTreino(series: number): Estado {
  let e = acoes.definirConsentimento(acoes.entrar(estadoInicial()), 'dados_saude', true);
  e = acoes.salvarRotina(e, { id: 'r', nome: 'Treino QA', ordem: 1, atualizadoEm: '', itens: [{ id: 'i', exercicioId: EX, ordem: 1, seriesAlvo: series, repsAlvo: 8, descansoS: 60 }] });
  e = acoes.iniciarSessao(e, { id: 'ses', rotinaId: 'r', iniciadaEm: new Date(Date.now() - 600000).toISOString(), finalizadaEm: null, notas: null, atualizadoEm: '' });
  return { ...e, permissaoNotificacao: 'negada' };
}

describe('alerta do descanso fora da tela do treino', () => {
  it('em outra tela: faixa com o tempo, e no zero vibra e leva de volta ao treino', async () => {
    const vib = jest.spyOn(Vibration, 'vibrate').mockImplementation(() => {});
    jest.useFakeTimers({ now: new Date('2026-11-06T12:00:00Z') });
    try {
      mockCaminho = '/inicio';
      definirDescanso({ fim: Date.now() + 5000, exercicio: 'Supino' });
      await montar(<VigiaDescanso />, comTreino(3));
      await act(async () => { jest.advanceTimersByTime(1000); });
      expect(screen.getByText(/Descanso 0:0/)).toBeTruthy();
      expect(vib).not.toHaveBeenCalled();
      await act(async () => { jest.advanceTimersByTime(5000); });
      expect(vib).toHaveBeenCalledWith([0, 400, 200, 400]);
      expect(screen.getByText(/Acabou o descanso/)).toBeTruthy();
      await fireEvent.press(screen.getByTestId('faixa-descanso'));
      expect(router.push).toHaveBeenCalledWith('/treino');
    } finally { jest.useRealTimers(); vib.mockRestore(); }
  });
  it('sem treino em andamento, o descanso antigo é esquecido (nada de faixa)', async () => {
    mockCaminho = '/inicio';
    definirDescanso({ fim: Date.now() + 5000, exercicio: 'Supino' });
    const e = comTreino(3);
    await montar(<VigiaDescanso />, { ...e, sessoes: [] });
    expect(screen.queryByTestId('faixa-descanso')).toBeNull();
    expect(lerDescanso()).toBeNull();
  });
});

describe('treino concluído e excluir', () => {
  it('na última série (todos verdes): "Treino concluído!", sem descanso, com o alerta de fim', async () => {
    const vib = jest.spyOn(Vibration, 'vibrate').mockImplementation(() => {});
    await montar(<Treino />, comTreino(2));
    await fireEvent.press(screen.getByTestId('concluir-proxima'));
    expect(screen.getByText('DESCANSO')).toBeTruthy();
    expect(screen.queryByTestId('todas-feitas')).toBeNull();
    await fireEvent.press(screen.getByTestId('concluir-proxima'));
    expect(screen.getByTestId('todas-feitas')).toBeTruthy();
    expect(screen.queryByText('DESCANSO')).toBeNull();
    expect(vib).toHaveBeenCalledWith([0, 200, 100, 200, 100, 500]);
    vib.mockRestore();
  });
  it('finalizar sem nenhuma série oferece descartar (não vira "treino feito")', async () => {
    await montar(<Treino />, comTreino(3));
    await fireEvent.press(screen.getByTestId('finalizar'));
    expect(screen.getByText('Nenhuma série marcada. Descartar este treino?')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('confirmar-descartar'));
    expect(ultimo.sessoes.find((s) => s.id === 'ses')).toBeUndefined();
  });
  it('treino já feito pode ser excluído pelo resumo (sai do histórico)', async () => {
    let e = comTreino(1);
    e = acoes.salvarSerie(e, { id: 's1', sessaoId: 'ses', exercicioId: EX, ordem: 1, tipo: 'normal', cargaKg: 20, reps: 8, duracaoS: null, rpe: null, concluidaEm: new Date().toISOString(), atualizadoEm: '' });
    e = acoes.salvarSessao(e, { ...e.sessoes[0], finalizadaEm: new Date().toISOString() });
    mockParams = { id: 'ses' };
    await montar(<Resumo />, e);
    await fireEvent.press(screen.getByTestId('excluir-sessao'));
    await fireEvent.press(screen.getByTestId('confirmar-excluir-sessao'));
    expect(ultimo.sessoes.find((s) => s.id === 'ses')).toBeUndefined();
    expect(ultimo.series.find((s) => s.sessaoId === 'ses')).toBeUndefined();
    expect(router.replace).toHaveBeenCalledWith('/inicio');
  });
});
