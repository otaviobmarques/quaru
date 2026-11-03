import type { TreinoAtribuido, Vinculo } from '@/dominio/treinador';
import { supabase } from '@/servicos/supabase';

/** v0.8: busca os treinadores da conta e os treinos que eles enviaram. null = sem servidor (modo local). */
export async function buscarDoTreinador(): Promise<{ vinculos: Vinculo[]; treinos: TreinoAtribuido[] } | null> {
  const sb = supabase();
  if (!sb) return null;
  const v = await sb.rpc('meus_treinadores');
  if (v.error) throw v.error;
  const vinculos = (v.data ?? []) as Vinculo[];
  if (!vinculos.length) return { vinculos, treinos: [] };
  const t = await sb.from('treinos_atribuidos').select('id, aluno_ref, nome, itens, dias, observacoes, atualizado_em')
    .in('aluno_ref', vinculos.map((x) => x.aluno_ref)).is('excluido_em', null);
  if (t.error) throw t.error;
  return { vinculos, treinos: (t.data ?? []) as TreinoAtribuido[] };
}

export type ResultadoVinculo = { resultado: 'vinculado'; treinador: string } | { resultado: 'codigo_invalido' | 'ja_usado' | 'proprio_treinador' | 'ja_vinculado' | 'sem_servidor' | 'erro' };
export async function aceitarVinculo(codigo: string): Promise<ResultadoVinculo> {
  const sb = supabase();
  if (!sb) return { resultado: 'sem_servidor' };
  const { data, error } = await sb.rpc('aceitar_vinculo', { p_codigo: codigo.trim().toLowerCase() });
  if (error) return { resultado: 'erro' };
  return data as ResultadoVinculo;
}

export async function desvincularTreinador(alunoRef: string): Promise<boolean> {
  const sb = supabase();
  if (!sb) return false;
  const { data, error } = await sb.rpc('desvincular_treinador', { p_ref: alunoRef });
  return !error && data === 1;
}
