// v0.11 – descanso padrão de 60 s, alerta de fim do treino e cardio (sugestão e exercícios por tempo).
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import * as N from 'expo-notifications';
import { Vibration } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Treino from '@/app/treino';
import Resumo from '@/app/resumo/[id]';
import TreinoDoDia from '@/app/treino-do-dia';
import { BIBLIOTECA } from '@/dominio/biblioteca';
import { DURACAO_PADRAO_CARDIO_S, formatarDuracao, gerarCardio, lerMinutos } from '@/dominio/cardio';
import { descansoDaSerie, tempoEstimadoTreino } from '@/dominio/descanso';
import { comoItensRotina } from '@/dominio/treino-do-dia';
import { acoes, estadoInicial, ProvedorEstado, useEstado, type Estado } from '@/estado/armazem';

let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), navigate: jest.fn(), back: jest.fn(), canGoBack: () => false }, useLocalSearchParams: () => mockParams }));
const router = jest.requireMock('expo-router').router as Record<string, jest.Mock>;
const agendar = N.scheduleNotificationAsync as jest.Mock;
afterEach(async () => { await cleanup(); jest.clearAllMocks(); mockParams = {}; });

let ultimo: Estado;
function Espiao() { ultimo = useEstado().estado; return null; }
const montar = (ui: React.ReactElement, e: Estado) => render(
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}><ProvedorEstado inicial={e}>{ui}<Espiao /></ProvedorEstado></SafeAreaProvider>);
const EX = BIBLIOTECA.find((x) => x.categoria !== 'cardio')!.id;
const ESTEIRA = '6e846730-b6f9-5b3f-a847-e231f6aa4cd4';
function comTreino(itens: Estado['rotinas'][number]['itens'], origem?: 'treinador'): Estado {
  let e = acoes.definirConsentimento(acoes.entrar(estadoInicial()), 'dados_saude', true);
  e = acoes.salvarRotina(e, { id: 'r', nome: 'Treino QA', ordem: 1, atualizadoEm: '', itens, ...(origem ? { origem } : {}) });
  e = acoes.iniciarSessao(e, { id: 'ses', rotinaId: 'r', iniciadaEm: new Date(Date.now() - 1800000).toISOString(), finalizadaEm: null, notas: null, atualizadoEm: '' });
  return { ...e, permissaoNotificacao: 'concedida' };
}
const forca = [{ id: 'i', exercicioId: EX, ordem: 1, seriesAlvo: 3, repsAlvo: 8, descansoS: 90 }];

