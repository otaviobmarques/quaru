// QA v0.1 – sincronização com DOIS aparelhos do mesmo usuário e edições concorrentes.
// Servidor simulado em memória com as regras L2 do banco (upsert por id, última gravação vence,
// exclusão vence edição). As regras reais do banco estão testadas em backend/test (PGlite).
import { idsPendentes, mesclar, processarFila, type Enviar } from '@/dominio/sincronizacao';
import { acoes, estadoInicial, type Estado } from '@/estado/armazem';
import type { Rotina } from '@/dominio/tipos';

function servidor() {
  const tabelas = new Map<string, Map<string, any>>();
  let relogio = 0;
  const enviar: Enviar = async (item) => {
    const t = tabelas.get(item.tabela) ?? new Map(); tabelas.set(item.tabela, t);
    const atual = t.get(item.registro.id);
    if (atual?.excluidoEm) return { ok: true, registro: atual }; // exclusão vence edição
    if (typeof (item.registro as any).nome === 'string' && (item.registro as any).nome.length > 60) return { ok: false, status: 422, mensagem: 'nome longo' };
    const reg = { ...item.registro, atualizadoEm: `srv-${String(++relogio).padStart(4, '0')}` };
    t.set(reg.id, reg);
    return { ok: true, registro: reg };
  };
  const baixar = (tabela: string) => [...(tabelas.get(tabela)?.values() ?? [])];
  return { enviar, baixar };
}

const aparelho = (): Estado => acoes.definirConsentimento(acoes.entrar(estadoInicial()), 'dados_saude', true);
const rot = (nome: string, extra: Partial<Rotina> = {}): Rotina => ({ id: 'rot-1', nome, ordem: 1, itens: [], atualizadoEm: '', ...extra });

async function sincronizar(e: Estado, srv: ReturnType<typeof servidor>): Promise<Estado> {
  const { restantes } = await processarFila(e.fila, srv.enviar);
  return { ...e, fila: restantes, rotinas: mesclar(e.rotinas, srv.baixar('rotinas'), idsPendentes(restantes)), series: mesclar(e.series, srv.baixar('series'), idsPendentes(restantes)) };
}

describe('dois aparelhos, mesmo usuário', () => {
  it('edições concorrentes do mesmo registro: vence a última recebida pelo servidor, e os dois convergem', async () => {
    const srv = servidor();
    let celular = acoes.salvarRotina(aparelho(), rot('Treino A'));
    celular = await sincronizar(celular, srv);
    let tablet = await sincronizar(aparelho(), srv);
    expect(tablet.rotinas[0].nome).toBe('Treino A');
    // offline, os dois editam
    celular = acoes.salvarRotina(celular, rot('Treino A – celular'));
    tablet = acoes.salvarRotina(tablet, rot('Treino A – tablet'));
    celular = await sincronizar(celular, srv);   // chega primeiro
    tablet = await sincronizar(tablet, srv);     // chega depois → vence
    celular = await sincronizar(celular, srv);
    expect(srv.baixar('rotinas')[0].nome).toBe('Treino A – tablet');
    expect(celular.rotinas[0].nome).toBe('Treino A – tablet');
    expect(tablet.rotinas[0].nome).toBe('Treino A – tablet');
    expect(celular.fila).toHaveLength(0); expect(tablet.fila).toHaveLength(0);
  });

  it('um exclui e o outro edita depois (atrasado): exclusão vence nos dois aparelhos', async () => {
    const srv = servidor();
    let celular = await sincronizar(acoes.salvarRotina(aparelho(), rot('Treino B')), srv);
    let tablet = await sincronizar(aparelho(), srv);
    celular = acoes.excluirRotina(celular, 'rot-1');
    tablet = acoes.salvarRotina(tablet, rot('Treino B editado'));
    celular = await sincronizar(celular, srv);
    tablet = await sincronizar(tablet, srv);
    celular = await sincronizar(celular, srv);
    expect(srv.baixar('rotinas')[0].excluidoEm).toBeTruthy();
    expect(tablet.rotinas[0].excluidoEm).toBeTruthy();
    expect(celular.rotinas[0].excluidoEm).toBeTruthy();
  });

  it('séries criadas nos dois aparelhos (ids diferentes) ficam todas, sem duplicar ao reenviar', async () => {
    const srv = servidor();
    const serie = (id: string) => ({ id, sessaoId: 'ses', exercicioId: 'e', ordem: 1, tipo: 'normal' as const, cargaKg: 50, reps: 8, duracaoS: null, rpe: null, concluidaEm: 'x', atualizadoEm: '' });
    let celular = acoes.salvarSerie(aparelho(), serie('s-cel'));
    let tablet = acoes.salvarSerie(aparelho(), serie('s-tab'));
    celular = await sincronizar(celular, srv);
    await processarFila([{ tabela: 'series', registro: celular.series[0] as any }], srv.enviar); // reenvio duplicado
    tablet = await sincronizar(tablet, srv);
    celular = await sincronizar(celular, srv);
    expect(srv.baixar('series').map((x) => x.id).sort()).toEqual(['s-cel', 's-tab']);
    expect(celular.series).toHaveLength(2); expect(tablet.series).toHaveLength(2);
  });

  it('queda de rede no meio do envio: nada se perde e o reenvio completa', async () => {
    const srv = servidor();
    let e = acoes.salvarRotina(acoes.salvarRotina(aparelho(), rot('R1', { id: 'r1' })), rot('R2', { id: 'r2' }));
    let n = 0;
    const r = await processarFila(e.fila, async (i) => { if (++n === 2) throw new Error('rede'); return srv.enviar(i); });
    expect(r.restantes.map((x) => x.registro.id)).toEqual(['r2']);
    e = await sincronizar({ ...e, fila: r.restantes }, srv);
    expect(srv.baixar('rotinas')).toHaveLength(2);
  });

  it('item recusado (422) fica marcado com erro na fila e não trava os demais', async () => {
    const srv = servidor();
    // O aparelho agora também recusa nome > 60 (BUG-06); simula item antigo já na fila.
    let e = aparelho();
    e = { ...e, fila: [{ tabela: 'rotinas', registro: { ...rot('x'.repeat(61), { id: 'longa' }), atualizadoEm: 'x' } as never }] };
    e = acoes.salvarRotina(e, rot('ok', { id: 'curta' }));
    e = await sincronizar(e, srv);
    expect(e.fila).toEqual([expect.objectContaining({ erro: 'nome longo' })]);
    expect(srv.baixar('rotinas').map((x) => x.id)).toEqual(['curta']);
  });

  it('BUG-12 (corrigido): download do servidor não deveria sobrescrever edição local ainda pendente na fila', async () => {
    const srv = servidor();
    let celular = await sincronizar(acoes.salvarRotina(aparelho(), rot('v1')), srv);
    celular = acoes.salvarRotina(celular, rot('v2 local'));
    // baixa sem conseguir enviar (ex.: envio falhou, download funcionou)
    celular = { ...celular, rotinas: mesclar(celular.rotinas, srv.baixar('rotinas'), idsPendentes(celular.fila)) };
    expect(celular.rotinas[0].nome).toBe('v2 local');
  });
});
