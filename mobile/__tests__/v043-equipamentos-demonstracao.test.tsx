// v0.4.3 – equipamentos (tour, Meus dados, recomendação) e demonstração dos exercícios nos treinos adicionados.
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import BoasVindas from '@/app/boas-vindas';
import MeusDados from '@/app/meus-dados';
import RotinaTela from '@/app/rotina/[id]';
import Treino from '@/app/treino';
import { ConteudoSugeridos } from '@/app/treinos-sugeridos';
import { BIBLIOTECA } from '@/dominio/biblioteca';
import {
  adaptarModelo, alternativaPara, EQUIPAMENTOS_LISTA, equipamentosDoExercicio, equipamentosDoPerfil, equipamentosPadrao, lacunasDoCatalogo, modeloAdaptado, temEquipamento,
} from '@/dominio/equipamentos';
import { imagemDoExercicio } from '@/dominio/imagens-exercicios';
import { recomendarPara } from '@/dominio/tour';
import { MODELOS, rotinaDoModelo } from '@/dominio/treinos-sugeridos';
import { acoes, estadoInicial, migrarEstado, ProvedorEstado, useEstado, type Estado } from '@/estado/armazem';

let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => false }, useLocalSearchParams: () => mockParams }));
const router = jest.requireMock('expo-router').router as Record<string, jest.Mock>;
let ultimo: Estado;
function Espiao() { ultimo = useEstado().estado; return null; }
const montar = (ui: React.ReactElement, e: Estado) => render(
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}><ProvedorEstado inicial={e}>{ui}<Espiao /></ProvedorEstado></SafeAreaProvider>);
const base = () => acoes.concluirApresentacao(acoes.consentir(acoes.entrar(estadoInicial()), { dadosSaude: true }));
beforeEach(() => { jest.clearAllMocks(); mockParams = {}; });
const n = (nome: string) => BIBLIOTECA.find((e) => e.nome === nome)!;

describe('equipamentos: domínio', () => {
  it('10 opções; padrão: academia marca tudo, casa e ar livre só o peso do corpo', () => {
    expect(EQUIPAMENTOS_LISTA).toHaveLength(10);
    expect(equipamentosPadrao('academia')).toHaveLength(10);
    expect(equipamentosPadrao('casa')).toEqual(['peso-corpo']);
    expect(equipamentosPadrao('ar-livre')).toEqual(['peso-corpo']);
    expect(equipamentosDoPerfil({ local: 'casa' })).toEqual(['peso-corpo']);
    expect(equipamentosDoPerfil({ local: 'casa', equipamentos: ['halteres'] })).toEqual(['halteres']);
    expect(equipamentosDoPerfil({})).toBeNull();
  });
  it('todo exercício do catálogo pede ao menos um equipamento conhecido, ou fica "Não informado" (fora das trocas)', () => {
    for (const e of BIBLIOTECA) expect(equipamentosDoExercicio(e).length > 0 || e.equipamento === 'Não informado').toBe(true);
    for (const e of BIBLIOTECA.filter((x) => x.equipamento === 'Não informado')) expect(temEquipamento(e, equipamentosPadrao('academia'))).toBe(false);
    expect(temEquipamento(n('Supino reto com barra'), ['barra-anilhas'])).toBe(false); // precisa de banco
  });
  it('alternativa sempre do catálogo, do mesmo grupo e possível com o equipamento', () => {
    const alt = alternativaPara(n('Supino reto com barra'), ['peso-corpo'])!;
    expect(BIBLIOTECA).toContain(alt);
    expect(alt.grupoMuscular).toBe('Peito');
    expect(temEquipamento(alt, ['peso-corpo'])).toBe(true);
    expect(alternativaPara(n('Leg press 45°'), ['peso-corpo'])?.nome).toBe('Agachamento com peso do corpo'); // v0.4.4: lacuna coberta
    expect(alternativaPara(n('Rosca direta'), ['peso-corpo'])).toBeNull(); // lacuna que continua: bíceps sem equipamento
  });
  it('lacunas (v0.4.4): só com peso do corpo ainda faltam ombros, bíceps e antebraço; costas, pernas e tríceps cobertos', () => {
    expect(lacunasDoCatalogo(['peso-corpo']).sort()).toEqual(['Antebraço', 'Bíceps', 'Ombros'].sort());
    expect(lacunasDoCatalogo(['peso-corpo', 'elastico']).sort()).toEqual(['Antebraço', 'Bíceps'].sort());
  });
  it('modelo adaptado só tem exercícios do catálogo; sem opção nenhuma, mantém o original', () => {
    for (const m of MODELOS) for (const tem of [['peso-corpo'], ['halteres', 'banco'], equipamentosPadrao('academia')] as const) {
      const a = modeloAdaptado(m, [...tem]);
      for (const i of a.itens) expect(BIBLIOTECA.some((e) => e.nome === i.nome)).toBe(true);
    }
    const semNada = MODELOS.find((m) => adaptarModelo(m, ['peso-corpo']).every((x) => !x.usar));
    if (semNada) expect(modeloAdaptado(semNada, ['peso-corpo'])).toBe(semNada);
    expect(adaptarModelo(MODELOS.find((m) => m.id === 'casa-i')!, ['peso-corpo']).every((x) => !x.troca)).toBe(true);
  });
  it('Recomendado para você: em casa, treinos sem aparelho vêm primeiro; com tudo marcado nada muda', () => {
    const t = { objetivo: 'massa', nivel: 'iniciante', dias: 3, areas: [] } as never;
    expect(recomendarPara(t, { equipamentos: ['peso-corpo'] }).modelos[0].id).toMatch(/^casa/);
    const tudo = recomendarPara(t, { equipamentos: equipamentosPadrao('academia') }).modelos.map((m) => m.id);
    expect(tudo).toEqual(recomendarPara(t, {}).modelos.map((m) => m.id));
  });
});

