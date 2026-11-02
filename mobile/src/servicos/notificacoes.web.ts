import type { ResultadoPermissao } from './notificacoes';

/** Web: só pede a permissão do navegador quando a pessoa ativa um lembrete (nunca antes). */
export async function pedirPermissaoNotificacao(): Promise<ResultadoPermissao> {
  const N = (globalThis as { Notification?: { permission: string; requestPermission: () => Promise<string> } }).Notification;
  if (!N) return 'indisponivel';
  if (N.permission === 'granted') return 'concedida';
  if (N.permission === 'denied') return 'negada';
  return (await N.requestPermission()) === 'granted' ? 'concedida' : 'negada';
}
