import { useSyncExternalStore } from 'react';

/**
 * v0.12.3: o descanso em andamento fica fora da tela do treino, para o alerta tocar em qualquer tela do app
 * (antes, ao voltar para o Início durante o descanso, o cronômetro sumia e nada avisava).
 */
export type Descanso = {
  fim: number;
  exercicio: string;
  troca?: boolean;
  recuperacao?: boolean;
  /** Bloco de cardio cronometrado (não é descanso): ao acabar, a tela do treino registra o tempo. */
  trabalho?: { exId: string; ordem: number; seg: number };
};

let atual: Descanso | null = null;
const ouvintes = new Set<() => void>();
const assinar = (f: () => void) => { ouvintes.add(f); return () => { ouvintes.delete(f); }; };

export const lerDescanso = () => atual;
export function definirDescanso(d: Descanso | null) { atual = d; for (const f of ouvintes) f(); }
export function useDescanso(): [Descanso | null, (d: Descanso | null) => void] {
  return [useSyncExternalStore(assinar, lerDescanso, lerDescanso), definirDescanso];
}
