// v0.4.3 – fotos reais da RedBox (Pexels/Pixabay): importação, créditos, visual de reserva e contraste.
import { render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import DietaTela from '@/app/dieta/[id]';
import Refeicoes from '@/app/refeicoes';
import Sobre from '@/app/sobre';
import { CORES_RESERVA } from '@/componentes/reserva-refeicao';
import { CREDITOS_FOTOS, legendaCredito } from '@/dominio/creditos-fotos';
import { FOTOS_DIETAS } from '@/dominio/fotos-dietas';
import { IMAGENS_RECEITAS } from '@/dominio/imagens-redbox-gerado';
import { IDEIAS } from '@/dominio/refeicoes';
import { acoes, estadoInicial, ProvedorEstado } from '@/estado/armazem';
import { temas } from '@/tema/tokens';
import { contraste } from './contraste.test';

let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() }, useLocalSearchParams: () => mockParams }));
const cp = require('child_process') as { execFileSync: (c: string, a: string[], o: object) => string };
const fs = require('fs') as { mkdtempSync: (p: string) => string; writeFileSync: (p: string, d: Uint8Array | string) => void; rmSync: (p: string, o: object) => void; statSync: (p: string) => { size: number } };
const montar = (ui: React.ReactElement) => render(<SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}><ProvedorEstado inicial={acoes.entrar(estadoInicial())}>{ui}</ProvedorEstado></SafeAreaProvider>);

const COM_FOTO = ['mingau-aveia', 'ovos-abacate', 'iogurte-fruta', 'fruta-castanha', 'ovo-cozido', 'pao-pasta-amendoim', 'sopa-legumes', 'tofu-legumes'];
const SEM_FOTO = ['tapioca-ovo', 'cuscuz-ovo', 'pao-queijo-branco', 'feijao-tropeiro-veg', 'grao-de-bico', 'carne-legumes', 'frango-mandioca', 'pf-frango', 'peixe-pirao', 'omelete'];

describe('fotos da RedBox', () => {
  it('as 8 dietas usam a foto real (não mais a provisória) com alt vindo da descrição da RedBox', () => {
    for (const f of Object.values(FOTOS_DIETAS)) { expect(f.provisoria).toBe(false); expect(f.alt).toMatch(/^Foto de [^()]+$/); }
  });
  it('8 receitas com foto; as demais (10) ficam com o visual de reserva', () => {
    expect(Object.keys(IMAGENS_RECEITAS).sort()).toEqual([...COM_FOTO].sort());
    expect(IDEIAS.map((i) => i.id).filter((id) => !IMAGENS_RECEITAS[id]).sort()).toEqual([...SEM_FOTO].sort());
  });
  it('arquivos copiados: WebP de até 80 KB', () => {
    for (const id of COM_FOTO) for (const s of ['1x1', '16x9']) expect(fs.statSync(`assets/receitas/${id}_${s}.webp`).size).toBeLessThanOrEqual(80 * 1024);
  });
  it('créditos: um por foto que entrou, com autor, origem Pexels/Pixabay e licença', () => {
    expect(CREDITOS_FOTOS).toHaveLength(16);
    for (const c of CREDITOS_FOTOS) {
      expect(c.origem).toMatch(/^https:\/\/(www\.pexels\.com|pixabay\.com)\//);
      expect(['Pexels License', 'Pixabay Content License']).toContain(c.licenca);
      expect(c.autor.length).toBeGreaterThan(0);
    }
    expect(CREDITOS_FOTOS.some((c) => /peixe-pirao|omelete/.test(c.arquivo))).toBe(false); // não entraram
  });
  it('detalhe da dieta mostra o crédito; Sobre lista os créditos', async () => {
    mockParams = { id: 'vegana' };
    await montar(<DietaTela />);
    expect(await screen.findByText(legendaCredito('dieta-vegana')!)).toBeTruthy();
    await montar(<Sobre />);
    expect(await screen.findByText('Fotos de alimentos (dietas e ideias de refeições)')).toBeTruthy();
  });
});

describe('visual de reserva', () => {
  it('receita sem foto mostra a reserva (oculta ao leitor de tela); com foto, a imagem com alt', async () => {
    mockParams = {};
    await montar(<Refeicoes />);
    expect(await screen.findByTestId('foto-receita-tapioca-ovo-reserva', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.queryByTestId('foto-receita-tapioca-ovo-reserva')).toBeNull(); // escondida da árvore acessível
    expect(screen.getByTestId('foto-receita-mingau-aveia').props.accessibilityLabel).toMatch(/^Foto de mingau/);
  });
  it.each(['claro', 'escuro'] as const)('ícone ≥ 3:1 sobre o fundo em cada refeição (%s)', (t) => {
    for (const [, k] of Object.entries(CORES_RESERVA(temas[t]))) expect(contraste(k.icone, k.fundo)).toBeGreaterThanOrEqual(3);
  });
});

describe('script de importação (--verificar)', () => {
  const webp = (w: number, h: number) => { const b = new Uint8Array(30); const s = 'RIFF\0\0\0\0WEBPVP8X'; for (let i = 0; i < 16; i++) b[i] = s.charCodeAt(i);
    const put = (o: number, v: number) => { b[o] = v & 255; b[o + 1] = (v >> 8) & 255; b[o + 2] = (v >> 16) & 255; }; put(24, w - 1); put(27, h - 1); return b; };
  it('lê fotos/, ignora descartadas/, aceita refeicao-, confere proporção e não grava nada', () => {
    const dir = fs.mkdtempSync('/tmp/redbox-teste-');
    cp.execFileSync('mkdir', ['-p', `${dir}/fotos/descartadas`], {});
    fs.writeFileSync(`${dir}/fotos/dieta-vegana_1x1.webp`, webp(640, 640));
    fs.writeFileSync(`${dir}/fotos/dieta-vegana_16x9.webp`, webp(1280, 720));
    fs.writeFileSync(`${dir}/fotos/refeicao-tapioca-ovo_1x1.webp`, webp(640, 640));
    fs.writeFileSync(`${dir}/fotos/dieta-paleo_16x9.webp`, webp(1280, 853));
    fs.writeFileSync(`${dir}/fotos/refeicao-bolo_1x1.webp`, webp(640, 640));
    fs.writeFileSync(`${dir}/fotos/descartadas/dieta-atkins_1x1.webp`, webp(640, 640));
    try {
      const out = cp.execFileSync('node', ['scripts/importar-imagens-redbox.mjs', '--verificar'], { env: { ...process.env, REDBOX_IMAGENS: dir }, encoding: 'utf8' });
      expect(out).toContain('copiados: 3');
      expect(out).toContain('refeicao-tapioca-ovo_1x1.webp → assets/receitas/tapioca-ovo_1x1.webp');
      expect(out).toMatch(/dieta-paleo_16x9\.webp: 1280×853, proporção errada/);
      expect(out).toMatch(/refeicao-bolo_1x1\.webp: id sem correspondência/);
      expect(out).not.toMatch(/atkins/);
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
});
