// QA v0.1 – notificação local de descanso (L5), com expo-notifications simulado (jest.setup.js).
// O que depende do sistema operacional (disparo real, tela bloqueada, segundo plano, som) NÃO é testável aqui.
import * as N from 'expo-notifications';
import { Platform } from 'react-native';
import { agendarFimDescanso, cancelarDescanso, pedirPermissao, textoDescanso } from '@/servicos/notificacao';

const agendar = N.scheduleNotificationAsync as jest.Mock;
const cancelar = N.cancelScheduledNotificationAsync as jest.Mock;

describe('notificação de descanso – QA', () => {
  beforeEach(async () => { await cancelarDescanso(); jest.clearAllMocks(); });

  it('agenda com gatilho por intervalo em segundos igual ao descanso e texto sem carga/peso', async () => {
    await agendarFimDescanso(90, 'Supino reto');
    const arg = agendar.mock.calls[0][0];
    expect(arg.trigger).toEqual({ type: 'timeInterval', seconds: 90, channelId: 'descanso' }); // 0.3.0: canal com som (ADR-0011)
    expect(arg.content.sound).toBe('descanso.wav');
    expect(arg.content.body).toBe(textoDescanso('Supino reto'));
    expect(arg.content.body).not.toMatch(/\d+\s*kg|×/);
  });
  it('descanso 0 ou negativo não agenda (e cancela o anterior)', async () => {
    await agendarFimDescanso(60, 'A');
    await agendarFimDescanso(0, 'A');
    await agendarFimDescanso(-5, 'A');
    expect(agendar).toHaveBeenCalledTimes(1);
    expect(cancelar).toHaveBeenCalledTimes(1);
  });
  it('cancelar sem nada agendado não chama o sistema', async () => {
    await cancelarDescanso();
    expect(cancelar).not.toHaveBeenCalled();
  });
  it('cancelar duas vezes chama o sistema uma vez só', async () => {
    await agendarFimDescanso(30, 'A');
    await cancelarDescanso(); await cancelarDescanso();
    expect(cancelar).toHaveBeenCalledTimes(1);
  });
  it('falha ao cancelar no sistema não quebra o app', async () => {
    await agendarFimDescanso(30, 'A');
    cancelar.mockRejectedValueOnce(new Error('so'));
    await expect(cancelarDescanso()).resolves.toBeUndefined();
  });
  it('permissão negada → pedirPermissao devolve false', async () => {
    (N.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ granted: false });
    expect(await pedirPermissao()).toBe(false);
  });
  it('na web não agenda nem pede permissão', async () => {
    const antes = Platform.OS;
    (Platform as any).OS = 'web';
    try {
      expect(await pedirPermissao()).toBe(false);
      await agendarFimDescanso(60, 'A');
      expect(agendar).not.toHaveBeenCalled();
    } finally { (Platform as any).OS = antes; }
  });
  it('nome de exercício com emoji/acentos/texto longo vai como está', async () => {
    const nome = 'Agachamento búlgaro 💪 ' + 'x'.repeat(200);
    await agendarFimDescanso(10, nome);
    expect(agendar.mock.calls[0][0].content.body).toContain(nome);
  });
  it('BUG-13 (corrigido): duas séries concluídas em sequência rápida deveriam deixar no máximo UMA notificação ativa', async () => {
    let n = 0;
    agendar.mockImplementation(() => new Promise((r) => setTimeout(() => r(`id-${++n}`), 10)));
    await Promise.all([agendarFimDescanso(90, 'A'), agendarFimDescanso(60, 'B')]);
    agendar.mockImplementation(async () => 'notif-1');
    // 2 agendadas e nenhuma cancelada → uma fica "órfã" e dispara depois
    expect(agendar.mock.calls.length - cancelar.mock.calls.length).toBeLessThanOrEqual(1);
  });
});
