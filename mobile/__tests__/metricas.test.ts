import { ehRecorde, lerNumero, recordes, ultimaVez, umRmEstimado, volume } from '@/dominio/metricas';
import type { Serie, SessaoTreino } from '@/dominio/tipos';

const se = (id: string, sessaoId: string, carga: number | null, reps: number | null, extra: Partial<Serie> = {}): Serie => ({
  id, sessaoId, exercicioId: 'supino', ordem: 1, tipo: 'normal', cargaKg: carga, reps, duracaoS: null, rpe: null, concluidaEm: '2026-10-01T10:00:00Z', atualizadoEm: '', ...extra });
const ses = (id: string, ini: string, fim: string | null = ini): SessaoTreino => ({ id, rotinaId: null, iniciadaEm: ini, finalizadaEm: fim, notas: null, atualizadoEm: '' });

describe('métricas', () => {
  it('1RM de Epley: 100 kg × 10 = 133,3; 1 rep = a própria carga; fora de 1–12 reps não estima', () => {
    expect(umRmEstimado(100, 10)).toBe(133.3);
    expect(umRmEstimado(100, 1)).toBe(100);
    expect(umRmEstimado(100, 20)).toBeNull();
    expect(umRmEstimado(null, 5)).toBeNull();
  });
  it('volume ignora aquecimento, série não concluída e excluída', () => {
    const l = [se('1', 's', 50, 10), se('2', 's', 20, 10, { tipo: 'aquecimento' }), se('3', 's', 60, 8, { concluidaEm: null }), se('4', 's', 60, 8, { excluidoEm: 'x' })];
    expect(volume(l)).toBe(500);
  });
  it('recordes consolidados', () => {
    expect(recordes([se('1', 's', 50, 10), se('2', 's', 60, 3)])).toEqual({ melhorCarga: 60, melhor1Rm: 66.7, melhorVolumeSerie: 500 });
  });
  it('recorde ao vivo: maior carga é recorde; primeira vez e aquecimento não são', () => {
    const ant = [se('1', 's1', 50, 10)];
    expect(ehRecorde(se('n', 's2', 52.5, 8), ant)).toBe(true);
    expect(ehRecorde(se('n', 's2', 50, 12), ant)).toBe(true); // 1RM maior com mesma carga
    expect(ehRecorde(se('n', 's2', 45, 10), ant)).toBe(false);
    expect(ehRecorde(se('n', 's2', 80, 5), [])).toBe(false);
    expect(ehRecorde(se('n', 's2', 80, 5, { tipo: 'aquecimento' }), ant)).toBe(false);
  });
  it('"última vez" pega a sessão finalizada mais recente com o exercício, sem a atual', () => {
    const sessoes = [ses('s1', '2026-10-01T10:00:00Z'), ses('s2', '2026-10-05T10:00:00Z'), ses('atual', '2026-10-09T10:00:00Z', null)];
    const series = [se('1', 's1', 40, 10), se('2', 's2', 45, 10), se('3', 's2', 45, 9, { ordem: 2 }), se('4', 'atual', 50, 10)];
    expect(ultimaVez('supino', series, sessoes, 'atual').map((s) => s.id)).toEqual(['2', '3']);
    expect(ultimaVez('outro', series, sessoes, 'atual')).toEqual([]);
  });
  it('lê número com vírgula e recusa negativo/texto', () => {
    expect(lerNumero('52,5')).toBe(52.5);
    expect(lerNumero('-5')).toBeNull();
    expect(lerNumero('abc')).toBeNull();
  });
});
