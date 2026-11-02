/**
 * Lembretes (v0.5): plano diário a partir das respostas do tour/Meus dados. Textos SEM dado de saúde
 * (aparecem na tela bloqueada). Água: de 2 em 2 horas, das 10h às 20h.
 */
export interface Lembrete { id: string; hora: number; minuto: number; titulo: string; corpo: string; tipo: 'treino' | 'agua' }
export const HORAS_AGUA = [10, 12, 14, 16, 18, 20];

export function planoLembretes(l: { treinoHora: string | null; agua: boolean } | null | undefined): Lembrete[] {
  const plano: Lembrete[] = [];
  const m = l?.treinoHora?.match(/^(\d{1,2}):(\d{2})$/);
  if (m) plano.push({ id: 'lembrete-treino', hora: +m[1], minuto: +m[2], titulo: 'Hora do treino', corpo: 'Bora treinar? Seu treino de hoje está no Quaru.', tipo: 'treino' });
  if (l?.agua) for (const h of HORAS_AGUA) plano.push({ id: `lembrete-agua-${h}`, hora: h, minuto: 0, titulo: 'Água', corpo: 'Que tal um copo de água agora?', tipo: 'agua' });
  return plano;
}
