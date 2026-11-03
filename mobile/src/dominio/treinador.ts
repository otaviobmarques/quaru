import type { Agenda } from './agenda';
import type { Rotina } from './tipos';

/**
 * Treinos enviados pelo treinador (v0.8, ADR-0023). Vêm do servidor (tabela treinos_atribuidos, só leitura para o
 * aluno) e viram treinos locais com origem 'treinador': aparecem em Meus treinos e entram na agenda nos dias marcados.
 * Cada sincronização troca o conjunto inteiro: treino apagado pelo treinador some do app; o que o aluno fez fica no
 * histórico (as sessões guardam o id do treino).
 */
export interface TreinoAtribuido {
  id: string; aluno_ref: string; nome: string; observacoes?: string | null; dias?: number[] | null; atualizado_em?: string;
  /** v0.10: datas (AAAA-MM-DD) em que o treinador agendou este treino. */
  datas?: string[] | null;
  itens: { exercicioId: string; series: number; reps: number | null; descansoS: number; obs?: string }[];
}
export interface Vinculo { aluno_ref: string; treinador: string; vinculado_em?: string | null; /** v0.10: o aluno compartilha a evolução com ele */ compartilha?: boolean }
/** v0.10: convite de um treinador pelo ID do aluno, esperando resposta. */
export interface Convite { aluno_ref: string; treinador: string; convidado_em?: string | null }

/** Monta os treinos locais e a agenda a partir do que veio do servidor. `existe` diz se o exercício está no catálogo. */
export function aplicarTreinosDoTreinador(
  e: { rotinas: Rotina[]; agenda?: Agenda; vinculos?: Vinculo[] },
  vinculos: Vinculo[], treinos: TreinoAtribuido[], existe: (exercicioId: string) => boolean, agora: string,
): { rotinas: Rotina[]; agenda: Agenda; vinculos: Vinculo[] } {
  const meus = new Map(vinculos.map((v) => [v.aluno_ref, v.treinador]));
  const recebidos = treinos.filter((t) => meus.has(t.aluno_ref));
  const ids = new Set(recebidos.map((t) => t.id));
  const proprias = e.rotinas.filter((r) => r.origem !== 'treinador');
  const ordemBase = Math.max(0, ...proprias.filter((r) => !r.excluidoEm).map((r) => r.ordem));
  // Treino do treinador que saiu: fica marcado como excluído (as sessões antigas continuam com o nome).
  const saiu = e.rotinas.filter((r) => r.origem === 'treinador' && !ids.has(r.id)).map((r) => (r.excluidoEm ? r : { ...r, excluidoEm: agora }));
  const novos: Rotina[] = recebidos.map((t, k) => ({
    id: t.id, nome: t.nome.slice(0, 60), ordem: ordemBase + k + 1, origem: 'treinador', treinador: meus.get(t.aluno_ref), observacoes: t.observacoes ?? null,
    atualizadoEm: t.atualizado_em ?? agora,
    itens: t.itens.filter((i) => existe(i.exercicioId)).map((i, n) => ({
      id: `${t.id}-${n}`, exercicioId: i.exercicioId, ordem: n, seriesAlvo: Math.max(1, Math.min(20, Math.round(i.series || 1))),
      repsAlvo: i.reps == null ? null : Math.max(1, Math.min(100, Math.round(i.reps))), descansoS: Math.max(0, Math.min(900, Math.round(i.descansoS ?? 90))),
      ...(i.obs ? { obs: String(i.obs).slice(0, 120) } : {}),
    })),
  }));
  // Agenda: os dias do treinador entram como padrão da semana, sem passar por cima de um dia que a pessoa marcou
  // com um treino dela (só ocupam dias livres ou que já eram de outro treino do treinador).
  let agenda: Agenda = e.agenda ? { semana: { ...e.agenda.semana }, dias: { ...e.agenda.dias } } : { semana: {}, dias: {} };
  const doTreinador = new Set([...ids, ...e.rotinas.filter((r) => r.origem === 'treinador').map((r) => r.id)]);
  for (const [dow, v] of Object.entries(agenda.semana)) if (v && doTreinador.has(v) && !ids.has(v)) delete agenda.semana[+dow];
  for (const t of recebidos) {
    for (const d of t.dias ?? []) {
      const atual = agenda.semana[d];
      if (!atual || doTreinador.has(atual)) agenda = { ...agenda, semana: { ...agenda.semana, [d]: t.id } };
    }
  }
  // v0.10: datas agendadas pelo treinador. Entram em dias livres (ou que já eram dele); um dia que a pessoa mudou
  // fica como ela deixou. Data que o treinador tirou sai da agenda, se ainda estava com o treino dele.
  const antes = e.agenda?.treinador ?? {};
  const colocadas: Record<string, string> = {};
  const dias = { ...agenda.dias };
  for (const t of recebidos) {
    for (const d of t.datas ?? []) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
      colocadas[d] = t.id;
      const atual = dias[d];
      const livre = !(d in dias) || (atual != null && atual !== 'descanso' && doTreinador.has(atual) && (antes[d] === undefined || antes[d] === atual));
      if (livre) dias[d] = t.id;
    }
  }
  for (const [d, id] of Object.entries(antes)) if (!colocadas[d] && dias[d] === id) delete dias[d];
  agenda = { ...agenda, dias, treinador: colocadas };
  return { rotinas: [...proprias, ...saiu, ...novos], agenda, vinculos };
}

/** Código do link de vínculo: 32 caracteres hexadecimais. */
export const codigoValido = (c: string | null | undefined) => !!c && /^[0-9a-f]{32}$/i.test(c.trim());

/** v0.10: ID do aluno (7 caracteres). Mostra como K7M-2PQ9. */
export const formatarIdAluno = (c: string | null | undefined) => (c ? `${c.slice(0, 3)}-${c.slice(3)}` : '');
