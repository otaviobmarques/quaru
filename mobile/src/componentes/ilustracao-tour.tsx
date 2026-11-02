import { useColorScheme, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { ILUSTRACOES_TOUR, PESSOAS_LOGIN } from '@/config/design-v042-gerado';

/** As 11 ilustrações do tour do design v2.1 (360×240), com as cores do tema já resolvidas na geração. */
export type NomeIlustracaoTour = keyof typeof ILUSTRACOES_TOUR;
export const NOMES_ILUSTRACOES_TOUR = Object.keys(ILUSTRACOES_TOUR) as NomeIlustracaoTour[];

/** Imagem para o leitor de tela, com a descrição do próprio design; os desenhos internos ficam ocultos. */
export function IlustracaoTour({ nome, largura = 300, descricao }: { nome: NomeIlustracaoTour; largura?: number; descricao?: string }) {
  const escuro = useColorScheme() === 'dark';
  const i = ILUSTRACOES_TOUR[nome];
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={descricao ?? i.descricao} testID={`ilustracao-tour-${nome}`}
      style={{ width: largura, maxWidth: '100%', aspectRatio: 360 / 240, alignSelf: 'center' }}>
      <SvgXml xml={escuro ? i.escuro : i.claro} width="100%" height="100%" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
    </View>
  );
}

/** Pessoas do topo do login: decorativas (ocultas do leitor de tela). */
export function PessoaLogin({ indice, largura = 76 }: { indice: 0 | 1; largura?: number }) {
  const escuro = useColorScheme() === 'dark';
  const p = PESSOAS_LOGIN[indice];
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: largura, height: (largura * 150) / 120 }}>
      <SvgXml xml={escuro ? p.escuro : p.claro} width="100%" height="100%" />
    </View>
  );
}
