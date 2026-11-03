// v0.4.1 – telas: apresentação, Início vazio, logo, foto/avatar, altura/IMC, água, dietas, treinos sugeridos, objetivo.
import { hoje } from '@/dominio/agenda';
import { proximasDatas } from '@/componentes/treinos/depois-de-adicionar';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Inicio from '@/app/(abas)/inicio';
import MeusDados from '@/app/meus-dados';
import Alimentacao from '@/app/(abas)/alimentacao';
import Perfil from '@/app/(abas)/perfil';
import Agua from '@/app/(abas)/agua';
import BoasVindas from '@/app/boas-vindas';
import Consentimentos from '@/app/consentimentos';
import DietaTela from '@/app/dieta/[id]';
import FotoPerfilTela from '@/app/foto-perfil';
import ObjetivoTela from '@/app/objetivo';
import Sobre from '@/app/sobre';
import Treino from '@/app/treino';
import TreinosSugeridos from '@/app/treinos-sugeridos';
import { BIBLIOTECA } from '@/dominio/biblioteca';
import { acoes, estadoInicial, useEstado, type Estado } from '@/estado/armazem';
import { ProvedorEstado } from '@/estado/armazem';

let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), navigate: jest.fn(), canGoBack: () => false }, useLocalSearchParams: () => mockParams }));
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ granted: false })),
  requestCameraPermissionsAsync: jest.fn(async () => ({ granted: false })),
  launchImageLibraryAsync: jest.fn(), launchCameraAsync: jest.fn(),
}));
jest.mock('expo-image-manipulator', () => ({ manipulateAsync: jest.fn(), SaveFormat: { JPEG: 'jpeg' } }));
const { router } = jest.requireMock('expo-router');
const picker = jest.requireMock('expo-image-picker');
afterEach(async () => { await cleanup(); mockParams = {}; jest.clearAllMocks(); });

let ultimo: Estado;
function Espiao() { ultimo = useEstado().estado; return null; }
const montar = (ui: React.ReactElement, e: Estado = estadoInicial()) => render(
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
    <ProvedorEstado inicial={e}>{ui}<Espiao /></ProvedorEstado>
  </SafeAreaProvider>);
const base = () => acoes.concluirApresentacao(acoes.consentir(acoes.entrar(estadoInicial()), { dadosSaude: true }));

describe('apresentação de primeiro acesso', () => {
  it('consentimentos levam à apresentação no primeiro acesso', async () => {
    await montar(<Consentimentos />, acoes.entrar(estadoInicial()));
    await fireEvent.press(screen.getByTestId('salvar-consentimentos'));
    expect(router.replace).toHaveBeenCalledWith('/boas-vindas');
  });
  it('tour: logo e passo 1 de 16; avança e "Sair do tour" marca como visto sem gravar respostas', async () => {
    await montar(<BoasVindas />, acoes.consentir(acoes.entrar(estadoInicial()), { dadosSaude: true }));
    expect(screen.getByLabelText('Quaru')).toBeTruthy();
    expect(screen.getByText('Bem-vindo ao Quaru')).toBeTruthy();
    expect(screen.getByLabelText('Passo 1 de 16')).toBeTruthy();
    expect(screen.getByLabelText('Ilustração de um halter com brilhos')).toBeTruthy();
    expect(screen.queryByTestId('pular-pergunta')).toBeNull(); // passo explicativo não tem pergunta
    await fireEvent.press(screen.getByTestId('proximo-passo'));
    expect(screen.getByText('Como podemos te chamar?')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('pular-apresentacao'));
    expect(ultimo.apresentacaoVistaEm).toBeTruthy();
    expect(ultimo.perfil?.treino ?? null).toBeNull();
    expect(router.replace).toHaveBeenCalledWith('/inicio');
  });
  it('tour: objetivo e áreas gravam a escolha', async () => {
    mockParams = { passo: '5' };
    await montar(<BoasVindas />, acoes.consentir(acoes.entrar(estadoInicial()), { dadosSaude: true }));
    await fireEvent.press(screen.getByTestId('objetivo-forca'));
    await fireEvent.press(screen.getByText('4 dias'));
    await fireEvent.press(screen.getByTestId('proximo-passo'));
    for (let k = 0; k < 4; k++) await fireEvent.press(screen.getByTestId(k === 3 ? 'proximo-passo' : 'pular-pergunta')); // experiência, tempo, equipamentos, Treinos
    await fireEvent.press(screen.getByText('Abdômen/Core'));
    await fireEvent.press(screen.getByTestId('proximo-passo'));
    expect(ultimo.perfil?.treino).toMatchObject({ objetivo: 'forca', dias: 4, areas: ['core'] });
  });
  it('reaberta pelo Perfil (rever=1) não altera a marca', async () => {
    mockParams = { rever: '1' };
    const e = base();
    await montar(<BoasVindas />, e);
    await fireEvent.press(screen.getByTestId('pular-apresentacao'));
    expect(ultimo.apresentacaoVistaEm).toBe(e.apresentacaoVistaEm);
    expect(router.replace).toHaveBeenCalledWith('/perfil');
  });
  it('botões com área mínima de 44 px', async () => {
    await montar(<BoasVindas />);
    const st = (id: string) => [screen.getByTestId(id).props.style].flat(5).reduce((a, b) => ({ ...a, ...(b || {}) }), {});
    expect(st('proximo-passo').height).toBeGreaterThanOrEqual(44);
    expect(st('pular-apresentacao').height).toBeGreaterThanOrEqual(44);
  });
});

