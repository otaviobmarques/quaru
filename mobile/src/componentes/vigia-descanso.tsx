import { router, usePathname } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Texto } from '@/componentes/ui';
import { definirDescanso, useDescanso } from '@/estado/descanso-atual';
import { useEstado } from '@/estado/armazem';
import { alertarFimDescanso, bipeContagem } from '@/servicos/alerta-descanso';
import { avisoLocalDescanso, avisoRemotoAgendado } from '@/servicos/aviso-remoto';
import { agoraMs } from '@/servicos/relogio';
import { useCores } from '@/tema/tema';

/**
 * v0.12.3: cuida do fim do descanso em QUALQUER tela (montado no _layout).
 * - Bipes 3, 2, 1 e o alerta no zero (som + vibração), também fora da tela do treino.
 * - Com o app em segundo plano e sem o aviso do servidor, mostra a notificação pelo próprio aparelho.
 * - Fora da tela do treino, uma faixa no topo mostra o tempo e leva de volta ao treino.
 */
export function VigiaDescanso() {
  const [descanso] = useDescanso();
  const { estado } = useEstado();
  const emAndamento = estado.sessoes.some((x) => !x.finalizadaEm && !x.excluidoEm);
  useEffect(() => { if (descanso && !emAndamento) definirDescanso(null); }, [descanso, emAndamento]);
  const caminho = usePathname();
  const c = useCores();
  const topo = useSafeAreaInsets().top;
  const [agora, setAgora] = useState(agoraMs);
  const avisado = useRef<number | null>(null);
  useEffect(() => { if (!descanso) return; const t = setInterval(() => setAgora(agoraMs()), 250); return () => clearInterval(t); }, [descanso]);
  const faltaS = descanso ? Math.ceil((descanso.fim - agora) / 1000) : null;
  const zerou = !!descanso && agora >= descanso.fim;
  useEffect(() => { if (faltaS != null && faltaS >= 1 && faltaS <= 3) bipeContagem(); }, [faltaS]);
  useEffect(() => {
    if (!zerou || !descanso || avisado.current === descanso.fim) return;
    avisado.current = descanso.fim;
    alertarFimDescanso();
    if (Platform.OS === 'web' && typeof document !== 'undefined' && document.visibilityState !== 'visible' && !avisoRemotoAgendado()) avisoLocalDescanso();
  }, [zerou, descanso]);

  if (!descanso || caminho === '/treino') return null;
  const resta = Math.max(0, faltaS ?? 0);
  const texto = zerou ? '⏱ Acabou o descanso! Toque para voltar ao treino' : `⏱ ${descanso.trabalho ? 'Cardio' : 'Descanso'} ${Math.floor(resta / 60)}:${String(resta % 60).padStart(2, '0')} · voltar ao treino`;
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', top: topo + 8, left: 12, right: 12, zIndex: 50, alignItems: 'center' }}>
      <Pressable testID="faixa-descanso" accessibilityRole="button" accessibilityLiveRegion="polite" onPress={() => router.push('/treino')}
        style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, backgroundColor: zerou ? c.primaria : c.texto, maxWidth: 480 }}>
        <Texto v="corpo-forte" cor={c.superficie}>{texto}</Texto>
      </Pressable>
    </View>
  );
}
