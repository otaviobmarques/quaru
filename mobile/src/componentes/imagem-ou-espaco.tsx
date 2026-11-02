import { Image, type ImageSourcePropType, View } from 'react-native';

import { Texto } from '@/componentes/ui';
import { raio, useCores } from '@/tema/tema';

/**
 * Imagem com espaço provisório no estilo do DS (v0.4.3): sem arquivo da RedBox ainda, mostra um bloco em
 * superficie-2 com um símbolo neutro, no MESMO tamanho da imagem final (layout não pula).
 * O espaço não é anunciado ao leitor de tela; a imagem, quando existe, usa o texto alternativo.
 */
export function ImagemOuEspaco({ fonte, alt, largura, proporcao, cantos = 'medio', simbolo = '🍽', testID }: {
  fonte?: ImageSourcePropType | null; alt?: string; largura: number | '100%'; proporcao: number; cantos?: 'medio' | 'grande'; simbolo?: string; testID?: string;
}) {
  const c = useCores();
  const base = { width: largura, aspectRatio: proporcao, borderRadius: raio[cantos], backgroundColor: c['superficie-2'] } as const;
  // Na web, Image ignora aspectRatio quando a foto é grande: a caixa (View) define o tamanho e a foto preenche.
  if (fonte) return (
    <View style={[base, { overflow: 'hidden' }]}>
      <Image source={fonte} accessible={!!alt} accessibilityRole="image" accessibilityLabel={alt} accessibilityIgnoresInvertColors testID={testID}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', aspectRatio: proporcao }} resizeMode="cover" />
    </View>
  );
  return (
    <View testID={testID ? `${testID}-espaco` : undefined} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden
      style={[base, { alignItems: 'center', justifyContent: 'center' }]}>
      <Texto v="titulo-3" suave>{simbolo}</Texto>
    </View>
  );
}