describe('Início', () => {
  it('vazio: ilustração, "Comece aqui" 1-2-3, treinos sugeridos e logo', async () => {
    await montar(<Inicio />, base());
    expect(screen.getByLabelText(/alvo acertado/)).toBeTruthy(); // v0.4.2: ilustração do design v2.1
    expect(screen.getByLabelText(/^Passo 1: Monte seu primeiro treino/)).toBeTruthy();
    expect(screen.getByLabelText(/^Passo 3: Registre cada série/)).toBeTruthy();
    expect(screen.getByText('Não sabe por onde começar?')).toBeTruthy();
    expect(screen.getByLabelText('Quaru')).toBeTruthy();
    await fireEvent.press(screen.getByText('Não sabe por onde começar?'));
    expect(router.push).toHaveBeenCalledWith('/treinos-sugeridos');
  });
  it('"Olá, nome" com avatar e "Recomendado para você" pelo objetivo', async () => {
    let e = acoes.definirNome(base(), 'Bia');
    e = acoes.definirAvatar(e, { tipo: 'ilustrado', id: 'a4' });
    e = acoes.definirObjetivo(e, { objetivo: 'emagrecer', nivel: 'iniciante', dias: 4 });
    await montar(<Inicio />, e);
    expect(screen.getByText('Olá, Bia')).toBeTruthy();
    expect(screen.getByLabelText('Avatar com lenço na cabeça')).toBeTruthy();
    expect(screen.getByText('Recomendado para você')).toBeTruthy();
    expect(screen.getByText(/Combine o treino com a parte de Alimentação/)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('adicionar-superiores-i'));
    expect(ultimo.rotinas.map((r) => r.nome)).toContain('Superiores (iniciante)');
  });
});

describe('logo', () => {
  it('no Perfil e no Sobre, com versão; fora do treino em andamento', async () => {
    await montar(<Sobre />);
    expect(screen.getByTestId('rodape-marca')).toBeTruthy();
    expect(screen.getAllByText(/0\.4\.1/).length).toBeGreaterThan(0);
    await cleanup();
    let e = acoes.salvarRotina(base(), { id: 'r', nome: 'A', ordem: 1, atualizadoEm: '', itens: [{ id: 'i', exercicioId: BIBLIOTECA[0].id, ordem: 1, seriesAlvo: 1, repsAlvo: 8, descansoS: 60 }] });
    e = acoes.iniciarSessao(e, { id: 's', rotinaId: 'r', iniciadaEm: new Date().toISOString(), finalizadaEm: null, notas: null, atualizadoEm: '' });
    await montar(<Treino />, e);
    expect(screen.queryByLabelText('Quaru')).toBeNull();
  });
});

