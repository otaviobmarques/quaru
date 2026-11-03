import { diaLocal } from './treino-de-hoje';

/**
 * Agenda de treinos (v0.7). Cada dia pode ter um treino (id de Meus treinos), "descanso" ou nada.
 * - semana: o padrão por dia da semana (0 = domingo … 6 = sábado), que se repete toda semana;
 * - dias: o planejado para uma data (AAAA-MM-DD), que vale mais que o padrão da semana.
 * Treino que foi excluído some da agenda sozinho (a consulta ignora ids que não existem mais).
 */
export type Planejado = string | 'descanso';
export interface Agenda { semana: Partial<Record<number, Planejado>>; dias: Record<string, Planejado | null> }
export const agendaVazia = (): Agenda => ({ semana: {}, dias: {} });

export const diaDaSemana = (dia: string) => new Date(`${dia}T12:00:00Z`).getUTCDay();
export const NOMES_DIA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
export const SIGLAS_DIA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/** O que está planejado para o dia: a data específica vence o padrão da semana. `null` nas datas apaga o padrão daquele dia. */
export function planejadoPara(a: Agenda | undefined, dia: string, existe: (id: string) => boolean): { valor: Planejado | null; fonte: 'dia' | 'semana' | null } {
  if (!a) return { valor: null, fonte: null };
  const ok = (v: Planejado | null | undefined) => v === 'descanso' || (!!v && existe(v));
  if (dia in a.dias) { const v = a.dias[dia]; return ok(v) ? { valor: v!, fonte: 'dia' } : { valor: null, fonte: v === null ? 'dia' : null }; }
  const s = a.semana[diaDaSemana(dia)];
  return ok(s) ? { valor: s!, fonte: 'semana' } : { valor: null, fonte: null };
}

/** Define o planejado de uma data. `repetir` grava também como padrão daquele dia da semana. */
export function definirDia(a: Agenda | undefined, dia: string, valor: Planejado | null, repetir = false): Agenda {
  const base = a ?? agendaVazia();
  if (repetir) {
    const semana = { ...base.semana };
    if (valor) semana[diaDaSemana(dia)] = valor; else delete semana[diaDaSemana(dia)];
    const dias = { ...base.dias }; delete dias[dia]; // a data passa a seguir o padrão
    return { semana, dias };
  }
  return { ...base, dias: { ...base.dias, [dia]: valor } };
}

/** As 7 datas (segunda a domingo) da semana que contém `dia`, deslocada `deslocamento` semanas. */
export function datasDaSemana(dia: string, deslocamento = 0): string[] {
  const d = new Date(`${dia}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7) + deslocamento * 7);
  return Array.from({ length: 7 }, (_, i) => { const x = new Date(d); x.setUTCDate(d.getUTCDate() + i); return x.toISOString().slice(0, 10); });
}

export const hoje = (agora: string | Date = new Date()) => diaLocal(typeof agora === 'string' ? agora : agora.toISOString());
