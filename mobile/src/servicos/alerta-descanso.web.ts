import { Asset } from 'expo-asset';

/**
 * ADR-0013: fim do descanso na WEB. Sem notificações push: só com a página aberta, toca descanso.wav
 * (HTMLAudio) e vibra com navigator.vibrate quando o navegador oferece (Android/Chrome; iPhone/Safari não vibra).
 */
let audio: HTMLAudioElement | null = null;

/** Chamado num toque do usuário (concluir série): cria e "destrava" o áudio, exigência dos navegadores. */
export function prepararAlertaDescanso() {
  if (typeof Audio === 'undefined') return;
  try {
    if (!audio) audio = new Audio(Asset.fromModule(require('../../assets/sons/descanso.wav')).uri);
    audio.muted = true;
    audio.play().then(() => { audio!.pause(); audio!.currentTime = 0; audio!.muted = false; }).catch(() => { if (audio) audio.muted = false; });
  } catch { /* sem áudio: segue só com o aviso visual */ }
}

export function alertarFimDescanso() {
  try { if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate([0, 400, 200, 400]); } catch {}
  try { if (audio) { audio.muted = false; audio.currentTime = 0; audio.play().catch(() => {}); } } catch {}
}
export const avisoDescansoDisponivel = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
