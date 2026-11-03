// v0.7 – agenda de treinos (semana e mês) e treino do dia gerado pelo app.
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import TreinoDoDia from '@/app/treino-do-dia';
import { AgendaTreinos } from '@/componentes/treinos/agenda';
import { datasDaSemana, definirDia, planejadoPara } from '@/dominio/agenda';
import { doCatalogo } from '@/dominio/biblioteca';
import { cartaoTreinoDeHoje, diaLocal, proximaRotina } from '@/dominio/treino-de-hoje';
import { escolherFoco, gerarTreinoDoDia } from '@/dominio/treino-do-dia';
import type { Rotina } from '@/dominio/tipos';
import { acoes, estadoInicial, ProvedorEstado, useEstado, type Estado } from '@/estado/armazem';

jest.mock('expo-router', () => ({ router: { navigate: jest.fn(), push: jest.fn(), replace: jest.fn(), back: jest.fn() }, useLocalSearchParams: () => ({}) }));
const router = jest.requireMock('expo-router').router as Record<string, jest.Mock>;
let ultimo: Estado;
function Espiao() { ultimo = useEstado().estado; return null; }
const montar = (ui: React.ReactElement, e: Estado) => render(
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}><ProvedorEstado inicial={e}>{ui}<Espiao /></ProvedorEstado></SafeAreaProvider>);
beforeEach(() => jest.clearAllMocks());

const rot = (id: string, ordem: number, extra: Partial<Rotina> = {}): Rotina => ({ id, nome: `Treino ${id}`, ordem, itens: [], atualizadoEm: '', ...extra });
const existe = (ids: string[]) => (id: string) => ids.includes(id);

describe('agenda: regras', () => {
  it('a data vence o padrão da semana; "repetir" grava o padrão e limpa a data', () => {
    let a = definirDia(undefined, '2026-11-02', 'A', true); // segunda
    expect(planejadoPara(a, '2026-11-09', existe(['A', 'B'])).valor).toBe('A'); // próxima segunda
    a = definirDia(a, '2026-11-09', 'B');
    expect(planejadoPara(a, '2026-11-09', existe(['A', 'B']))).toEqual({ valor: 'B', fonte: 'dia' });
    expect(planejadoPara(a, '2026-11-16', existe(['A', 'B']))).toEqual({ valor: 'A', fonte: 'semana' });
    a = definirDia(a, '2026-11-16', null); // "Livre" só naquela data
    expect(planejadoPara(a, '2026-11-16', existe(['A'])).valor).toBeNull();
  });
  it('treino excluído some da agenda', () => {
    const a = definirDia(undefined, '2026-11-03', 'X');
    expect(planejadoPara(a, '2026-11-03', existe([])).valor).toBeNull();
  });
  it('semana vai de segunda a domingo', () => {
    expect(datasDaSemana('2026-11-05')).toEqual(['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08']);
    expect(datasDaSemana('2026-11-05', 1)[0]).toBe('2026-11-09');
  });
  it('card Hoje usa a agenda: treino marcado vence a sequência; descanso vira dia de descanso', () => {
    const rs = [rot('A', 1), rot('B', 2)];
    const agora = '2026-11-03T12:00:00Z';
    expect(cartaoTreinoDeHoje(rs, [], agora, 'B')).toMatchObject({ estado: 'proxima', rotina: { id: 'B' }, daAgenda: true });
    expect(cartaoTreinoDeHoje(rs, [], agora, 'descanso')).toMatchObject({ estado: 'descanso', proxima: { id: 'A' } });
    expect(cartaoTreinoDeHoje(rs, [], agora, null)).toMatchObject({ estado: 'proxima', rotina: { id: 'A' } });
  });
  it('o treino do dia fica fora da sequência A → B → C', () => {
    expect(proximaRotina([rot('D', 0, { origem: 'dia' }), rot('A', 1)], [])?.id).toBe('A');
  });
});

