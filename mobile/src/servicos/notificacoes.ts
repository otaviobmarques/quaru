import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import type { Lembrete } from '@/dominio/lembretes';

/**
 * Lembretes no aparelho (v0.5): notificações LOCAIS diárias pelo expo-notifications, sem servidor.
 * A permissão só é pedida quando a pessoa ativa um lembrete (tour ou Meus dados).
 */
export type ResultadoPermissao = 'concedida' | 'negada' | 'indisponivel';
export async function pedirPermissaoNotificacao(): Promise<ResultadoPermissao> {
  try {
    const atual = await Notifications.getPermissionsAsync();
    if (atual.granted) return 'concedida';
    if (!atual.canAskAgain) return 'negada';
    return (await Notifications.requestPermissionsAsync()).granted ? 'concedida' : 'negada';
  } catch { return 'indisponivel'; }
}

export const CANAL_LEMBRETES = 'lembretes';

/** Troca os lembretes agendados pelo plano atual (cancela os antigos com prefixo "lembrete-"). Sem permissão, não agenda. */
export async function agendarLembretes(plano: Lembrete[], _deveAvisar?: (l: Lembrete) => boolean): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const agendados = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(agendados.filter((n) => n.identifier.startsWith('lembrete-')).map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
    if (!plano.length || !(await Notifications.getPermissionsAsync()).granted) return;
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync?.(CANAL_LEMBRETES, { name: 'Lembretes de treino e água', importance: 5 });
    for (const l of plano) {
      await Notifications.scheduleNotificationAsync({
        identifier: l.id,
        content: { title: l.titulo, body: l.corpo },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: l.hora, minute: l.minuto, channelId: CANAL_LEMBRETES },
      });
    }
  } catch (e) { console.warn('[lembretes] não deu para agendar:', (e as Error).message); }
}
