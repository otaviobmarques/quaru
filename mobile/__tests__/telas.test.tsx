import { render, screen, fireEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Inicio from '@/app/(abas)/inicio';
import Sobre from '@/app/sobre';
import { acoes, estadoInicial, ProvedorEstado } from '@/estado/armazem';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => false } }));
const { router } = jest.requireMock('expo-router');

const comEstado = async (ui: React.ReactElement, e = estadoInicial()) =>
  await render(<SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}><ProvedorEstado inicial={e}>{ui}</ProvedorEstado></SafeAreaProvider>);

describe('telas', () => {
  it('Início sem rotinas mostra estado vazio e leva a criar rotina', async () => {
    await comEstado(<Inicio />);
    expect(await screen.findByText('Você ainda não tem rotinas')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('criar-rotina'));
    expect(router.push).toHaveBeenCalledWith('/rotina/nova');
  });
  it('Início com rotinas sugere a próxima e mostra o selo de EXEMPLO', async () => {
    const e = acoes.carregarExemplo(acoes.consentir(acoes.entrar(estadoInicial(), 'a@exemplo.test'), { dadosSaude: true, iaVisaoEua: false }));
    await comEstado(<Inicio />, e);
    expect(await screen.findByText(/TREINO DE HOJE/)).toBeTruthy();
    expect(screen.getByTestId('selo-simulacao').props.accessibilityLabel).toMatch(/dados de EXEMPLO/);
  });
  it('Sobre mostra o aviso MIT do MuscleMap', async () => {
    await comEstado(<Sobre />);
    expect(await screen.findByText(/Melih Colpan/)).toBeTruthy();
  });
});
