// v0.10 – ID do aluno, convite do treinador, datas do treinador na agenda e evolução compartilhada.
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BIBLIOTECA } from '@/dominio/biblioteca';
import { definirDia, planejadoPara, proximasDatas, hoje } from '@/dominio/agenda';
import { assinatura, montarResumo } from '@/dominio/evolucao';
import { aplicarTreinosDoTreinador, formatarIdAluno, type TreinoAtribuido } from '@/dominio/treinador';
import { acoes, estadoInicial, ProvedorEstado, useEstado, type Estado } from '@/estado/armazem';

const mockSessao = { modo: 'conta', pronta: true, usuario: { id: 'u1', email: 'bia@ex.com' }, acesso: { papel: 'usuario', ativo: true }, aviso: null, link: null, trocarSenha: false,
  entrar: jest.fn(), esqueci: jest.fn(), definirSenha: jest.fn(), sair: jest.fn(), limparLink: jest.fn() };
jest.mock('@/estado/sessao', () => ({ ...jest.requireActual('@/estado/sessao'), useSessao: () => mockSessao }));
const mockServ = { aceitarVinculo: jest.fn(), buscarDoTreinador: jest.fn(), desvincularTreinador: jest.fn(), responderConvite: jest.fn(), meusConvites: jest.fn(), definirCompartilhamento: jest.fn() };
jest.mock('@/servicos/treinador', () => Object.fromEntries(['aceitarVinculo', 'buscarDoTreinador', 'desvincularTreinador', 'responderConvite', 'meusConvites', 'definirCompartilhamento']
  .map((k) => [k, (...a: unknown[]) => (mockServ as Record<string, jest.Mock>)[k](...a)])));
jest.mock('expo-router', () => ({ router: { navigate: jest.fn(), push: jest.fn(), replace: jest.fn(), back: jest.fn() }, useLocalSearchParams: () => ({ codigo: 'a'.repeat(32) }) }));
const router = jest.requireMock('expo-router').router as Record<string, jest.Mock>;

import Perfil from '@/app/(abas)/perfil';
import Vincular from '@/app/vincular';
import { CartaoConvite } from '@/componentes/convite-treinador';

let ultimo: Estado;
function Espiao() { ultimo = useEstado().estado; return null; }
const montar = (ui: React.ReactElement, e: Estado) => render(
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}><ProvedorEstado inicial={e}>{ui}<Espiao /></ProvedorEstado></SafeAreaProvider>);
beforeEach(() => jest.clearAllMocks());

const EX = BIBLIOTECA[0].id;
const atr = (id: string, datas: string[]): TreinoAtribuido => ({ id, aluno_ref: 'ref1', nome: `Treino ${id}`, dias: [], datas, itens: [{ exercicioId: EX, series: 3, reps: 10, descansoS: 90 }] });
const vinc = [{ aluno_ref: 'ref1', treinador: 'Coach Ana', compartilha: true }];
const ok = (id: string) => id === EX;
const base = () => acoes.consentir(acoes.entrar(estadoInicial()), { dadosSaude: true });

describe('datas do treinador na agenda', () => {
  it('entram nos dias livres; o que a pessoa marcou fica; data tirada pelo treinador sai', () => {
    let agenda = definirDia(undefined, '2026-11-06', 'meu-treino'); // a pessoa marcou dia 6
    const r1 = aplicarTreinosDoTreinador({ rotinas: [], agenda }, vinc, [atr('t1', ['2026-11-05', '2026-11-06'])], ok, '2026-11-03T12:00:00Z');
    expect(r1.agenda.dias['2026-11-05']).toBe('t1');
    expect(r1.agenda.dias['2026-11-06']).toBe('meu-treino');
    // a pessoa reagenda o dia 5 para o dia 7: a próxima sincronização respeita
    agenda = { ...r1.agenda, dias: { ...r1.agenda.dias, '2026-11-05': null, '2026-11-07': 't1' } };
    const r2 = aplicarTreinosDoTreinador({ rotinas: r1.rotinas, agenda }, vinc, [atr('t1', ['2026-11-05', '2026-11-06', '2026-11-09'])], ok, '2026-11-03T12:00:00Z');
    expect(r2.agenda.dias['2026-11-05']).toBeNull();
    expect(r2.agenda.dias['2026-11-07']).toBe('t1');
    expect(r2.agenda.dias['2026-11-09']).toBe('t1');
    // o treinador tira o dia 9
    const r3 = aplicarTreinosDoTreinador({ rotinas: r2.rotinas, agenda: r2.agenda }, vinc, [atr('t1', ['2026-11-05'])], ok, '2026-11-03T12:00:00Z');
    expect('2026-11-09' in r3.agenda.dias).toBe(false);
  });
});

