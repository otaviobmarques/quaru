/**
 * Sons do treino na WEB (ADR-0013, revisto na v0.11).
 * - Antes: <audio> com descanso.wav. No iPhone isso tomava a sessão de áudio e PAUSAVA a música (Spotify etc.).
 * - Agora: sons sintetizados pelo Web Audio, com navigator.audioSession.type = 'transient' (Safari 16.4+), que toca
 *   por cima da música sem interromper. No Android/Chrome o Web Audio já não pausa a música.
 *   Observação: no iPhone, com a chave do silencioso ligada, esse tipo de som não toca (fica a notificação).
 * - Vibra com navigator.vibrate onde existe (Android). O AudioContext é "destravado" num toque (exigência dos navegadores).
 */
type ComSessao = Navigator & { audioSession?: { type: string } };
let ctx: AudioContext | null = null;

function contexto(): AudioContext | null {
  try {
    const nav = (typeof navigator !== 'undefined' ? navigator : undefined) as ComSessao | undefined;
    if (nav?.audioSession) { try { nav.audioSession.type = 'transient'; } catch { /* navegador sem suporte */ } }
    if (!ctx) {
      const C = (globalThis as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
        ?? (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  } catch { return null; }
}

/** Toca notas (Hz, início em s, duração em s) com envelope suave. */
function tocar(notas: [number, number, number][], volume = 0.35) {
  const c = contexto();
  if (!c) return;
  const t0 = c.currentTime + 0.02;
  for (const [f, ini, dur] of notas) {
    const o = c.createOscillator(); const g = c.createGain();
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t0 + ini);
    g.gain.exponentialRampToValueAtTime(volume, t0 + ini + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + ini + dur);
    o.connect(g).connect(c.destination);
    o.start(t0 + ini); o.stop(t0 + ini + dur + 0.05);
  }
}
const vibrar = (p: number[]) => { try { if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(p); } catch { /* sem suporte */ } };

/** Chamado num toque do usuário (concluir série, iniciar cronômetro): destrava o áudio com um som mudo. */
export function prepararAlertaDescanso() {
  const c = contexto();
  if (!c) return;
  try { const o = c.createOscillator(); const g = c.createGain(); g.gain.value = 0; o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + 0.01); } catch { /* ignora */ }
}

/** Fim do descanso: três bipes (Lá5) e vibração. */
export function alertarFimDescanso() {
  vibrar([0, 400, 200, 400]);
  tocar([[880, 0, 0.16], [880, 0.24, 0.16], [1318.5, 0.48, 0.42]]);
}

/** Bipe curto da contagem regressiva (3, 2, 1). */
export function bipeContagem() { tocar([[660, 0, 0.1]], 0.2); }

/** Fim do treino: arpejo de comemoração e vibração mais longa. */
export function alertarFimTreino() {
  vibrar([0, 200, 100, 200, 100, 500]);
  tocar([[523.25, 0, 0.5], [659.25, 0.12, 0.5], [783.99, 0.24, 0.55], [1046.5, 0.36, 0.8]], 0.3);
}
export const avisoDescansoDisponivel = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
