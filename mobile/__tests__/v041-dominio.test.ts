// v0.4.1 – regras puras: IMC, água, treinos sugeridos, objetivo/áreas, dietas, perfil, exportação e migração.
import { arredondar50, diaLocal, metaPadraoMl, totalDoDia, ultimos7Dias, type RegistroAgua } from '@/dominio/agua';
import { BIBLIOTECA } from '@/dominio/biblioteca';
import { ALERTA_RESTRITIVA, DIETAS } from '@/dominio/dietas';
import { arquivosExportacao, dadosParaExportar, fotoPerfilBytes } from '@/dominio/exportacao';
import { alturaValida, calcularImc, faixaImc, formatarImc } from '@/dominio/imc';
import { divisaoPorDias, recomendar, REGRAS } from '@/dominio/objetivo';
import { AREAS, MODELOS, modeloDaArea, regioesDoModelo, rotinaDoModelo, tempoEstimadoMin } from '@/dominio/treinos-sugeridos';
import { acoes, estadoInicial, migrarEstado, precisaApresentacao } from '@/estado/armazem';

const comSaude = () => acoes.definirConsentimento(acoes.entrar(estadoInicial()), 'dados_saude', true);

describe('IMC', () => {
  it('peso ÷ altura² com 1 casa', () => {
    expect(calcularImc(70, 175)).toBe(22.9);
    expect(calcularImc(80, 180)).toBe(24.7);
    expect(formatarImc(22.9)).toBe('22,9');
  });
  it('sem peso ou com altura fora de 100–250 não calcula', () => {
    expect(calcularImc(null, 170)).toBeNull();
    expect(calcularImc(70, 99)).toBeNull();
    expect(calcularImc(70, 251)).toBeNull();
    expect(alturaValida(100) && alturaValida(250)).toBe(true);
  });
  it.each([[18.4, 'abaixo'], [18.5, 'referencia'], [24.9, 'referencia'], [24.94, 'referencia'], [24.95, 'acima'], [25, 'acima'], [29.9, 'acima'], [30, 'bem-acima'], [42, 'bem-acima']])('faixa de %p = %p', (v, f) => {
    expect(faixaImc(v as number)).toBe(f);
  });
  it('altura exige consentimento e limites; entra no Excluir tudo', () => {
    expect(() => acoes.definirAltura(acoes.entrar(estadoInicial()), 170)).toThrow('sem_consentimento');
    expect(() => acoes.definirAltura(comSaude(), 99)).toThrow('valor_invalido');
    expect(() => acoes.definirAltura(comSaude(), 251)).toThrow('valor_invalido');
    const e = acoes.definirAltura(comSaude(), 172);
    expect(e.perfil?.alturaCm).toBe(172);
    expect(acoes.excluirTudo().perfil?.alturaCm).toBeNull();
  });
});

describe('água', () => {
  const r = (ml: number, quando: Date): RegistroAgua => ({ id: String(Math.random()), ml, registradoEm: quando.toISOString(), atualizadoEm: '' });
  it('meta padrão 35 ml/kg arredondada a 50 ml; sem peso não há meta', () => {
    expect(metaPadraoMl(70)).toBe(2450);
    expect(metaPadraoMl(78.5)).toBe(2750); // 2747,5 → 2750
    expect(metaPadraoMl(61)).toBe(2150); // 2135 → 2150
    expect(arredondar50(2124)).toBe(2100);
    expect(metaPadraoMl(null)).toBeNull();
  });
  it('vira o dia à meia-noite local', () => {
    const l = [r(250, new Date(2026, 10, 1, 23, 59)), r(500, new Date(2026, 10, 2, 0, 0)), r(250, new Date(2026, 10, 2, 0, 1))];
    expect(totalDoDia(l, new Date(2026, 10, 1, 12))).toBe(250);
    expect(totalDoDia(l, new Date(2026, 10, 2, 8))).toBe(750);
    expect(diaLocal(new Date(2026, 10, 2, 0, 0))).toBe('2026-11-02');
  });
  it('últimos 7 dias incluem hoje e zeram dias sem registro', () => {
    const l = [r(500, new Date(2026, 10, 1, 9)), r(300, new Date(2026, 9, 26, 9)), r(999, new Date(2026, 9, 25, 9))];
    const s = ultimos7Dias(l, new Date(2026, 10, 1, 20));
    expect(s).toHaveLength(7);
    expect(s[0]).toEqual({ dia: '2026-10-26', ml: 300 });
    expect(s[6]).toEqual({ dia: '2026-11-01', ml: 500 });
  });
  it('registrar exige consentimento e limites; desfazer remove; meta manual valida', () => {
    const t = new Date().toISOString();
    expect(() => acoes.registrarAgua(acoes.entrar(estadoInicial()), { id: 'a', ml: 250, registradoEm: t, atualizadoEm: t })).toThrow('sem_consentimento');
    expect(() => acoes.registrarAgua(comSaude(), { id: 'a', ml: 0, registradoEm: t, atualizadoEm: t })).toThrow('valor_invalido');
    let e = acoes.registrarAgua(comSaude(), { id: 'a', ml: 250, registradoEm: t, atualizadoEm: t });
    e = acoes.registrarAgua(e, { id: 'b', ml: 500, registradoEm: t, atualizadoEm: t });
    expect(acoes.desfazerAgua(e, 'b').agua).toHaveLength(1);
    expect(() => acoes.definirMetaAgua(e, 100)).toThrow('valor_invalido');
    expect(acoes.definirMetaAgua(e, 2000).perfil?.metaAguaMl).toBe(2000);
    expect(acoes.excluirTudo().agua).toEqual([]);
  });
});