describe('descanso entre séries', () => {
  it('padrão de 60 s; "Automático" usa o calculado; treino do treinador usa o dele', () => {
    expect(descansoDaSerie(null, { descansoS: 90 }, null, null, false)).toBe(60);
    expect(descansoDaSerie({ modo: 'fixo', segundos: 120 }, { descansoS: 90 }, null, null, false)).toBe(120);
    expect(descansoDaSerie({ modo: 'auto' }, { descansoS: 90 }, null, null, false)).toBe(90);
    expect(descansoDaSerie(null, { descansoS: 150 }, null, null, true)).toBe(150);
  });
  it('na tela: concluir a série começa 60 s; "Mudar" para 90 s vale na próxima série', async () => {
    await montar(<Treino />, comTreino(forca));
    expect(screen.getByText('⏱ Descanso entre séries: 1 min')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Carga em kg, série 1'), '50');
    await fireEvent.press(screen.getByTestId('concluir-1'));
    expect(agendar.mock.calls[0][0].trigger.seconds).toBe(60);
    await fireEvent.press(screen.getByTestId('mudar-descanso'));
    await fireEvent.press(screen.getByText('1 min 30 s'));
    expect(ultimo.perfil?.descanso).toEqual({ modo: 'fixo', segundos: 90 });
    await fireEvent.changeText(screen.getByLabelText('Carga em kg, série 2'), '50');
    await fireEvent.press(screen.getByTestId('concluir-2'));
    expect(agendar.mock.calls.at(-1)[0].trigger.seconds).toBe(90);
  });
});

describe('fim do treino', () => {
  it('finalizar vibra com o alerta de concluído e abre o resumo com a comemoração', async () => {
    const vib = jest.spyOn(Vibration, 'vibrate').mockImplementation(() => {});
    await montar(<Treino />, comTreino(forca));
    // v0.12.3: sem nenhuma série marcada, Finalizar oferece descartar; com uma série, finaliza.
    await fireEvent.press(screen.getByTestId('finalizar'));
    expect(screen.getByTestId('confirmar-descartar')).toBeTruthy();
    await fireEvent.press(screen.getByText('Voltar ao treino'));
    await fireEvent.press(screen.getByTestId('concluir-proxima'));
    await fireEvent.press(screen.getByTestId('finalizar'));
    await fireEvent.press(screen.getByTestId('confirmar-finalizar'));
    expect(vib).toHaveBeenCalledWith([0, 200, 100, 200, 100, 500]);
    expect(router.replace).toHaveBeenCalledWith('/resumo/ses?concluido=1');
    mockParams = { id: 'ses', concluido: '1' };
    await cleanup();
    await montar(<Resumo />, ultimo);
    expect(screen.getByTestId('treino-concluido')).toBeTruthy();
    expect(screen.getByText(/Treino concluído/)).toBeTruthy();
    vib.mockRestore();
  });
});

describe('cardio', () => {
  it('lê e mostra o tempo', () => {
    expect(lerMinutos('20')).toBe(1200);
    expect(lerMinutos('0,5')).toBe(30);
    expect(lerMinutos('1:30')).toBe(90);
    expect(lerMinutos('abc')).toBeNull();
    expect(lerMinutos('0')).toBeNull();
    expect(formatarDuracao(1200)).toBe('20 min');
    expect(formatarDuracao(90)).toBe('1:30');
    expect(formatarDuracao(30)).toBe('30 s');
  });
  it('iniciante: contínuo com aquecimento e volta à calma, no tempo da pessoa', () => {
    const c = gerarCardio({ tempoMin: 30 });
    expect(c.titulo).toBe('Cardio do dia · Contínuo');
    expect(c.itens.map((i) => i.papel)).toEqual([expect.stringMatching(/Aquecimento/), expect.stringMatching(/conversar.*volta à calma/)]);
    expect(c.minutos).toBe(30);
    expect(tempoEstimadoTreino(comoItensRotina(c.itens))).toBe(30);
  });
  it('intermediário alterna intervalado e contínuo; joelho tira corrida e saltos; em casa vira circuito', () => {
    const t = { objetivo: 'condicionamento', nivel: 'intermediario', dias: 4 } as never;
    const a = gerarCardio({ treino: t, tempoMin: 30, variacao: 0 });
    expect(a.titulo).toBe('Cardio do dia · Intervalado');
    expect(a.itens[1].seriesAlvo).toBeGreaterThanOrEqual(4);
    expect(gerarCardio({ treino: t, tempoMin: 30, variacao: 1 }).titulo).toBe('Cardio do dia · Contínuo');
    for (let v = 0; v < 6; v++) {
      const j = gerarCardio({ treino: t, tempoMin: 45, variacao: v, restricoes: ['joelho'] });
      expect(j.itens.map((i) => i.nome).join(' ')).not.toMatch(/Corrida|Trote|Pular|Skipping|Salto|Calcanhar|Escalador/);
    }
    const casa = gerarCardio({ treino: t, tempoMin: 30, variacao: 0, tem: ['peso-corpo'] });
    expect(casa.itens).toHaveLength(3);
    expect(casa.itens[1].duracaoS).toBe(30);
    expect(gerarCardio({ tempoMin: 30, tem: ['peso-corpo'] }).itens).toEqual([expect.objectContaining({ nome: 'Caminhada', duracaoS: 1800 })]);
  });
  it('nunca repete o mesmo exercício (a tela do treino junta os iguais)', () => {
    for (const nivel of ['iniciante', 'intermediario', 'avancado']) for (const tem of [null, ['peso-corpo']]) for (const r of [[], ['joelho'], ['coluna'], ['ombro'], ['joelho', 'coluna']]) for (let v = 0; v < 4; v++) {
      const c = gerarCardio({ treino: { objetivo: 'saude', nivel, dias: 3 } as never, tem: tem as never, tempoMin: 45, restricoes: r as never, variacao: v });
      expect(new Set(c.itens.map((i) => i.exercicioId)).size).toBe(c.itens.length);
      expect(c.minutos).toBeGreaterThanOrEqual(20);
    }
  });
  it('tela do Treino do dia: Cardio mostra o plano por tempo', async () => {
    await montar(<TreinoDoDia />, comTreino([]));
    await fireEvent.press(screen.getByText('Cardio'));
    expect(screen.getByText('Cardio Contínuo')).toBeTruthy();
    expect(screen.getAllByText(/Aquecimento · ritmo leve/).length).toBeGreaterThan(0);
  });
  it('no treino: bloco por tempo com cronômetro; no fim registra o tempo e começa a recuperação', async () => {
    jest.useFakeTimers({ now: new Date('2026-11-04T12:00:00Z') });
    try {
      await montar(<Treino />, comTreino([{ id: 'c', exercicioId: ESTEIRA, ordem: 1, seriesAlvo: 2, repsAlvo: null, descansoS: 45, duracaoAlvoS: 120 }]));
      expect(screen.getAllByLabelText(/Tempo em minutos, bloco/)).toHaveLength(2);
      await fireEvent.press(screen.getByTestId(`cronometrar-${ESTEIRA}-1`));
      expect(screen.getByText(/CARDIO ·/)).toBeTruthy();
      expect(agendar.mock.calls.at(-1)[0].trigger.seconds).toBe(120);
      await act(async () => { jest.advanceTimersByTime(121_000); });
      await act(async () => { jest.advanceTimersByTime(500); });
      expect(ultimo.series.find((s) => s.sessaoId === 'ses')).toMatchObject({ duracaoS: 120, cargaKg: null, reps: null });
      expect(screen.getByText('RECUPERAÇÃO · RITMO LEVE')).toBeTruthy();
      expect(agendar.mock.calls.at(-1)[0].trigger.seconds).toBe(45);
    } finally { jest.useRealTimers(); }
  });
  it('cardio sem duração definida usa 10 min', () => {
    expect(DURACAO_PADRAO_CARDIO_S).toBe(600);
  });
});
