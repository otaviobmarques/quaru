import { Vibration } from 'react-native';

import { tocarSomConcluido } from './notificacao';

/** Aparelho: vibra no fim do descanso (o som vem pela notificação local, que toca por cima da música; ADR-0011). */
export function prepararAlertaDescanso() {}
export function alertarFimDescanso() { Vibration.vibrate([0, 400, 200, 400]); }
export function bipeContagem() {}
/** Fim do treino: vibração e o som concluido.wav pela via de notificação (sem banner com o app aberto). */
export function alertarFimTreino() { Vibration.vibrate([0, 200, 100, 200, 100, 500]); tocarSomConcluido().catch(() => {}); }
export const avisoDescansoDisponivel = true;
