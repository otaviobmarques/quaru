// v0.5 – sequência e semana, progressão, lembrete de backup, lembretes, diário alimentar, volume por semana, compartilhar.
import { precisaLembrarBackup } from '@/dominio/backup';
import { volumePorSemana } from '@/dominio/consultas';
import { textoCompartilharTreino } from '@/dominio/compartilhar';
import { doDia, marcar } from '@/dominio/diario';
import { planoLembretes } from '@/dominio/lembretes';
import { sugerirProgressao } from '@/dominio/progressao';
import type { Serie, SessaoTreino } from '@/dominio/tipos';
import { semanaTreinos, sequenciaDias } from '@/dominio/treino-de-hoje';
import { acoes, estadoInicial } from '@/estado/armazem';

const sessao = (id: string, fim: string): SessaoTreino => ({ id, rotinaId: null, iniciadaEm: fim, finalizadaEm: fim, notas: null, atualizadoEm: fim });
const serie = (p: Partial<Serie>): Serie => ({ id: 'x', sessaoId: 's', exercicioId: 'e', ordem: 1, tipo: 'normal', cargaKg: 40, reps: 10, duracaoS: null, rpe: null, concluidaEm: 'z', atualizadoEm: '', ...p });
// 15h UTC = 12h em Brasília
const dia = (d: string) => `${d}T15:00:00.000Z`;

describe('sequência de dias', () => {
  it('conta dias seguidos até hoje', () => {
    const l = [sessao('a', dia('2026-11-01')), sessao('b', dia('2026-11-02')), sessao('c', dia('2026-11-03'))];
    expect(sequenciaDias(l, dia('2026-11-03'))).toEqual({ dias: 3, hoje: true });
  });
  it('sem treino hoje, conta até ontem (a sequência ainda vale)', () => {
    const l = [sessao('a', dia('2026-11-01')), sessao('b', dia('2026-11-02'))];
    expect(sequenciaDias(l, dia('2026-11-03'))).toEqual({ dias: 2, hoje: false });
  });
  it('um dia inteiro sem treino zera', () => {
    expect(sequenciaDias([sessao('a', dia('2026-11-01'))], dia('2026-11-03')).dias).toBe(0);
  });
  it('dois treinos no mesmo dia contam um dia; excluído e em andamento não contam', () => {
    const l = [sessao('a', dia('2026-11-03')), sessao('b', dia('2026-11-03')), { ...sessao('c', dia('2026-11-02')), excluidoEm: 'x' }, { ...sessao('d', dia('2026-11-01')), finalizadaEm: null }];
    expect(sequenciaDias(l, dia('2026-11-03'))).toEqual({ dias: 1, hoje: true });
  });
  it('semana: 7 dias terminando hoje, com os feitos marcados', () => {
    const s = semanaTreinos([sessao('a', dia('2026-11-01'))], dia('2026-11-03'));
    expect(s).toHaveLength(7);
    expect(s.at(-1)).toEqual({ dia: '2026-11-03', feito: false, hoje: true });
    expect(s.find((x) => x.dia === '2026-11-01')?.feito).toBe(true);
  });
});

describe('progressão de carga', () => {
  it('bateu as reps em todas as séries: sobe um degrau (5%, entre 1 e 2,5 kg)', () => {
    expect(sugerirProgressao([serie({ cargaKg: 40, reps: 10 }), serie({ ordem: 2, cargaKg: 40, reps: 12 })], 10)).toEqual({ tipo: 'carga', deKg: 40, paraKg: 42, incrementoKg: 2 });
    expect(sugerirProgressao([serie({ cargaKg: 100, reps: 8 })], 8)).toMatchObject({ paraKg: 102.5, incrementoKg: 2.5 });
    expect(sugerirProgressao([serie({ cargaKg: 8, reps: 12 })], 12)).toMatchObject({ paraKg: 9, incrementoKg: 1 });
  });
  it('alguma série abaixo do alvo: não sugere nada', () => {
    expect(sugerirProgressao([serie({ reps: 10 }), serie({ ordem: 2, reps: 8 })], 10)).toBeNull();
  });
  it('aquecimento não conta; sem alvo ou sem histórico não sugere', () => {
    expect(sugerirProgressao([serie({ tipo: 'aquecimento', reps: 5 }), serie({ ordem: 2, reps: 10 })], 10)).not.toBeNull();
    expect(sugerirProgressao([serie({})], null)).toBeNull();
    expect(sugerirProgressao([], 10)).toBeNull();
  });
  it('peso do corpo: +1 repetição', () => {
    expect(sugerirProgressao([serie({ cargaKg: null, reps: 12 })], 12)).toEqual({ tipo: 'reps', paraReps: 13 });
  });
});

