// v0.12 – planos de assinatura: teste grátis, bloqueio do treino sem plano, tela de planos e criar conta.
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { cpfCnpjValido, diasDeTeste, economia, mascararCpfCnpj, PLANOS, podeTreinar, porMes, type PlanoConta } from '@/dominio/plano';
import { acoes, estadoInicial, ProvedorEstado, useEstado, type Estado } from '@/estado/armazem';
import { iniciarTreino } from '@/estado/treino';

const mockSessao = { modo: 'conta', pronta: true, usuario: { id: 'u1', email: 'bia@ex.com' }, acesso: { papel: 'usuario', ativo: true }, aviso: null, link: null, trocarSenha: false,
  entrar: jest.fn(), criarConta: jest.fn(), esqueci: jest.fn(), definirSenha: jest.fn(), sair: jest.fn(), limparLink: jest.fn() };
jest.mock('@/estado/sessao', () => ({ ...jest.requireActual('@/estado/sessao'), useSessao: () => mockSessao }));
const mockServ = { assinar: jest.fn(), buscarPlano: jest.fn(), cancelarAssinatura: jest.fn(), linkDePagamento: jest.fn() };
jest.mock('@/servicos/assinatura', () => Object.fromEntries(Object.keys({ assinar: 1, buscarPlano: 1, cancelarAssinatura: 1, linkDePagamento: 1 }).map((k) => [k, (...a: unknown[]) => (mockServ as Record<string, jest.Mock>)[k](...a)])));
jest.mock('expo-router', () => ({ router: { navigate: jest.fn(), push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true }, useLocalSearchParams: () => ({}) }));
const router = jest.requireMock('expo-router').router as Record<string, jest.Mock>;

import Planos from '@/app/planos';
import CriarConta from '@/app/criar-conta';
import { FaixaPlano } from '@/componentes/faixa-plano';

let ultimo: Estado;
function Espiao() { ultimo = useEstado().estado; return null; }
const montar = (ui: React.ReactElement, e: Estado) => render(
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}><ProvedorEstado inicial={e}>{ui}<Espiao /></ProvedorEstado></SafeAreaProvider>);
beforeEach(() => jest.clearAllMocks());

const AGORA = new Date('2026-11-05T12:00:00Z');
const dia = (n: number) => new Date(AGORA.getTime() + n * 86400000).toISOString();
const plano = (x: Partial<PlanoConta>): PlanoConta => ({ acesso: true, motivo: 'teste', cobranca_ativa: true, status: 'teste', plano: null, teste_ate: dia(5), valido_ate: null, cortesia: false, ...x });
const base = () => acoes.consentir(acoes.entrar(estadoInicial()), { dadosSaude: true });

describe('regras do plano', () => {
  it('pode treinar: cobrança desligada, isento, pago ou teste válido; o teste vencido bloqueia mesmo sem rede', () => {
    expect(podeTreinar(null, AGORA)).toBe(true);
    expect(podeTreinar(plano({ cobranca_ativa: false, teste_ate: dia(-3) }), AGORA)).toBe(true);
    expect(podeTreinar(plano({ motivo: 'isento', teste_ate: dia(-3) }), AGORA)).toBe(true);
    expect(podeTreinar(plano({}), AGORA)).toBe(true);
    expect(podeTreinar(plano({ teste_ate: dia(-1) }), AGORA)).toBe(false);
    expect(podeTreinar(plano({ teste_ate: dia(-10), valido_ate: dia(20), motivo: 'assinante' }), AGORA)).toBe(true);
    expect(podeTreinar(plano({ motivo: 'teste', teste_ate: dia(-10), valido_ate: dia(-1) }), AGORA)).toBe(false);
  });
  it('dias de teste, economia e preço por mês', () => {
    expect(diasDeTeste(plano({ teste_ate: dia(6.2) }), AGORA)).toBe(7);
    expect(diasDeTeste(plano({ teste_ate: dia(0.3) }), AGORA)).toBe(1);
    expect(diasDeTeste(plano({ teste_ate: dia(-1) }), AGORA)).toBe(0);
    expect(PLANOS.map((p) => [p.id, economia(p), porMes(p)])).toEqual([['mensal', 0, 19.9], ['trimestral', 16, 16.63], ['anual', 24, 14.99]]);
  });
  it('CPF/CNPJ', () => {
    expect(cpfCnpjValido('529.982.247-25')).toBe(true);
    expect(cpfCnpjValido('529.982.247-24')).toBe(false);
    expect(mascararCpfCnpj('52998224725')).toBe('529.982.247-25');
    expect(mascararCpfCnpj('11222333000181')).toBe('11.222.333/0001-81');
  });
  it('sem plano, começar treino leva para Planos; com treino em andamento, continua', () => {
    const e = { ...base(), plano: plano({ teste_ate: dia(-1) }) };
    iniciarTreino(() => {}, e, null);
    expect(router.push).toHaveBeenCalledWith('/planos?motivo=bloqueado');
    jest.clearAllMocks();
    const emAndamento = acoes.iniciarSessao(base(), { id: 's', rotinaId: null, iniciadaEm: new Date().toISOString(), finalizadaEm: null, notas: null, atualizadoEm: '' });
    iniciarTreino(() => {}, { ...emAndamento, plano: plano({ teste_ate: dia(-1) }) }, null);
    expect(router.push).toHaveBeenCalledWith('/treino');
  });
});

