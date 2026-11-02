import { useColorScheme, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { DOMMA_ASSINATURA_CLARO, DOMMA_ASSINATURA_ESCURO } from '@/config/design-v042-gerado';
import { DOMMA_SIMBOLO_CLARO, DOMMA_SIMBOLO_ESCURO } from '@/config/domma-gerado';

/**
 * Símbolo oficial da Domma (logo/final-sinal, sem redesenho). Claro: "icone" (onda roxa + ponto escuro).
 * Escuro: "icone-perfil" (quadrado escuro com ponto claro), para o ponto não sumir no fundo escuro.
 */
export function SimboloDomma({ tamanho = 32 }: { tamanho?: number }) {
  const escuro = useColorScheme() === 'dark';
  return (
    <View accessible accessibilityRole="image" accessibilityLabel="Domma Tecnologia" testID="simbolo-domma" style={{ width: tamanho, height: tamanho }}>
      <SvgXml xml={escuro ? DOMMA_SIMBOLO_ESCURO : DOMMA_SIMBOLO_CLARO} width="100%" height="100%" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
    </View>
  );
}

/** v0.4.2: assinatura oficial da Domma (sinal + nome), arquivos de final-sinal; alt = nome da empresa. */
export function AssinaturaDomma({ largura = 136 }: { largura?: number }) {
  const escuro = useColorScheme() === 'dark';
  return (
    <View accessible accessibilityRole="image" accessibilityLabel="Domma Tecnologia" testID="assinatura-domma" style={{ width: largura, height: (largura * 270) / 750 }}>
      <SvgXml xml={escuro ? DOMMA_ASSINATURA_ESCURO : DOMMA_ASSINATURA_CLARO} width="100%" height="100%" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
    </View>
  );
}
