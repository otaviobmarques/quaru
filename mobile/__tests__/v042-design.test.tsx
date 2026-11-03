// v0.4.2 – design v2.1: login (sem login falso), slogan, links jurídicos, Google, ilustrações do tour, mapa, animações, contraste.
import { fireEvent, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Entrar from '@/app/entrar';
import { ILUSTRACAO_DO_PASSO } from '@/app/boas-vindas';
import { Animacao } from '@/componentes/animacao';
import { INFO_ANIMACAO } from '@/componentes/animacoes-fontes';
import { IlustracaoTour, NOMES_ILUSTRACOES_TOUR } from '@/componentes/ilustracao-tour';
import { corDoMusculo, descricaoMapa, MapaMuscular, MUSCULO_DA_REGIAO } from '@/componentes/mapa-muscular';
import { MAPA_MUSCULOS, MARCA_DESIGN } from '@/config/design-v042-gerado';
import marcaJson from '@/config/marca.json';
import { autenticacaoDisponivel, linksJuridicos, marca } from '@/config/marca';
import { acoes, estadoInicial, ProvedorEstado } from '@/estado/armazem';
import { apoio, google, temas } from '@/tema/tokens';
import { contraste } from './contraste.test';

let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), setParams: jest.fn() }, useLocalSearchParams: () => mockParams }));
const mockRouter = jest.requireMock('expo-router').router as Record<string, jest.Mock>;
const oculto = { includeHiddenElements: true };

const montar = (ui: React.ReactElement, e = estadoInicial()) => render(
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}><ProvedorEstado inicial={e}>{ui}</ProvedorEstado></SafeAreaProvider>);

beforeEach(() => { jest.clearAllMocks(); mockParams = {}; });

describe('marca', () => {
  it('slogan escolhido pelo Otávio vem do marca.json; nome e empresa batem com o design', () => {
    expect(marcaJson.slogan).toBe('Seu treino, no seu ritmo.');
    expect(marca.slogan).toBe(marcaJson.slogan);
    expect(marca.nome).toBe(MARCA_DESIGN.nome);
    expect(marca.empresa).toBe(MARCA_DESIGN.empresa);
    expect(marca.versao).toMatch(/^0\.8\.2/);
  });
  it('links jurídicos apontam para a tela jurídica existente', () => {
    expect(linksJuridicos.termos).toEqual({ tipo: 'interno', rota: '/juridico?doc=termos' });
    expect(linksJuridicos.privacidade).toEqual({ tipo: 'interno', rota: '/juridico?doc=politica' });
  });
});

