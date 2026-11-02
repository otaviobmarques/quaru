import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

/**
 * Notificação LOCAL de fim do descanso (L5): sem push, sem servidor, no máximo uma agendada.
 * Texto sem dado de saúde (aparece na tela bloqueada).
 */
let agendada: string | null = null;
/** BUG-13: operações em fila (uma de cada vez) para nunca sobrar notificação órfã. */
let fila: Promise<unknown> = Promise.resolve();
const emSerie = <T,>(f: () => Promise<T>): Promise<T> => { const p = fila.then(f, f); fila = p.catch(() => {}); return p; };

/**
 * ADR-0011 (rev. 0.3.0, especificação L5): com o app ABERTO, sem banner nem lista; a tela vibra e o sistema toca
 * o som curto `descanso.wav` (CC0, gerado localmente) pela via de NOTIFICAÇÃO, que respeita o modo silencioso
 * (Android: modo silencioso/vibrar; iPhone: chave lateral). Em segundo plano, a notificação local aparece com o mesmo som.
 */
export const SOM_DESCANSO = 'descanso.wav';
export const CANAL_DESCANSO = 'descanso';
export const comportamentoPrimeiroPlano = { shouldShowBanner: false, shouldShowList: false, shouldPlaySound: true, shouldSetBadge: false } as const;
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler?.({ handleNotification: async () => comportamentoPrimeiroPlano });
}

/** Android 8+: o som fica no canal. Importância padrão (som, sem pop-up); o sistema aplica o modo silencioso. */
export async function prepararCanal() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync?.(CANAL_DESCANSO, {
    name: 'Fim do descanso',
    importance: 5, // AndroidImportance.DEFAULT do expo-notifications (som sem pop-up)
    sound: SOM_DESCANSO,
    vibrationPattern: [0, 400, 200, 400],
    enableVibrate: true,
  });
}
if (Platform.OS === 'android') prepararCanal().catch(() => {});

export const textoDescanso = (exercicio: string) => `Descanso terminou — próxima série: ${exercicio}`;

export async function pedirPermissao(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const r = await Notifications.requestPermissionsAsync();
  return r.granted;
}

export function agendarFimDescanso(segundos: number, exercicio: string) {
  return emSerie(async () => {
    await cancelarAgora();
    if (Platform.OS === 'web' || segundos <= 0) return;
    agendada = await Notifications.scheduleNotificationAsync({
      content: { title: 'Descanso', body: textoDescanso(exercicio), sound: SOM_DESCANSO },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.round(segundos), channelId: CANAL_DESCANSO },
    });
  });
}

async function cancelarAgora() {
  const id = agendada; agendada = null;
  if (id && Platform.OS !== 'web') await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}

export function cancelarDescanso(): Promise<void> { return emSerie(cancelarAgora); }
