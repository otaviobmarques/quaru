import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Aviso, Cartao, EstadoVazio, FaixaFichas, Ficha, Segmentado, Selo, Tela, Texto } from '@/componentes/ui';
import { ReservaRefeicao } from '@/componentes/reserva-refeicao';
import { legendaCredito } from '@/dominio/creditos-fotos';
import { ImagemOuEspaco } from '@/componentes/imagem-ou-espaco';
import { IMAGENS_RECEITAS } from '@/dominio/imagens-redbox-gerado';
import { etiquetaDaPreferencia } from '@/dominio/tour';
import { useEstado } from '@/estado/armazem';
import { AVISO_REFEICOES, ETIQUETAS, filtrarIdeias, MOMENTOS, type Etiqueta, type Momento } from '@/dominio/refeicoes';

/** Tela 11d – Ideias de refeições saudáveis (v0.4.1). Conteúdo em dominio/refeicoes.ts, em revisão. */
export default function Refeicoes() {
  const [momento, setMomento] = useState<Momento>('cafe');
  const { estado } = useEstado();
  // Começa filtrado pela preferência alimentar do tour (dá para tirar o filtro).
  const [tags, setTags] = useState<Etiqueta[]>(() => { const t = etiquetaDaPreferencia(estado.perfil?.prefAlimentar); return t ? [t] : []; });
  const lista = filtrarIdeias(momento, tags);
  return (
    <Tela titulo="Ideias de refeições" voltar={router.back} rodape={<Aviso tom="alerta" titulo="Conteúdo informativo" texto={AVISO_REFEICOES} />}>
      <Segmentado opcoes={MOMENTOS.map((m) => ({ valor: m.id, rotulo: m.nome.replace(' da manhã', '') }))} valor={momento} onChange={setMomento} />
      <FaixaFichas>{ETIQUETAS.map((e) => <Ficha key={e.id} texto={e.nome} ativa={tags.includes(e.id)} onPress={() => setTags(tags.includes(e.id) ? tags.filter((x) => x !== e.id) : [...tags, e.id])} />)}</FaixaFichas>
      {lista.length === 0 && <EstadoVazio titulo="Nenhuma ideia com esses filtros" texto="Tire uma etiqueta ou troque a refeição." />}
      {lista.map((i) => (
        <Cartao key={i.id}>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            {IMAGENS_RECEITAS[i.id]
              ? <ImagemOuEspaco fonte={IMAGENS_RECEITAS[i.id].mini} alt={IMAGENS_RECEITAS[i.id].alt ?? `Foto de ${i.nome.toLowerCase()}`} largura={72} proporcao={1} testID={`foto-receita-${i.id}`} />
              : <ReservaRefeicao momento={i.momento} largura={72} testID={`foto-receita-${i.id}-reserva`} />}
            <View style={{ flex: 1 }}><Texto v="titulo-3">{i.nome}</Texto></View>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{i.etiquetas.map((e) => <Selo key={e} texto={ETIQUETAS.find((x) => x.id === e)!.nome} />)}</View>
          <Texto v="corpo-forte">Ingredientes</Texto>
          {i.ingredientes.map((g) => <Texto key={g}>{`• ${g}`}</Texto>)}
          <Texto v="corpo-forte">Preparo</Texto>
          <Texto>{i.preparo}</Texto>
          {IMAGENS_RECEITAS[i.id] && legendaCredito(`refeicao-${i.id}`) && <Texto v="legenda" suave>{legendaCredito(`refeicao-${i.id}`)}</Texto>}
        </Cartao>
      ))}
    </Tela>
  );
}