describe('equipamentos: telas', () => {
  it('tour: passo logo depois de "Tempo e lugar", com padrão do local e gravação', async () => {
    mockParams = { passo: '8' };
    await montar(<BoasVindas />, acoes.atualizarPerfil(base(), { local: 'casa' }));
    expect(await screen.findByText('Seus equipamentos')).toBeTruthy();
    expect(screen.getByText('Marcamos só o peso do corpo. Marque o que você tiver.')).toBeTruthy();
    await fireEvent.press(screen.getByText('Halteres'));
    await fireEvent.press(screen.getByTestId('proximo-passo'));
    expect(ultimo.perfil?.equipamentos?.sort()).toEqual(['halteres', 'peso-corpo']);
  });
  it('Perfil → Meus dados: edita e limpa os equipamentos', async () => {
    await montar(<MeusDados />, acoes.atualizarPerfil(base(), { local: 'academia', equipamentos: ['halteres'] }));
    await fireEvent.press(await screen.findByText('Barra fixa'));
    await fireEvent.press(screen.getByTestId('salvar-equipamentos'));
    expect(ultimo.perfil?.equipamentos?.sort()).toEqual(['barra-fixa', 'halteres']);
    await fireEvent.press(screen.getByTestId('limpar-equipamentos'));
    expect(ultimo.perfil?.equipamentos ?? null).toBeNull();
  });
  it('Sugeridos: troca mostrada e aviso quando falta opção; o treino adicionado usa a troca', async () => {
    await montar(<ConteudoSugeridos />, acoes.atualizarPerfil(base(), { equipamentos: ['peso-corpo'] }));
    expect((await screen.findAllByText(/No lugar de Supino inclinado com halteres/)).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Falta equipamento').length).toBeGreaterThan(0);
    await fireEvent.press(screen.getByTestId('adicionar-superiores-i'));
    const r = ultimo.rotinas.at(-1)!;
    expect(r.itens.map((i) => i.exercicioId)).toContain(n('Flexão de braço').id);
    expect(r.itens.map((i) => i.exercicioId)).not.toContain(n('Supino inclinado com halteres').id);
  });
});

describe('demonstração (regressão: sumia depois de adicionar o treino)', () => {
  const comRotina = () => acoes.salvarRotina(base(), rotinaDoModelo(MODELOS.find((m) => m.id === 'superiores-i')!, 1, (() => { let k = 0; return () => `id-${k++}`; })(), '2026-10-01T00:00:00.000Z'));
  it('todo exercício dos treinos sugeridos tem demonstração (foto no pacote ou animação do catálogo)', () => {
    for (const m of MODELOS) for (const i of m.itens) expect(imagemDoExercicio(n(i.nome).id) ?? n(i.nome).midia).not.toBeNull();
  });
  it('dados salvos na 0.4.2 migram sem perder o exercício e seguem com demonstração', () => {
    const salvo = JSON.parse(JSON.stringify({ ...comRotina(), versao: 2 }));
    delete salvo.perfil.equipamentos;
    const e = migrarEstado(salvo)!;
    const r = e.rotinas.find((x) => x.nome)!;
    expect(r.itens.length).toBeGreaterThan(0);
    for (const it of r.itens) expect(imagemDoExercicio(it.exercicioId)).not.toBeNull();
  });
  it('Meus treinos → editar rotina: cada exercício abre o mesmo detalhe da Biblioteca', async () => {
    const e = comRotina(); const r = e.rotinas.at(-1)!;
    mockParams = { id: r.id };
    await montar(<RotinaTela />, e);
    const primeiro = r.itens.toSorted((a, b) => a.ordem - b.ordem)[0].exercicioId;
    await fireEvent.press(await screen.findByTestId(`demonstracao-${primeiro}`));
    expect(router.push).toHaveBeenCalledWith(`/exercicio/${primeiro}`);
    expect(screen.getAllByLabelText(/^Ver demonstração de /)).toHaveLength(r.itens.length);
  });
  it('durante o treino: a mesma demonstração', async () => {
    let e = comRotina(); const r = e.rotinas.at(-1)!;
    e = acoes.iniciarSessao(e, { id: 'ses', rotinaId: r.id, iniciadaEm: new Date().toISOString(), finalizadaEm: null, notas: null, atualizadoEm: '' });
    await montar(<Treino />, { ...e, permissaoNotificacao: 'negada' });
    const id = r.itens.toSorted((a, b) => a.ordem - b.ordem)[0].exercicioId;
    await fireEvent.press(await screen.findByTestId(`demonstracao-${id}`));
    expect(router.push).toHaveBeenCalledWith(`/exercicio/${id}`);
  });
});

describe('ícones de equipamento (RedBox r2)', () => {
  const { ICONES_EQUIPAMENTO, ILUSTRACAO_SAIR } = require('@/config/ilustracoes-r2-gerado') as typeof import('@/config/ilustracoes-r2-gerado');
  it('um ícone por id de equipamentos.ts, com versão clara e escura já resolvidas (sem variáveis CSS)', () => {
    expect(Object.keys(ICONES_EQUIPAMENTO).sort()).toEqual(EQUIPAMENTOS_LISTA.map((e) => e.id).sort());
    for (const x of [...Object.values(ICONES_EQUIPAMENTO), ILUSTRACAO_SAIR]) {
      expect(x.claro).not.toMatch(/var\(|<style/); expect(x.escuro).not.toMatch(/var\(|<style/);
      expect(x.claro).not.toBe(x.escuro);
    }
  });
  it('arquivos da RedBox copiados sem alteração para o projeto', () => {
    const fs = require('fs') as { readFileSync: (p: string, e: string) => string; existsSync: (p: string) => boolean };
    const orig = '/home/box/redbox/clientes/domma-tecnologia/app-treinos/imagens-v0.4.3/ilustracoes-r2';
    if (!fs.existsSync(orig)) return; // fora do box da Domma, só confere o que está no projeto
    for (const e of EQUIPAMENTOS_LISTA) expect(fs.readFileSync(`assets/ilustracoes-redbox/r2/equipamentos/equipamento-${e.id}.svg`, 'utf8')).toBe(fs.readFileSync(`${orig}/equipamentos/svg/equipamento-${e.id}.svg`, 'utf8'));
  });
  it('tour e Meus dados: cada opção é uma caixa de seleção com ícone', async () => {
    mockParams = { passo: '8' };
    await montar(<BoasVindas />, acoes.atualizarPerfil(base(), { local: 'casa' }));
    for (const e of EQUIPAMENTOS_LISTA) {
      const op = await screen.findByTestId(`equip-${e.id}`);
      expect(op.props.accessibilityRole).toBe('checkbox');
      expect(op.props.accessibilityState.checked).toBe(e.id === 'peso-corpo');
      expect(screen.getByTestId(`icone-equipamento-${e.id}`, { includeHiddenElements: true })).toBeTruthy();
    }
    await cleanupLocal();
    await montar(<MeusDados />, acoes.atualizarPerfil(base(), { local: 'academia' }));
    expect((await screen.findByTestId('equip-kettlebell')).props.accessibilityState.checked).toBe(true);
  });
  it('cartões de treino sugerido mostram os ícones do equipamento usado', async () => {
    await montar(<ConteudoSugeridos />, base());
    expect((await screen.findAllByTestId('icone-equipamento-halteres', { includeHiddenElements: true })).length).toBeGreaterThan(0);
  });
});
async function cleanupLocal() { const { cleanup } = require('@testing-library/react-native'); await cleanup(); }
