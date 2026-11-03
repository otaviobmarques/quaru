// v0.9 – aniversário, perguntar o dia ao adicionar treino, reagendar e mascote no Início.
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Inicio from '@/app/(abas)/inicio';
import EditarRotina from '@/app/rotina/[id]';
import { CartaoMascote } from '@/componentes/cartao-mascote';
import { DepoisDeAdicionar } from '@/componentes/treinos/depois-de-adicionar';
import { AgendaTreinos } from '@/componentes/treinos/agenda';
import { rascunhoDe, salvarPasso } from '@/componentes/pergunta-tour';
import { amanhaDe, definirDia, diaDaSemana, hoje, planejadoPara, proximasDatas, reagendar } from '@/dominio/agenda';
import { ehAniversario, formatarAniversario, idadeQueCompleta, lerAniversario, mascararAniversario } from '@/dominio/aniversario';
import { BIBLIOTECA } from '@/dominio/biblioteca';
import { acoes, estadoInicial, ProvedorEstado, useEstado, type Estado } from '@/estado/armazem';

let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({ router: { navigate: jest.fn(), push: jest.fn(), replace: jest.fn(), back: jest.fn() }, useLocalSearchParams: () => mockParams }));
const router = jest.requireMock('expo-router').router as Record<string, jest.Mock>;
let ultimo: Estado;
function Espiao() { ultimo = useEstado().estado; return null; }
const montar = (ui: React.ReactElement, e: Estado) => render(
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}><ProvedorEstado inicial={e}>{ui}<Espiao /></ProvedorEstado></SafeAreaProvider>);
beforeEach(() => { jest.clearAllMocks(); mockParams = {}; });
const base = () => acoes.carregarExemplo(acoes.consentir(acoes.entrar(estadoInicial()), { dadosSaude: true }));
const treinos = (e: Estado) => e.rotinas.filter((r) => !r.excluidoEm);

describe('aniversário: regras', () => {
  it('lê DD/MM e DD/MM/AAAA; recusa data impossível ou no futuro', () => {
    expect(lerAniversario('05/11', '2026-11-03')).toEqual({ dia: 5, mes: 11, ano: null });
    expect(lerAniversario('5-11-1990', '2026-11-03')).toEqual({ dia: 5, mes: 11, ano: 1990 });
    expect(lerAniversario('', '2026-11-03')).toBeNull();
    for (const t of ['31/02', '29/02/2001', '00/05', '10/13', '01/01/2999', '1/1/1800', 'abc']) expect(lerAniversario(t, '2026-11-03')).toBe('invalido');
    expect(lerAniversario('29/02/2000', '2026-11-03')).toEqual({ dia: 29, mes: 2, ano: 2000 });
  });
  it('é aniversário hoje; 29/02 comemora em 28/02 nos anos comuns; idade só com ano', () => {
    expect(ehAniversario({ dia: 3, mes: 11 }, '2026-11-03')).toBe(true);
    expect(ehAniversario({ dia: 4, mes: 11 }, '2026-11-03')).toBe(false);
    expect(ehAniversario({ dia: 29, mes: 2 }, '2027-02-28')).toBe(true);
    expect(ehAniversario({ dia: 29, mes: 2 }, '2028-02-28')).toBe(false);
    expect(idadeQueCompleta({ dia: 3, mes: 11, ano: 1990 }, '2026-11-03')).toBe(36);
    expect(idadeQueCompleta({ dia: 3, mes: 11 }, '2026-11-03')).toBeNull();
  });
  it('máscara e formatação', () => {
    expect(mascararAniversario('0511')).toBe('05/11');
    expect(mascararAniversario('05111990')).toBe('05/11/1990');
    expect(formatarAniversario({ dia: 5, mes: 11, ano: null })).toBe('05/11');
  });
  it('o passo do tour grava o aniversário e recusa data inválida', () => {
    const e = base();
    const x = salvarPasso(e, 'idade', { ...rascunhoDe(e), aniversarioTxt: '05/11' });
    expect(x.perfil?.aniversario).toEqual({ dia: 5, mes: 11, ano: null });
    expect(() => salvarPasso(e, 'idade', { ...rascunhoDe(e), aniversarioTxt: '31/02' })).toThrow('data_invalida');
  });
});

