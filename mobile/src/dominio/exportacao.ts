import type { Exercicio, PesoCorporal, Rotina, Serie, SessaoTreino } from './tipos';

export interface DadosExportacao {
  rotinas: Rotina[]; sessoes: SessaoTreino[]; series: Serie[]; pesos: PesoCorporal[]; exercicios: Exercicio[];
  /** v0.4.1: perfil local (nome, foto/avatar, altura, meta de água) e água. */
  perfil?: { nome: string | null; avatar: { tipo: 'ilustrado'; id: string } | { tipo: 'foto'; uri: string } | null; alturaCm: number | null; metaAguaMl?: number | null } & import('./tour').DadosTour & { treino?: unknown };
  agua?: { id: string; ml: number; registradoEm: string }[];
}

/** Número com vírgula decimal (padrão do Excel no Brasil, L3). */
const num = (n: number | null | undefined) => (n == null ? '' : String(n).replace('.', ','));
/** Escapa campo CSV com separador ';'. */
/** BUG-11: campo começando com = + - @ (ou tab/CR) ganha apóstrofo para a planilha não executar fórmula. Números puros ficam como estão. */
const neutralizar = (t: string) => (/^[=+\-@\t\r]/.test(t) && !/^-?\d+([.,]\d+)?$/.test(t) ? `'${t}` : t);
const campo = (t0: string) => { const t = neutralizar(t0); return /[;"\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
const linha = (l: string[]) => l.map(campo).join(';');

export function treinosCsv(d: DadosExportacao): string {
  const rot = new Map(d.rotinas.map((r) => [r.id, r.nome]));
  const ex = new Map(d.exercicios.map((e) => [e.id, e.nome]));
  const ses = new Map(d.sessoes.map((s) => [s.id, s]));
  const cab = ['data', 'rotina', 'exercicio', 'ordem', 'tipo', 'carga_kg', 'reps', 'duracao_s', 'rpe'];
  const corpo = d.series.filter((s) => !s.excluidoEm).map((s) => {
    const se = ses.get(s.sessaoId);
    return linha([se?.iniciadaEm ?? '', (se?.rotinaId && rot.get(se.rotinaId)) || '', ex.get(s.exercicioId) ?? '',
      String(s.ordem), s.tipo, num(s.cargaKg), num(s.reps), num(s.duracaoS), num(s.rpe)]);
  });
  return [linha(cab), ...corpo].join('\n') + '\n';
}

export function pesoCsv(d: DadosExportacao): string {
  return [linha(['medido_em', 'peso_kg']), ...d.pesos.filter((p) => !p.excluidoEm).map((p) => linha([p.medidoEm, num(p.pesoKg)]))].join('\n') + '\n';
}

export function aguaCsv(d: DadosExportacao): string {
  return [linha(['registrado_em', 'ml']), ...(d.agua ?? []).map((a) => linha([a.registradoEm, String(a.ml)]))].join('\n') + '\n';
}

export const LEIA_ME = `Exportação dos seus dados
dados.json: todos os dados (versao_formato 1), datas ISO 8601 com fuso, pesos em kg.
treinos.csv: uma linha por série (data; rotina; exercicio; ordem; tipo; carga_kg; reps; duracao_s; rpe).
peso_corporal.csv: medido_em; peso_kg.
agua.csv: registrado_em; ml.
perfil (em dados.json): nome, altura_cm, meta de água, avatar, objetivo e os dados do tour guiado (faixa de idade, experiência, tempo e local de treino, áreas, restrições ou lesões, preferência alimentar, lembretes, cidade e bairro); a foto de perfil, se houver, vai também como foto-perfil.jpg.
CSV em UTF-8, separador ';' e vírgula decimal.
refeicoes.csv: entra quando o diário alimentar (pacote @domma/nutricao) for integrado.
`;

export function arquivosExportacao(d: DadosExportacao): Record<string, string> {
  return {
    'dados.json': JSON.stringify({ versao_formato: 1, gerado_em: new Date().toISOString(), ...d }, null, 2),
    'treinos.csv': treinosCsv(d),
    'peso_corporal.csv': pesoCsv(d),
    'agua.csv': aguaCsv(d),
    'LEIA-ME.txt': LEIA_ME,
  };
}

/** Monta os dados exportados a partir do estado (inclui perfil e água da v0.4.1). */
export function dadosParaExportar(e: { rotinas: Rotina[]; sessoes: SessaoTreino[]; series: Serie[]; pesos: PesoCorporal[]; exercicios: Exercicio[]; perfil?: DadosExportacao['perfil']; agua?: DadosExportacao['agua'] }): DadosExportacao {
  return { rotinas: e.rotinas, sessoes: e.sessoes, series: e.series, pesos: e.pesos, exercicios: e.exercicios,
    perfil: e.perfil ?? { nome: null, avatar: null, alturaCm: null }, agua: (e.agua ?? []).map(({ id, ml, registradoEm }) => ({ id, ml, registradoEm })) };
}

/** Bytes da foto de perfil (data URI base64) para ir como arquivo separado no .zip. */
export function fotoPerfilBytes(e: { perfil?: DadosExportacao['perfil'] }): Uint8Array | null {
  const a = e.perfil?.avatar;
  if (a?.tipo !== 'foto') return null;
  const b64 = a.uri.split(',')[1] ?? '';
  const bin = atob(b64);
  return Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
}
