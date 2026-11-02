// Testes de QA v0.1 (01/11/2026) – bordas e regras de negócio. Dados fictícios.
// Bugs do relatório v0.1 marcados "(corrigido)" eram `it.failing`; corrigidos na 0.2.0.
import { ehRecorde, lerNumero, recordes, ultimaVez, umRmEstimado, volume } from '@/dominio/metricas';
import { cartaoTreinoDeHoje, proximaRotina, treinosUltimos7Dias } from '@/dominio/treino-de-hoje';
import { treinosCsv } from '@/dominio/exportacao';
import { acoes, estadoInicial, migrarEstado } from '@/estado/armazem';
import type { Serie, SessaoTreino, Rotina } from '@/dominio/tipos';

const s = (p: Partial<Serie>): Serie => ({ id: Math.random().toString(), sessaoId: 's1', exercicioId: 'e1', ordem: 1, tipo: 'normal', cargaKg: 50, reps: 8, duracaoS: null, rpe: null, concluidaEm: '2026-10-01T10:00:00Z', atualizadoEm: '', ...p });
const ses = (p: Partial<SessaoTreino>): SessaoTreino => ({ id: 's1', rotinaId: null, iniciadaEm: '2026-10-01T10:00:00Z', finalizadaEm: '2026-10-01T11:00:00Z', notas: null, atualizadoEm: '', ...p });
const rot = (id: string, ordem: number, extra: Partial<Rotina> = {}): Rotina => ({ id, nome: id, ordem, itens: [], atualizadoEm: '', ...extra });
const comConsent = () => acoes.definirConsentimento(acoes.entrar(estadoInicial()), 'dados_saude', true);

describe('lerNumero (entrada de carga/reps)', () => {
  it.each([['52,5', 52.5], [' 10 ', 10], ['0', 0], ['007', 7], ['100.25', 100.25]])('"%s" → %p', (t, n) => expect(lerNumero(t)).toBe(n));
  it.each(['', '-5', '1e3', '1.5.5', '52,', ',5', 'abc', '1.234,5', '½', '٣'])('"%s" → null', (t) => expect(lerNumero(t)).toBeNull());
  it('lerNumero só interpreta; o teto (BUG-06) fica em salvarSerie', () => expect(lerNumero('99999')).toBe(99999));
});

describe('1RM, volume e recordes', () => {
  it('1RM: reps fora de 1–12, carga 0 ou nula → null; reps 1 = carga', () => {
    expect(umRmEstimado(100, 13)).toBeNull();
    expect(umRmEstimado(100, 0)).toBeNull();
    expect(umRmEstimado(0, 5)).toBeNull();
    expect(umRmEstimado(null, 5)).toBeNull();
    expect(umRmEstimado(100, 1)).toBe(100);
    expect(umRmEstimado(100, 12)).toBe(140);
  });
  it('volume ignora aquecimento, excluídas e não concluídas; arredonda 1 casa', () => {
    expect(volume([s({ cargaKg: 52.5, reps: 3 }), s({ tipo: 'aquecimento' }), s({ excluidoEm: 'x' }), s({ concluidaEm: null })])).toBe(157.5);
  });
  it('recorde: primeira vez não é recorde; aquecimento nunca; empate não é', () => {
    expect(ehRecorde(s({ cargaKg: 100 }), [])).toBe(false);
    expect(ehRecorde(s({ tipo: 'aquecimento', cargaKg: 200 }), [s({ cargaKg: 50 })])).toBe(false);
    expect(ehRecorde(s({ cargaKg: 50, reps: 8 }), [s({ cargaKg: 50, reps: 8 })])).toBe(false);
  });
  it('recorde por 1RM com mesma carga e mais reps', () => {
    expect(ehRecorde(s({ cargaKg: 50, reps: 10 }), [s({ cargaKg: 50, reps: 8 })])).toBe(true);
  });
  it('série excluída ou de outro exercício não conta como recorde anterior', () => {
    expect(ehRecorde(s({ cargaKg: 60 }), [s({ cargaKg: 50 }), s({ cargaKg: 90, excluidoEm: 'x' }), s({ cargaKg: 200, exercicioId: 'e2' })])).toBe(true);
  });
  it('recordes com lista vazia', () => expect(recordes([])).toEqual({ melhorCarga: null, melhor1Rm: null, melhorVolumeSerie: null }));
  it('última vez pula sessão excluída e a sessão atual', () => {
    const sessoes = [ses({ id: 'a', iniciadaEm: '2026-10-01T10:00:00Z' }), ses({ id: 'b', iniciadaEm: '2026-10-03T10:00:00Z', excluidoEm: 'x' }), ses({ id: 'c', iniciadaEm: '2026-10-05T10:00:00Z' })];
    const series = [s({ sessaoId: 'a', cargaKg: 40 }), s({ sessaoId: 'b', cargaKg: 45 }), s({ sessaoId: 'c', cargaKg: 50 })];
    expect(ultimaVez('e1', series, sessoes, 'c').map((x) => x.cargaKg)).toEqual([40]);
  });
});

