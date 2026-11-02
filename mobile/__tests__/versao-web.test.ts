import { CHAVE_ASYNC, criarArmazenamentoWeb } from '../src/servicos/armazenamento.web';

class Mem { [k: string]: any; getItem(k: string) { return k in this ? this[k] : null; } setItem(k: string, v: string) { this[k] = String(v); } removeItem(k: string) { delete this[k]; } }

describe('armazenamento web (ADR-0013)', () => {
  it('grava e lê no armazenamento do navegador, em modo web (sem cifra)', async () => {
    const ls = new Mem() as unknown as Storage;
    const a = criarArmazenamentoWeb(ls);
    expect(a.modo).toBe('web');
    await a.gravar('{"versao":2}');
    expect(await a.ler()).toBe('{"versao":2}');
  });
  it('Excluir tudo apaga só as chaves do app', async () => {
    const m = new Mem(); m.setItem(CHAVE_ASYNC, 'x'); m.setItem('outro-site', 'y');
    await criarArmazenamentoWeb(m as unknown as Storage).apagarTudo();
    expect(m.getItem(CHAVE_ASYNC)).toBeNull();
    expect(m.getItem('outro-site')).toBe('y');
  });
  it('sem localStorage (modo privado bloqueado) não quebra', async () => {
    const a = criarArmazenamentoWeb(null);
    await a.gravar('x');
    expect(await a.ler()).toBeNull();
  });
});

describe('alerta de descanso na web', () => {
  it('vibra com navigator.vibrate quando existe', () => {
    const vibrate = jest.fn();
    Object.defineProperty(globalThis.navigator, 'vibrate', { value: vibrate, configurable: true });
    jest.isolateModules(() => { require('../src/servicos/alerta-descanso.web').alertarFimDescanso(); });
    expect(vibrate).toHaveBeenCalledWith([0, 400, 200, 400]);
  });
});
