import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** true quando a pessoa ligou "reduzir movimento" no sistema (Android/iOS) ou prefers-reduced-motion (web). */
export function useReduzirMovimento(): boolean {
  const [reduzir, setReduzir] = useState(false);
  useEffect(() => {
    let vivo = true;
    AccessibilityInfo.isReduceMotionEnabled?.().then((v) => { if (vivo) setReduzir(!!v); }).catch(() => {});
    const s = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v: boolean) => setReduzir(!!v));
    return () => { vivo = false; s?.remove?.(); };
  }, []);
  return reduzir;
}
