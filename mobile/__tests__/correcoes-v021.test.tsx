// Correções da 0.2.1 (relatório de QA v0.2). Dados fictícios.
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import * as N from 'expo-notifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Fila from '@/app/fila';
import { mensagemRecusa, nomeVazio, problemaSerie } from '@/dominio/validacao';
import { acoes, estadoInicial, ProvedorEstado, type Estado } from '@/estado/armazem';
import { comportamentoPrimeiroPlano } from '@/servicos/notificacao';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() } }));
afterEach(async () => { await cleanup(); });
// eslint-disable-next-line @typescript-eslint/no-require-imports
const plugin = require('../plugins/sem-backup-android');

const base = () => acoes.definirConsentimento(acoes.entrar(estadoInicial()), 'dados_saude', true);

describe('REG-01: limites antes de gravar', () => {
  it('1500 kg e 1001 reps geram mensagem; 1000 kg passa', () => {
    expect(problemaSerie(1500, 8)).toMatch(/1000 kg/);
    expect(problemaSerie(50, 1001)).toMatch(/1000 repetições/);
    expect(problemaSerie(1000, 1000)).toBeNull();
  });
});

describe('BUG-08/REG-03: espaços Unicode', () => {
  it.each(['\u00a0', '\t', '\u3000', '\u200b', '\ufeff', '\u2003\u202f', '\n', ''])('nome %j é vazio', (n) => expect(nomeVazio(n)).toBe(true));
  it('nome com letra é válido', () => expect(nomeVazio('\u00a0Treino A\u3000')).toBe(false));
  it('armazém recusa rotina só com tabulação ou U+3000', () => {
    for (const nome of ['\t', '\u3000\u200b']) expect(() => acoes.salvarRotina(base(), { id: 'r', nome, ordem: 1, itens: [], atualizadoEm: '' })).toThrow('valor_invalido');
  });
});

describe('BUG-17 / ADR-0011: primeiro plano', () => {
  it('handler (rev. 0.3.0): sem banner nem lista; som pela via de notificação', async () => {
    expect(comportamentoPrimeiroPlano).toEqual({ shouldShowBanner: false, shouldShowList: false, shouldPlaySound: true, shouldSetBadge: false });
    const chamada = (N.setNotificationHandler as jest.Mock).mock.calls.at(-1)?.[0];
    expect(chamada).toBeDefined();
    expect(await chamada.handleNotification()).toEqual(comportamentoPrimeiroPlano);
  });
});

describe('tela Itens com erro (fila)', () => {
  function estado(): Estado {
    const e = acoes.salvarRotina(base(), { id: 'ok', nome: 'Treino B', ordem: 2, itens: [], atualizadoEm: '' });
    const longa = { id: 'longa', nome: 'x'.repeat(61), ordem: 1, itens: [], atualizadoEm: 'x' };
    return { ...e, rotinas: [...e.rotinas, longa], fila: [...e.fila, { tabela: 'rotinas', registro: longa as never, erro: 'nome longo' }] };
  }
  const montar = (e: Estado) => render(<SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}><ProvedorEstado inicial={e}><Fila /></ProvedorEstado></SafeAreaProvider>);

  it('lista só o item com erro, corrige o nome e o erro some', async () => {
    await montar(estado());
    expect(screen.getByText('nome longo')).toBeTruthy();
    expect(screen.queryByText(/Treino B/)).toBeNull();
    await fireEvent.changeText(screen.getByLabelText(/Nome corrigido/), 'Treino A');
    await fireEvent.press(screen.getByText('Salvar correção'));
    expect(screen.getByText('Nenhum item com erro')).toBeTruthy();
  });
  it('descartar pede confirmação e tira o item', async () => {
    await montar(estado());
    await fireEvent.press(screen.getByText('Descartar envio'));
    await fireEvent.press(screen.getByText('Descartar'));
    expect(screen.getByText('Nenhum item com erro')).toBeTruthy();
  });
  it('ações: corrigir atualiza rotina e fila; nome inválido é recusado; descartar mantém o dado local', () => {
    const c = acoes.corrigirNomeItemFila(estado(), 'longa', ' Treino A ');
    expect(c.rotinas.find((r) => r.id === 'longa')?.nome).toBe('Treino A');
    expect(c.fila.find((i) => i.registro.id === 'longa')?.erro).toBeUndefined();
    expect(() => acoes.corrigirNomeItemFila(estado(), 'longa', '\u00a0')).toThrow('valor_invalido');
    const d = acoes.descartarItemFila(estado(), 'longa');
    expect(d.fila.some((i) => i.registro.id === 'longa')).toBe(false);
    expect(d.rotinas.some((r) => r.id === 'longa')).toBe(true);
  });
});

describe('plugin sem-backup-android (ADR-0010)', () => {
  it('manifesto recebe allowBackup=false, dataExtractionRules e fullBackupContent', () => {
    const m = plugin.aplicarNoManifesto({ manifest: { application: [{ $: { 'android:name': '.MainApplication' } }] } });
    expect(m.manifest.application[0].$).toMatchObject({ 'android:allowBackup': 'false', 'android:dataExtractionRules': '@xml/regras_extracao_dados', 'android:fullBackupContent': '@xml/regras_backup' });
  });
  it('regras excluem nuvem e transferência entre aparelhos', () => {
    const x: string = plugin.regrasExtracao();
    expect(x).toContain('<cloud-backup>');
    expect(x).toContain('<device-transfer>');
    expect(x.match(/<exclude domain=/g)).toHaveLength(10);
    expect(plugin.regrasBackupCompleto()).toContain('<exclude domain="database" path="." />');
  });
});

describe('REG-04: mensagens de recusa', () => {
  it('cada código tem texto próprio e há texto genérico', () => {
    expect(mensagemRecusa('sem_consentimento')).toMatch(/Consentimentos/);
    expect(mensagemRecusa('valor_invalido')).toMatch(/1000 kg/);
    expect(mensagemRecusa('sessao_ativa')).toMatch(/outro treino/);
    expect(mensagemRecusa('qualquer')).toMatch(/Não foi possível/);
  });
});
