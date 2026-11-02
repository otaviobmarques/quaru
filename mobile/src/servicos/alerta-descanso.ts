import { Vibration } from 'react-native';

/** Aparelho: vibra no fim do descanso (o som vem pela notificação local, ADR-0011). */
export function prepararAlertaDescanso() {}
export function alertarFimDescanso() { Vibration.vibrate([0, 400, 200, 400]); }
export const avisoDescansoDisponivel = true;