describe('treino de hoje (L1) e fuso', () => {
  it('sequência A → B → C → A, ignorando rotina excluída', () => {
    const rs = [rot('A', 1), rot('B', 2, { excluidoEm: 'x' }), rot('C', 3)];
    expect(proximaRotina(rs, [ses({ rotinaId: 'A' })])?.id).toBe('C');
    expect(proximaRotina(rs, [ses({ rotinaId: 'C' })])?.id).toBe('A');
  });
  it('última sessão de rotina já excluída volta ao início', () => {
    expect(proximaRotina([rot('A', 1), rot('C', 3)], [ses({ rotinaId: 'B' })])?.id).toBe('A');
  });
  it('treino às 23h30 de São Paulo conta como "feito hoje" (02:30 UTC do dia seguinte)', () => {
    const c = cartaoTreinoDeHoje([rot('A', 1)], [ses({ rotinaId: 'A', finalizadaEm: '2026-10-02T02:30:00Z' })], '2026-10-01T23:50:00-03:00');
    expect(c.estado).toBe('feito');
  });
  it('treino finalizado no futuro (relógio adiantado) não conta nos 7 dias', () => {
    expect(treinosUltimos7Dias([ses({ finalizadaEm: '2026-10-10T00:00:00Z' })], '2026-10-05T00:00:00Z')).toBe(0);
  });
  it('sem rotina → sem_rotina', () => expect(cartaoTreinoDeHoje([], [], '2026-10-01T10:00:00Z').estado).toBe('sem_rotina'));
});

