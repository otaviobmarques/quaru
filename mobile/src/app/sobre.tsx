import { router } from 'expo-router';
import { RodapeMarca } from '@/componentes/rodape-marca';
import { Cartao, ItemLista, Tela, Texto } from '@/componentes/ui';
import { marca } from '@/config/marca';
import { CREDITOS_FOTOS } from '@/dominio/creditos-fotos';
import { MIT_MUSCLEMAP, OUTRAS } from '@/dominio/licencas';

/** Tela 12d – Sobre e licenças (L3). */
export default function Sobre() {
  return (
    <Tela titulo="Sobre o app" voltar={router.back}>
      <RodapeMarca />
      <Texto suave style={{ textAlign: 'center' }}>{marca.nome} · versão {marca.versao} · Desenvolvido por {marca.empresa}</Texto>
      <Texto v="rotulo" suave>Termos de uso e política de privacidade: RASCUNHO em revisão jurídica (Perfil → Termos de uso e privacidade).</Texto>
      <Cartao>{OUTRAS.map((o, i) => <ItemLista key={o.nome} ultimo={i === OUTRAS.length - 1} titulo={o.nome} sub={`${o.licenca} · ${o.obs}`} />)}</Cartao>
      <Texto v="corpo-forte">Fotos de alimentos (dietas e ideias de refeições)</Texto>
      <Texto v="rotulo" suave>Fotos reais selecionadas pela RedBox no Pexels e no Pixabay. Uso comercial gratuito; o crédito é opcional, mas registramos aqui.</Texto>
      <Cartao>{CREDITOS_FOTOS.map((c, i) => <ItemLista key={c.arquivo} ultimo={i === CREDITOS_FOTOS.length - 1} titulo={c.descricao} sub={`${c.autor} · ${c.licenca} · ${c.origem}`} />)}</Cartao>
      <Texto v="corpo-forte">MuscleMap — licença MIT (texto integral)</Texto>
      <Cartao><Texto v="legenda">{MIT_MUSCLEMAP}</Texto></Cartao>
    </Tela>
  );
}