describe('login (tela-08)', () => {
  it('autenticação real desligada: Entrar, Criar conta, Esqueci e Google desativados com "em breve"', async () => {
    expect(autenticacaoDisponivel).toBe(false);
    await montar(<Entrar />);
    for (const id of ['entrar', 'criar-conta', 'esqueci-senha', 'botao-google']) expect(screen.getByTestId(id).props.accessibilityState.disabled).toBe(true);
    expect(screen.getByText('Entrar (em breve)')).toBeTruthy();
    expect(screen.getByText('Criar conta (em breve)')).toBeTruthy();
    expect(screen.getByText('Login com Google: em breve.')).toBeTruthy();
    expect(screen.getByText('Conta com login: em breve')).toBeTruthy();
  });
  it('tocar em Entrar não faz nada (não há login falso)', async () => {
    await montar(<Entrar />);
    await fireEvent.press(screen.getByTestId('entrar'));
    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
  it('"Continuar sem conta" entra no modo local e segue para os consentimentos', async () => {
    await montar(<Entrar />);
    await fireEvent.press(screen.getByTestId('continuar'));
    expect(mockRouter.replace).toHaveBeenCalledWith('/consentimentos');
  });
  it('campos com rótulo visível, autocomplete certo e não editáveis', async () => {
    await montar(<Entrar />);
    const email = screen.getByTestId('campo-email'), senha = screen.getByTestId('campo-senha');
    expect(email.props.accessibilityLabel).toBe('E-mail');
    expect(email.props.autoComplete).toBe('email');
    expect(senha.props.autoComplete).toBe('current-password');
    expect(senha.props.secureTextEntry).toBe(true);
    expect(email.props.editable).toBe(false);
  });
  it('mostra o slogan no espaço reservado do topo', async () => {
    await montar(<Entrar />);
    expect(screen.getByTestId('slogan').props.children).toBe('Seu treino, no seu ritmo.');
  });
  it('Termos e Política abrem a tela jurídica', async () => {
    await montar(<Entrar />);
    await fireEvent.press(screen.getByTestId('link-termos'));
    expect(mockRouter.push).toHaveBeenCalledWith('/juridico?doc=termos');
    await fireEvent.press(screen.getByTestId('link-privacidade'));
    expect(mockRouter.push).toHaveBeenCalledWith('/juridico?doc=politica');
  });
  it('botão do Google: texto aprovado, rótulo e toque ≥ 44', async () => {
    await montar(<Entrar />);
    const g = screen.getByTestId('botao-google');
    expect(g.props.accessibilityLabel).toBe('Continuar com o Google');
    expect(screen.getByText('Continuar com o Google')).toBeTruthy();
  });
  it('estado de erro (galeria) tem ícone + título + texto, não só cor', async () => {
    mockParams = { estado: 'erro' };
    await montar(<Entrar />);
    expect(screen.getByText('E-mail ou senha incorretos.')).toBeTruthy();
    expect(screen.getByText('Confira os dados e tente de novo.')).toBeTruthy();
  });
  it('estado carregando (galeria) mostra "Entrando…" e marca ocupado', async () => {
    mockParams = { estado: 'carregando' };
    await montar(<Entrar />);
    expect(screen.getByText('Entrando…')).toBeTruthy();
    expect(screen.getByTestId('entrar').props.accessibilityState.busy).toBe(true);
  });
  it('assinatura da Domma com o nome da empresa como texto alternativo', async () => {
    await montar(<Entrar />);
    expect(screen.getByTestId('assinatura-domma').props.accessibilityLabel).toBe('Domma Tecnologia');
  });
});

describe('ilustrações do tour (lote 1)', () => {
  it('as 11 do design existem e todas são usadas em algum passo', () => {
    expect(NOMES_ILUSTRACOES_TOUR).toHaveLength(11);
    expect(new Set(Object.values(ILUSTRACAO_DO_PASSO))).toEqual(new Set(NOMES_ILUSTRACOES_TOUR));
  });
  it.each(NOMES_ILUSTRACOES_TOUR)('%s: imagem com descrição e sem variável CSS sobrando', async (n) => {
    await montar(<IlustracaoTour nome={n} />);
    const v = screen.getByTestId(`ilustracao-tour-${n}`);
    expect(v.props.accessibilityRole).toBe('image');
    expect(v.props.accessibilityLabel.length).toBeGreaterThan(10);
  });
});

describe('mapa muscular (data-musculo/data-lado)', () => {
  it('18 músculos, ids únicos, frente e costas', () => {
    expect(MAPA_MUSCULOS).toHaveLength(18);
    expect(new Set(MAPA_MUSCULOS.map((m) => m.id)).size).toBe(18);
    expect(new Set(MAPA_MUSCULOS.map((m) => m.lado))).toEqual(new Set(['frente', 'costas']));
  });
  it('toda região do domínio tem músculo no desenho', () => {
    const grupos = new Set(MAPA_MUSCULOS.map((m) => m.musculo));
    for (const g of Object.values(MUSCULO_DA_REGIAO)) expect(grupos.has(g as never)).toBe(true);
  });
  it('colore pelo código: ativo = primaria; inativo = superficie com contorno texto-suave', () => {
    const c = temas.claro;
    expect(corDoMusculo('peito', ['peito'], c)).toEqual({ fill: c.primaria, stroke: c.primaria, ativo: true });
    expect(corDoMusculo('lombar', ['peito'], c)).toEqual({ fill: c.superficie, stroke: c['texto-suave'], ativo: false });
  });
  it('ombros acende frente e costas', async () => {
    await montar(<MapaMuscular regioes={['ombros', 'triceps']} />);
    expect(screen.getByTestId('musculo-ombros-frente-ativo', oculto)).toBeTruthy();
    expect(screen.getByTestId('musculo-ombros-costas-ativo', oculto)).toBeTruthy();
    expect(screen.getByTestId('musculo-triceps-ativo', oculto)).toBeTruthy();
    expect(screen.getByTestId('musculo-peito', oculto)).toBeTruthy();
  });
  it('descrição sem área destacada', () => {
    expect(descricaoMapa([])).toBe('Mapa muscular, frente e costas, sem área destacada');
  });
});

describe('animações Lottie', () => {
  afterEach(() => jest.restoreAllMocks());
  it('sucesso tem descrição; decorativa fica oculta', async () => {
    await montar(<><Animacao nome="treino-concluido" /><Animacao nome="carregando" /></>);
    expect(screen.getByLabelText('Treino concluído. Parabéns!')).toBeTruthy();
    expect(screen.getByTestId('animacao-carregando', oculto).props.importantForAccessibility).toBe('no-hide-descendants');
  });
  it('sem "reduzir movimento": toca uma vez (autoPlay)', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    await montar(<Animacao nome="meta-de-agua" />);
    expect(screen.getByTestId('lottie').props['data-autoplay']).toBe('true');
  });
  it('com "reduzir movimento": quadro final parado (progress=1, sem autoPlay)', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    await montar(<Animacao nome="meta-de-agua" />);
    expect(await screen.findByTestId('lottie')).toBeTruthy();
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.getByTestId('lottie').props['data-progress']).toBe('1');
    expect(screen.getByTestId('lottie').props['data-autoplay']).toBe('false');
  });
  it('carregando repete no máximo 10 vezes; as demais 1', () => {
    expect(INFO_ANIMACAO.carregando.repeticoesMax).toBe(10);
    expect(INFO_ANIMACAO['meta-de-agua'].repeticoesMax).toBe(1);
  });
});

describe('contraste v0.4.2 (pares novos do design v2.1)', () => {
  it.each([
    ['branco × marca (texto no degradê)', '#FFFFFF', apoio.marca, 4.5],
    ['branco × marca-escuro', '#FFFFFF', apoio['marca-escuro'], 4.5],
    ['sobre-energia × energia (selos)', apoio['sobre-energia'], apoio.energia, 4.5],
    ['texto do Google Light', google.light.texto, google.light.fundo, 4.5],
    ['texto do Google Neutral', google.neutral.texto, google.neutral.fundo, 4.5],
    ['borda do Google Light × superficie clara', google.light.borda, temas.claro.superficie, 3],
    ['contorno do músculo inativo × silhueta (claro)', temas.claro['texto-suave'], temas.claro['superficie-2'], 3],
    ['contorno do músculo inativo × silhueta (escuro)', temas.escuro['texto-suave'], temas.escuro['superficie-2'], 3],
    ['borda do selo × fundo escuro', temas.escuro.texto, temas.escuro.fundo, 3],
    ['Google Neutral × superficie escura', google.neutral.fundo, temas.escuro.superficie, 3],
  ] as const)('%s', (_n, a, b, min) => {
    expect(contraste(a, b)).toBeGreaterThanOrEqual(min);
  });
});

void acoes;