describe('treinos sugeridos', () => {
  it('tipos em 2 níveis (v0.4.4: +elástico, kettlebell e barra fixa), só com exercícios do catálogo e volumes conservadores', () => {
    expect(new Set(MODELOS.map((m) => m.nome.replace('Iniciante em casa', 'Em casa'))).size).toBe(10);
    const nomes = new Set(BIBLIOTECA.map((e) => e.nome));
    for (const m of MODELOS) for (const i of m.itens) {
      expect(nomes.has(i.nome)).toBe(true);
      expect(i.series).toBeGreaterThanOrEqual(1); expect(i.series).toBeLessThanOrEqual(3);
      if (i.reps != null) { expect(i.reps).toBeGreaterThanOrEqual(6); expect(i.reps).toBeLessThanOrEqual(15); }
      expect(i.descansoS).toBeGreaterThanOrEqual(60); expect(i.descansoS).toBeLessThanOrEqual(180);
    }
  });
  it('em casa não usa equipamento', () => {
    for (const m of MODELOS.filter((x) => x.id.startsWith('casa'))) for (const i of m.itens) expect(BIBLIOTECA.find((e) => e.nome === i.nome)!.equipamento).toBe('Peso corporal');
  });
  it('tempo estimado pela fórmula (séries × reps × 3 s + descanso + 1 min de troca), em múltiplos de 5', () => {
    const m = { id: 't', nome: 'T', nivel: 'iniciante' as const, descricao: '', itens: [{ nome: 'Leg press 45°', series: 2, reps: 12, descansoS: 90 }] };
    // 2×36 + 90 + 60 = 222 s = 3,7 min → mínimo 5
    expect(tempoEstimadoMin(m)).toBe(5);
    const sup = MODELOS.find((x) => x.id === 'superiores-i')!; // 6 × (72 + 90 + 60) = 1332 s ≈ 22 min → 20
    expect(tempoEstimadoMin(sup)).toBe(20);
  });
  it('vira rotina editável com ids novos', () => {
    let n = 0;
    const r = rotinaDoModelo(MODELOS[0], 3, () => `id-${++n}`, '2026-11-01T00:00:00Z');
    expect(r.nome).toBe('Superiores (iniciante)');
    expect(r.ordem).toBe(3);
    expect(r.itens).toHaveLength(MODELOS[0].itens.length);
    expect(acoes.salvarRotina(comSaude(), r).rotinas).toHaveLength(1);
  });
  it('mapa muscular: superiores destaca peito e costas, não pernas', () => {
    const r = regioesDoModelo(MODELOS.find((x) => x.id === 'superiores-i')!);
    expect(r).toEqual(expect.arrayContaining(['peito', 'costas']));
    expect(r).not.toContain('quadriceps');
  });
  it('filtro por área', () => {
    const ids = (a: Parameters<typeof modeloDaArea>[1]) => MODELOS.filter((m) => modeloDaArea(m, a)).map((m) => m.id);
    expect(ids('superiores')).toEqual(expect.arrayContaining(['superiores-i', 'empurrar-i', 'puxar-i']));
    expect(ids('superiores')).not.toContain('inferiores-i');
    expect(ids('inferiores')).toEqual(expect.arrayContaining(['inferiores-i', 'pernas-i']));
    expect(ids('corpo-inteiro')).toContain('fullbody-i');
    expect(ids('corpo-inteiro')).not.toContain('superiores-i');
    expect(ids('core')).toEqual(expect.arrayContaining(['casa-i', 'pernas-m']));
    expect(AREAS.filter((a) => a.principal).map((a) => a.nome)).toEqual(['Superiores', 'Inferiores', 'Corpo inteiro', 'Abdômen/Core']);
  });
});

