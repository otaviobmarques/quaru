import { Pressable, Text, useColorScheme, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { google } from '@/tema/tokens';

/**
 * Botão "Continuar com o Google" seguindo as diretrizes de marca do Google Identity:
 * logotipo "G" padrão de 4 cores sem alteração, texto aprovado ("Continuar com o Google", tradução oficial de
 * "Continue with Google"), estilo Light no tema claro (#FFFFFF, borda #747775, texto #1F1F1F) e Neutral no escuro
 * (#F2F2F2, sem borda), cantos de 4 px, altura ≥ 40 px (usamos 44 para o toque), fonte média 14/20.
 * O design v2.1 trazia "Entrar com Google" e o "G" em degradê do Figma; ver ADR-0017.
 */
export function BotaoGoogle({ onPress, desabilitado }: { onPress: () => void; desabilitado?: boolean }) {
  const e = useColorScheme() === 'dark' ? google.neutral : google.light;
  return (
    <Pressable testID="botao-google" accessibilityRole="button" accessibilityLabel="Continuar com o Google" accessibilityState={{ disabled: !!desabilitado }}
      disabled={desabilitado} onPress={onPress}
      style={{ minHeight: 44, borderRadius: 4, backgroundColor: e.fundo, borderWidth: 1, borderColor: e.borda, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 12, opacity: desabilitado ? 0.6 : 1 }}>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Svg width={20} height={20} viewBox="0 0 48 48">
          <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </Svg>
      </View>
      <Text style={{ color: e.texto, fontSize: 14, lineHeight: 20, fontWeight: '500', fontFamily: 'Roboto, system-ui, sans-serif' }}>Continuar com o Google</Text>
    </Pressable>
  );
}
