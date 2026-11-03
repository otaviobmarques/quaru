// v0.8 – treinos enviados pelo treinador: viram treinos locais (só leitura), entram na agenda e somem se apagados.
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BIBLIOTECA } from '@/dominio/biblioteca';
import { planejadoPara } from '@/dominio/agenda';
import { aplicarTreinosDoTreinador, codigoValido, type TreinoAtribuido } from '@/dominio/treinador';
import { proximaRotina } from '@/dominio/treino-de-hoje';
import type { Rotina } from '@/dominio/tipos';
import { acoes, estadoInicial, ProvedorEstado, useEstado, type Estado } from '@/estado/armazem';

const mockSessao = { modo: 'conta', pronta: true, usuario: { id: 'u1', email: 'bia@ex.com' } as { id: string; email: string } | null, acesso: { papel: 'usuario', ativo: true } as { papel: string; ativo: boolean } | null, aviso: null, link: null, trocarSenha: false,
  entrar: jest.fn(), esqueci: jest.fn(), definirSenha: jest.fn(), sair: jest.fn(), limparLink: jest.fn() };
jest.mock('@/estado/sessao', () => ({ ...jest.requireActual('@/estado/sessao'), useSessao: () => mockSessao }));
const mockServ = { aceitarVinculo: jest.fn(), buscarDoTreinador: jest.fn(), desvincularTreinador: jest.fn() };
jest.mock('@/servicos/treinador', () => ({ aceitarVinculo: (...a: unknown[]) => mockServ.aceitarVinculo(...a), buscarDoTreinador: (...a: unknown[]) => mockServ.buscarDoTreinador(...a), desvincularTreinador: (...a: unknown[]) => mockServ.desvincularTreinador(...a) }));
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({ router: { navigate: jest.fn(), push: jest.fn(), replace: jest.fn(), back: jest.fn() }, useLocalSearchParams: () => mockParams }));
const router = jest.requireMock('expo-router').router as Record<string, jest.Mock>;

import Vincular from '@/app/vincular';
import EditarRotina from '@/app/rotina/[id]';

let ultimo: Estado;
function Espiao() { ultimo = useEstado().estado; return null; }
const montar = (ui: React.ReactElement, e: Estado) => render(
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}><ProvedorEstado inicial={e}>{ui}<Espiao /></ProvedorEstado></SafeAreaProvider>);
beforeEach(() => { jest.clearAllMocks(); mockParams = {}; mockSessao.usuario = { id: 'u1', email: 'bia@ex.com' }; mockSessao.acesso = { papel: 'usuario', ativo: true }; });

const EX = BIBLIOTECA[0].id;
const atr = (id: string, extra: Partial<TreinoAtribuido> = {}): TreinoAtribuido => ({ id, aluno_ref: 'ref1', nome: `Treino ${id}`, dias: [1], itens: [{ exercicioId: EX, series: 3, reps: 10, descansoS: 90, obs: 'leve' }], ...extra });
const vinc = [{ aluno_ref: 'ref1', treinador: 'Coach Ana' }];
const existe = (id: string) => id === EX;

