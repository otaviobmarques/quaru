import LottieView from 'lottie-react-native';
import { useRef } from 'react';
import { useColorScheme, View } from 'react-native';

import { INFO_ANIMACAO, LOTTIE, type NomeAnimacao } from '@/componentes/animacoes-fontes';
import { useReduzirMovimento } from '@/servicos/movimento';

/**
 * Animação Lottie do Quaru (Android/iOS). Com "reduzir movimento" ligado, mostra o quadro final parado.
 * Sucesso: imagem com descrição. Decorativa: oculta do leitor de tela. "carregando" para depois de 10 voltas.
 * Na web, ver animacao.web.tsx (quadro final estático, sem o pacote do Lottie).
 */
export function Animacao({ nome, tamanho = 160 }: { nome: NomeAnimacao; tamanho?: number }) {
  const escuro = useColorScheme() === 'dark';
  const reduzir = useReduzirMovimento();
  const info = INFO_ANIMACAO[nome];
  const ref = useRef<LottieView>(null);
  const voltas = useRef(0);
  const a11y = info.tipo === 'sucesso'
    ? { accessible: true, accessibilityRole: 'image' as const, accessibilityLabel: info.descricao ?? undefined }
    : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const };
  return (
    <View testID={`animacao-${nome}`} {...a11y} style={{ width: tamanho, height: tamanho, alignSelf: 'center' }}>
      <LottieView ref={ref} source={escuro ? LOTTIE[nome].escuro : LOTTIE[nome].claro} autoPlay={!reduzir} loop={false}
        progress={reduzir ? 1 : undefined} style={{ width: '100%', height: '100%' }}
        onAnimationFinish={() => { if (!reduzir && ++voltas.current < info.repeticoesMax) ref.current?.play(); }} />
    </View>
  );
}
