import type { Convite, TreinoAtribuido, Vinculo } from '@/dominio/treinador';
import type { ResumoEvolucao } from '@/dominio/evolucao';
import { supabase } from '@/servicos/supabase';

/** v0.8: busca os treinadores da conta e os treinos que eles enviaram. null = sem servidor (modo local). */
export async function buscarDoTreinador(): Promise<{ vinculos: Vinculo[]; treinos: TreinoAtribuido[] } | null> {
  const sb = supabase();
  if (!sb) return null;
  const v = await sb.rpc('meus_treinadores');
  if (v.error) throw v.error;
  const vinculos = (v.data ?? []) as Vinculo[];
  if (!vinculos.length) return { vinculos, treinos: [] };
  const t = await sb.from('treinos_atribuidos').select('id, aluno_ref, nome, itens, dias, datas, observacoes, atualizado_em')
    .in('aluno_ref', vinculos.map((x) => x.aluno_ref)).is('excluido_em', null);
  if (t.error) throw t.error;
  return { vinculos, treinos: (t.data ?? []) as TreinoAtribuido[] };
}

export type ResultadoVinculo = { resultado: 'vinculado'; treinador: string; aluno_ref?: string } | { resultado: 'codigo_invalido' | 'ja_usado' | 'proprio_treinador' | 'ja_vinculado' | 'sem_servidor' | 'erro' };
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

// ---------- v0.10: ID do aluno, convites e evolução compartilhada ----------

/** O ID de aluno desta conta (para mostrar ao treinador). null = sem servidor. */
export async function meuIdAluno(): Promise<string | null> {
  const sb = supabase();
  if (!sb) return null;
  const { data, error } = await sb.rpc('meu_codigo_aluno');
  return error ? null : (data as string | null);
}

export async function meusConvites(): Promise<Convite[] | null> {
  const sb = supabase();
  if (!sb) return null;
  const { data, error } = await sb.rpc('meus_convites');
  if (error) throw error;
  return (data ?? []) as Convite[];
}

/** Resposta: 'vinculado' | 'recusado' | 'ja_vinculado' | 'nao_encontrado' | 'erro'. */
export async function responderConvite(ref: string, aceitar: boolean, compartilhar: boolean): Promise<string> {
  const sb = supabase();
  if (!sb) return 'erro';
  const { data, error } = await sb.rpc('responder_convite', { p_ref: ref, p_aceitar: aceitar, p_compartilhar: compartilhar });
  return error ? 'erro' : String(data);
}

export async function definirCompartilhamento(ref: string, ligado: boolean): Promise<boolean> {
  const sb = supabase();
  if (!sb) return false;
  const { data, error } = await sb.rpc('definir_compartilhamento', { p_ref: ref, p_ligado: ligado });
  return !error && data === true;
}

export async function publicarEvolucao(r: ResumoEvolucao): Promise<boolean> {
  const sb = supabase();
  if (!sb) return false;
  const { error } = await sb.rpc('publicar_evolucao', { p_itens: r.itens, p_agenda: r.agenda });
  return !error;
}
