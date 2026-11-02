import { router } from 'expo-router';
import { View } from 'react-native';

import { Logo } from '@/componentes/logo';
import { SimboloDomma } from '@/componentes/simbolo-domma';
import { Botao, Texto } from '@/componentes/ui';
import { marca } from '@/config/marca';

/** Rodapé com o logotipo, a versão e os créditos da Domma (Perfil e Sobre, v0.4.1). */
export function RodapeMarca({ novidades = true }: { novidades?: boolean }) {
  return (
    <View style={{ alignItems: 'center', gap: 8, paddingTop: 16 }} testID="rodape-marca">
      <Logo largura={120} />
      <Texto v="legenda" suave>Versão {marca.versao}</Texto>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <SimboloDomma tamanho={28} />
        <Texto v="rotulo" suave>Desenvolvido por {marca.empresa}</Texto>
      </View>
      {novidades && <Botao v="texto" titulo="O que há de novo" onPress={() => router.push('/atualizacao')} testID="link-novidades" />}
    </View>
  );
}

/** Linha discreta de créditos (rodapé do Início). */
export function CreditoDomma() {
  return <Texto v="legenda" suave style={{ textAlign: 'center' }}>Desenvolvido por {marca.empresa}</Texto>;
}
