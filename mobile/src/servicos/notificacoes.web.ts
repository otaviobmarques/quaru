import type { ResultadoPermissao } from './notificacoes';
import { BASE } from '@/config/endereco';

/** Web: só pede a permissão do navegador quando a pessoa ativa um lembrete (nunca antes). */
export async function pedirPermissaoNotificacao(): Promise<ResultadoPermissao> {
  const N = (globalThis as { Notification?: { permission: string; requestPermission: () => Promise<string> } }).Notification;
  if (!N) return 'indisponivel';
  if (N.permission === 'granted') return 'concedida';
  if (N.permission === 'denied') return 'negada';
  return (await N.requestPermission()) === 'granted' ? 'concedida' : 'negada';
}

/**
 * Web (v0.5): o navegador não agenda notificações sem servidor de push. Enquanto o Quaru está aberto (ou instalado
 * e em segundo plano com a aba viva), conferimos a cada minuto e avisamos uma vez por dia em cada horário, até
 * 2 horas depois. `deveAvisar` deixa pular (ex.: já treinou hoje). Sem permissão, nada aparece.
 */
let plano: import('@/dominio/lembretes').Lembrete[] = [];
let filtro: ((l: import('@/dominio/lembretes').Lembrete) => boolean) | undefined;
let relogio: ReturnType<typeof setInterval> | null = null;
const CHAVE = (id: string) => `quaru:lembrete-visto:${id}`;
const hojeLocal = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };

async function mostrar(titulo: string, corpo: string) {
  try {
    const reg = await navigator.serviceWorker?.getRegistration?.();
    if (reg?.showNotification) { await reg.showNotification(titulo, { body: corpo, icon: `${BASE}icones/icone-192.png`, tag: titulo }); return; }
  } catch { /* cai para a Notification simples */ }
  try { new Notification(titulo, { body: corpo }); } catch { /* sem suporte */ }
}

export function conferirLembretes(agora = new Date()) {
  const N = (globalThis as { Notification?: { permission: string } }).Notification;
  if (!N || N.permission !== 'granted') return;
  const min = agora.getHours() * 60 + agora.getMinutes();
  for (const l of plano) {
    const alvo = l.hora * 60 + l.minuto;
    if (min < alvo || min > alvo + 120) continue;
    let visto: string | null = null;
    try { visto = localStorage.getItem(CHAVE(l.id)); } catch { /* modo privado */ }
    if (visto === hojeLocal()) continue;
    try { localStorage.setItem(CHAVE(l.id), hojeLocal()); } catch { /* ignora */ }
    if (filtro && !filtro(l)) continue;
    mostrar(l.titulo, l.corpo);
  }
}

export async function agendarLembretes(p: import('@/dominio/lembretes').Lembrete[], deveAvisar?: (l: import('@/dominio/lembretes').Lembrete) => boolean): Promise<void> {
  plano = p; filtro = deveAvisar;
  if (relogio) { clearInterval(relogio); relogio = null; }
  if (!p.length || typeof window === 'undefined') return;
  relogio = setInterval(() => conferirLembretes(), 60000);
  conferirLembretes();
}
