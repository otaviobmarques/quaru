import { enfileirar, mesclar, processarFila, type ItemFila } from '@/dominio/sincronizacao';

const item = (id: string, extra: Record<string, unknown> = {}): ItemFila => ({ tabela: 'series', registro: { id, atualizadoEm: '', ...extra } });

describe('fila de sincronização (RF09, L2)', () => {
  it('envia em ordem; 422 marca erro e não trava os demais', async () => {
    const enviados: string[] = [];
    const r = await processarFila([item('a'), item('b'), item('c')], async (i) => {
      enviados.push(i.registro.id);
      return i.registro.id === 'b' ? { ok: false, status: 422, mensagem: 'carga inválida' } : { ok: true, registro: i.registro };
    });
    expect(enviados).toEqual(['a', 'b', 'c']);
    expect(r.aceitos.map((x) => x.id)).toEqual(['a', 'c']);
    expect(r.restantes).toEqual([{ ...item('b'), erro: 'carga inválida' }]);
  });
  it('sem rede: para no primeiro erro e mantém a ordem do restante', async () => {
    const r = await processarFila([item('a'), item('b'), item('c')], async (i) => {
      if (i.registro.id === 'b') throw new Error('rede');
      return { ok: true, registro: i.registro };
    });
    expect(r.restantes.map((x) => x.registro.id)).toEqual(['b', 'c']);
  });
  it('reenviar o mesmo registro não duplica na fila (fica a última versão)', () => {
    const f = enfileirar(enfileirar([item('a', { v: 1 })], item('b')), item('a', { v: 2 }));
    expect(f.map((x) => [x.registro.id, x.registro.v])).toEqual([['b', undefined], ['a', 2]]);
  });
  it('versão do servidor vence, mas exclusão local não é desfeita', () => {
    const local = [{ id: '1', atualizadoEm: '1', nome: 'local' }, { id: '2', atualizadoEm: '1', excluidoEm: 'x' }];
    const serv = [{ id: '1', atualizadoEm: '2', nome: 'servidor' }, { id: '2', atualizadoEm: '2' }, { id: '3', atualizadoEm: '2' }];
    const m = mesclar(local as any[], serv as any[], new Set());
    expect(m.find((x) => x.id === '1')?.nome).toBe('servidor');
    expect(m.find((x) => x.id === '2')?.excluidoEm).toBe('x');
    expect(m).toHaveLength(3);
  });
});

describe('mesclar com pendentes obrigatório (BUG-12)', () => {
  it('registro pendente na fila não é sobrescrito', () => {
    const m = mesclar([{ id: '1', atualizadoEm: '1', nome: 'local' }] as any[], [{ id: '1', atualizadoEm: '2', nome: 'servidor' }] as any[], new Set(['1']));
    expect((m[0] as any).nome).toBe('local');
  });
});
