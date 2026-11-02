/**
 * Atualização do app (v0.4.1). No Android/iOS nativo não há atualização dentro do app nesta versão: ela vem pela
 * loja ou, no futuro, pelo EAS Update (ADR-0015). Este arquivo é a versão nativa; a web usa atualizacao.web.ts.
 */
export type EstadoAtualizacao = 'indisponivel' | 'atualizado' | 'verificando' | 'nova-versao' | 'erro';
export const suportaAtualizacao = false;
export async function verificarAtualizacao(): Promise<EstadoAtualizacao> { return 'indisponivel'; }
export function ouvirNovaVersao(_cb: () => void): () => void { return () => {}; }
export async function aplicarAtualizacao(): Promise<void> {}