describe('Perfil: foto/avatar e altura/IMC', () => {
  it('altura fora de 100–250 mostra erro; válida mostra IMC com o último peso e o aviso', async () => {
    const e = acoes.registrarPeso(base(), { id: 'p', pesoKg: 70, medidoEm: '2026-10-01T10:00:00Z', atualizadoEm: '' });
    await montar(<Perfil />, e);
    await fireEvent.changeText(screen.getByTestId('campo-altura'), '90');
    await fireEvent.press(screen.getByTestId('salvar-altura'));
    expect(screen.getByText(/entre 100 e 250 cm/)).toBeTruthy();
    await fireEvent.changeText(screen.getByTestId('campo-altura'), '175');
    await fireEvent.press(screen.getByTestId('salvar-altura'));
    expect(ultimo.perfil?.alturaCm).toBe(175);
    expect(screen.getByText('IMC 22,9')).toBeTruthy();
    expect(screen.getByText(/De 18,5 a 24,9/)).toBeTruthy();
    expect(screen.getByText(/vale para atletas, gestantes, idosos e menores de 18 anos/)).toBeTruthy();
    expect(screen.getByTestId('rodape-marca')).toBeTruthy();
  });
  it('escolhe avatar, remove; galeria sem permissão avisa e não grava', async () => {
    await montar(<FotoPerfilTela />, base());
    expect(screen.getByLabelText('Sem foto de perfil')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('avatar-a6'));
    expect(ultimo.perfil?.avatar).toEqual({ tipo: 'ilustrado', id: 'a6' });
    await fireEvent.press(screen.getByTestId('remover-avatar'));
    expect(ultimo.perfil?.avatar).toBeNull();
    await fireEvent.press(screen.getByTestId('foto-galeria'));
    expect(picker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled();
    expect(picker.launchImageLibraryAsync).not.toHaveBeenCalled();
    expect(await screen.findByText('Foto não usada')).toBeTruthy();
  });
  it('objetivo pelo Perfil recalcula sem apagar rotinas', async () => {
    const e = acoes.salvarRotina(base(), { id: 'r', nome: 'Minha', ordem: 1, atualizadoEm: '', itens: [] });
    await montar(<ObjetivoTela />, e);
    await fireEvent.press(screen.getByTestId('objetivo-massa'));
    await fireEvent.press(screen.getByTestId('salvar-objetivo'));
    expect(ultimo.perfil?.treino?.objetivo).toBe('massa');
    expect(ultimo.rotinas).toHaveLength(1);
  });
});

describe('água', () => {
  it('+250, +500, desfazer, valor personalizado e aviso fixo', async () => {
    const e = acoes.registrarPeso(base(), { id: 'p', pesoKg: 70, medidoEm: '2026-10-01T10:00:00Z', atualizadoEm: '' });
    await montar(<Agua />, e);
    expect(screen.getByText(/de 2,45 L/)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('agua-250'));
    await fireEvent.press(screen.getByTestId('agua-500'));
    expect(screen.getByText('750 ml')).toBeTruthy();
    await fireEvent.press(screen.getByText('Desfazer'));
    expect(ultimo.agua?.map((a) => a.ml)).toEqual([250]);
    await fireEvent.changeText(screen.getByTestId('agua-outro'), '5000');
    await fireEvent.press(screen.getByTestId('agua-somar'));
    expect(screen.getByText(/de 1 a 3000 ml/)).toBeTruthy();
    await fireEvent.changeText(screen.getByTestId('agua-outro'), '300');
    await fireEvent.press(screen.getByTestId('agua-somar'));
    expect(ultimo.agua?.map((a) => a.ml)).toEqual([250, 300]);
    expect(screen.getByText(/doença renal ou cardíaca, ou restrição de líquidos/)).toBeTruthy();
  });
  it('sem peso: pede o peso ou meta manual', async () => {
    await montar(<Agua />, base());
    expect(screen.getByText(/Registre seu peso para calcular a meta padrão/)).toBeTruthy();
    await fireEvent.changeText(screen.getByTestId('agua-meta'), '2000');
    await fireEvent.press(screen.getByTestId('agua-salvar-meta'));
    expect(ultimo.perfil?.metaAguaMl).toBe(2000);
  });
});

describe('dietas', () => {
  it('Alimentação lista as 8 e mostra o aviso fixo', async () => {
    await montar(<Alimentacao />, base());
    for (const n of ['Vegetariana', 'Vegana', 'Mediterrânea', 'Paleo', 'Cetogênica', 'Low-carb', 'Jejum intermitente', 'Atkins']) expect(screen.getByText(n)).toBeTruthy();
    expect(screen.getByText(/consulte um nutricionista/)).toBeTruthy();
  });
  it('cetogênica mostra alerta, cardápio e "para quem não é indicada"', async () => {
    mockParams = { id: 'cetogenica' };
    await montar(<DietaTela />);
    expect(screen.getByText('Não é para todo mundo')).toBeTruthy();
    expect(screen.getByText('Cardápio de exemplo (1 dia)')).toBeTruthy();
    expect(screen.getByText('Para quem não é indicada')).toBeTruthy();
    expect(screen.getByText(/consulte um nutricionista/)).toBeTruthy();
  });
});

describe('treinos sugeridos', () => {
  it('cartão com tempo, exercícios, equipamento e mapa; filtro por área; adicionar ao plano', async () => {
    await montar(<TreinosSugeridos />, base());
    expect(screen.getByText(/Procure um profissional de educação física/)).toBeTruthy();
    expect(screen.getAllByTestId('mapa-muscular').length).toBe(9); // v0.4.4: + Em casa com elástico; v0.5: + mapa do foco no topo
    expect(screen.getAllByLabelText(/^Mapa muscular: trabalha/).length).toBe(8);
    await fireEvent.press(screen.getAllByText('Inferiores')[0]); // a ficha vem antes dos cartões
    expect(screen.queryByTestId('adicionar-superiores-i')).toBeNull();
    expect(screen.getByTestId('adicionar-inferiores-i')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('adicionar-inferiores-i'));
    expect(ultimo.rotinas[0].nome).toBe('Inferiores (iniciante)');
    // v0.8.1: o cartão pergunta "Começar agora" ou "Agendar"; agendar põe o treino na agenda na data escolhida.
    const id = ultimo.rotinas[0].id;
    expect(screen.getByText(/está em Meus treinos\. E agora\?/)).toBeTruthy();
    expect(screen.getByTestId(`comecar-agora-${id}`)).toBeTruthy();
    await fireEvent.press(screen.getByTestId(`agendar-botao-${id}`));
    await fireEvent.press(screen.getByText('Amanhã'));
    await fireEvent.press(screen.getByTestId(`confirmar-agenda-${id}`));
    const dia = proximasDatas(hoje(), 2)[1];
    expect(ultimo.agenda?.dias[dia]).toBe(id);
    expect(screen.getByText(/agendado: amanhã/)).toBeTruthy();
    await fireEvent.press(screen.getByTestId(`ver-agenda-${id}`));
    expect(router.navigate).toHaveBeenCalledWith('/treinos?secao=agenda');
  });
});

import Refeicoes from '@/app/refeicoes';
describe('ideias de refeições (tela)', () => {
  it('troca de refeição, filtra por etiqueta e mantém o aviso', async () => {
    await montar(<Refeicoes />);
    expect(screen.getByText('Tapioca com ovo e tomate')).toBeTruthy();
    await fireEvent.press(screen.getAllByText('Vegana')[0]); // ficha do filtro
    expect(screen.queryByText('Tapioca com ovo e tomate')).toBeNull();
    expect(screen.getByText('Mingau de aveia com banana')).toBeTruthy();
    await fireEvent.press(screen.getByText('Jantar'));
    expect(screen.getByText('Sopa de legumes com feijão')).toBeTruthy();
    expect(screen.getByText(/procure um nutricionista/)).toBeTruthy();
  });
});

describe('créditos da Domma', () => {
  it('Sobre o app: símbolo oficial, "Desenvolvido por Domma Tecnologia", versão e link para novidades', async () => {
    await montar(<Sobre />);
    expect(screen.getAllByLabelText('Domma Tecnologia').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Desenvolvido por Domma Tecnologia/).length).toBeGreaterThan(0);
    await fireEvent.press(screen.getByTestId('link-novidades'));
    expect(router.push).toHaveBeenCalledWith('/atualizacao');
  });
  it('linha discreta no rodapé do Início', async () => {
    await montar(<Inicio />, base());
    expect(screen.getByText('Desenvolvido por Domma Tecnologia')).toBeTruthy();
  });
});