describe('agenda: reagendar', () => {
  it('move só aquela data; o padrão da semana continua nas outras', () => {
    let a = definirDia(undefined, '2026-11-03', 'A', true); // toda terça
    a = reagendar(a, '2026-11-03', '2026-11-05', 'A');
    const ex = () => true;
    expect(planejadoPara(a, '2026-11-03', ex).valor).toBeNull();
    expect(planejadoPara(a, '2026-11-05', ex).valor).toBe('A');
    expect(planejadoPara(a, '2026-11-10', ex).valor).toBe('A'); // próxima terça
  });
  it('na agenda: Reagendar leva o treino para o dia escolhido', async () => {
    const e0 = base();
    const r = treinos(e0)[0];
    const d = hoje();
    const e = acoes.planejarDia(e0, d, r.id);
    await montar(<AgendaTreinos />, e);
    await fireEvent.press(screen.getByTestId(`reagendar-${d}`));
    await fireEvent.press(screen.getByText('Amanhã'));
    await fireEvent.press(screen.getByTestId(`confirmar-reagendar-${d}`));
    expect(planejadoPara(ultimo.agenda, d, () => true).valor).toBeNull();
    expect(planejadoPara(ultimo.agenda, amanhaDe(d), () => true).valor).toBe(r.id);
  });
  it('no Início: o treino de hoje da agenda tem "Reagendar para outro dia"', async () => {
    const e0 = base();
    const r = treinos(e0)[1];
    const d = hoje();
    const e = { ...acoes.planejarDia(e0, d, r.id), sessoes: e0.sessoes.filter((s) => s.finalizadaEm && s.iniciadaEm.slice(0, 10) < d) };
    await montar(<Inicio />, e);
    await fireEvent.press(await screen.findByTestId('reagendar-hoje'));
    const alvo = proximasDatas(d, 4)[3];
    await fireEvent.press(screen.getAllByText(/^(Qua|Qui|Sex|Sáb|Dom|Seg|Ter) \d\d\/\d\d$/)[1]);
    await fireEvent.press(screen.getByTestId('confirmar-reagendar-hoje'));
    expect(planejadoPara(ultimo.agenda, d, () => true).valor).toBeNull();
    expect(planejadoPara(ultimo.agenda, alvo, () => true).valor).toBe(r.id);
  });
});

describe('perguntar o dia ao adicionar', () => {
  it('Hoje e Amanhã agendam direto; Reagendar troca a data', async () => {
    const e = base();
    const r = treinos(e)[0];
    await montar(<DepoisDeAdicionar rotinaId={r.id} nome={r.nome} />, e);
    expect(screen.getByText(/Para qual dia\?/)).toBeTruthy();
    await fireEvent.press(screen.getByTestId(`agendar-amanha-${r.id}`));
    expect(ultimo.agenda?.dias[amanhaDe(hoje())]).toBe(r.id);
    expect(screen.getByText(/agendado: amanhã/)).toBeTruthy();
    await fireEvent.press(screen.getByTestId(`reagendar-${r.id}`));
    await fireEvent.press(screen.getByText('Hoje'));
    await fireEvent.press(screen.getByTestId(`confirmar-agenda-${r.id}`));
    expect(planejadoPara(ultimo.agenda, amanhaDe(hoje()), () => true).valor).toBeNull();
    expect(ultimo.agenda?.dias[hoje()]).toBe(r.id);
  });
  it('reagendar um "toda semana" tira o padrão antigo', async () => {
    const e = base();
    const r = treinos(e)[0];
    await montar(<DepoisDeAdicionar rotinaId={r.id} nome={r.nome} />, e);
    await fireEvent.press(screen.getByTestId(`agendar-botao-${r.id}`));
    await fireEvent.press(screen.getByText('Hoje'));
    await fireEvent.press(screen.getByTestId(`repetir-${r.id}`));
    await fireEvent.press(screen.getByTestId(`confirmar-agenda-${r.id}`));
    expect(ultimo.agenda?.semana[diaDaSemana(hoje())]).toBe(r.id);
    await fireEvent.press(screen.getByTestId(`reagendar-${r.id}`));
    await fireEvent.press(screen.getByText('Amanhã'));
    await fireEvent.press(screen.getByTestId(`repetir-${r.id}`)); // desliga o repetir
    await fireEvent.press(screen.getByTestId(`confirmar-agenda-${r.id}`));
    expect(ultimo.agenda?.semana[diaDaSemana(hoje())]).toBeUndefined();
    expect(ultimo.agenda?.dias[amanhaDe(hoje())]).toBe(r.id);
  });
  it('treino novo: ao salvar, pergunta o dia; Concluir volta', async () => {
    let e = base();
    const r = { id: 'novo-1', nome: 'Meu treino', ordem: 9, atualizadoEm: '', itens: [{ id: 'i1', exercicioId: BIBLIOTECA[0].id, ordem: 0, seriesAlvo: 3, repsAlvo: 10, descansoS: 90 }] };
    e = acoes.salvarRotina(e, r);
    mockParams = { id: r.id, nova: '1' };
    await montar(<EditarRotina />, e);
    await fireEvent.press(screen.getByTestId('salvar-treino'));
    expect(router.back).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId(`agendar-hoje-${r.id}`));
    expect(ultimo.agenda?.dias[hoje()]).toBe(r.id);
    await fireEvent.press(screen.getByTestId('concluir-agenda'));
    expect(router.back).toHaveBeenCalled();
  });
  it('editar um treino que já existia: Salvar só volta', async () => {
    const e = base();
    mockParams = { id: treinos(e)[0].id };
    await montar(<EditarRotina />, e);
    await fireEvent.press(screen.getByTestId('salvar-treino'));
    expect(router.back).toHaveBeenCalled();
  });
});

