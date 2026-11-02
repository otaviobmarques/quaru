// QA v0.2 (01/11/2026) – regressões após as correções da 0.2.0. Dados fictícios.
// REG-01 era `it.failing`; corrigido na 0.2.1.
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Treino from '@/app/treino';
import { acoes, estadoInicial, ProvedorEstado, type Estado } from '@/estado/armazem';
import { BIBLIOTECA } from '@/dominio/biblioteca';
import { mesclar } from '@/dominio/sincronizacao';
import { treinosCsv } from '@/dominio/exportacao';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => false } }));
afterEach(async () => { await cleanup(); });

function estado(): Estado {
  let e = acoes.definirConsentimento(acoes.entrar(estadoInicial()), 'dados_saude', true);
  e = acoes.salvarRotina(e, { id: 'r', nome: 'Treino QA', ordem: 1, atualizadoEm: '', itens: [{ id: 'i', exercicioId: BIBLIOTECA[0].id, ordem: 1, seriesAlvo: 1, repsAlvo: 8, descansoS: 90 }] });
  e = acoes.iniciarSessao(e, { id: 'ses', rotinaId: 'r', iniciadaEm: new Date().toISOString(), finalizadaEm: null, notas: null, atualizadoEm: '' });
  return { ...e, permissaoNotificacao: 'negada' };
}
const montar = () => render(<SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}><ProvedorEstado inicial={estado()}><Treino /></ProvedorEstado></SafeAreaProvider>);

describe('regressões v0.2', () => {
  it('REG-01 (corrigido na 0.2.1): digitar 1500 kg e concluir a série não deveria derrubar a tela (deveria avisar e manter o treino)', async () => {
    await montar();
    await fireEvent.changeText(screen.getByLabelText('Carga em kg, série 1'), '1500');
    await fireEvent.press(screen.getByTestId('concluir-1'));
    expect(screen.getByText('Treino QA')).toBeTruthy();
    expect(screen.getByText('Série não registrada')).toBeTruthy();
    expect(screen.getByText(/carga máxima é 1000 kg/)).toBeTruthy();
    expect(screen.getByTestId('concluir-1')).toBeTruthy(); // a série continua pendente
  });
  it('mesclar: pendentes agora é obrigatório (0.2.1); com conjunto vazio a versão do servidor vence', () => {
    const r = mesclar([{ id: '1', atualizadoEm: '', nome: 'local' } as any], [{ id: '1', atualizadoEm: '', nome: 'servidor' } as any], new Set());
    expect((r[0] as any).nome).toBe('servidor');
  });
  it.each(['=1+1', '+cmd', '@SUM(A1)', '\t=1', '-cmd'])('CSV neutraliza "%s"', (nome) => {
    const csv = treinosCsv({ rotinas: [{ id: 'r', nome, ordem: 1, itens: [], atualizadoEm: '' }], sessoes: [{ id: 's1', rotinaId: 'r', iniciadaEm: 'x', finalizadaEm: 'y', notas: null, atualizadoEm: '' }], series: [{ id: 'x', sessaoId: 's1', exercicioId: 'e', ordem: 1, tipo: 'normal', cargaKg: 50, reps: 8, duracaoS: null, rpe: null, concluidaEm: 'z', atualizadoEm: '' }], pesos: [], exercicios: [] });
    expect(csv.split('\n')[1].split(';')[1].replace(/^"/, '').startsWith("'")).toBe(true);
  });
  it('CSV: número negativo e decimal com vírgula ficam como número', () => {
    const csv = treinosCsv({ rotinas: [], sessoes: [], series: [{ id: 'x', sessaoId: 's', exercicioId: 'e', ordem: 1, tipo: 'normal', cargaKg: 52.5, reps: 8, duracaoS: null, rpe: null, concluidaEm: 'z', atualizadoEm: '' }], pesos: [], exercicios: [] });
    expect(csv).toContain(';52,5;8;');
  });
  it('aparelho: nome só com NBSP é recusado (trim do JS cobre NBSP)', () => {
    const e = acoes.definirConsentimento(acoes.entrar(estadoInicial()), 'dados_saude', true);
    expect(() => acoes.salvarRotina(e, { id: 'r', nome: '\u00a0\u00a0', ordem: 1, itens: [], atualizadoEm: '' })).toThrow('valor_invalido');
  });
});
