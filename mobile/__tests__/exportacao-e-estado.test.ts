import { marca } from '@/config/marca';
import { filtrarExercicios, BIBLIOTECA } from '@/dominio/biblioteca';
import { gerarExemplo } from '@/dominio/exemplo';
import { arquivosExportacao, pesoCsv, treinosCsv } from '@/dominio/exportacao';
import { MIT_MUSCLEMAP } from '@/dominio/licencas';
import { acoes, estadoInicial, temExemplo } from '@/estado/armazem';

const sessao = { id: 's1', rotinaId: 'r1', iniciadaEm: '2026-10-01T10:00:00-03:00', finalizadaEm: '2026-10-01T11:00:00-03:00', notas: null, atualizadoEm: '' };
const serie = { id: 'x', sessaoId: 's1', exercicioId: BIBLIOTECA[0].id, ordem: 1, tipo: 'normal' as const, cargaKg: 52.5, reps: 8, duracaoS: null, rpe: 8.5, concluidaEm: 'z', atualizadoEm: '' };

describe('exportação (L3)', () => {
  const d = { rotinas: [{ id: 'r1', nome: 'Treino; A', ordem: 1, itens: [], atualizadoEm: '' }], sessoes: [sessao], series: [serie], pesos: [{ id: 'p', pesoKg: 78.4, medidoEm: '2026-10-01T08:00:00-03:00', atualizadoEm: '' }], exercicios: [...BIBLIOTECA] };
  it('treinos.csv com separador ; vírgula decimal e escape', () => {
    expect(treinosCsv(d)).toBe('data;rotina;exercicio;ordem;tipo;carga_kg;reps;duracao_s;rpe\n2026-10-01T10:00:00-03:00;"Treino; A";Supino reto com barra;1;normal;52,5;8;;8,5\n');
  });
  it('peso_corporal.csv', () => {
    expect(pesoCsv(d)).toBe('medido_em;peso_kg\n2026-10-01T08:00:00-03:00;78,4\n');
  });
  it('pacote tem dados.json versão 1, CSVs e LEIA-ME', () => {
    const a = arquivosExportacao(d);
    expect(Object.keys(a).sort()).toEqual(['LEIA-ME.txt', 'agua.csv', 'dados.json', 'diario_alimentar.csv', 'peso_corporal.csv', 'treinos.csv']); // v0.4.1: + agua.csv; v0.5: + diário
    expect(JSON.parse(a['dados.json']).versao_formato).toBe(1);
  });
});

describe('estado do aparelho', () => {
  const comConsent = () => acoes.consentir(acoes.entrar(estadoInicial(), 'a@exemplo.test'), { dadosSaude: true, iaVisaoEua: false });
  it('sem consentimento de saúde não grava treino nem peso', () => {
    const e = estadoInicial();
    expect(() => acoes.iniciarSessao(e, sessao)).toThrow('sem_consentimento');
    expect(() => acoes.registrarPeso(e, { id: 'p', pesoKg: 80, medidoEm: '', atualizadoEm: '' })).toThrow('sem_consentimento');
  });
  it('recusa carga negativa e peso fora da faixa', () => {
    const e = acoes.iniciarSessao(comConsent(), sessao);
    expect(() => acoes.salvarSerie(e, { ...serie, cargaKg: -1 })).toThrow('valor_invalido');
    expect(() => acoes.registrarPeso(e, { id: 'p', pesoKg: 5, medidoEm: '', atualizadoEm: '' })).toThrow('valor_invalido');
  });
  it('gravar coloca na fila de sincronização sem duplicar', () => {
    let e = acoes.iniciarSessao(comConsent(), sessao);
    e = acoes.salvarSerie(e, serie);
    e = acoes.salvarSerie(e, { ...serie, reps: 9 });
    expect(e.series).toHaveLength(1);
    expect(e.fila.filter((f) => f.tabela === 'series')).toHaveLength(1);
  });
  it('excluir rotina é lógico (excluidoEm) para sincronizar', () => {
    let e = acoes.salvarRotina(comConsent(), { id: 'r', nome: 'A', ordem: 1, itens: [], atualizadoEm: '' });
    e = acoes.excluirRotina(e, 'r');
    expect(e.rotinas[0].excluidoEm).toBeTruthy();
  });
  it('excluir conta zera tudo no aparelho', () => {
    expect(acoes.excluirTudo()).toEqual(estadoInicial());
  });
  it('dados de exemplo são todos marcados e removíveis', () => {
    const x = gerarExemplo(new Date('2026-11-01T12:00:00Z'));
    [...x.rotinas, ...x.sessoes, ...x.series, ...x.pesos].forEach((r) => expect(r.exemplo).toBe(true));
    const e = acoes.carregarExemplo(comConsent());
    expect(temExemplo(e)).toBe(true);
    expect(temExemplo(acoes.removerExemplo(e))).toBe(false);
  });
});

describe('biblioteca, marca e licenças', () => {
  it('busca sem acento e filtra por grupo', () => {
    expect(filtrarExercicios(BIBLIOTECA, 'triceps').map((e) => e.nome)).toEqual(expect.arrayContaining(['Tríceps na polia', 'Tríceps francês']));
    expect(filtrarExercicios(BIBLIOTECA, 'triceps').every((e) => /tr[ií]ceps/i.test(e.nome + ' ' + e.nomeOriginal))).toBe(true);
    expect(filtrarExercicios(BIBLIOTECA, '', 'Pernas').every((e) => e.grupoMuscular === 'Pernas')).toBe(true);
  });
  it('nome vem de um único ponto de configuração', () => {
    expect(marca.nome).toBe('Quaru');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const app = require('../app.json').expo;
    expect(app.name).toBe(marca.nome);
    expect(app.android.package).toBe('br.com.domma.academia'); // identificador ainda não muda
    expect(app.ios.bundleIdentifier).toBe('br.com.domma.academia');
  });
  it('aviso MIT do MuscleMap integral', () => {
    expect(MIT_MUSCLEMAP).toContain('Copyright (c) 2026 Melih Colpan');
    expect(MIT_MUSCLEMAP).toContain('THE SOFTWARE IS PROVIDED "AS IS"');
  });
});
