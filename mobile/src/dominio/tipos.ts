export type TipoSerie = 'aquecimento' | 'normal' | 'falha' | 'drop';
export type TipoExercicio = 'carga_reps' | 'tempo' | 'peso_corporal';

/** Campos comuns de sincronização (regras L2). */
export interface Sincronizavel {
  id: string;
  atualizadoEm: string; // ISO 8601; no servidor é o relógio do servidor
  excluidoEm?: string | null;
  /** true = dado de EXEMPLO (fictício), nunca dado real do usuário. */
  exemplo?: boolean;
}

export interface Exercicio extends Sincronizavel {
  usuarioId: string | null; // null = biblioteca Domma
  nome: string;
  grupoMuscular: string;
  equipamento: string;
  tipo: TipoExercicio;
}

export interface ItemRotina {
  id: string;
  exercicioId: string;
  ordem: number;
  seriesAlvo: number;
  repsAlvo: number | null;
  descansoS: number;
  /** v0.8: observação do treinador para o exercício. */
  obs?: string;
}

export interface Rotina extends Sincronizavel {
  nome: string;
  ordem: number;
  itens: ItemRotina[];
  /** v0.7: 'dia' = treino do dia gerado pelo app (fora da sequência A→B→C); 'treinador' = enviado por um treinador. */
  origem?: 'dia' | 'treinador';
  /** v0.8: nome de quem enviou (origem 'treinador') e observações gerais do treino. */
  treinador?: string;
  observacoes?: string | null;
}

export interface Serie extends Sincronizavel {
  sessaoId: string;
  exercicioId: string;
  ordem: number;
  tipo: TipoSerie;
  cargaKg: number | null;
  reps: number | null;
  duracaoS: number | null;
  rpe: number | null;
  concluidaEm: string | null;
}

export interface SessaoTreino extends Sincronizavel {
  rotinaId: string | null;
  iniciadaEm: string;
  finalizadaEm: string | null;
  notas: string | null;
}

export interface PesoCorporal extends Sincronizavel {
  pesoKg: number;
  medidoEm: string;
}

export type { Finalidade, RegistroConsentimento } from './consentimento';
