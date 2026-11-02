import { useColorScheme, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { LOGO_BRANCO } from '@/config/design-v042-gerado';
import { LOGO_CLARO, LOGO_ESCURO, SIMBOLO } from '@/config/logo-gerado';
import { marca } from '@/config/marca';

/**
 * Logotipo oficial do Quaru (arquivos de quaru_v2, sem redesenho). Claro: "colorido"; escuro: "colorido-fundo-escuro"
 * (o fundo do arquivo é #1A0E12, igual ao fundo do tema escuro). O viewBox já traz a área de proteção.
 * Tamanho mínimo adotado: 96 px de largura do arquivo (o guia não define; a confirmar com a Lorena).
 */
export const LOGO_LARGURA_MINIMA = 96;
export function Logo({ largura = 120 }: { largura?: number }) {
  const escuro = useColorScheme() === 'dark';
  const w = Math.max(LOGO_LARGURA_MINIMA, largura);
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={marca.nome} testID="logo-quaru" style={{ width: w, height: (w * 180) / 480 }}>
      <SvgXml xml={escuro ? LOGO_ESCURO : LOGO_CLARO} width="100%" height="100%" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
    </View>
  );
}

/** v0.4.2 (design v2.1): só o símbolo no topo das abas (36 px). A logo inteira fica no login e no Sobre. */
export function Simbolo({ tamanho = 36 }: { tamanho?: number }) {
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={marca.nome} testID="simbolo-quaru" style={{ width: tamanho, height: tamanho }}>
      <SvgXml xml={SIMBOLO} width="100%" height="100%" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
    </View>
  );
}

/** Logotipo branco (sobre o degradê vermelho do topo do login), arquivo oficial. */
export function LogoBranco({ largura = 176 }: { largura?: number }) {
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={marca.nome} testID="logo-quaru-branco" style={{ width: largura, height: (largura * 180) / 480 }}>
      <SvgXml xml={LOGO_BRANCO} width="100%" height="100%" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
    </View>
  );
}