describe('resumo da evolução', () => {
  it('só peso, treinos feitos (sem notas) e a agenda com nomes', () => {
    let e = acoes.salvarRotina(base(), { id: 'r1', nome: 'Treino A', ordem: 1, atualizadoEm: '', itens: [{ id: 'i', exercicioId: EX, ordem: 0, seriesAlvo: 1, repsAlvo: 8, descansoS: 60 }] });
    const ini = new Date(Date.now() - 3600000).toISOString(), fim = new Date().toISOString();
    e = acoes.iniciarSessao(e, { id: 's1', rotinaId: 'r1', iniciadaEm: ini, finalizadaEm: null, notas: 'dor no joelho', atualizadoEm: '' });
    e = acoes.salvarSerie(e, { id: 'x1', sessaoId: 's1', exercicioId: EX, ordem: 1, tipo: 'normal', cargaKg: 40, reps: 8, duracaoS: null, rpe: null, concluidaEm: fim, atualizadoEm: '' });
    e = acoes.salvarSessao(e, { ...e.sessoes[0], finalizadaEm: fim });
    e = acoes.registrarPeso(e, { id: 'p1', pesoKg: 80.44, medidoEm: fim, atualizadoEm: '' });
    e = acoes.planejarDia(e, proximasDatas(hoje(), 3)[2], 'r1');
    const r = montarResumo(e);
    expect(r.itens).toEqual(expect.arrayContaining([
      { origem_id: 'p1', tipo: 'peso', quando: fim, dados: { kg: 80.4 } },
      expect.objectContaining({ origem_id: 's1', tipo: 'treino', dados: expect.objectContaining({ nome: 'Treino A', series: 1, volume: 320, min: 60 }) }),
    ]));
    expect(JSON.stringify(r)).not.toMatch(/joelho/);
    expect(r.agenda[proximasDatas(hoje(), 3)[2]]).toBe('Treino A');
    expect(assinatura(r)).toBe(assinatura(montarResumo(e)));
  });
});

describe('telas', () => {
  it('ID do aluno formatado no Perfil e compartilhar liga no servidor', async () => {
    mockServ.definirCompartilhamento.mockResolvedValue(true);
    const e = { ...base(), idAluno: 'K7M2PQ9', vinculos: [{ aluno_ref: 'ref1', treinador: 'Coach Ana', compartilha: false }] };
    expect(formatarIdAluno('K7M2PQ9')).toBe('K7M-2PQ9');
    await montar(<Perfil />, e);
    expect(screen.getByText('K7M-2PQ9')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('compartilhar-ref1'));
    await waitFor(() => expect(ultimo.vinculos?.[0].compartilha).toBe(true));
    expect(mockServ.definirCompartilhamento).toHaveBeenCalledWith('ref1', true);
  });
  it('convite: aceitar e compartilhar responde ao servidor e busca os treinos', async () => {
    mockServ.responderConvite.mockResolvedValue('vinculado');
    mockServ.buscarDoTreinador.mockResolvedValue({ vinculos: vinc, treinos: [] });
    mockServ.meusConvites.mockResolvedValue([]);
    const c = { aluno_ref: 'ref1', treinador: 'Coach Ana' };
    await montar(<CartaoConvite c={c} />, { ...base(), convites: [c] });
    expect(screen.getByText('Coach Ana quer ser seu treinador')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('aceitar-compartilhar-ref1'));
    await waitFor(() => expect(ultimo.vinculos).toEqual(vinc));
    expect(mockServ.responderConvite).toHaveBeenCalledWith('ref1', true, true);
    expect(ultimo.convites).toEqual([]);
  });
  it('convite: recusar', async () => {
    mockServ.responderConvite.mockResolvedValue('recusado');
    mockServ.buscarDoTreinador.mockResolvedValue({ vinculos: [], treinos: [] });
    mockServ.meusConvites.mockResolvedValue([]);
    const c = { aluno_ref: 'ref2', treinador: 'Coach Beto' };
    await montar(<CartaoConvite c={c} />, { ...base(), convites: [c] });
    await fireEvent.press(screen.getByTestId('recusar-ref2'));
    await waitFor(() => expect(ultimo.convites).toEqual([]));
    expect(mockServ.responderConvite).toHaveBeenCalledWith('ref2', false, false);
  });
  it('link do treinador: "Vincular e compartilhar" liga o compartilhamento', async () => {
    mockServ.aceitarVinculo.mockResolvedValue({ resultado: 'vinculado', treinador: 'Coach Ana', aluno_ref: 'ref1' });
    mockServ.definirCompartilhamento.mockResolvedValue(true);
    mockServ.buscarDoTreinador.mockResolvedValue({ vinculos: vinc, treinos: [] });
    await montar(<Vincular />, base());
    await fireEvent.press(screen.getByTestId('confirmar-vinculo-compartilhar'));
    await waitFor(() => expect(mockServ.definirCompartilhamento).toHaveBeenCalledWith('ref1', true));
    expect(router.replace).not.toHaveBeenCalledWith('/entrar');
  });
});
