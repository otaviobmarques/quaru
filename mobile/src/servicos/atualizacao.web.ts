import { BASE } from '@/config/endereco';
/**
 * Atualização da versão web/PWA (v0.4.1). O service worker novo instala e fica em espera; o app mostra
 * "Nova versão disponível" e, ao tocar em "Atualizar agora", manda ATUALIZAR (skipWaiting) e recarrega quando o
 * novo controlador assume. O localStorage fica intacto; na abertura, migrarEstado() converte o esquema se preciso.
 */
export type EstadoAtualizacao = 'indisponivel' | 'atualizado' | 'verificando' | 'nova-versao' | 'erro';
export const suportaAtualizacao = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
const ESCOPO = BASE;

const registro = async () => (suportaAtualizacao ? (await navigator.serviceWorker.getRegistration(ESCOPO)) ?? null : null);

/** Avisa quando houver um service worker novo em espera (já instalado e com um controlador antigo ativo). */
export function ouvirNovaVersao(cb: () => void): () => void {
  if (!suportaAtualizacao) return () => {};
  let vivo = true;
  const ver = (r: ServiceWorkerRegistration | null) => {
    if (!r || !vivo) return;
    if (r.waiting && navigator.serviceWorker.controller) cb();
    r.addEventListener('updatefound', () => {
      const novo = r.installing;
      novo?.addEventListener('statechange', () => { if (vivo && novo.state === 'installed' && navigator.serviceWorker.controller) cb(); });
    });
  };
  registro().then(ver).catch(() => {});
  return () => { vivo = false; };
}

export async function verificarAtualizacao(): Promise<EstadoAtualizacao> {
  try {
    const r = await registro();
    if (!r) return 'indisponivel';
    await r.update();
    if (r.waiting || r.installing) return 'nova-versao';
    return 'atualizado';
  } catch {
    return 'erro';
  }
}

export async function aplicarAtualizacao(): Promise<void> {
  const r = await registro();
  if (!r?.waiting) { location.reload(); return; }
  navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true });
  r.waiting.postMessage('ATUALIZAR');
}
