// v0.4.4 – catálogo completo do free-exercise-db: importação, ids, migração da 0.4.3, busca, desempenho,
// Biblioteca virtualizada, demonstração animada (com "reduzir movimento") e aviso de revisão CREF.
declare const __dirname: string;
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs') as { readFileSync(p: string, c?: string): string; existsSync(p: string): boolean; statSync(p: string): { size: number }; readdirSync(p: string): string[] };
const path = require('path') as { join(...p: string[]): string };
/* eslint-enable @typescript-eslint/no-require-imports */
import { fireEvent, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import BibliotecaTela from '@/app/biblioteca';
import DetalheExercicio, { AVISO_CREF } from '@/app/exercicio/[id]';
import { BIBLIOTECA, doCatalogo, EQUIPAMENTOS, filtrarExercicios, GRUPOS, META_CATALOGO } from '@/dominio/biblioteca';
import { EQUIPAMENTOS_LISTA, lacunasDoCatalogo } from '@/dominio/equipamentos';
import { definirBaseMidia } from '@/dominio/midia-exercicios';
import { AnimacaoExercicio } from '@/componentes/animacao-exercicio';
import { MODELOS, rotinaDoModelo } from '@/dominio/treinos-sugeridos';
import { acoes, estadoInicial, migrarEstado, ProvedorEstado, todosExercicios, type Estado } from '@/estado/armazem';

let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => false }, useLocalSearchParams: () => mockParams }));
const montar = (ui: React.ReactElement, e: Estado) => render(
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}><ProvedorEstado inicial={e}>{ui}</ProvedorEstado></SafeAreaProvider>);
const base = () => acoes.concluirApresentacao(acoes.consentir(acoes.entrar(estadoInicial()), { dadosSaude: true }));
const RAIZ = path.join(__dirname, '..');

/** Biblioteca exatamente como era na 0.4.3 (ordem = número do id). */
const BIBLIOTECA_043 = ['Supino reto com barra', 'Supino inclinado com halteres', 'Crucifixo na máquina', 'Flexão de braço', 'Puxada frontal',
  'Remada curvada com barra', 'Remada baixa', 'Barra fixa', 'Agachamento livre', 'Leg press 45°', 'Cadeira extensora', 'Mesa flexora',
  'Levantamento terra', 'Panturrilha em pé', 'Desenvolvimento com halteres', 'Elevação lateral', 'Rosca direta', 'Rosca alternada',
  'Tríceps na polia', 'Tríceps francês', 'Prancha', 'Abdominal supra'];
const id043 = (i: number) => `00000000-0000-4000-a000-${String(i).padStart(12, '0')}`;

