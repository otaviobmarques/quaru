// v0.6 – conta obrigatória por convite: login real, sem "Continuar sem conta", vínculo dos dados e sessão segura.
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { acoes, estadoInicial, ProvedorEstado } from '@/estado/armazem';

jest.mock('@/config/marca', () => ({ ...jest.requireActual('@/config/marca'), autenticacaoDisponivel: true }));
const mockSessao = { modo: 'conta', pronta: true, usuario: null as { id: string; email: string } | null, acesso: null, aviso: null as string | null, link: null, trocarSenha: false,
  entrar: jest.fn(async () => null as string | null), esqueci: jest.fn(async () => null), definirSenha: jest.fn(async () => null), sair: jest.fn(async () => {}), limparLink: jest.fn() };
jest.mock('@/estado/sessao', () => ({ ...jest.requireActual('@/estado/sessao'), useSessao: () => mockSessao }));
jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() }, useLocalSearchParams: () => ({}) }));
const mockRouter = jest.requireMock('expo-router').router as Record<string, jest.Mock>;
const mockCofre = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: async (k: string) => mockCofre.get(k) ?? null,
  setItemAsync: async (k: string, v: string) => { if (v.length > 2048) throw new Error('grande demais'); mockCofre.set(k, v); },
  deleteItemAsync: async (k: string) => { mockCofre.delete(k); },
}));

import DefinirSenha from '@/app/definir-senha';
import Entrar from '@/app/entrar';
import { armazenamentoSeguro } from '@/servicos/supabase';

const montar = (ui: React.ReactElement) => render(
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}><ProvedorEstado inicial={estadoInicial()}>{ui}</ProvedorEstado></SafeAreaProvider>);

beforeEach(() => { jest.clearAllMocks(); mockSessao.aviso = null; mockSessao.usuario = null; mockSessao.trocarSenha = false; mockSessao.entrar.mockImplementation(async () => null); });

describe('tela de entrar com conta obrigatória', () => {
  it('não tem "Continuar sem conta", "Criar conta" nem Google; explica que é por convite', async () => {
    await montar(<Entrar />);
    expect(screen.queryByTestId('continuar')).toBeNull();
    expect(screen.queryByTestId('criar-conta')).toBeNull();
    expect(screen.queryByTestId('botao-google')).toBeNull();
    expect(screen.getByText(/acesso ao Quaru é por convite/)).toBeTruthy();
    expect(screen.getByTestId('campo-email').props.editable).toBe(true);
  });
  it('Entrar chama o login com e-mail e senha e volta para o início', async () => {
    await montar(<Entrar />);
    await fireEvent.changeText(screen.getByTestId('campo-email'), 'ana@exemplo.com');
    await fireEvent.changeText(screen.getByTestId('campo-senha'), 'segredo123');
    await fireEvent.press(screen.getByTestId('entrar'));
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/'));
    expect(mockSessao.entrar).toHaveBeenCalledWith('ana@exemplo.com', 'segredo123');
    expect(screen.getByTestId('campo-senha').props.value).toBe(''); // a senha não fica na tela
  });
  it('erro de login aparece e não navega', async () => {
    mockSessao.entrar.mockImplementation(async () => 'E-mail ou senha incorretos.');
    await montar(<Entrar />);
    await fireEvent.changeText(screen.getByTestId('campo-email'), 'ana@exemplo.com');
    await fireEvent.changeText(screen.getByTestId('campo-senha'), 'errada');
    await fireEvent.press(screen.getByTestId('entrar'));
    expect(await screen.findByText('E-mail ou senha incorretos.')).toBeTruthy();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });
  it('campos vazios não chamam o servidor; "Esqueci" pede o e-mail antes', async () => {
    await montar(<Entrar />);
    await fireEvent.press(screen.getByTestId('entrar'));
    expect(mockSessao.entrar).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('esqueci-senha'));
    expect(mockSessao.esqueci).not.toHaveBeenCalled();
    await fireEvent.changeText(screen.getByTestId('campo-email'), 'ana@exemplo.com');
    await fireEvent.press(screen.getByTestId('esqueci-senha'));
    expect(mockSessao.esqueci).toHaveBeenCalledWith('ana@exemplo.com');
    expect(await screen.findByText(/Se o e-mail tiver conta/)).toBeTruthy();
  });
  it('aviso de conta bloqueada vindo da sessão aparece', async () => {
    mockSessao.aviso = 'Seu acesso foi bloqueado. Fale com o administrador do Quaru.';
    await montar(<Entrar />);
    expect(screen.getByText(/acesso foi bloqueado/)).toBeTruthy();
  });
});