describe('treinos do treinador: regras', () => {
  it('viram treinos com origem treinador, nome do treinador, observação por exercício e dias na agenda', () => {
    const r = aplicarTreinosDoTreinador({ rotinas: [] }, vinc, [atr('t1')], existe, '2026-11-03T12:00:00Z');
    expect(r.rotinas).toHaveLength(1);
    expect(r.rotinas[0]).toMatchObject({ id: 't1', origem: 'treinador', treinador: 'Coach Ana' });
    expect(r.rotinas[0].itens[0]).toMatchObject({ exercicioId: EX, seriesAlvo: 3, repsAlvo: 10, obs: 'leve' });
    expect(planejadoPara(r.agenda, '2026-11-02', () => true).valor).toBe('t1'); // segunda
  });
  it('treino apagado pelo treinador sai do app (marcado como excluído) e da agenda', () => {
    const r1 = aplicarTreinosDoTreinador({ rotinas: [] }, vinc, [atr('t1')], existe, 'x');
    const r2 = aplicarTreinosDoTreinador(r1, vinc, [], existe, 'agora');
    expect(r2.rotinas[0].excluidoEm).toBe('agora');
    expect(r2.agenda.semana[1]).toBeUndefined();
  });
  it('não passa por cima de um dia que a pessoa marcou com um treino dela; exercício fora do catálogo é ignorado', () => {
    const meu: Rotina = { id: 'meu', nome: 'Meu', ordem: 1, itens: [], atualizadoEm: '' };
    const r = aplicarTreinosDoTreinador({ rotinas: [meu], agenda: { semana: { 1: 'meu' }, dias: {} } }, vinc,
      [atr('t1', { itens: [{ exercicioId: 'nao-existe', series: 3, reps: 10, descansoS: 90 }, { exercicioId: EX, series: 99, reps: 0, descansoS: 5000 }] })], existe, 'x');
    expect(r.agenda.semana[1]).toBe('meu');
    expect(r.rotinas.find((x) => x.id === 't1')!.itens).toEqual([expect.objectContaining({ seriesAlvo: 20, repsAlvo: 1, descansoS: 900 })]);
  });
  it('treino de outro vínculo (ex.: aluno do próprio treinador) não entra', () => {
    const r = aplicarTreinosDoTreinador({ rotinas: [] }, vinc, [atr('t9', { aluno_ref: 'outro' })], existe, 'x');
    expect(r.rotinas).toHaveLength(0);
  });
  it('entra na sequência A → B → C como qualquer treino (o do dia não)', () => {
    const r = aplicarTreinosDoTreinador({ rotinas: [] }, vinc, [atr('t1')], existe, 'x');
    expect(proximaRotina(r.rotinas, [])?.id).toBe('t1');
  });
  it('código do link: 32 caracteres hexadecimais', () => {
    expect(codigoValido('a'.repeat(32))).toBe(true);
    expect(codigoValido('xyz')).toBe(false);
    expect(codigoValido(null)).toBe(false);
  });
});

describe('vincular: tela', () => {
  const COD = 'ab'.repeat(16);
  it('sem login guarda o código e leva para entrar', async () => {
    mockSessao.usuario = null; mockSessao.acesso = null; mockParams = { codigo: COD };
    await montar(<Vincular />, acoes.entrar(estadoInicial()));
    await waitFor(() => expect(ultimo.vinculoPendente).toBe(COD));
    await fireEvent.press(screen.getByTestId('vincular-entrar'));
    expect(router.replace).toHaveBeenCalledWith('/entrar');
  });
  it('com login pede confirmação, vincula e traz os treinos', async () => {
    mockParams = { codigo: COD };
    mockServ.aceitarVinculo.mockResolvedValue({ resultado: 'vinculado', treinador: 'Coach Ana' });
    mockServ.buscarDoTreinador.mockResolvedValue({ vinculos: vinc, treinos: [atr('t1')] });
    await montar(<Vincular />, acoes.guardarVinculoPendente(acoes.entrar(estadoInicial()), COD));
    expect(screen.getByText('Ele vê o seu e-mail.', { exact: false })).toBeTruthy();
    await fireEvent.press(screen.getByTestId('confirmar-vinculo'));
    expect(await screen.findByText('Pronto! Agora você treina com Coach Ana.')).toBeTruthy();
    expect(mockServ.aceitarVinculo).toHaveBeenCalledWith(COD);
    await waitFor(() => expect(ultimo.rotinas.some((r) => r.origem === 'treinador')).toBe(true));
    expect(ultimo.vinculoPendente).toBeNull();
  });
  it('link já usado mostra a mensagem', async () => {
    mockParams = { codigo: COD };
    mockServ.aceitarVinculo.mockResolvedValue({ resultado: 'ja_usado' });
    await montar(<Vincular />, acoes.entrar(estadoInicial()));
    await fireEvent.press(screen.getByTestId('confirmar-vinculo'));
    expect(await screen.findByText(/já foi usado por outra conta/)).toBeTruthy();
  });
});

describe('treino do treinador: só leitura, com cópia', () => {
  it('mostra quem enviou e o recado; Fazer uma cópia cria um treino editável', async () => {
    const r = aplicarTreinosDoTreinador({ rotinas: [] }, vinc, [atr('t1', { observacoes: 'Capriche no aquecimento' })], existe, 'x');
    const e = { ...acoes.entrar(estadoInicial()), rotinas: r.rotinas, vinculos: vinc };
    mockParams = { id: 't1' };
    await montar(<EditarRotina />, e);
    expect(screen.getByText(/Enviado por Coach Ana/)).toBeTruthy();
    expect(screen.getByText('Capriche no aquecimento')).toBeTruthy();
    expect(screen.getByText('📝 leve')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('copiar-treino'));
    const copia = ultimo.rotinas.find((x) => x.nome.endsWith('(cópia)'))!;
    expect(copia.origem).toBeUndefined();
    expect(router.replace).toHaveBeenCalledWith(`/rotina/${copia.id}`);
  });
});
