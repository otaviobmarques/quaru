import { cartaoTreinoDeHoje, proximaRotina, treinosUltimos7Dias } from '@/dominio/treino-de-hoje';
import type { Rotina, SessaoTreino } from '@/dominio/tipos';

const r = (id: string, ordem: number, extra: Partial<Rotina> = {}): Rotina => ({ id, nome: id, ordem, itens: [], atualizadoEm: '', ...extra });
const s = (id: string, rotinaId: string | null, ini: string, fim: string | null, extra: Partial<SessaoTreino> = {}): SessaoTreino =>
  ({ id, rotinaId, iniciadaEm: ini, finalizadaEm: fim, notas: null, atualizadoEm: '', ...extra });
const rotinas = [r('C', 3), r('A', 1), r('B', 2)];
const AGORA = '2026-11-01T15:00:00-03:00';

describe('regra L1 – treino de hoje', () => {
  it('sem histórico, sugere a primeira rotina da lista', () => {
    expect(proximaRotina(rotinas, [])?.id).toBe('A');
  });
  it('segue a sequência A → B → C → A a partir da última finalizada', () => {
    expect(proximaRotina(rotinas, [s('1', 'A', '2026-10-28T10:00:00Z', '2026-10-28T11:00:00Z')])?.id).toBe('B');
    expect(proximaRotina(rotinas, [s('1', 'B', '2026-10-28T10:00:00Z', '2026-10-28T11:00:00Z'), s('2', 'C', '2026-10-30T10:00:00Z', '2026-10-30T11:00:00Z')])?.id).toBe('A');
  });
  it('ignora rotina excluída e sessão excluída', () => {
    const l = [r('A', 1), r('B', 2, { excluidoEm: 'x' }), r('C', 3)];
    expect(proximaRotina(l, [s('1', 'A', '2026-10-28T10:00:00Z', '2026-10-28T11:00:00Z')])?.id).toBe('C');
    expect(proximaRotina(rotinas, [s('1', 'A', '2026-10-28T10:00:00Z', '2026-10-28T11:00:00Z', { excluidoEm: 'x' })])?.id).toBe('A');
  });
  it('sessão em andamento tem prioridade sobre tudo', () => {
    const c = cartaoTreinoDeHoje(rotinas, [s('1', 'A', '2026-11-01T10:00:00-03:00', '2026-11-01T11:00:00-03:00'), s('2', 'B', '2026-11-01T14:00:00-03:00', null)], AGORA);
    expect(c.estado).toBe('continuar');
  });
  it('treino finalizado hoje (fuso de São Paulo) mostra "feito" com a próxima', () => {
    const c = cartaoTreinoDeHoje(rotinas, [s('1', 'A', '2026-11-01T10:00:00-03:00', '2026-11-01T11:00:00-03:00')], AGORA);
    expect(c).toMatchObject({ estado: 'feito', proxima: { id: 'B' } });
  });
  it('treino às 23h de ontem em São Paulo (02h UTC de hoje) não conta como hoje', () => {
    const c = cartaoTreinoDeHoje(rotinas, [s('1', 'A', '2026-11-01T01:00:00Z', '2026-11-01T02:00:00Z')], AGORA);
    expect(c.estado).toBe('proxima');
  });
  it('sem rotinas: estado vazio', () => {
    expect(cartaoTreinoDeHoje([], [], AGORA).estado).toBe('sem_rotina');
  });
  it('conta treinos dos últimos 7 dias', () => {
    expect(treinosUltimos7Dias([s('1', 'A', '2026-10-30T10:00:00Z', '2026-10-30T11:00:00Z'), s('2', 'A', '2026-10-01T10:00:00Z', '2026-10-01T11:00:00Z')], AGORA)).toBe(1);
  });
});