describe('objetivo → recomendação', () => {
  it.each([[2, ['Full Body']], [3, ['Full Body']], [4, ['Superiores', 'Inferiores']], [5, ['Empurrar', 'Puxar', 'Pernas']], [6, ['Empurrar', 'Puxar', 'Pernas']]])('%p dias → %p', (d, l) => {
    expect(divisaoPorDias(d as number)).toEqual(l);
  });
  it('iniciante mantém 8–12 reps do modelo, qualquer objetivo', () => {
    const [m] = recomendar({ objetivo: 'forca', nivel: 'iniciante', dias: 3 });
    expect(m.id).toBe('fullbody-i');
    expect(m.itens.filter((i) => i.reps != null).every((i) => i.reps! >= 8 && i.reps! <= 12)).toBe(true);
  });
  it('intermediário: reps e descanso seguem o objetivo; força avançado 6 reps e 3 min', () => {
    const cond = recomendar({ objetivo: 'condicionamento', nivel: 'intermediario', dias: 4 });
    expect(cond.map((m) => m.nome)).toEqual(['Superiores', 'Inferiores']);
    expect(cond[0].itens[0]).toMatchObject({ reps: REGRAS.condicionamento.reps, descansoS: 60 });
    const f = recomendar({ objetivo: 'forca', nivel: 'avancado', dias: 5 });
    expect(f[0].itens[0]).toMatchObject({ reps: 6, descansoS: 180 });
    expect(recomendar({ objetivo: 'forca', nivel: 'intermediario', dias: 5 })[0].itens[0]).toMatchObject({ reps: 8, descansoS: 120 });
  });
  it('prancha (por tempo) não ganha repetições', () => {
    const fb = recomendar({ objetivo: 'massa', nivel: 'intermediario', dias: 2 })[0];
    expect(fb.itens.find((i) => i.nome === 'Prancha')!.reps).toBeNull();
  });
  it('áreas de foco acrescentam até 2 modelos da área sem repetir', () => {
    const r = recomendar({ objetivo: 'saude', nivel: 'iniciante', dias: 3, areas: ['superiores'] });
    expect(r[0].id).toBe('fullbody-i');
    expect(r.length).toBeLessThanOrEqual(3);
    expect(r.slice(1).every((m) => modeloDaArea(m, 'superiores'))).toBe(true);
    expect(new Set(r.map((m) => m.id)).size).toBe(r.length);
  });
  it('mudar o objetivo não apaga o plano', () => {
    let e = acoes.salvarRotina(comSaude(), rotinaDoModelo(MODELOS[0], 1, () => Math.random().toString(), ''));
    e = acoes.definirObjetivo(e, { objetivo: 'massa', nivel: 'intermediario', dias: 4 });
    e = acoes.definirObjetivo(e, { objetivo: 'forca', nivel: 'avancado', dias: 6 });
    expect(e.rotinas).toHaveLength(1);
    expect(e.perfil?.treino?.objetivo).toBe('forca');
    expect(() => acoes.definirObjetivo(e, { objetivo: 'forca', nivel: 'avancado', dias: 7 })).toThrow('valor_invalido');
  });
});

describe('dietas (conteúdo informativo)', () => {
  it('as 8 dietas pedidas, com todas as seções', () => {
    expect(DIETAS.map((d) => d.id)).toEqual(['vegetariana', 'vegana', 'mediterranea', 'paleo', 'cetogenica', 'low-carb', 'jejum-intermitente', 'atkins']);
    for (const d of DIETAS) {
      expect(d.oQueE.length).toBeGreaterThan(20);
      expect(d.comer.length && d.evitar.length && d.naoIndicada.length).toBeTruthy();
      expect(d.cardapio.length).toBeGreaterThanOrEqual(3);
      expect(d.fontes.length).toBeGreaterThan(0);
    }
  });
  it('cetogênica, jejum e Atkins têm o alerta para os 6 grupos', () => {
    for (const id of ['cetogenica', 'jejum-intermitente', 'atkins']) expect(DIETAS.find((d) => d.id === id)!.alerta).toBe(ALERTA_RESTRITIVA);
    for (const g of ['gestantes', 'lactantes', 'diabetes', 'transtorno alimentar', 'doença renal', 'menores de 18']) expect(ALERTA_RESTRITIVA).toContain(g);
  });
  it('sem números (calorias, gramas, metas)', () => {
    const texto = JSON.stringify(DIETAS);
    expect(texto).not.toMatch(/\d+\s*(kcal|cal|g\b|gramas|%)/i);
    expect(texto).not.toMatch(/\bcalorias? por\b/i);
  });
});

