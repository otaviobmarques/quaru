// v0.4.3 – Sair (tela 05b) e Sair e apagar (folha 05c), com os ajustes da revisão de perfil.tsx.
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Perfil from '@/app/(abas)/perfil';
import Sair, { TEXTO_SAIR } from '@/app/sair';
import Entrar from '@/app/entrar';
import { confirmacaoValida, FolhaApagar, TEXTOS_APAGAR } from '@/componentes/folha-apagar';
import { Botao, sobreErro } from '@/componentes/ui';
import { BIBLIOTECA } from '@/dominio/biblioteca';
import { acoes, estadoInicial, ProvedorEstado, useEstado, type Estado } from '@/estado/armazem';
import { encerrarSessaoRemota } from '@/servicos/sessao';
import { temas } from '@/tema/tokens';
import { contraste } from './contraste.test';

let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => false }, useLocalSearchParams: () => mockParams }));
const router = jest.requireMock('expo-router').router as Record<string, jest.Mock>;
let ultimo: Estado;
function Espiao() { ultimo = useEstado().estado; return null; }
const montar = (ui: React.ReactElement, e: Estado = comDados()) => render(
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}><ProvedorEstado inicial={e}>{ui}<Espiao /></ProvedorEstado></SafeAreaProvider>);
function comDados() {
  return acoes.salvarRotina(acoes.concluirApresentacao(acoes.consentir(acoes.entrar(estadoInicial()), { dadosSaude: true })),
    { id: 'r1', nome: 'Meu treino', ordem: 1, atualizadoEm: '', itens: [{ id: 'i', exercicioId: BIBLIOTECA[0].id, ordem: 0, seriesAlvo: 3, repsAlvo: 10, descansoS: 90 }] });
}
const estilo = (el: { props: Record<string, unknown> }) => [el.props.style].flat(9).reduce((a: object, b) => ({ ...a, ...((b as object) || {}) }), {}) as Record<string, unknown>;
beforeEach(() => { jest.clearAllMocks(); mockParams = {}; });

describe('Sair (mantém os dados)', () => {
  it('sem autenticação real, encerrar a sessão remota não faz nada (pronto para o Supabase, ADR-0017)', async () => {
    expect(await encerrarSessaoRemota()).toBe('sem-autenticacao');
  });
  it('acao sair só desliga o usuário e mantém todo o resto', () => {
    const e = comDados(); const s = acoes.sair(e);
    expect(s.usuario).toBeNull();
    expect({ ...s, usuario: e.usuario }).toEqual(e);
  });
  it('B5: no Perfil, "Sair" é o botão principal comum e abre a tela Sair', async () => {
    await montar(<Perfil />);
    const b = await screen.findByTestId('ir-sair');
    expect(estilo(b).backgroundColor).toBe(temas.claro['acao-sobre-fundo']); // v3.2: principal direto sobre o rosa = ação escura
    await fireEvent.press(b);
    expect(router.push).toHaveBeenCalledWith('/sair');
    expect(screen.queryByText('Sair e apagar meus dados deste aparelho')).toBeNull(); // o apagar fica na tela Sair
  });
  it('tela Sair: ilustração da RedBox com descrição, texto do design e Sair mantendo os dados', async () => {
    await montar(<Sair />);
    expect((await screen.findByTestId('ilustracao-sair')).props.accessibilityLabel).toBe('Pessoa acenando ao lado de uma porta aberta');
    expect(screen.getByText(TEXTO_SAIR)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('sair'));
    expect(router.replace).toHaveBeenCalledWith('/entrar');
    expect(ultimo.usuario).toBeNull();
    expect(ultimo.rotinas.find((r) => r.id === 'r1')).toBeTruthy();
  });
  it('depois de Sair, "Continuar sem conta" retoma de onde parou', async () => {
    await montar(<Entrar />, acoes.sair(comDados()));
    await fireEvent.press(await screen.findByTestId('continuar'));
    expect(router.replace).toHaveBeenCalledWith('/');
    expect(ultimo.rotinas.find((r) => r.id === 'r1')).toBeTruthy();
  });
  it('link antigo /perfil?excluir=1 abre a folha na tela Sair', async () => {
    mockParams = { excluir: '1' };
    await montar(<Perfil />);
    expect(router.replace).toHaveBeenCalledWith('/sair?apagar=1');
  });
});

