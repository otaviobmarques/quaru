/**
 * Lembretes (v0.4.1) no Android: a preferência fica salva, mas o agendamento depende do expo-notifications,
 * que entra no próximo build nativo (ADR-0016). Nenhuma permissão é pedida aqui.
 */
export type ResultadoPermissao = 'concedida' | 'negada' | 'indisponivel';
export async function pedirPermissaoNotificacao(): Promise<ResultadoPermissao> {
  return 'indisponivel';
}