describe('lembrete de cópia (backup)', () => {
  const agora = '2026-11-20T12:00:00Z';
  it('sem dados, não lembra', () => expect(precisaLembrarBackup({ temDados: false, agora })).toBe(false));
  it('nunca exportou: lembra', () => expect(precisaLembrarBackup({ temDados: true, agora })).toBe(true));
  it('exportou há menos de 14 dias: não lembra; há 14 ou mais: lembra', () => {
    expect(precisaLembrarBackup({ temDados: true, ultimaExportacaoEm: '2026-11-10T12:00:00Z', agora })).toBe(false);
    expect(precisaLembrarBackup({ temDados: true, ultimaExportacaoEm: '2026-11-06T12:00:00Z', agora })).toBe(true);
  });
  it('"Agora não" adia 7 dias', () => {
    expect(precisaLembrarBackup({ temDados: true, lembreteBackupAdiadoEm: '2026-11-15T12:00:00Z', agora })).toBe(false);
    expect(precisaLembrarBackup({ temDados: true, lembreteBackupAdiadoEm: '2026-11-12T12:00:00Z', agora })).toBe(true);
  });
  it('exportar zera o adiamento e grava a data', () => {
    const e = acoes.registrarExportacao(acoes.adiarLembreteBackup(estadoInicial()));
    expect(e.ultimaExportacaoEm).toBeTruthy();
    expect(e.lembreteBackupAdiadoEm).toBeNull();
  });
});

describe('lembretes', () => {
  it('treino no horário escolhido e água de 2 em 2 horas', () => {
    const p = planoLembretes({ treinoHora: '07:30', agua: true });
    expect(p[0]).toMatchObject({ id: 'lembrete-treino', hora: 7, minuto: 30, tipo: 'treino' });
    expect(p.filter((l) => l.tipo === 'agua').map((l) => l.hora)).toEqual([10, 12, 14, 16, 18, 20]);
  });
  it('nada ativado: plano vazio; textos sem dado de saúde', () => {
    expect(planoLembretes({ treinoHora: null, agua: false })).toEqual([]);
    expect(planoLembretes(null)).toEqual([]);
    for (const l of planoLembretes({ treinoHora: '18:00', agua: true })) expect(`${l.titulo} ${l.corpo}`).not.toMatch(/kg|peso|IMC|lesão/i);
  });
});

describe('diário alimentar', () => {
  it('um registro por dia e refeição; tocar de novo (null) desmarca', () => {
    let l = marcar([], '2026-11-03', 'cafe', 'bem', 't');
    l = marcar(l, '2026-11-03', 'cafe', 'mais-ou-menos', 't');
    l = marcar(l, '2026-11-03', 'almoco', 'pulei', 't');
    expect(doDia(l, '2026-11-03')).toHaveLength(2);
    expect(l.find((r) => r.momento === 'cafe')?.avaliacao).toBe('mais-ou-menos');
    expect(marcar(l, '2026-11-03', 'cafe', null, 't')).toHaveLength(1);
  });
  it('exige o consentimento de dados de saúde', () => {
    expect(() => acoes.marcarRefeicao(acoes.entrar(estadoInicial()), '2026-11-03', 'cafe', 'bem')).toThrow('sem_consentimento');
    const e = acoes.marcarRefeicao(acoes.consentir(acoes.entrar(estadoInicial()), { dadosSaude: true }), '2026-11-03', 'cafe', 'bem');
    expect(e.diario).toHaveLength(1);
  });
});

describe('volume por semana', () => {
  it('8 semanas (segunda a domingo), zeros nas semanas sem treino', () => {
    const s = [sessao('a', dia('2026-11-02')), sessao('b', dia('2026-11-03'))]; // segunda e terça
    const series = [serie({ sessaoId: 'a', cargaKg: 50, reps: 10 }), serie({ id: 'y', sessaoId: 'b', cargaKg: 20, reps: 10 })];
    const v = volumePorSemana({ sessoes: s, series }, dia('2026-11-04'));
    expect(v).toHaveLength(8);
    expect(v.at(-1)).toEqual({ inicio: '2026-11-02', volume: 700, treinos: 2 });
    expect(v.slice(0, -1).every((x) => x.volume === 0 && x.treinos === 0)).toBe(true);
  });
});

describe('compartilhar treino', () => {
  it('leva nome, séries, volume, recorde e sequência; sem dado de saúde', () => {
    const t = textoCompartilharTreino({ nome: 'Treino A', series: 12, volumeKg: '3.240', duracaoMin: 45, recordes: ['Supino 60 kg × 8'], sequencia: 4 });
    expect(t).toContain('Treino A');
    expect(t).toContain('12 séries · 3.240 kg de volume · 45 min');
    expect(t).toContain('Recorde: Supino 60 kg × 8');
    expect(t).toContain('Sequência de 4 dias');
    expect(textoCompartilharTreino({ nome: 'X', series: 1, volumeKg: '0', duracaoMin: null, recordes: [], sequencia: 1 })).not.toMatch(/Sequência|Recorde/);
  });
});
