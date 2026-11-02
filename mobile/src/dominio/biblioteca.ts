import catalogo from './catalogo-fedb.json';
import type { Exercicio } from './tipos';

/**
 * Catálogo de exercícios (v0.4.4): yuhonas/free-exercise-db, Unlicense/domínio público (docs/fontes/free-exercise-db.md),
 * gerado por scripts/importar-free-exercise-db.py — não editar catalogo-fedb.json à mão.
 * Os 22 exercícios da biblioteca anterior mantêm id, nome, grupo e equipamento (estados salvos continuam válidos).
 * Nomes e instruções em português: tradução própria da Domma, TODOS "pendente de revisão CREF" (ADR-0021).
 * Sem tradução revisada, a instrução aparece no inglês original, sinalizada.
 */
export type Area = 'superiores' | 'inferiores' | 'core';
export type NivelCatalogo = 'iniciante' | 'intermediario' | 'avancado';
export interface ExercicioCatalogo extends Exercicio {
  fonteId: string;
  nomeOriginal: string;
  /** manual = nome fixo; glossario = regra completa; parcial = regra com termos sem tradução; original = sem tradução. */
  traducaoNome: 'manual' | 'glossario' | 'parcial' | 'original';
  /** Ids de equipamentos.ts e extras (bola-medicinal, bola-suica, rolo-espuma, outro). Vazio = não informado na fonte. */
  equipamentos: string[];
  area: Area;
  nivel: NivelCatalogo;
  categoria: string;
  musculos: string[];
  musculosSecundarios: string[];
  instrucoes: string[] | null;
  instrucoesOriginais: string[];
  revisao: 'pendente de revisão CREF';
  /** Nome base das mídias em /exercicios (null: a fonte não tem as duas fotos). */
  midia: string | null;
}

type Bruto = Omit<ExercicioCatalogo, 'usuarioId' | 'atualizadoEm'>;
export const META_CATALOGO = catalogo.meta;
export const BIBLIOTECA: ExercicioCatalogo[] = (catalogo.exercicios as Bruto[]).map((e) => ({ ...e, usuarioId: null, atualizadoEm: '2026-11-01T00:00:00-03:00' }));

const POR_ID = new Map(BIBLIOTECA.map((e) => [e.id, e]));
const POR_NOME = new Map(BIBLIOTECA.map((e) => [e.nome, e]));
export const doCatalogo = (id: string) => POR_ID.get(id) ?? null;
export const doCatalogoPorNome = (nome: string) => POR_NOME.get(nome) ?? null;
export const ehDoCatalogo = (e: Exercicio): e is ExercicioCatalogo => POR_ID.get(e.id) === e;

const ORDEM_GRUPOS = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps', 'Abdômen', 'Antebraço', 'Pescoço'];
export const GRUPOS = ORDEM_GRUPOS.filter((g) => BIBLIOTECA.some((e) => e.grupoMuscular === g));
const ORDEM_EQ = ['Peso corporal', 'Halteres', 'Barra', 'Barra W', 'Máquina', 'Polia', 'Elástico', 'Kettlebell', 'Barra fixa', 'Banco', 'Esteira/bike', 'Bola medicinal', 'Bola suíça', 'Rolo de espuma', 'Outro', 'Não informado'];
export const EQUIPAMENTOS = ORDEM_EQ.filter((q) => BIBLIOTECA.some((e) => e.equipamento === q));
export const AREAS: { id: Area; nome: string }[] = [{ id: 'superiores', nome: 'Superiores' }, { id: 'inferiores', nome: 'Inferiores' }, { id: 'core', nome: 'Core' }];

export const semAcento = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const CHAVE = new WeakMap<Exercicio, string>();
const chave = (e: Exercicio) => {
  let k = CHAVE.get(e);
  if (k === undefined) { k = semAcento(e.nome + ' ' + ((e as ExercicioCatalogo).nomeOriginal ?? '')); CHAVE.set(e, k); }
  return k;
};
/** Busca sem acento (nome em português e nome original) + filtros de grupo, equipamento e área. Todas as palavras precisam aparecer. */
export function filtrarExercicios<T extends Exercicio>(l: T[], busca: string, grupo?: string | null, equip?: string | null, area?: Area | null): T[] {
  const termos = semAcento(busca.trim()).split(/\s+/).filter(Boolean);
  return l.filter((e) => !e.excluidoEm && (!grupo || e.grupoMuscular === grupo) && (!equip || e.equipamento === equip)
    && (!area || (e as Exercicio as Partial<ExercicioCatalogo>).area === area) && termos.every((t) => chave(e).includes(t)));
}
