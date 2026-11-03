// v0.8.2 – descartar o treino em andamento (começou o treino errado).
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Treino from '@/app/treino';
import { BIBLIOTECA } from '@/dominio/biblioteca';
import { acoes, estadoInicial, ProvedorEstado, useEstado, type Estado } from '@/estado/armazem';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), navigate: jest.fn(), back: jest.fn(), canGoBack: () => false } }));
const router = jest.requireMock('expo-router').router as Record<string, jest.Mock>;
afterEach(async () => { await cleanup(); jest.clearAllMocks(); });

let ultimo: Estado;
function Espiao() { ultimo = useEstado().estado; return null; }
function estado(): Estado {
  let e = acoes.definirConsentimento(acoes.entrar(estadoInicial()), 'dados_saude', true);
  e = acoes.salvarRotina(e, { id: 'r', nome: 'Treino errado', ordem: 1, atualizadoEm: '', itens: [{ id: 'i', exercicioId: BIBLIOTECA[0].id, ordem: 1, seriesAlvo: 3, repsAlvo: 8, descansoS: 90 }] });
  // um treino antigo, finalizado, que não pode ser afetado
  e = acoes.iniciarSessao(e, { id: 'velha', rotinaId: 'r', iniciadaEm: '2026-10-01T10:00:00Z', finalizadaEm: '2026-10-01T11:00:00Z', notas: null, atualizadoEm: '' });
  e = acoes.salvarSerie(e, { id: 's-velha', sessaoId: 'velha', exercicioId: BIBLIOTECA[0].id, ordem: 1, tipo: 'normal', cargaKg: 20, reps: 8, duracaoS: null, rpe: null, concluidaEm: '2026-10-01T10:10:00Z', atualizadoEm: '' });
  e = acoes.iniciarSessao(e, { id: 'ses', rotinaId: 'r', iniciadaEm: new Date().toISOString(), finalizadaEm: null, notas: null, atualizadoEm: '' });
  e = acoes.salvarSerie(e, { id: 's1', sessaoId: 'ses', exercicioId: BIBLIOTECA[0].id, ordem: 1, tipo: 'normal', cargaKg: 30, reps: 8, duracaoS: null, rpe: null, concluidaEm: new Date().toISOString(), atualizadoEm: '' });
  return { ...e, permissaoNotificacao: 'negada' };
}

describe('descartar treino', () => {
  it('a ação apaga a sessão em andamento e as séries dela, e manda a exclusão para a fila', () => {
    const e = acoes.descartarSessao(estado(), 'ses');
    expect(e.sessoes.map((s) => s.id)).toEqual(['velha']);
    expect(e.series.map((s) => s.id)).toEqual(['s-velha']);
    const excl = e.fila.filter((f) => (f.registro as { excluidoEm?: string }).excluidoEm);
    expect(excl.map((f) => f.tabela).sort()).toEqual(['series', 'sessoes_treino']);
  });
  it('não descarta treino já finalizado', () => {
    const e0 = estado();
    expect(acoes.descartarSessao(e0, 'velha')).toBe(e0);
  });
  it('na tela: pede confirmação, descarta e leva para Meus treinos; depois dá para começar outro', async () => {
    await render(<SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}><ProvedorEstado inicial={estado()}><Treino /><Espiao /></ProvedorEstado></SafeAreaProvider>);
    await fireEvent.press(screen.getByTestId('descartar-treino'));
    expect(screen.getByText('Descartar este treino?')).toBeTruthy();
    expect(screen.getByText(/A série registrada nele será apagada/)).toBeTruthy();
    await fireEvent.press(screen.getByText('Voltar ao treino'));
    expect(ultimo.sessoes.some((s) => s.id === 'ses')).toBe(true);
    await fireEvent.press(screen.getByTestId('descartar-treino'));
    await fireEvent.press(screen.getByTestId('confirmar-descartar'));
    expect(ultimo.sessoes.some((s) => s.id === 'ses')).toBe(false);
    expect(router.replace).toHaveBeenCalledWith('/treinos?secao=meus');
    expect(() => acoes.iniciarSessao(ultimo, { id: 'nova', rotinaId: 'r', iniciadaEm: new Date().toISOString(), finalizadaEm: null, notas: null, atualizadoEm: '' })).not.toThrow();
  });
});
