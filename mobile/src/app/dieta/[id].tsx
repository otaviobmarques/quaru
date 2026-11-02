import { router, useLocalSearchParams } from 'expo-router';

import { ImagemOuEspaco } from '@/componentes/imagem-ou-espaco';
import { legendaCredito } from '@/dominio/creditos-fotos';
import { FOTOS_DIETAS } from '@/dominio/fotos-dietas';
import { Aviso, Cartao, EstadoVazio, Tela, Texto } from '@/componentes/ui';
import { AVISO_DIETAS, DIETAS, FONTES } from '@/dominio/dietas';

const Lista = ({ itens }: { itens: string[] }) => <>{itens.map((t) => <Texto key={t}>{`• ${t}`}</Texto>)}</>;

/** Tela 11c – Detalhe de uma dieta (conteúdo de dominio/dietas.ts, em revisão por nutricionista). */
export default function DietaTela() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const d = DIETAS.find((x) => x.id === id);
  // O aviso fica no rodapé fixo: sempre visível, mesmo rolando.
  const rodape = <Aviso tom="alerta" titulo="Conteúdo informativo" texto={AVISO_DIETAS} />;
  if (!d) return <Tela titulo="Dieta" voltar={router.back} rodape={rodape}><EstadoVazio titulo="Dieta não encontrada" texto="Volte e escolha outra da lista." /></Tela>;
  return (
    <Tela titulo={d.nome} voltar={router.back} rodape={rodape}>
      <ImagemOuEspaco fonte={FOTOS_DIETAS[d.id]?.foto} alt={FOTOS_DIETAS[d.id]?.alt} largura="100%" proporcao={16 / 9} cantos="grande" testID="foto-dieta" />
      {!FOTOS_DIETAS[d.id].provisoria && legendaCredito(`dieta-${d.id}`) && <Texto v="legenda" suave>{legendaCredito(`dieta-${d.id}`)}</Texto>}
      {d.alerta && <Aviso tom="erro" titulo="Não é para todo mundo" texto={d.alerta} />}
      <Cartao><Texto v="corpo-forte">O que é</Texto><Texto>{d.oQueE}</Texto></Cartao>
      <Cartao><Texto v="corpo-forte">O que comer</Texto><Lista itens={d.comer} /></Cartao>
      <Cartao><Texto v="corpo-forte">O que evitar</Texto><Lista itens={d.evitar} /></Cartao>
      <Cartao><Texto v="corpo-forte">Cardápio de exemplo (1 dia)</Texto>
        {d.cardapio.map((r) => <Texto key={r.refeicao}><Texto v="corpo-forte">{r.refeicao}: </Texto>{r.exemplo}</Texto>)}
        <Texto v="legenda" suave>Só um exemplo genérico, sem quantidades. Porções e calorias dependem de cada pessoa.</Texto></Cartao>
      <Cartao><Texto v="corpo-forte">Para quem não é indicada</Texto><Lista itens={d.naoIndicada} /></Cartao>
      <Texto v="legenda" suave>{`Fontes: ${d.fontes.map((f) => FONTES[f]).join('; ')}. Conteúdo em revisão por nutricionista.`}</Texto>
    </Tela>
  );
}
