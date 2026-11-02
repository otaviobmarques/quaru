import { Image, useColorScheme, View } from 'react-native';

import { INFO_ANIMACAO, QUADRO_FINAL, type NomeAnimacao } from '@/componentes/animacoes-fontes';

/**
 * Web: fallback estático (quadro final da animação, PNG). Evita carregar o pacote de Lottie para web
 * (@lottiefiles/dotlottie-react) e respeita "reduzir movimento" por definição (nada se move na web).
 */
export function Animacao({ nome, tamanho = 160 }: { nome: NomeAnimacao; tamanho?: number }) {
  const escuro = useColorScheme() === 'dark';
  const info = INFO_ANIMACAO[nome];
  const a11y = info.tipo === 'sucesso'
    ? { accessible: true, accessibilityRole: 'image' as const, accessibilityLabel: info.descricao ?? undefined }
    : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const, 'aria-hidden': true };
  return (
    <View testID={`animacao-${nome}`} {...a11y} style={{ width: tamanho, height: tamanho, alignSelf: 'center' }}>
      <Image source={escuro ? QUADRO_FINAL[nome].escuro : QUADRO_FINAL[nome].claro} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
    </View>
  );
}