describe('importação', () => {
  it('876 exercícios da fonte fixada (Unlicense), ids únicos e nomes únicos', () => {
    expect(BIBLIOTECA).toHaveLength(876);
    expect(META_CATALOGO.commit).toBe('f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5');
    expect(META_CATALOGO.licenca).toMatch(/Unlicense/);
    expect(new Set(BIBLIOTECA.map((e) => e.id)).size).toBe(876);
    expect(new Set(BIBLIOTECA.map((e) => e.nome.toLowerCase())).size).toBe(876);
    expect(new Set(BIBLIOTECA.map((e) => e.fonteId)).size).toBe(876);
  });
  it('os 22 da 0.4.3 mantêm id, nome, grupo e equipamento; os novos têm uuid v5 estável', () => {
    BIBLIOTECA_043.forEach((nome, i) => { const e = doCatalogo(id043(i + 1))!; expect(e.nome).toBe(nome); expect(BIBLIOTECA[i]).toBe(e); });
    for (const e of BIBLIOTECA.slice(22)) expect(e.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
  it('mapeia grupo, equipamento (10 do app + extras), área, nível e tipo', () => {
    const app = new Set<string>(EQUIPAMENTOS_LISTA.map((x) => x.id));
    const extras = new Set(['bola-medicinal', 'bola-suica', 'rolo-espuma', 'outro']);
    for (const e of BIBLIOTECA) {
      expect(GRUPOS).toContain(e.grupoMuscular);
      expect(EQUIPAMENTOS).toContain(e.equipamento);
      for (const q of e.equipamentos) expect(app.has(q) || extras.has(q)).toBe(true);
      expect(['superiores', 'inferiores', 'core']).toContain(e.area);
      expect(['iniciante', 'intermediario', 'avancado']).toContain(e.nivel);
      expect(['carga_reps', 'tempo', 'peso_corporal']).toContain(e.tipo);
      expect(e.revisao).toBe('pendente de revisão CREF');
    }
    expect(doCatalogo(BIBLIOTECA.find((e) => e.fonteId === 'Goblet_Squat')!.id)!.equipamentos).toEqual(['kettlebell']);
  });
  it('não inventa: instrução em português só onde há tradução; o original da fonte sempre fica guardado', () => {
    const fonte = JSON.parse(fs.readFileSync(path.join(RAIZ, 'src/dominio/catalogo-fedb.json'), 'utf8')).exercicios as { instrucoes: string[] | null; instrucoesOriginais: string[] }[];
    expect(fonte.filter((e) => e.instrucoes).length).toBe(41);
    for (const e of fonte) if (e.instrucoes) expect(e.instrucoesOriginais.length).toBeGreaterThan(0);
  });
  it('script reprodutível: fonte e commit fixados, nada de caminho local no JSON', () => {
    const s = fs.readFileSync(path.join(RAIZ, 'scripts/importar-free-exercise-db.py'), 'utf8');
    expect(s).toContain("COMMIT = 'f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5'");
    expect(fs.readFileSync(path.join(RAIZ, 'src/dominio/catalogo-fedb.json'), 'utf8')).not.toMatch(/\/home\/|\/tmp\//);
  });
});

describe('mídias (ADR-0020)', () => {
  const pasta = path.join(RAIZ, 'public/exercicios');
  it('uma animação, um pôster e uma miniatura por exercício com fotos; animação até 60 KB', () => {
    const com = BIBLIOTECA.filter((e) => e.midia);
    expect(com.length).toBe(873);
    let total = 0;
    for (const e of com) {
      const t = fs.statSync(path.join(pasta, `${e.midia}.webp`)).size;
      expect(t).toBeLessThanOrEqual(60 * 1024);
      total += t;
      expect(fs.existsSync(path.join(pasta, `${e.midia}-p.webp`))).toBe(true);
      expect(fs.existsSync(path.join(pasta, `${e.midia}-m.webp`))).toBe(true);
    }
    expect(total / 1048576).toBeLessThan(32);
  });
  it('WebP animado de verdade (ANIM + 6 quadros)', () => {
    const b = fs.readFileSync(path.join(pasta, 'Goblet_Squat.webp'), 'latin1');
    expect(b.slice(0, 4)).toBe('RIFF');
    expect(b.slice(8, 12)).toBe('WEBP');
    expect(b.includes('ANIM')).toBe(true);
    expect(b.split('ANMF').length - 1).toBe(6);
  });
  it('service worker: mídias fora do pré-cache, guardadas sob demanda num cache que sobrevive às versões', () => {
    const s = fs.readFileSync(path.join(RAIZ, 'scripts/pos-export-web.mjs'), 'utf8');
    expect(s).toContain("!f.startsWith('exercicios/')");
    expect(s).toContain("quaru-midia-v1");
    expect(s).toContain('k !== MIDIA');
  });
});

describe('migração de um estado salvo na 0.4.3', () => {
  it('rotina, séries e exercício próprio continuam apontando para os mesmos exercícios', () => {
    let k = 0; const ids = () => `x-${k++}`;
    let e = acoes.salvarRotina(base(), rotinaDoModelo(MODELOS.find((m) => m.id === 'superiores-m')!, 1, ids, '2026-10-20T00:00:00.000Z'));
    const r = e.rotinas.at(-1)!;
    e = { ...e, rotinas: [{ ...r, itens: BIBLIOTECA_043.map((_, i) => ({ id: `it-${i}`, exercicioId: id043(i + 1), ordem: i, seriesAlvo: 3, repsAlvo: 10, descansoS: 90 })) }],
      exercicios: [{ id: '11111111-2222-4333-8444-555555555555', usuarioId: 'local', nome: 'Meu exercício', grupoMuscular: 'Pernas', equipamento: 'Halteres', tipo: 'carga_reps', atualizadoEm: '2026-10-20T00:00:00.000Z' }] };
    const salvo = JSON.parse(JSON.stringify(e)); // como ficou no armazenamento da 0.4.3 (esquema 2)
    expect(salvo.versao).toBe(2);
    const m = migrarEstado(salvo)!;
    const todos = new Map(todosExercicios(m).map((x) => [x.id, x]));
    m.rotinas[0].itens.forEach((it, i) => expect(todos.get(it.exercicioId)?.nome).toBe(BIBLIOTECA_043[i]));
    expect(todos.get('11111111-2222-4333-8444-555555555555')?.nome).toBe('Meu exercício');
    expect(todosExercicios(m)).toHaveLength(877);
  });
});

describe('busca e filtros', () => {
  it('sem acento, por várias palavras, pelo nome em português ou original', () => {
    expect(filtrarExercicios(BIBLIOTECA, 'elevacao lateral').map((e) => e.nome)).toContain('Elevação lateral');
    expect(filtrarExercicios(BIBLIOTECA, 'ROSCA martelo').length).toBeGreaterThan(0);
    expect(filtrarExercicios(BIBLIOTECA, 'goblet').map((e) => e.nome)).toContain('Agachamento goblet');
    expect(filtrarExercicios(BIBLIOTECA, 'agachamento', null, 'Kettlebell').every((e) => e.equipamento === 'Kettlebell')).toBe(true);
    expect(filtrarExercicios(BIBLIOTECA, '', 'Costas', null, 'superiores').every((e) => e.grupoMuscular === 'Costas' && e.area === 'superiores')).toBe(true);
    expect(filtrarExercicios(BIBLIOTECA, '', null, null, 'core').every((e) => e.grupoMuscular === 'Abdômen')).toBe(true);
  });
  it('desempenho: 200 buscas no catálogo inteiro em menos de 1 s', () => {
    filtrarExercicios(BIBLIOTECA, 'aquece');
    const t = Date.now();
    for (let i = 0; i < 200; i++) filtrarExercicios(BIBLIOTECA, ['supino', 'agach', 'rosca', 'remada inclinado'][i % 4], i % 3 ? null : 'Pernas');
    expect(Date.now() - t).toBeLessThan(1000);
  });
});

describe('treinos sugeridos com o catálogo novo', () => {
  it('cobre pernas, glúteos, lombar e tríceps sem equipamento; com elástico, ombros; bíceps segue lacuna', () => {
    const casa = MODELOS.find((m) => m.id === 'casa-i')!.itens.map((i) => i.nome);
    expect(casa).toEqual(expect.arrayContaining(['Agachamento com peso do corpo', 'Ponte de glúteo', 'Super-homem (extensão lombar no solo)']));
    expect(MODELOS.find((m) => m.id === 'elastico-i')!.itens.map((i) => i.nome)).toEqual(expect.arrayContaining(['Desenvolvimento com elástico', 'Elevação lateral com elástico']));
    expect(lacunasDoCatalogo(['peso-corpo'])).toContain('Bíceps');
    expect(lacunasDoCatalogo(['peso-corpo'])).not.toContain('Pernas');
  });
});

describe('telas', () => {
  beforeEach(() => { mockParams = {}; });
  it('Biblioteca virtualizada: 876 no total, só uma janela renderizada; busca e filtro de área', async () => {
    const t = Date.now();
    await montar(<BibliotecaTela />, base());
    expect(Date.now() - t).toBeLessThan(3000);
    expect(screen.getByText(/876 exercícios/)).toBeTruthy();
    expect(screen.getByText(/revisão por profissional \(CREF\)/)).toBeTruthy();
    const linhas = screen.queryAllByText(/^(Peito|Costas|Pernas|Ombros|Bíceps|Tríceps|Abdômen|Antebraço|Pescoço) · /).length;
    expect(linhas).toBeGreaterThan(5);
    expect(linhas).toBeLessThan(100);
    expect(screen.queryByText('Abdominal supra')).toBeNull(); // fora da janela inicial
    await fireEvent.changeText(screen.getByLabelText('Buscar'), 'abdominal supra');
    expect(await screen.findByText('Abdominal supra')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Buscar'), '');
    await fireEvent.press(screen.getByText('Core'));
    expect(screen.getByText(/^\d+ exercícios/).props.children[0]).toBeLessThan(876);
  });
  it('Ver demonstração: instruções traduzidas, aviso CREF visível', async () => {
    mockParams = { id: id043(9) };
    await montar(<DetalheExercicio />, base());
    expect(screen.getByText('Instruções em revisão profissional')).toBeTruthy();
    expect(screen.getByText(AVISO_CREF)).toBeTruthy();
    expect(screen.getByText(/rack de agachamento/)).toBeTruthy();
  });
  it('sem tradução: mostra o original em inglês, sinalizado', async () => {
    const e = BIBLIOTECA.find((x) => !x.instrucoes && x.instrucoesOriginais.length && x.midia)!;
    mockParams = { id: e.id };
    await montar(<DetalheExercicio />, base());
    expect(screen.getByText('Tradução pendente · texto original em inglês')).toBeTruthy();
  });
  const goblet = () => BIBLIOTECA.find((x) => x.fonteId === 'Goblet_Squat')!;
  afterEach(() => { definirBaseMidia(undefined); jest.restoreAllMocks(); });
  it('com origem de mídia: a animação roda e tem Pausar', async () => {
    definirBaseMidia('https://exemplo.invalid/quaru/exercicios/');
    await montar(<AnimacaoExercicio exercicioId={goblet().id} nome={goblet().nome} />, base());
    expect(screen.getByTestId('demo-animacao')).toBeTruthy();
    expect(screen.getByLabelText('Animação: Agachamento goblet, alternando posição inicial e final')).toBeTruthy();
    await fireEvent.press(screen.getByText('Pausar demonstração'));
    expect(screen.getByTestId('demo-parada')).toBeTruthy();
  });
  it('"reduzir movimento": começa na foto parada, com Reproduzir', async () => {
    definirBaseMidia('https://exemplo.invalid/quaru/exercicios/');
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    await montar(<AnimacaoExercicio exercicioId={goblet().id} nome={goblet().nome} />, base());
    expect(await screen.findByTestId('demo-parada')).toBeTruthy();
    expect(screen.getByText(/Reduzir movimento” está ligado/)).toBeTruthy();
    await fireEvent.press(screen.getByText('▶ Reproduzir demonstração'));
    expect(screen.getByTestId('demo-animacao')).toBeTruthy();
  });
  it('sem origem de mídia (nativo sem EXPO_PUBLIC_MIDIA_URL): só a foto do pacote, sem botão', async () => {
    definirBaseMidia(null);
    await montar(<AnimacaoExercicio exercicioId={id043(9)} nome="Agachamento livre" />, base());
    expect(screen.getByTestId('demo-parada')).toBeTruthy();
    expect(screen.queryByText('Pausar demonstração')).toBeNull();
  });
});