describe('dados do aparelho e conta', () => {
  const conta = { id: 'u1', email: 'ana@exemplo.com' };
  const comTreino = () => { const e = acoes.consentir(acoes.entrar(estadoInicial()), { dadosSaude: true }); return acoes.registrarPeso(e, { id: 'p1', pesoKg: 70, medidoEm: '2026-11-01T10:00:00Z', atualizadoEm: '' }); };
  it('primeiro login: os dados que já estavam no aparelho passam a ser da conta', () => {
    const e = acoes.entrarConta(comTreino(), conta);
    expect(e.conta).toEqual(conta);
    expect(e.pesos).toHaveLength(1);
    expect(e.usuario).toBeTruthy();
  });
  it('outra conta com dados no aparelho: recusa (nada se mistura)', () => {
    const e = acoes.entrarConta(comTreino(), conta);
    expect(() => acoes.entrarConta(e, { id: 'u2', email: 'bia@exemplo.com' })).toThrow('outra_conta');
  });
  it('outra conta sem dados pessoais no aparelho: pode entrar', () => {
    const e = acoes.entrarConta(acoes.entrar(estadoInicial()), conta);
    expect(acoes.entrarConta(e, { id: 'u2', email: 'bia@exemplo.com' }).conta?.id).toBe('u2');
  });
});

describe('sessão guardada no Keychain/Keystore', () => {
  it('guarda em pedaços (sessões passam de 2 KB) e lê de volta igual', async () => {
    const grande = 'x'.repeat(5000);
    await armazenamentoSeguro.setItem('sb-token', grande);
    expect(await armazenamentoSeguro.getItem('sb-token')).toBe(grande);
    expect([...mockCofre.keys()].filter((k) => k.startsWith('sb-token.'))).toHaveLength(4); // 3 pedaços + contagem
  });
  it('trocar por um valor menor não deixa pedaço velho; remover apaga tudo', async () => {
    await armazenamentoSeguro.setItem('k', 'a'.repeat(4000));
    await armazenamentoSeguro.setItem('k', 'curto');
    expect(await armazenamentoSeguro.getItem('k')).toBe('curto');
    expect([...mockCofre.keys()].filter((x) => x.startsWith('k.'))).toEqual(['k.0', 'k.n']);
    await armazenamentoSeguro.removeItem('k');
    expect(await armazenamentoSeguro.getItem('k')).toBeNull();
  });
});

describe('senha criada pelo administrador (v0.6.1)', () => {
  it('no 1º acesso pede para criar a própria senha e confere as duas', async () => {
    mockSessao.usuario = { id: 'u1', email: 'amigo@exemplo.com' }; mockSessao.trocarSenha = true;
    await montar(<DefinirSenha />);
    expect(screen.getByText('Por segurança, troque a senha que você recebeu')).toBeTruthy();
    await fireEvent.changeText(screen.getByTestId('nova-senha'), 'MinhaSenha9');
    await fireEvent.changeText(screen.getByTestId('nova-senha-conf'), 'Outra9999');
    await fireEvent.press(screen.getByTestId('salvar-senha'));
    expect(await screen.findByText('As duas senhas não são iguais.')).toBeTruthy();
    expect(mockSessao.definirSenha).not.toHaveBeenCalled();
    await fireEvent.changeText(screen.getByTestId('nova-senha-conf'), 'MinhaSenha9');
    await fireEvent.press(screen.getByTestId('salvar-senha'));
    await waitFor(() => expect(mockSessao.definirSenha).toHaveBeenCalledWith('MinhaSenha9'));
    expect(mockRouter.replace).toHaveBeenCalledWith('/');
  });
});
