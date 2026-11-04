/**
 * v0.11: aviso remoto do fim do descanso. No aparelho (Android/iPhone nativo) não precisa: a notificação local
 * já toca com a tela bloqueada (servicos/notificacao). Este arquivo existe para a web (aviso-remoto.web.ts).
 */
export type SituacaoAvisoRemoto = 'ativo' | 'disponivel' | 'instalar' | 'negado' | 'sem-suporte';
export async function situacaoAvisoRemoto(): Promise<SituacaoAvisoRemoto> { return 'sem-suporte'; }
export async function ativarAvisoRemoto(): Promise<SituacaoAvisoRemoto> { return 'sem-suporte'; }
export function agendarAvisoRemoto(_segundos: number): void {}
export function cancelarAvisoRemoto(): void {}
