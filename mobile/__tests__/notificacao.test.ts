import * as N from 'expo-notifications';
import { agendarFimDescanso, cancelarDescanso, textoDescanso } from '@/servicos/notificacao';

describe('notificação local de descanso (L5)', () => {
  beforeEach(() => jest.clearAllMocks());
  it('texto sem dado de saúde', () => {
    expect(textoDescanso('Supino')).toBe('Descanso terminou — próxima série: Supino');
  });
  it('agenda no máximo uma: reagendar cancela a anterior', async () => {
    await agendarFimDescanso(90, 'Supino');
    await agendarFimDescanso(60, 'Supino');
    expect(N.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
    expect(N.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(1);
    expect((N.scheduleNotificationAsync as jest.Mock).mock.calls[1][0].trigger.seconds).toBe(60);
    await cancelarDescanso();
    expect(N.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(2);
  });
});