describe('telas', () => {
  it('faixa do Início: teste contando, sem plano; nada com a cobrança desligada', async () => {
    const { rerender, queryByTestId } = await render(<FaixaPlano plano={plano({ teste_ate: dia(3) })} agora={AGORA} />);
    expect(screen.getByText('Teste grátis: faltam 3 dias')).toBeTruthy();
    await rerender(<FaixaPlano plano={plano({ teste_ate: dia(-1) })} agora={AGORA} />);
    expect(screen.getByText('Seu teste grátis acabou')).toBeTruthy();
    await rerender(<FaixaPlano plano={plano({ cobranca_ativa: false })} agora={AGORA} />);
    expect(queryByTestId('faixa-teste')).toBeNull();
  });
  it('Planos: escolher, validar CPF, assinar e abrir o pagamento', async () => {
    mockServ.assinar.mockResolvedValue({ url: 'https://sandbox.asaas.com/i/abc' });
    mockServ.buscarPlano.mockResolvedValue(plano({ status: 'pendente', plano: 'trimestral' }));
    await montar(<Planos />, { ...base(), plano: plano({ teste_ate: new Date(Date.now() + 3 * 86400000).toISOString() }) });
    expect(screen.getByText(/Teste grátis: faltam 3 dias/)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('plano-trimestral'));
    await fireEvent.changeText(screen.getByTestId('campo-nome-cobranca'), 'Bia Santos');
    await fireEvent.changeText(screen.getByTestId('campo-cpf'), '52998224724');
    await fireEvent.press(screen.getByTestId('assinar'));
    expect(screen.getByText(/Confira o CPF/)).toBeTruthy();
    expect(mockServ.assinar).not.toHaveBeenCalled();
    await fireEvent.changeText(screen.getByTestId('campo-cpf'), '52998224725');
    await fireEvent.press(screen.getByTestId('assinar'));
    await waitFor(() => expect(screen.getByTestId('abrir-pagamento')).toBeTruthy());
    expect(mockServ.assinar).toHaveBeenCalledWith('trimestral', '529.982.247-25', 'Bia Santos');
    await waitFor(() => expect(ultimo.plano?.status).toBe('pendente'));
  });
  it('Criar conta: pede aceite dos termos e mostra "confira o seu e-mail"', async () => {
    mockSessao.criarConta.mockResolvedValue(null);
    await montar(<CriarConta />, base());
    await fireEvent.changeText(screen.getByTestId('cc-nome'), 'Bia');
    await fireEvent.changeText(screen.getByTestId('cc-email'), 'bia@ex.com');
    await fireEvent.changeText(screen.getByTestId('cc-senha'), 'senha1234');
    await fireEvent.press(screen.getByTestId('cc-criar'));
    expect(screen.getByText(/aceite os Termos/)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('cc-aceito'));
    await fireEvent.press(screen.getByTestId('cc-criar'));
    await waitFor(() => expect(screen.getByText('Quase lá! Confira o seu e-mail')).toBeTruthy());
    expect(mockSessao.criarConta).toHaveBeenCalledWith('Bia', 'bia@ex.com', 'senha1234');
  });
});