describe('apresentação, perfil, exportação e migração', () => {
  it('apresentação só no primeiro acesso; migração não mostra para quem já usava', () => {
    expect(precisaApresentacao(estadoInicial())).toBe(true);
    expect(precisaApresentacao(acoes.concluirApresentacao(estadoInicial()))).toBe(false);
    const antigo = { ...estadoInicial(), consentimentosVistosEm: '2026-10-01T00:00:00Z' } as Record<string, unknown>;
    delete antigo.apresentacaoVistaEm; delete antigo.perfil; delete antigo.agua;
    const m = migrarEstado(antigo)!;
    expect(precisaApresentacao(m)).toBe(false);
    expect(m.perfil).toEqual({ nome: null, avatar: null, alturaCm: null });
    expect(m.agua).toEqual([]);
  });
  it('nome e avatar: limites, troca e remoção', () => {
    expect(() => acoes.definirNome(estadoInicial(), 'x'.repeat(41))).toThrow('valor_invalido');
    expect(acoes.definirNome(estadoInicial(), '  Ana  ').perfil?.nome).toBe('Ana');
    expect(acoes.definirNome(estadoInicial(), '   ').perfil?.nome).toBeNull();
    expect(() => acoes.definirAvatar(estadoInicial(), { tipo: 'foto', uri: 'https://exemplo.test/a.jpg' })).toThrow('valor_invalido');
    let e = acoes.definirAvatar(estadoInicial(), { tipo: 'ilustrado', id: 'a3' });
    e = acoes.definirAvatar(e, null);
    expect(e.perfil?.avatar).toBeNull();
  });
  it('exportação leva perfil, água e a foto como arquivo', () => {
    const t = new Date().toISOString();
    let e = acoes.definirAltura(comSaude(), 170);
    e = acoes.registrarAgua(e, { id: 'w', ml: 250, registradoEm: t, atualizadoEm: t });
    e = acoes.definirAvatar(e, { tipo: 'foto', uri: 'data:image/jpeg;base64,/9j/AA==' });
    const a = arquivosExportacao(dadosParaExportar(e));
    const j = JSON.parse(a['dados.json']);
    expect(j.perfil.alturaCm).toBe(170);
    expect(j.agua[0].ml).toBe(250);
    expect(a['agua.csv']).toContain(';250');
    expect(Array.from(fotoPerfilBytes(e)!.slice(0, 2))).toEqual([0xff, 0xd8]);
    expect(fotoPerfilBytes(estadoInicial())).toBeNull();
  });
});

import { ETIQUETAS as ETQ, filtrarIdeias, IDEIAS, MOMENTOS } from '@/dominio/refeicoes';
describe('ideias de refeições', () => {
  it('4 momentos, cada um com ideias completas', () => {
    for (const m of MOMENTOS) expect(IDEIAS.filter((i) => i.momento === m.id).length).toBeGreaterThanOrEqual(3);
    for (const i of IDEIAS) { expect(i.ingredientes.length).toBeGreaterThan(1); expect(i.preparo.length).toBeGreaterThan(10); expect(i.etiquetas.length).toBeGreaterThan(0); }
  });
  it('filtro combina etiquetas (E) e as etiquetas de dieta apontam para dietas existentes', () => {
    expect(filtrarIdeias('almoco', ['vegana']).every((i) => i.etiquetas.includes('vegana'))).toBe(true);
    expect(filtrarIdeias('cafe', ['vegana', 'low-carb'])).toEqual([]);
    const ids = new Set(DIETAS.map((d) => d.id));
    for (const e of ETQ) if (e.dieta) expect(ids.has(e.dieta as never)).toBe(true);
  });
  it('vegana nunca leva ovo, leite, queijo ou iogurte; sem números nutricionais', () => {
    for (const i of IDEIAS.filter((x) => x.etiquetas.includes('vegana'))) expect(i.ingredientes.join(' ')).not.toMatch(/ovo|leite|queijo|iogurte|mel\b/i);
    expect(JSON.stringify(IDEIAS)).not.toMatch(/\d+\s*(kcal|cal|g\b|gramas|%)/i);
  });
});

