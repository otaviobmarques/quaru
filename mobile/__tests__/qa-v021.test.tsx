// QA v0.2.1 (01/11/2026) – reteste da 0.2.1. Dados fictícios. REG-04 era `it.failing`; corrigido na 0.2.2.
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import * as N from 'expo-notifications';
import { Vibration } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Fila from '@/app/fila';
import Treino from '@/app/treino';
import { acoes, estadoInicial, ProvedorEstado, type Estado } from '@/estado/armazem';
import { BIBLIOTECA } from '@/dominio/biblioteca';
import { comportamentoPrimeiroPlano } from '@/servicos/notificacao';
import { nomeVazio } from '@/dominio/validacao';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => false } }));
afterEach(async () => { await cleanup(); jest.clearAllMocks(); });
const quadro = (ui: React.ReactElement, e: Estado) => render(<SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}><ProvedorEstado inicial={e}>{ui}</ProvedorEstado></SafeAreaProvider>);
const base = () => acoes.definirConsentimento(acoes.entrar(estadoInicial()), 'dados_saude', true);
function comTreino(perm: Estado['permissaoNotificacao'] = 'concedida'): Estado {
  let e = acoes.salvarRotina(base(), { id: 'r', nome: 'Treino QA', ordem: 1, atualizadoEm: '', itens: [{ id: 'i', exercicioId: BIBLIOTECA[0].id, ordem: 1, seriesAlvo: 1, repsAlvo: 8, descansoS: 90 }] });
  e = acoes.iniciarSessao(e, { id: 'ses', rotinaId: 'r', iniciadaEm: new Date().toISOString(), finalizadaEm: null, notas: null, atualizadoEm: '' });
  return { ...e, permissaoNotificacao: perm };
}