describe('agenda: tela', () => {
  it('escolher o treino do dia e repetir toda semana', async () => {
    const e = acoes.carregarExemplo(acoes.entrar(estadoInicial()));
    const hoje = diaLocal(new Date().toISOString());
    const alvo = e.rotinas.filter((r) => !r.excluidoEm)[1];
    await montar(<AgendaTreinos />, e);
    expect(screen.getByTestId(`escolha-${hoje}`)).toBeTruthy(); // hoje já vem aberto
    await fireEvent.press(screen.getByText(alvo.nome, { exact: true }));
    expect(planejadoPara(ultimo.agenda, hoje, () => true)).toEqual({ valor: alvo.id, fonte: 'dia' });
    await fireEvent(screen.getByTestId(`repetir-${hoje}`), 'valueChange', true);
    expect(planejadoPara(ultimo.agenda, hoje, () => true).fonte).toBe('semana');
  });
  it('"Montar um treino novo" cria o treino, marca o dia e abre o editor', async () => {
    const hoje = diaLocal(new Date().toISOString());
    await montar(<AgendaTreinos />, acoes.entrar(estadoInicial()));
    await fireEvent.press(screen.getByTestId(`novo-treino-${hoje}`));
    const novo = ultimo.rotinas[0];
    expect(novo.nome).toMatch(/^Treino de /);
    expect(planejadoPara(ultimo.agenda, hoje, () => true).valor).toBe(novo.id);
    expect(router.push).toHaveBeenCalledWith(`/rotina/${novo.id}`);
  });
});

describe('treino do dia: gerador', () => {
  const agora = '2026-11-03T12:00:00Z';
  it('começando do zero: corpo inteiro, 2 séries, só exercícios do catálogo e no máximo 45 min', () => {
    const t = gerarTreinoDoDia({ agora });
    expect(t.foco).toBe('corpo-inteiro');
    expect(t.itens.length).toBeGreaterThanOrEqual(3);
    expect(t.minutos).toBeLessThanOrEqual(45);
    for (const i of t.itens) { expect(doCatalogo(i.exercicioId)).toBeTruthy(); expect(i.seriesAlvo).toBe(2); }
  });
  it('em casa só com o peso do corpo: nada de máquina', () => {
    const t = gerarTreinoDoDia({ agora, treino: { objetivo: 'saude', nivel: 'iniciante', dias: 3 }, tem: ['peso-corpo'] });
    for (const i of t.itens) expect(doCatalogo(i.exercicioId)!.equipamentos.every((q) => q === 'peso-corpo')).toBe(true);
  });
  it('mesmo dia → mesma sugestão; "Outra sugestão" muda', () => {
    const a = gerarTreinoDoDia({ agora }).itens.map((i) => i.nome);
    expect(gerarTreinoDoDia({ agora }).itens.map((i) => i.nome)).toEqual(a);
    expect(gerarTreinoDoDia({ agora, variacao: 1 }).itens.map((i) => i.nome)).not.toEqual(a);
  });
  it('lesão no joelho tira agachamento livre, leg press e extensora; tempo de 30 min corta exercícios', () => {
    const t = gerarTreinoDoDia({ agora, treino: { objetivo: 'massa', nivel: 'intermediario', dias: 4 }, restricoes: ['joelho'], tempoMin: 30 });
    expect(t.itens.map((i) => i.nome)).not.toEqual(expect.arrayContaining(['Agachamento livre']));
    for (const n of ['Agachamento livre', 'Leg press 45°', 'Cadeira extensora']) expect(t.itens.some((i) => i.nome === n)).toBe(false);
    expect(t.minutos).toBeLessThanOrEqual(30);
  });
  it('intermediário alterna o foco pelo último treino', () => {
    const treino = { objetivo: 'massa' as const, nivel: 'intermediario' as const, dias: 4 };
    expect(escolherFoco(treino, [], []).foco).toBe('superiores');
    const s = { id: 's1', rotinaId: null, iniciadaEm: agora, finalizadaEm: agora, notas: null, atualizadoEm: '' };
    const supino = gerarTreinoDoDia({ agora, treino }).itens[0];
    expect(escolherFoco(treino, [s], [{ id: 'x', sessaoId: 's1', exercicioId: supino.exercicioId, ordem: 1, tipo: 'normal', cargaKg: 40, reps: 10, duracaoS: null, rpe: null, concluidaEm: agora, atualizadoEm: '' }]).foco).toBe('inferiores');
  });
});

describe('treino do dia: tela', () => {
  it('Começar agora grava como treino do dia (um só) e inicia; Salvar guarda uma cópia em Meus treinos', async () => {
    const e = acoes.consentir(acoes.entrar(estadoInicial()), { dadosSaude: true });
    await montar(<TreinoDoDia />, e);
    expect(screen.getByText('Começando do zero')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('salvar-treino-do-dia'));
    expect(ultimo.rotinas.filter((r) => !r.origem)).toHaveLength(1);
    await fireEvent.press(screen.getByTestId('comecar-treino-do-dia'));
    expect(ultimo.rotinas.filter((r) => r.origem === 'dia')).toHaveLength(1);
    expect(router.push).toHaveBeenCalledWith('/treino');
  });
});
