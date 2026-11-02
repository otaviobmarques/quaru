import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Botao, Texto } from '@/componentes/ui';
import { aplicarAtualizacao, ouvirNovaVersao } from '@/servicos/atualizacao';
import { espaco, raio, useCores } from '@/tema/tema';

/** Faixa "Nova versão disponível" (web/PWA, v0.4.1). `forcar` só para testes e capturas. */
export function AvisoAtualizacao({ forcar }: { forcar?: boolean }) {
  const c = useCores();
  const insets = useSafeAreaInsets();
  const [nova, setNova] = useState(false);
  const [aplicando, setAplicando] = useState(false);
  // Build de capturas: só a simulação (?nova-versao=1), para a faixa não cobrir as outras telas.
  useEffect(() => (process.env.EXPO_PUBLIC_CAPTURAS === '1' ? undefined : ouvirNovaVersao(() => setNova(true))), []);
  const simular = (__DEV__ || process.env.EXPO_PUBLIC_CAPTURAS === '1') && Platform.OS === 'web' && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('nova-versao') === '1';
  if (!(nova || forcar || simular)) return null;
  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="polite" testID="aviso-atualizacao"
      style={{ position: 'absolute', left: 0, right: 0, bottom: 80 + insets.bottom, alignItems: 'center', paddingHorizontal: espaco[4] }}>
      <View style={{ width: '100%', maxWidth: 448, backgroundColor: c.texto, borderRadius: raio.grande, padding: espaco[3], gap: espaco[2] }}>
        <Texto v="corpo-forte" cor={c.fundo}>Nova versão disponível</Texto>
        <Texto v="rotulo" cor={c.fundo}>Seus dados continuam neste navegador.</Texto>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Botao flex titulo="Atualizar agora" carregando={aplicando} onPress={() => { setAplicando(true); aplicarAtualizacao(); }} testID="atualizar-agora" />
          <Botao flex v="secundario" titulo="Depois" onPress={() => setNova(false)} />
        </View>
      </View>
    </View>
  );
}