describe('mascote', () => {
  const agora = new Date(`${hoje()}T15:00:00`);
  it('dá boas-vindas, pergunta o aniversário e fecha até amanhã', async () => {
    const e = acoes.definirNome(base(), 'Otávio');
    await montar(<CartaoMascote recado="Bora treinar hoje?" agora={agora} />, e);
    expect(screen.getByTestId('mascote-boas-vindas')).toBeTruthy();
    expect(screen.getByText('Boa tarde, Otávio!')).toBeTruthy();
    expect(screen.getByLabelText('Mascote do Quaru acenando')).toBeTruthy();
    await fireEvent.changeText(screen.getByTestId('mascote-campo-aniversario'), '3102');
    await fireEvent.press(screen.getByTestId('mascote-salvar-aniversario'));
    expect(screen.getByText(/Digite dia e mês/)).toBeTruthy();
    await fireEvent.changeText(screen.getByTestId('mascote-campo-aniversario'), '0511');
    await fireEvent.press(screen.getByTestId('mascote-salvar-aniversario'));
    expect(ultimo.perfil?.aniversario).toEqual({ dia: 5, mes: 11, ano: null });
    expect(screen.queryByTestId('perguntar-aniversario')).toBeNull();
    await fireEvent.press(screen.getByTestId('fechar-mascote'));
    expect(ultimo.mascote?.fechadoEm).toBe(hoje());
    expect(screen.queryByTestId('mascote-boas-vindas')).toBeNull();
  });
  it('no aniversário: chapéu de festa e parabéns com a idade', async () => {
    const d = hoje();
    const e = acoes.atualizarPerfil(acoes.definirNome(base(), 'Bia'), { aniversario: { dia: +d.slice(8, 10), mes: +d.slice(5, 7), ano: +d.slice(0, 4) - 30 } });
    await montar(<CartaoMascote recado="" agora={agora} />, e);
    expect(screen.getByTestId('mascote-aniversario')).toBeTruthy();
    expect(screen.getByText('Feliz aniversário, Bia! 🎉')).toBeTruthy();
    expect(screen.getByText(/30 anos/)).toBeTruthy();
    expect(screen.getByLabelText(/chapéu de festa/)).toBeTruthy();
  });
  it('desligado em Perfil não aparece', async () => {
    const e = acoes.ligarMascote(base(), false);
    await montar(<CartaoMascote recado="" agora={agora} />, e);
    expect(screen.queryByTestId('mascote-boas-vindas')).toBeNull();
  });
});
