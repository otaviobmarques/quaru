import { router, useLocalSearchParams } from 'expo-router';

import { HistoricoTreinos, MeusTreinos } from '@/componentes/treinos/secoes';
import { Botao, Segmentado, Tela } from '@/componentes/ui';
import { ConteudoSugeridos } from '@/app/treinos-sugeridos';

export type SecaoTreinos = 'meus' | 'sugeridos' | 'historico';
export const SECOES_TREINOS: { valor: SecaoTreinos; rotulo: string }[] = [
  { valor: 'meus', rotulo: 'Meus treinos' }, { valor: 'sugeridos', rotulo: 'Sugeridos' }, { valor: 'historico', rotulo: 'Histórico' },
];

/** Aba Treinos (v0.4.2, design v2.1): reúne Meus treinos (antes Rotinas), Sugeridos e Histórico. ?secao= abre direto. */
export default function Treinos() {
  const { secao: s0 } = useLocalSearchParams<{ secao?: string }>();
  return <TelaTreinos secao={s0 === 'sugeridos' || s0 === 'historico' ? s0 : 'meus'} />;
}

/** Conteúdo da aba Treinos numa seção. Também usado pelos endereços antigos /rotinas e /historico. */
export function TelaTreinos({ secao }: { secao: SecaoTreinos }) {
  const { area } = useLocalSearchParams<{ area?: string }>();
  return (
    <Tela logo titulo="Treinos" rodape={secao === 'meus' ? <Botao grande titulo="Nova rotina" onPress={() => router.push('/rotina/nova')} testID="nova-rotina" /> : undefined}>
      <Segmentado<SecaoTreinos> opcoes={SECOES_TREINOS} valor={secao} onChange={(v) => router.navigate(`/treinos?secao=${v}` as never)} />
      {secao === 'meus' ? <MeusTreinos /> : secao === 'sugeridos' ? <ConteudoSugeridos area0={area} /> : <HistoricoTreinos />}
    </Tela>
  );
}
