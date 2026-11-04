// QA v0.1 – tela de treino: timer de descanso x notificação; acessibilidade básica.
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';
afterEach(async () => { await cleanup(); });
import * as N from 'expo-notifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Treino from '@/app/treino';
import { acoes, estadoInicial, type Estado } from '@/estado/armazem';
import { ProvedorEstado } from '@/estado/armazem';
import { BIBLIOTECA } from '@/dominio/biblioteca';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => false } }));
const agendar = N.scheduleNotificationAsync as jest.Mock;

function estado(permissao: Estado['permissaoNotificacao']): Estado {
  let e = acoes.definirConsentimento(acoes.entrar(estadoInicial()), 'dados_saude', true);
  e = acoes.definirDescanso(e, { modo: 'auto' }); // v0.11: estes testes usam o descanso da rotina (modo Automático)
  e = acoes.salvarRotina(e, { id: 'r', nome: 'Treino QA', ordem: 1, atualizadoEm: '', itens: [{ id: 'i', exercicioId: BIBLIOTECA[0].id, ordem: 1, seriesAlvo: 2, repsAlvo: 8, descansoS: 90 }] });
  e = acoes.iniciarSessao(e, { id: 'ses', rotinaId: 'r', iniciadaEm: new Date().toISOString(), finalizadaEm: null, notas: null, atualizadoEm: '' });
  return { ...e, permissaoNotificacao: permissao };
}
const montar = (e: Estado) => render(<SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}><ProvedorEstado inicial={e}><Treino /></ProvedorEstado></SafeAreaProvider>);

async function concluirPrimeira() {
  await fireEvent.changeText(screen.getByLabelText('Carga em kg, série 1'), '50');
  await fireEvent.press(screen.getByTestId('concluir-1'));
}

describe('tela de treino – descanso', () => {
  beforeEach(() => jest.clearAllMocks());
  it('permissão concedida: concluir série agenda notificação com o descanso da rotina (90 s)', async () => {
    await montar(estado('concedida'));
    await concluirPrimeira();
    expect(agendar).toHaveBeenCalledTimes(1);
    expect(agendar.mock.calls[0][0].trigger.seconds).toBe(90);
  });
  it('permissão negada: não agenda, mas o timer aparece dentro do app', async () => {
    await montar(estado('negada'));
    await concluirPrimeira();
    expect(agendar).not.toHaveBeenCalled();
    expect(screen.getByText('DESCANSO')).toBeTruthy();
  });
  it('primeiro uso: mostra explicação antes de pedir permissão ao sistema', async () => {
    await montar(estado('nao_pedida'));
    await concluirPrimeira();
    expect(screen.getByText('Avisar quando o descanso acabar?')).toBeTruthy();
    expect(N.requestPermissionsAsync).not.toHaveBeenCalled();
  });
  it('BUG-14 (corrigido): ao ativar avisos no primeiro uso, o descanso em curso deveria ser agendado', async () => {
    await montar(estado('nao_pedida'));
    await concluirPrimeira();
    await fireEvent.press(screen.getByText('Ativar avisos'));
    expect(agendar).toHaveBeenCalledTimes(1);
  });
  it('BUG-01 (corrigido): "+15 s" deveria reagendar a notificação para 105 s (L5: alterar o tempo reagenda)', async () => {
    await montar(estado('concedida'));
    await concluirPrimeira();
    await fireEvent.press(screen.getByText('+15 s'));
    expect(agendar).toHaveBeenCalledTimes(2);
    expect(agendar.mock.calls[1][0].trigger.seconds).toBe(105);
  });
  it('"Pular descanso" cancela a notificação agendada', async () => {
    await montar(estado('concedida'));
    await concluirPrimeira();
    await fireEvent.press(screen.getByText('Pular descanso'));
    expect(N.cancelScheduledNotificationAsync).toHaveBeenCalled();
  });
});

describe('tela de treino – acessibilidade', () => {
  it('campos e botões de série têm rótulo acessível', async () => {
    await montar(estado('negada'));
    expect(screen.getByLabelText('Carga em kg, série 1')).toBeTruthy();
    expect(screen.getByLabelText('Repetições, série 1')).toBeTruthy();
    expect(screen.getByLabelText('Concluir série 1')).toBeTruthy();
    expect(screen.getByLabelText('Voltar')).toBeTruthy();
  });
});