describe('Sair e apagar (folha)', () => {
  it('B1: aviso de cópia aponta para o item real "Exportar meus dados" do Perfil', async () => {
    expect(TEXTOS_APAGAR.copia).toBe('Se quiser guardar uma cópia, exporte antes em Perfil › Exportar meus dados.');
    await montar(<Perfil />);
    expect(await screen.findByText('Exportar meus dados')).toBeTruthy();
  });
  it('B3: campo vazio, "Digite aqui" de exemplo e ajuda sobre maiúsculas; aceita minúsculas e espaços nas pontas', async () => {
    mockParams = { apagar: '1' };
    await montar(<Sair />);
    const campo = await screen.findByTestId('campo-confirmar');
    expect(campo.props.value).toBe('');
    expect(campo.props.placeholder).toBe('Digite aqui');
    expect(screen.getByText(TEXTOS_APAGAR.ajuda)).toBeTruthy();
    expect(confirmacaoValida('  excluir ')).toBe(true);
    expect(confirmacaoValida('EXCLUI')).toBe(false);
  });
  it('B4+B5: "Apagar e sair" em vermelho sólido, focável e anunciado como desativado até digitar EXCLUIR', async () => {
    mockParams = { apagar: '1' };
    await montar(<Sair />);
    const b = await screen.findByTestId('confirmar-apagar');
    expect(b.props.accessibilityState.disabled).toBe(true);
    // aria-disabled: o RN converte em accessibilityState; na web vira aria-disabled="true" (conferido no DOM das capturas).
    expect(b.props.focusable).not.toBe(false); // continua alcançável pelo teclado/leitor de tela
    expect(estilo(b).backgroundColor).toBe(temas.claro.erro);
    await fireEvent.press(b);
    expect(ultimo.rotinas.length).toBeGreaterThan(0); // clique barrado no Botao
    await fireEvent.changeText(screen.getByTestId('campo-confirmar'), 'excluir');
    expect(screen.getByTestId('confirmar-apagar').props.accessibilityState.disabled).toBe(false);
    expect(screen.getByText(TEXTOS_APAGAR.confirmado)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('confirmar-apagar'));
    expect(ultimo.rotinas).toHaveLength(0);
    expect(ultimo.usuario).toBeNull();
    expect(router.replace).toHaveBeenCalledWith('/entrar');
  });
  it('B6: com a folha aberta, a tela de trás sai da árvore de acessibilidade e a folha é modal', async () => {
    mockParams = { apagar: '1' };
    await montar(<Sair />);
    const tras = await screen.findByTestId('tela-sair', { includeHiddenElements: true });
    expect(tras.props.importantForAccessibility).toBe('no-hide-descendants');
    expect(tras.props['aria-hidden']).toBe(true);
    const folha = screen.getByTestId('folha-apagar');
    expect(folha.props.accessibilityViewIsModal).toBe(true);
    expect(folha.props['aria-modal']).toBe(true);
    expect(screen.queryByTestId('sair')).toBeNull(); // botões de trás não são alcançáveis
  });
  it('B2: falha ao apagar mostra "Não foi possível concluir. Tente de novo." (sem prometer que nada mudou) e deixa tentar de novo', async () => {
    let n = 0;
    const onConfirmar = jest.fn(async () => { n += 1; if (n === 1) throw new Error('falhou'); });
    await montar(<FolhaApagar aberta onFechar={() => {}} onConfirmar={onConfirmar} />);
    await fireEvent.changeText(await screen.findByTestId('campo-confirmar'), 'EXCLUIR');
    await fireEvent.press(screen.getByTestId('confirmar-apagar'));
    expect(await screen.findByText('Não foi possível concluir. Tente de novo.')).toBeTruthy();
    expect(screen.queryByText(/não foram alterados/)).toBeNull();
    await fireEvent.press(screen.getByText('Tentar de novo'));
    expect(onConfirmar).toHaveBeenCalledTimes(2);
  });
  it('Botao desativado no app todo: focável, aria-disabled e sem disparar onPress', async () => {
    const f = jest.fn();
    await render(<Botao titulo="X" desabilitado onPress={f} testID="b" />);
    const b = screen.getByTestId('b');
    expect(b.props.accessibilityState.disabled).toBe(true);
    expect(b.props.focusable).not.toBe(false);
    await fireEvent.press(b);
    expect(f).not.toHaveBeenCalled();
  });
  it.each(['claro', 'escuro'] as const)('texto do botão perigo ≥ 4,5:1 sobre o vermelho (%s)', (t) => {
    expect(contraste(sobreErro(temas[t].erro), temas[t].erro)).toBeGreaterThanOrEqual(4.5);
  });
});
