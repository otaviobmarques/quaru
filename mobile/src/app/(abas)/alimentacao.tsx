import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { DiarioDoDia } from '@/componentes/diario-alimentar';
import { ImagemOuEspaco } from '@/componentes/imagem-ou-espaco';
import { ReservaRefeicao } from '@/componentes/reserva-refeicao';
import { Aviso, BlocoTinta, Cartao, Segmentado, Selo, SeloEnergia, Tela, Texto } from '@/componentes/ui';
import { AVISO_DIETAS, DIETAS } from '@/dominio/dietas';
import { FOTOS_DIETAS } from '@/dominio/fotos-dietas';
import { IMAGENS_RECEITAS } from '@/dominio/imagens-redbox-gerado';
import { AVISO_REFEICOES, IDEIAS, MOMENTOS } from '@/dominio/refeicoes';
import { dietaDaPreferencia } from '@/dominio/tour';
import { useEstado } from '@/estado/armazem';
import { useCores, useCoresBase } from '@/tema/tema';

type Visao = 'dietas' | 'ideias';

/** Uma ideia de cada momento do dia, na ordem café → jantar (vitrine da aba; a lista completa fica em /refeicoes). */
const VITRINE_IDEIAS = MOMENTOS.map((m) => IDEIAS.find((i) => i.momento === m.id && IMAGENS_RECEITAS[i.id]) ?? IDEIAS.find((i) => i.momento === m.id)).filter((i) => !!i);

/**
 * Tela 11 – Alimentação (identidade v3.2, design/telas-v3.2/html/tela-03-alimentacao_*.html):
 * "Comer bem, sem complicar", diário simples do dia, e Dietas / Ideias de refeição num seletor.
 * Tudo é conteúdo informativo; nada substitui um nutricionista.
 */
export default function Alimentacao() {
  const { estado } = useEstado();
  const c = useCores();
  const b = useCoresBase();
  const pref = dietaDaPreferencia(estado.perfil?.prefAlimentar);
  const [visao, setVisao] = useState<Visao>('dietas');
  return (
    <Tela logo titulo="Alimentação">
      <Texto v="titulo-1">Comer bem, sem complicar</Texto>
      <DiarioDoDia />
      <Segmentado opcoes={[{ valor: 'dietas', rotulo: 'Dietas' }, { valor: 'ideias', rotulo: 'Ideias de refeição' }]} valor={visao} onChange={setVisao} />
      {visao === 'dietas' ? (
        <>
          {/* Dietas em grade de 2 colunas que vira 1 quando não cabe (nomes longos e fonte grande não vazam). */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {DIETAS.map((d) => (
              <Pressable key={d.id} testID={`cartao-dieta-${d.id}`} accessibilityRole="button"
                accessibilityLabel={`${d.nome}${d.alerta ? ', restritiva, leia os alertas' : ''}${d.id === pref ? ', sua preferência' : ''}`}
                onPress={() => router.push(`/dieta/${d.id}`)} style={({ pressed }) => ({ flexGrow: 1, flexBasis: 150, maxWidth: '100%', opacity: pressed ? 0.9 : 1 })}>
                <BlocoTinta raio={18}>
                  <View style={{ padding: 10, gap: 6 }}>
                    <View style={{ borderWidth: 2, borderColor: b.tinta, borderRadius: 14, overflow: 'hidden' }}>
                      <ImagemOuEspaco fonte={FOTOS_DIETAS[d.id]?.mini} alt={FOTOS_DIETAS[d.id]?.alt} largura="100%" proporcao={1} testID={`foto-dieta-${d.id}`} />
                    </View>
                    <Texto v="corpo-forte">{d.nome}</Texto>
                    {d.alerta ? <SeloEnergia texto="Restritiva · leia os alertas" /> : <Texto v="legenda" suave>Ideias gerais</Texto>}
                    {d.id === pref && <Selo texto="Sua preferência" tom="primaria" />}
                  </View>
                </BlocoTinta>
              </Pressable>
            ))}
          </View>
          <Aviso tom="alerta" titulo="Conteúdo informativo" texto={AVISO_DIETAS} />
        </>
      ) : (
        <>
          {VITRINE_IDEIAS.map((i) => (
            <Cartao key={i.id} rotulo={`${MOMENTOS.find((m) => m.id === i.momento)?.nome}: ${i.nome}`} onPress={() => router.push('/refeicoes')}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ borderWidth: 2, borderColor: b.tinta, borderRadius: 14, overflow: 'hidden' }}>
                  {IMAGENS_RECEITAS[i.id]
                    ? <ImagemOuEspaco fonte={IMAGENS_RECEITAS[i.id].mini} alt={IMAGENS_RECEITAS[i.id].alt ?? `Foto de ${i.nome.toLowerCase()}`} largura={64} proporcao={1} />
                    : <ReservaRefeicao momento={i.momento} largura={64} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Texto v="legenda" suave>{MOMENTOS.find((m) => m.id === i.momento)?.nome}</Texto>
                  <Texto v="corpo-forte">{i.nome}</Texto>
                </View>
                <Texto v="titulo-3">›</Texto>
              </View>
            </Cartao>
          ))}
          <Cartao rotulo="Ver todas as ideias de refeição" onPress={() => router.push('/refeicoes')}>
            <Texto v="corpo-forte" cor={b['primaria-texto']}>Ver todas as ideias, com filtros ›</Texto>
          </Cartao>
          <Texto v="rotulo" cor={c['texto-suave']}>{AVISO_REFEICOES}</Texto>
        </>
      )}
    </Tela>
  );
}
