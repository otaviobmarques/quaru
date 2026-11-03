import type { Aniversario } from '@/dominio/aniversario';
import { supabase } from '@/servicos/supabase';

/** v0.9: grava o aniversário no perfil do servidor (para a notificação no dia). false = sem servidor ou erro. */
export async function enviarAniversario(a: Aniversario | null): Promise<boolean> {
  const sb = supabase();
  if (!sb) return false;
  const { error } = await sb.rpc('definir_aniversario', { p_dia: a?.dia ?? null, p_mes: a?.mes ?? null, p_ano: a?.ano ?? null });
  return !error;
}

/** Chave do que já foi enviado (evita reenviar a cada abertura). */
export const chaveAniversario = (a: Aniversario | null | undefined) => (a ? `${a.dia}/${a.mes}/${a.ano ?? ''}` : '-');
