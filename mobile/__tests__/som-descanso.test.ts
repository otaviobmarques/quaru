// ADR-0011 rev. 0.3.0: som curto no fim do descanso, CC0 gerado localmente, respeitando o modo silencioso.
import * as N from 'expo-notifications';
import { Platform } from 'react-native';
import { CANAL_DESCANSO, SOM_DESCANSO, prepararCanal } from '@/servicos/notificacao';
declare const __dirname: string;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs') as { readFileSync(p: string): { length: number; toString(e: string, a: number, b: number): string; readUInt32LE(o: number): number; readUInt16LE(o: number): number } };

describe('som do fim do descanso', () => {
  it('arquivo WAV curto (< 1 s), mono 44,1 kHz, configurado no plugin do expo-notifications', () => {
    const b = fs.readFileSync(`${__dirname}/../assets/sons/${SOM_DESCANSO}`);
    expect(b.toString('ascii', 0, 4)).toBe('RIFF');
    expect(b.readUInt16LE(22)).toBe(1); // mono
    const taxa = b.readUInt32LE(24);
    expect(taxa).toBe(44100);
    expect((b.length - 44) / (taxa * 2)).toBeLessThan(1);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const app = require('../app.json').expo;
    const plug = app.plugins.find((p: unknown) => Array.isArray(p) && p[0] === 'expo-notifications');
    expect(plug[1].sounds).toContain('./assets/sons/descanso.wav');
  });
  it('Android: canal "descanso" com o som e vibração (o sistema aplica o modo silencioso)', async () => {
    const antes = Platform.OS; (Platform as { OS: string }).OS = 'android';
    const criar = jest.fn(async () => null);
    (N as unknown as { setNotificationChannelAsync: typeof criar }).setNotificationChannelAsync = criar;
    try {
      await prepararCanal();
      expect(criar).toHaveBeenCalledWith(CANAL_DESCANSO, expect.objectContaining({ sound: SOM_DESCANSO, enableVibrate: true }));
    } finally { (Platform as { OS: string }).OS = antes; }
  });
});
