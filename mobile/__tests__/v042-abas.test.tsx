// v0.4.2 – abas do design (Início, Treinos, Alimentação, Água, Perfil), seções de Treinos, redirecionamentos e slogan v2.2.
import { fireEvent, render, screen } from '@testing-library/react-native';
const { readdirSync } = require('fs') as { readdirSync: (p: string) => string[] };
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ABAS } from '@/app/(abas)/_layout';
import Historico from '@/app/historico';
import Rotinas from '@/app/rotinas';
import Treinos, { SECOES_TREINOS } from '@/app/(abas)/treinos';
import Entrar from '@/app/entrar';
import { marca } from '@/config/marca';
import { acoes, estadoInicial, ProvedorEstado } from '@/estado/armazem';

let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => {
  const { Text } = require('react-native');
  return { router: { navigate: jest.fn(), push: jest.fn(), replace: jest.fn(), back: jest.fn(), setParams: jest.fn() }, useLocalSearchParams: () => mockParams,
    Redirect: ({ href }: { href: string }) => <Text testID="redirect">{href}</Text> };
});
const router = jest.requireMock('expo-router').router as Record<string, jest.Mock>;

const montar = (ui: React.ReactElement, e = acoes.carregarExemplo(acoes.entrar(estadoInicial()))) => render(
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}><ProvedorEstado inicial={e}>{ui}</ProvedorEstado></SafeAreaProvider>);
beforeEach(() => { jest.clearAllMocks(); mockParams = {}; });

describe('abas do design', () => {
  it('ordem e nomes: Início, Treinos, Alimentação, Água e Perfil', () => {
    expect(ABAS.map((a) => a.titulo)).toEqual(['Início', 'Treinos', 'Alimentação', 'Água', 'Perfil']);
  });
  it('toda aba tem arquivo de rota', () => {
    const arquivos = readdirSync('src/app/(abas)').map((f) => f.replace(/\.tsx$/, ''));
    for (const a of ABAS) expect(arquivos).toContain(a.nome);
  });
  it('rota antiga /rotinas abre Meus treinos', async () => {
    await montar(<Rotinas />);
    expect((await screen.findByTestId('redirect')).props.children).toBe('/treinos?secao=meus');
  });
  it('rota antiga /historico abre a seção Histórico', async () => {
    await montar(<Historico />);
    expect((await screen.findByTestId('redirect')).props.children).toBe('/treinos?secao=historico');
  });
});

describe('aba Treinos', () => {
  it('três seções: Meus treinos, Sugeridos e Histórico', () => {
    expect(SECOES_TREINOS.map((s) => s.rotulo)).toEqual(['Meus treinos', 'Sugeridos', 'Histórico']);
  });
  it('Meus treinos é o padrão, lista as rotinas e tem "Nova rotina"', async () => {
    await montar(<Treinos />);
    expect(await screen.findByText('Nova rotina')).toBeTruthy();
    expect(screen.getAllByText(/Treino A/).length).toBeGreaterThan(0);
    await fireEvent.press(screen.getByTestId('nova-rotina'));
    expect(router.push).toHaveBeenCalledWith('/rotina/nova');
  });
  it('trocar de seção atualiza o parâmetro', async () => {
    await montar(<Treinos />);
    await fireEvent.press(await screen.findByRole('tab', { name: 'Histórico' }));
    expect(router.navigate).toHaveBeenCalledWith('/treinos?secao=historico');
  });
  it('Sugeridos mostra os modelos sem o botão "Nova rotina"', async () => {
    mockParams = { secao: 'sugeridos' };
    await montar(<Treinos />);
    expect(await screen.findByText('Antes de começar')).toBeTruthy();
    expect(screen.queryByText('Nova rotina')).toBeNull();
  });
  it('Histórico lista treinos finalizados e abre o resumo', async () => {
    mockParams = { secao: 'historico' };
    await montar(<Treinos />);
    const cartoes = await screen.findAllByText(/exercícios · /);
    expect(cartoes.length).toBeGreaterThan(0);
  });
  it('Histórico vazio leva ao Início', async () => {
    mockParams = { secao: 'historico' };
    await montar(<Treinos />, acoes.entrar(estadoInicial()));
    await fireEvent.press(await screen.findByText('Ir para o Início'));
    expect(router.push).toHaveBeenCalledWith('/inicio');
  });
});

describe('slogan do login v2.2', () => {
  it('logo abaixo do logo, branco, Inter 18/600, centralizado, texto da variável única', async () => {
    await montar(<Entrar />, estadoInicial());
    const s = await screen.findByTestId('slogan');
    expect(s.props.children).toBe(marca.slogan);
    expect(marca.slogan).toBe('Seu treino, no seu ritmo.');
    const st = StyleSheet.flatten(s.props.style);
    expect(st).toMatchObject({ color: '#FFFFFF', fontFamily: 'Inter', fontSize: 18, fontWeight: '600', textAlign: 'center' });
    expect(screen.getAllByTestId('slogan')).toHaveLength(1);
    expect(screen.queryByText('[slogan a definir]')).toBeNull();
  });
});
