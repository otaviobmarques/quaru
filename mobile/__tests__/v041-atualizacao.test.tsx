// v0.4.1 – atualização do app: service worker em espera, "Atualizar agora", versão, "O que há de novo" e dados preservados.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { readFileSync } = require('fs') as { readFileSync: (p: string, c: 'utf8') => string };
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Atualizacao from '@/app/atualizacao';
import { AvisoAtualizacao } from '@/componentes/aviso-atualizacao';
import { NOVIDADES, VERSAO_NOVIDADES } from '@/config/novidades-gerado';
import { acoes, estadoInicial, migrarEstado, ProvedorEstado } from '@/estado/armazem';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() } }));
afterEach(async () => { await cleanup(); });
const montar = (ui: React.ReactElement) => render(<SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}><ProvedorEstado inicial={estadoInicial()}>{ui}</ProvedorEstado></SafeAreaProvider>);

// Carrega o módulo web isolado (sem resetar o React dos outros testes); ele lê navigator na importação.
const carregar = () => { let m: typeof import('@/servicos/atualizacao.web'); jest.isolateModules(() => { m = require('@/servicos/atualizacao.web'); }); return m!; };
describe('service worker web (atualizacao.web.ts)', () => {
  const postMessage = jest.fn();
  let reg: Record<string, unknown>;
  beforeEach(() => {
    reg = { waiting: { postMessage }, installing: null, update: jest.fn(async () => {}), addEventListener: jest.fn() };
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { serviceWorker: { controller: {}, getRegistration: jest.fn(async () => reg), addEventListener: jest.fn() } } });
    Object.defineProperty(globalThis, 'location', { configurable: true, value: { reload: jest.fn() } });
  });
  it('detecta versão em espera e avisa', async () => {
    const m = carregar();
    const cb = jest.fn();
    m.ouvirNovaVersao(cb);
    await new Promise((r) => setTimeout(r, 0));
    expect(cb).toHaveBeenCalled();
    expect(await m.verificarAtualizacao()).toBe('nova-versao');
  });
  it('Atualizar agora manda ATUALIZAR (skipWaiting) e recarrega na troca de controlador', async () => {
    const m = carregar();
    await m.aplicarAtualizacao();
    expect(postMessage).toHaveBeenCalledWith('ATUALIZAR');
    expect((navigator.serviceWorker.addEventListener as jest.Mock).mock.calls[0][0]).toBe('controllerchange');
  });
  it('sem versão nova: atualizado', async () => {
    reg.waiting = null;
    const m = carregar();
    expect(await m.verificarAtualizacao()).toBe('atualizado');
  });
});

it('service worker gerado espera o toque (sem skipWaiting no install) e não mexe no localStorage', () => {
  const s = readFileSync('scripts/pos-export-web.mjs', 'utf8');
  expect(s).toContain("if (e.data === 'ATUALIZAR') self.skipWaiting()");
  expect(s).not.toMatch(/c\.addAll\(ARQUIVOS\)\)\.then\(\(\) => self\.skipWaiting/);
  expect(s).not.toMatch(/localStorage\./);
});

it('faixa "Nova versão disponível" com botão de 44 px ou mais', async () => {
  await montar(<AvisoAtualizacao forcar />);
  expect(screen.getByText('Nova versão disponível')).toBeTruthy();
  const st = [screen.getByTestId('atualizar-agora').props.style].flat(5).reduce((a, b) => ({ ...a, ...(b || {}) }), {});
  expect(st.height).toBeGreaterThanOrEqual(44);
});

it('tela de atualizações (nativo): versão, aviso da loja e O que há de novo do CHANGELOG', async () => {
  await montar(<Atualizacao />);
  expect(screen.getAllByText(/0\.8\.0/).length).toBeGreaterThan(0);
  expect(screen.getByText(/chegam pela loja/)).toBeTruthy();
  expect(VERSAO_NOVIDADES).toBe(JSON.parse(readFileSync('package.json', 'utf8')).version);
  const log = readFileSync('../CHANGELOG.md', 'utf8');
  expect(log).toContain(`## [${VERSAO_NOVIDADES}]`);
  expect(NOVIDADES.length).toBeGreaterThan(0); // o texto muda a cada versão; basta ter vindo do CHANGELOG
  expect(NOVIDADES.join(' ')).not.toMatch(/\/home|src\/|scripts\//);
});

it('dados da 0.4.0 são preservados ao abrir a 0.4.1 (migração de esquema)', () => {
  const e = acoes.salvarRotina(acoes.consentir(acoes.entrar(estadoInicial()), { dadosSaude: true }), { id: 'r', nome: 'Treino A', ordem: 1, atualizadoEm: '', itens: [] });
  const v040 = JSON.parse(JSON.stringify(e));
  delete v040.perfil; delete v040.agua; delete v040.apresentacaoVistaEm;
  const m = migrarEstado(v040)!;
  expect(m.rotinas.map((r) => r.nome)).toEqual(['Treino A']);
  expect(m.consentimentos).toEqual(e.consentimentos);
  expect(m.apresentacaoVistaEm).toBe(e.consentimentosVistosEm);
});
