import { router } from 'expo-router';
import { View } from 'react-native';

import { Botao, Cartao, Texto } from '@/componentes/ui';
import { dataCurtaBr, diasDeTeste, nomeDoPlano, podeTreinar, type PlanoConta } from '@/dominio/plano';

/**
 * v0.12: aviso do plano no Início. Só aparece com a cobrança ligada: teste contando, pagamento em atraso ou sem plano.
 * Assinante em dia, cortesia e treinador não veem nada.
 */
export function FaixaPlano({ plano, agora = new Date() }: { plano: PlanoConta | null | undefined; agora?: Date }) {
  if (!plano?.cobranca_ativa || plano.motivo === 'isento') return null;
  const dias = diasDeTeste(plano, agora);
  if (!podeTreinar(plano, agora)) return (
    <Cartao destaque>
      <View style={{ gap: 6 }} testID="faixa-sem-plano">
        <Texto v="titulo-3">{plano.valido_ate ? 'Sua assinatura venceu' : 'Seu teste grátis acabou'}</Texto>
        <Texto v="rotulo" suave>Assine para continuar treinando. Seu histórico e a sua evolução continuam aqui.</Texto>
        <Botao titulo="Ver planos" onPress={() => router.push('/planos' as never)} testID="ver-planos" />
      </View>
    </Cartao>
  );
  if (plano.status === 'atrasada') return (
    <Cartao>
      <View style={{ gap: 6 }} testID="faixa-atrasada">
        <Texto v="corpo-forte">Pagamento em atraso</Texto>
        <Texto v="rotulo" suave>{plano.valido_ate ? `Seu acesso vai até ${dataCurtaBr(plano.valido_ate)}. Pague para não ficar sem treinar.` : 'Pague para continuar treinando.'}</Texto>
        <Botao v="secundario" titulo="Pagar agora" onPress={() => router.push('/planos' as never)} />
      </View>
    </Cartao>
  );
  if (dias != null && dias > 0) return (
    <Cartao>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }} testID="faixa-teste">
        <View style={{ flex: 1, minWidth: 180, gap: 2 }}>
          <Texto v="corpo-forte">{`Teste grátis: ${dias === 1 ? 'falta 1 dia' : `faltam ${dias} dias`}`}</Texto>
          <Texto v="rotulo" suave>{plano.plano ? `Plano ${nomeDoPlano(plano.plano)} escolhido: falta pagar.` : 'Escolha um plano para não parar depois do teste.'}</Texto>
        </View>
        <Botao v="secundario" titulo="Ver planos" onPress={() => router.push('/planos' as never)} testID="ver-planos" />
      </View>
    </Cartao>
  );
  return null;
}
