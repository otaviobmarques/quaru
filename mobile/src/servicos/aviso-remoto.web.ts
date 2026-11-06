import { supabase } from '@/servicos/supabase';
import { BASE } from '@/config/endereco';
import { novoId } from '@/servicos/id';

/**
 * v0.11 (ADR-0025): aviso do fim do descanso com a TELA BLOQUEADA na versão web.
 * O navegador não agenda notificação sozinho; então, a cada descanso, o app avisa o servidor (função aviso-descanso),
 * que manda um push na hora. O service worker mostra "Descanso terminou" com som e vibração do sistema.
 * - Android (Chrome): funciona no navegador ou com o app instalado.
 * - iPhone: só com o Quaru instalado na Tela de Início (iOS 16.4+), exigência da Apple.
 * Nada de dado de saúde vai no push (ele nem tem conteúdo). Sem conta logada, não funciona (fica o som com o app aberto).
 */
export type SituacaoAvisoRemoto = 'ativo' | 'disponivel' | 'instalar' | 'negado' | 'sem-suporte';

export const ehIphone = () => typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent);
const instalado = () => typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
const temPush = () => typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

const chave64 = (b: string) => {
  const p = b.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((b.length + 3) % 4);
  return Uint8Array.from(atob(p), (c) => c.charCodeAt(0));
};
async function chamar(corpo: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  const sb = supabase();
  if (!sb) return null;
  const { data, error } = await sb.functions.invoke('aviso-descanso', { body: corpo });
  return error ? null : (data as Record<string, unknown>);
}
async function registro() { return navigator.serviceWorker.getRegistration(BASE).then((r) => r ?? navigator.serviceWorker.ready); }

export async function situacaoAvisoRemoto(): Promise<SituacaoAvisoRemoto> {
  if (!supabase()) return 'sem-suporte';
  if (ehIphone() && !instalado()) return 'instalar';
  if (!temPush()) return 'sem-suporte';
  if (Notification.permission === 'denied') return 'negado';
  if (Notification.permission !== 'granted') return 'disponivel';
  try { const r = await registro(); return (await r?.pushManager.getSubscription()) ? 'ativo' : 'disponivel'; } catch { return 'disponivel'; }
}

/** Pede a permissão (num toque), inscreve o aparelho e manda a inscrição para o servidor. */
export async function ativarAvisoRemoto(): Promise<SituacaoAvisoRemoto> {
  const s = await situacaoAvisoRemoto();
  if (s === 'instalar' || s === 'sem-suporte' || s === 'negado') return s;
  if ((await Notification.requestPermission()) !== 'granted') return 'negado';
  try {
    const c = await chamar({ acao: 'chave' });
    if (!c?.publica) return 'sem-suporte';
    const r = await registro();
    if (!r) return 'sem-suporte';
    const sub = (await r.pushManager.getSubscription()) ?? await r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chave64(String(c.publica)) });
    const ok = await chamar({ acao: 'inscrever', endpoint: sub.endpoint });
    return ok ? 'ativo' : 'sem-suporte';
  } catch { return 'sem-suporte'; }
}

let ativo = false;
/** Agenda (ou reagenda) o aviso. Um descanso novo, ±15 s ou outro agendamento substituem o anterior. */
export function agendarAvisoRemoto(segundos: number): void {
  if (segundos < 1 || !temPush() || Notification.permission !== 'granted') return;
  ativo = true;
  chamar({ acao: 'agendar', segundos: Math.round(segundos), token: novoId() }).catch(() => {});
}
export function cancelarAvisoRemoto(): void {
  if (!ativo) return;
  ativo = false;
  chamar({ acao: 'cancelar' }).catch(() => {});
}

/** v0.12.3: o aviso do servidor está marcado para este descanso (evita aviso duplicado). */
export function avisoRemotoAgendado(): boolean { return ativo; }

/** v0.12.3: com o app em segundo plano e sem o aviso do servidor, a notificação sai do próprio aparelho (Android). */
export function avisoLocalDescanso(): void {
  try {
    if (!temPush() || Notification.permission !== 'granted') return;
    registro().then((r) => r?.showNotification('⏱ Acabou o tempo', {
      body: 'Bora para a próxima série do seu treino!', tag: 'quaru-descanso', icon: `${BASE}icones/icone-192.png`,
      badge: `${BASE}icones/icone-192.png`, data: { url: `${BASE}treino` }, vibrate: [0, 400, 200, 400], renotify: true,
    } as NotificationOptions)).catch(() => {});
  } catch { /* sem suporte */ }
}