import { FONTES } from '@/dominio/dietas';
it('toda fonte citada nas dietas tem nome no mapa de fontes', () => {
  for (const d of DIETAS) for (const f of d.fontes) expect(FONTES[f]).toBeTruthy();
});

describe('tour guiado: domínio', () => {
  const { recomendarPara, validarHora, nivelDaExperiencia, dietaDaPreferencia, etiquetaDaPreferencia, imcSeAplica } = require('@/dominio/tour') as typeof import('@/dominio/tour');
  const { acoes: a, estadoInicial: ei } = require('@/estado/armazem') as typeof import('@/estado/armazem');
  const t = { objetivo: 'saude' as const, nivel: 'iniciante' as const, dias: 4, areas: [] };
  it('em casa/ao ar livre o treino sem aparelhos vem primeiro', () => {
    expect(recomendarPara(t, { local: 'casa' }).modelos[0].id.startsWith('casa')).toBe(true);
    expect(recomendarPara(t, {}).modelos.some((m) => m.id.startsWith('casa'))).toBe(false);
  });
  it('joelho deixa treinos de inferiores por último, sem esconder; avisos por idade e restrição', () => {
    const r = recomendarPara(t, { restricoes: ['joelho'], faixaIdade: 'menos-18' });
    expect(r.modelos.at(-1)!.nome).toBe('Inferiores');
    expect(r.modelos).toHaveLength(recomendarPara(t).modelos.length);
    expect(r.avisos).toHaveLength(2);
  });
  it('tempo por treino marca o que cabe', () => {
    expect(recomendarPara(t, { tempoTreinoMin: 60 }).modelos.every((m) => m.cabeNoTempo)).toBe(true);
    const r30 = recomendarPara({ ...t, nivel: 'intermediario', dias: 6 }, { tempoTreinoMin: 30 });
    const i = r30.modelos.findIndex((m) => !m.cabeNoTempo);
    if (i >= 0) expect(r30.modelos.slice(i).every((m) => !m.cabeNoTempo)).toBe(true);
  });
  it('hora, nível pela experiência, preferência alimentar e IMC para menores', () => {
    expect(validarHora('07:30')).toBe(true); expect(validarHora('24:00')).toBe(false); expect(validarHora('7:30')).toBe(false);
    expect(nivelDaExperiencia('nunca')).toBe('iniciante'); expect(nivelDaExperiencia('1-3')).toBe('intermediario'); expect(nivelDaExperiencia('mais-3')).toBe('avancado');
    expect(dietaDaPreferencia('vegana')).toBe('vegana'); expect(dietaDaPreferencia('sem-lactose')).toBeNull(); expect(etiquetaDaPreferencia('sem-lactose')).toBe('sem-lactose');
    expect(imcSeAplica('menos-18')).toBe(false); expect(imcSeAplica('18-29')).toBe(true); expect(imcSeAplica(null)).toBe(true);
  });
  it('atualizarPerfil: restrição exige consentimento, cidade aparada e limitada, hora validada; Excluir tudo apaga', () => {
    const sem = a.consentir(a.entrar(ei()), { dadosSaude: false });
    expect(() => a.atualizarPerfil(sem, { restricoes: ['coluna'] })).toThrow('sem_consentimento');
    const com = a.consentir(a.entrar(ei()), { dadosSaude: true });
    const e = a.atualizarPerfil(com, { restricoes: ['coluna'], cidade: '  ' + 'x'.repeat(80), bairro: '   ' });
    expect(e.perfil?.cidade).toHaveLength(60); expect(e.perfil?.bairro).toBeNull();
    expect(() => a.atualizarPerfil(com, { lembretes: { treinoHora: '25:00', agua: false } })).toThrow('valor_invalido');
    expect(a.excluirTudo().perfil?.restricoes).toBeUndefined();
  });
  it('exportação leva os dados do tour', () => {
    const { dadosParaExportar } = require('@/dominio/exportacao') as typeof import('@/dominio/exportacao');
    const e = a.atualizarPerfil(a.consentir(a.entrar(ei()), { dadosSaude: true }), { faixaIdade: '30-44', restricoes: ['ombro'], cidade: 'C' });
    expect(dadosParaExportar(e).perfil).toMatchObject({ faixaIdade: '30-44', restricoes: ['ombro'], cidade: 'C' });
  });
});