describe('REG-01 – tela de treino', () => {
  it('1500 kg: mensagem, nada gravado, nenhum descanso nem notificação', async () => {
    await quadro(<Treino />, comTreino());
    await fireEvent.changeText(screen.getByLabelText('Carga em kg, série 1'), '1500');
    await fireEvent.press(screen.getByTestId('concluir-1'));
    expect(screen.getByText('Série não registrada')).toBeTruthy();
    expect(screen.queryByText('DESCANSO')).toBeNull();
    expect(N.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
  it('1000 kg (limite) é aceito', async () => {
    await quadro(<Treino />, comTreino());
    await fireEvent.changeText(screen.getByLabelText('Carga em kg, série 1'), '1000');
    await fireEvent.press(screen.getByTestId('concluir-1'));
    expect(screen.queryByText('Série não registrada')).toBeNull();
    expect(screen.getByText('DESCANSO')).toBeTruthy();
  });
  it('REG-04 (corrigido na 0.2.2): se outra regra recusa a série (consentimento revogado com treino aberto), a tela deveria avisar e não iniciar descanso/notificação', async () => {
    const e = acoes.definirConsentimento(comTreino(), 'dados_saude', false);
    await quadro(<Treino />, e);
    await fireEvent.changeText(screen.getByLabelText('Carga em kg, série 1'), '50');
    await fireEvent.press(screen.getByTestId('concluir-1'));
    expect(N.scheduleNotificationAsync).not.toHaveBeenCalled();
    expect(screen.getByText('Série não registrada')).toBeTruthy();
    expect(screen.getByText(/Consentimentos/)).toBeTruthy(); // mensagem clara
    expect(screen.queryByText('DESCANSO')).toBeNull();       // descanso não começou
    expect(screen.getByTestId('concluir-1')).toBeTruthy();    // série continua pendente
  });
  it('REG-04 (comportamento atual): o estado anterior é mantido (nenhuma série gravada) e a tela não cai', async () => {
    const e = acoes.definirConsentimento(comTreino(), 'dados_saude', false);
    await quadro(<Treino />, e);
    await fireEvent.changeText(screen.getByLabelText('Carga em kg, série 1'), '50');
    await fireEvent.press(screen.getByTestId('concluir-1'));
    expect(screen.getByTestId('concluir-1')).toBeTruthy();
    expect(screen.queryByText(/1 concluída/)).toBeNull();
  });
});

describe('BUG-17 / ADR-0011', () => {
  it('app aberto (rev. 0.3.0): sem banner, lista ou selo; som curto pela via de notificação (respeita o silencioso)', () => {
    expect(comportamentoPrimeiroPlano).toEqual({ shouldShowBanner: false, shouldShowList: false, shouldPlaySound: true, shouldSetBadge: false });
  });
  it('vibra quando o descanso chega a zero (relógio controlado)', async () => {
    const vib = jest.spyOn(Vibration, 'vibrate').mockImplementation(() => {});
    jest.useFakeTimers({ now: new Date('2026-11-01T12:00:00Z') });
    try {
      await quadro(<Treino />, { ...acoes.definirDescanso(comTreino('negada'), { modo: 'auto' }), rotinas: comTreino().rotinas.map((r) => ({ ...r, itens: r.itens.map((i) => ({ ...i, descansoS: 2 })) })) });
      await fireEvent.changeText(screen.getByLabelText('Carga em kg, série 1'), '50');
      await fireEvent.press(screen.getByTestId('concluir-1'));
      expect(vib).not.toHaveBeenCalled();
      const { act } = require('@testing-library/react-native');
      await act(async () => { jest.advanceTimersByTime(3000); });
      expect(vib).toHaveBeenCalledWith([0, 400, 200, 400]);
    } finally { jest.useRealTimers(); vib.mockRestore(); }
  });
});

describe('tela "Itens com erro" (fila.tsx)', () => {
  const comErros = (): Estado => ({ ...base(),
    rotinas: [{ id: 'rl', nome: 'x'.repeat(61), ordem: 1, itens: [], atualizadoEm: '' }],
    fila: [
      { tabela: 'rotinas', registro: { id: 'rl', nome: 'x'.repeat(61), atualizadoEm: '' } as never, erro: 'nome longo' },
      { tabela: 'series', registro: { id: 'sx', atualizadoEm: '' } as never, erro: 'carga inválida' },
      { tabela: 'pesos_corporais', registro: { id: 'ok', atualizadoEm: '' } as never },
    ] });
  it('vazia mostra estado vazio', async () => {
    await quadro(<Fila />, base());
    expect(screen.getByText('Nenhum item com erro')).toBeTruthy();
  });
  it('lista só os itens com erro e mostra o motivo', async () => {
    await quadro(<Fila />, comErros());
    expect(screen.getByText('nome longo')).toBeTruthy();
    expect(screen.getByText('carga inválida')).toBeTruthy();
    expect(screen.getAllByText('Descartar envio')).toHaveLength(2);
  });
  it('corrigir: nome só com espaço de largura zero/NBSP fica desabilitado; nome válido some da lista de erros', async () => {
    await quadro(<Fila />, comErros());
    const campo = screen.getByLabelText(/^Nome corrigido, Treino/);
    await fireEvent.changeText(campo, '\u200b\u00a0');
    expect(screen.getByText(/sem ser só espaços/)).toBeTruthy();
    await fireEvent.changeText(campo, 'Treino A');
    await fireEvent.press(screen.getByText('Salvar correção'));
    expect(screen.queryByText('nome longo')).toBeNull();
    expect(screen.getByText('carga inválida')).toBeTruthy();
  });
  it('descartar pede confirmação; cancelar mantém; confirmar remove', async () => {
    await quadro(<Fila />, comErros());
    await fireEvent.press(screen.getAllByText('Descartar envio')[1]);
    await fireEvent.press(screen.getByText('Cancelar'));
    expect(screen.getByText('carga inválida')).toBeTruthy();
    await fireEvent.press(screen.getAllByText('Descartar envio')[1]);
    await fireEvent.press(screen.getByText('Descartar'));
    expect(screen.queryByText('carga inválida')).toBeNull();
  });
  it('ações de estado: descartar não apaga o dado local; corrigir com nome inválido é recusado', () => {
    const e = comErros();
    expect(acoes.descartarItemFila(e, 'rl').rotinas).toHaveLength(1);
    expect(() => acoes.corrigirNomeItemFila(e, 'rl', '\ufeff')).toThrow('valor_invalido');
    expect(acoes.corrigirNomeItemFila(e, 'rl', '  Treino B  ').rotinas[0].nome).toBe('Treino B');
  });
});

describe('validação de nome (aparelho = banco 0005)', () => {
  it.each(['\u00a0', '\t', '\u3000', '\u200b', '\ufeff', '\u2003\u202f', '\n'])('só espaço %j é vazio', (n) => expect(nomeVazio(n)).toBe(true));
  it('letra entre espaços Unicode não é vazio', () => expect(nomeVazio('\u00a0A\u3000')).toBe(false));
});