describe('tour guiado: perguntas', () => {
  const novo = () => acoes.consentir(acoes.entrar(estadoInicial()), { dadosSaude: true });
  it('nome, faixa de idade (aviso para menores) e "Pular esta pergunta" não grava', async () => {
    mockParams = { passo: '2' };
    await montar(<BoasVindas />, novo());
    await fireEvent.changeText(screen.getByTestId('campo-nome-tour'), 'Ana');
    await fireEvent.press(screen.getByTestId('proximo-passo'));
    expect(ultimo.perfil?.nome).toBe('Ana');
    await fireEvent.press(screen.getByText('Menos de 18'));
    expect(screen.getByText(/Menores de 18 anos devem treinar/)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('pular-pergunta'));
    expect(ultimo.perfil?.faixaIdade ?? null).toBeNull();
    expect(screen.getByText('Área: Início')).toBeTruthy();
  });
  it('restrições pedem aviso médico; altura e peso gravam; valores inválidos mostram erro', async () => {
    mockParams = { passo: '11' };
    await montar(<BoasVindas />, novo());
    expect(screen.getByText('Procure um médico')).toBeTruthy();
    await fireEvent.press(screen.getByText('Joelho'));
    await fireEvent.press(screen.getByTestId('proximo-passo'));
    expect(ultimo.perfil?.restricoes).toEqual(['joelho']);
    await fireEvent.changeText(screen.getByTestId('campo-altura-tour'), '90');
    await fireEvent.press(screen.getByTestId('proximo-passo'));
    expect(screen.getByText('Não salvamos')).toBeTruthy();
    await fireEvent.changeText(screen.getByTestId('campo-altura-tour'), '172');
    await fireEvent.changeText(screen.getByTestId('campo-peso-tour'), '70,5');
    await fireEvent.press(screen.getByTestId('proximo-passo'));
    expect(ultimo.perfil?.alturaCm).toBe(172);
    expect(ultimo.pesos.at(-1)?.pesoKg).toBe(70.5);
    expect(screen.getByText('Área: Alimentação')).toBeTruthy();
  });
  it('sem consentimento de saúde, restrições não aparecem para marcar', async () => {
    mockParams = { passo: '11' };
    await montar(<BoasVindas />, acoes.consentir(acoes.entrar(estadoInicial()), { dadosSaude: false }));
    expect(screen.getByText('Dados de saúde desativados')).toBeTruthy();
    expect(screen.queryByText('Joelho')).toBeNull();
  });
  it('preferência, lembrete de água (permissão só ao ativar) e cidade/bairro digitados', async () => {
    mockParams = { passo: '13' };
    await montar(<BoasVindas />, novo());
    await fireEvent.press(screen.getByText('Vegetariana'));
    await fireEvent.press(screen.getByTestId('proximo-passo'));
    expect(ultimo.perfil?.prefAlimentar).toBe('vegetariana');
    await fireEvent(screen.getByTestId('lembrete-agua'), 'valueChange', true);
    expect(await screen.findByText(/Preferência salva/)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('proximo-passo'));
    expect(ultimo.perfil?.lembretes).toEqual({ treinoHora: null, agua: true });
    expect(screen.getByText(/não usa a sua localização/)).toBeTruthy();
    await fireEvent.changeText(screen.getByTestId('campo-cidade'), '  Cidade Exemplo ');
    await fireEvent.press(screen.getByTestId('proximo-passo'));
    expect(ultimo.perfil?.cidade).toBe('Cidade Exemplo');
    expect(screen.getByText('Perfil: tudo editável')).toBeTruthy();
  });
  it('Meus dados edita e limpa respostas', async () => {
    const e = acoes.atualizarPerfil(base(), { experiencia: 'parado', cidade: 'X' });
    await montar(<MeusDados />, e);
    await fireEvent.press(screen.getByText('1 a 3 anos'));
    await fireEvent.press(screen.getByTestId('salvar-experiencia'));
    expect(ultimo.perfil?.experiencia).toBe('1-3');
    await fireEvent.press(screen.getByTestId('limpar-cidade'));
    expect(ultimo.perfil?.cidade).toBeNull();
  });
  it('Início usa os dados: em casa primeiro e aviso de restrição; Perfil não mostra faixa de IMC para menor', async () => {
    let e = acoes.definirObjetivo(base(), { objetivo: 'saude', nivel: 'iniciante', dias: 3, areas: [] });
    e = acoes.atualizarPerfil(e, { local: 'casa', restricoes: ['joelho'], faixaIdade: 'menos-18' });
    await montar(<Inicio />, e);
    expect(screen.getAllByText(/procure um médico ou fisioterapeuta/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Menores de 18 anos devem treinar/).length).toBeGreaterThan(0);
    await cleanup();
    e = acoes.registrarPeso(acoes.definirAltura(e, 160), { id: 'p', pesoKg: 50, medidoEm: new Date().toISOString(), atualizadoEm: new Date().toISOString() });
    await montar(<Perfil />, e);
    expect(screen.getByText(/não se aplica a menores de 18/)).toBeTruthy();
    expect(screen.queryByText(/Faixa da OMS para adultos/)).toBeNull();
  });
});
