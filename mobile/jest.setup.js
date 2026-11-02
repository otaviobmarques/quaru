jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('expo-crypto', () => { let n = 0; return { randomUUID: () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`, getRandomBytes: (k) => Uint8Array.from({ length: k }, (_, i) => (i * 37 + 11) % 256) }; });
jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn(async () => ({ granted: true })),
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn(async () => 'notif-1'),
  cancelScheduledNotificationAsync: jest.fn(async () => {}),
  SchedulableTriggerInputTypes: { TIME_INTERVAL: 'timeInterval' },
}));
// ADR-0010: sem módulo nativo nos testes. Cada teste do armazenamento cifrado troca estes mocks.
jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn(async () => { throw new Error('sem módulo nativo (jest)'); }), deleteDatabaseAsync: jest.fn(async () => {}) }));
jest.mock('expo-secure-store', () => {
  const m = new Map();
  return { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WUTDO', getItemAsync: jest.fn(async (k) => m.get(k) ?? null), setItemAsync: jest.fn(async (k, v) => { m.set(k, v); }), deleteItemAsync: jest.fn(async (k) => { m.delete(k); }), __mapa: m };
});
// v0.4.2: Lottie sem módulo nativo nos testes. Guarda as props para conferir "reduzir movimento".
jest.mock('lottie-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Lottie = React.forwardRef((p, ref) => { React.useImperativeHandle(ref, () => ({ play: () => {} })); return React.createElement(View, { testID: 'lottie', 'data-autoplay': String(p.autoPlay), 'data-progress': String(p.progress) }); });
  return { __esModule: true, default: Lottie };
});