describe('estado do aparelho – regras de negócio', () => {
  it('peso: limites 20 e 400 aceitos; 19,99, 400,01, NaN e Infinity recusados', () => {
    const e = comConsent();
    const p = (kg: number) => () => acoes.registrarPeso(e, { id: 'p', pesoKg: kg, medidoEm: '2026-10-01T08:00:00Z', atualizadoEm: '' });
    expect(p(20)).not.toThrow(); expect(p(400)).not.toThrow();
    for (const v of [19.99, 400.01, NaN, Infinity]) expect(p(v)).toThrow('valor_invalido');
  });
  it('série: carga ou reps negativos recusados', () => {
    expect(() => acoes.salvarSerie(comConsent(), s({ cargaKg: -1 }))).toThrow('valor_invalido');
    expect(() => acoes.salvarSerie(comConsent(), s({ reps: -1 }))).toThrow('valor_invalido');
  });
  it('BUG-06 (corrigido): série com carga acima do limite do servidor (1000 kg) deveria ser recusada no aparelho', () => {
    expect(() => acoes.salvarSerie(comConsent(), s({ cargaKg: 5000 }))).toThrow('valor_invalido');
  });
  it('salvar a mesma série duas vezes (toque duplo) não duplica nem na lista nem na fila', () => {
    const x = s({ id: 'dup' });
    const e = acoes.salvarSerie(acoes.salvarSerie(comConsent(), x), x);
    expect(e.series.filter((i) => i.id === 'dup')).toHaveLength(1);
    expect(e.fila.filter((i) => i.registro.id === 'dup')).toHaveLength(1);
  });
  it('BUG-09 (corrigido): iniciarSessao não deveria aceitar segunda sessão ativa (regra L2.5 só existe na tela)', () => {
    const e = acoes.iniciarSessao(comConsent(), ses({ id: 's1', finalizadaEm: null }));
    expect(() => acoes.iniciarSessao(e, ses({ id: 's2', finalizadaEm: null }))).toThrow();
  });
  it('excluir rotina é lógica e entra na fila; id inexistente não muda nada', () => {
    const e = acoes.salvarRotina(comConsent(), rot('A', 1));
    const d = acoes.excluirRotina(e, 'A');
    expect(d.rotinas[0].excluidoEm).toBeTruthy();
    expect(d.fila.at(-1)?.registro.excluidoEm).toBeTruthy();
    expect(acoes.excluirRotina(e, 'nao-existe')).toBe(e);
  });
  it('exclusão de conta no aparelho zera usuário, consentimentos, dados e fila', () => {
    let e = acoes.carregarExemplo(acoes.salvarSerie(comConsent(), s({})));
    e = acoes.excluirTudo();
    expect(e).toEqual(estadoInicial());
  });
  it('consentimento (versão de 01/11 15:14): revogar mantém histórico; conceder de novo cria novo registro', () => {
    let e = comConsent();
    e = acoes.definirConsentimento(e, 'dados_saude', false);
    expect(e.consentimentos).toHaveLength(1);
    expect(e.consentimentos[0].revogadoEm).toBeTruthy();
    expect(() => acoes.salvarSerie(e, s({}))).toThrow('sem_consentimento');
    expect(() => acoes.registrarPeso(e, { id: 'p', pesoKg: 80, medidoEm: 'x', atualizadoEm: '' })).toThrow('sem_consentimento');
    e = acoes.definirConsentimento(e, 'dados_saude', true);
    expect(e.consentimentos).toHaveLength(2);
    expect(e.consentimentos[1].revogadoEm).toBeNull();
  });
  it('conceder duas vezes (toque duplo) não duplica o registro', () => {
    const e = acoes.definirConsentimento(comConsent(), 'dados_saude', true);
    expect(e.consentimentos).toHaveLength(1);
  });
  it('consentimento de IA não libera dados de saúde', () => {
    const e = acoes.definirConsentimento(acoes.entrar(estadoInicial()), 'ia_visao_eua', true);
    expect(() => acoes.salvarSerie(e, s({}))).toThrow('sem_consentimento');
  });
  it('aceite de versão antiga do texto não vale (pede de novo)', () => {
    const e = { ...acoes.entrar(estadoInicial()), consentimentos: [{ id: 'c', finalidade: 'dados_saude' as const, versao: 'v0-antiga', aceitoEm: 'x', revogadoEm: null }] };
    expect(() => acoes.salvarSerie(e, s({}))).toThrow('sem_consentimento');
  });
  it('migração do formato 1: e-mail descartado e aceite antigo vira histórico encerrado', () => {
    const m = migrarEstado({ versao: 1, usuario: { email: 'qa@exemplo.test', modo: 'local' }, consentimentos: { dadosSaude: true, iaVisaoEua: false, versao: 'v1-rascunho', aceitoEm: '2026-10-01T10:00:00Z' }, exercicios: [], rotinas: [], sessoes: [], series: [], pesos: [], fila: [], permissaoNotificacao: 'nao_pedida' })!;
    expect(JSON.stringify(m)).not.toContain('qa@exemplo.test');
    expect(m.consentimentos[0].revogadoEm).toBeTruthy();
    expect(migrarEstado({ versao: 99 })).toBeNull();
  });
});

describe('textos enormes e caracteres especiais na exportação', () => {
  it('CSV escapa aspas, ponto e vírgula, quebra de linha; preserva emoji e acentos', () => {
    const csv = treinosCsv({ rotinas: [rot('r', 1, { nome: 'Peito "pesado";\n💪 ção' })], sessoes: [ses({ rotinaId: 'r' })], series: [s({})], pesos: [], exercicios: [] });
    expect(csv.split('\n')[1]).toContain('"Peito ""pesado"";\n💪 ção"'.split('\n')[0]);
    expect(csv).toContain('💪 ção"');
  });
  it('BUG-11 (corrigido): CSV deveria neutralizar fórmula (=, +, -, @) no início do campo (injeção em planilha)', () => {
    const csv = treinosCsv({ rotinas: [rot('r', 1, { nome: '=HYPERLINK("http://exemplo.test")' })], sessoes: [ses({ rotinaId: 'r' })], series: [s({})], pesos: [], exercicios: [] });
    expect(csv).not.toMatch(/;"?=HYPERLINK/);
  });
  it('BUG-06/08 (corrigido): nome de rotina acima de 60 caracteres ou só com espaços é recusado no aparelho', () => {
    expect(() => acoes.salvarRotina(comConsent(), rot('A', 1, { nome: 'x'.repeat(10000) }))).toThrow('valor_invalido');
    expect(() => acoes.salvarRotina(comConsent(), rot('A', 1, { nome: '   ' }))).toThrow('valor_invalido');
  });
});
