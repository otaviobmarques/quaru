import { View } from 'react-native';

import { DemonstracaoExercicio } from '@/componentes/demonstracao-exercicio';
import { MapaMuscular } from '@/componentes/mapa-muscular';
import { doCatalogoPorNome } from '@/dominio/biblioteca';
import { IconeEquipamento } from '@/componentes/icone-equipamento';
import { adaptarModelo, equipamentosDoExercicio, AVISO_SEM_ALTERNATIVA, type Equipamento } from '@/dominio/equipamentos';
import { Aviso, Botao, Cartao, Selo, Texto } from '@/componentes/ui';
import { equipamentosDoModelo, regioesDoModelo, tempoEstimadoMin, type Modelo } from '@/dominio/treinos-sugeridos';

/** Cartão de treino sugerido: nome, tempo estimado, nº de exercícios, equipamento e mapa muscular (v0.4.1). */
export function CartaoModelo({ m, onAdicionar, tem }: { m: Modelo; onAdicionar: () => void; tem?: Equipamento[] | null }) {
  const equip = equipamentosDoModelo(m);
  const ad = tem ? adaptarModelo(m, tem) : null;
  const semOpcao = ad?.some((a) => a.troca && !a.usar);
  return (
    <Cartao>
      <Selo texto={m.nivel === 'iniciante' ? 'Iniciante' : 'Intermediário'} tom={m.nivel === 'iniciante' ? 'secundaria' : 'primaria'} />
      <Texto v="titulo-2">{m.nome}</Texto>
      <Texto v="rotulo" suave>{m.descricao}</Texto>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <View style={{ flex: 1, gap: 6 }}>
          <Texto v="corpo-forte">{`⏱ ~${tempoEstimadoMin(m)} min`}</Texto>
          <Texto v="corpo-forte">{`${m.itens.length} exercícios`}</Texto>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            {[...new Set(m.itens.flatMap((i) => equipamentosDoExercicio(doCatalogoPorNome(i.nome)!)))].map((id) => <IconeEquipamento key={id} id={id} tamanho={24} />)}
          </View>
          <Texto v="rotulo" suave>{`Equipamento: ${equip.join(', ')}`}</Texto>
        </View>
        <MapaMuscular regioes={regioesDoModelo(m)} altura={110} />
      </View>
      {m.itens.map((i, k) => {
        const a = ad?.[k];
        const usar = a ? a.usar : i.nome;
        const e = usar ? doCatalogoPorNome(usar) : undefined;
        const dose = `${i.series}×${i.reps ?? `${i.segundosPorSerie ?? 30}s`}`;
        return (
          <View key={i.nome} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} testID={`item-${m.id}-${k}`}>
            <View style={{ flex: 1 }}>
              <Texto v="rotulo">{`${usar ?? i.nome} · ${dose}`}</Texto>
              {a?.troca && a.usar && <Texto v="legenda" suave>{`No lugar de ${i.nome} (equipamento que você não marcou)`}</Texto>}
              {a?.troca && !a.usar && <Texto v="legenda" suave>Sem opção no catálogo com o seu equipamento</Texto>}
            </View>
            {e && <DemonstracaoExercicio exercicioId={e.id} nome={e.nome} tamanho={48} />}
          </View>
        );
      })}
      {semOpcao && <Aviso tom="secundaria" titulo="Falta equipamento" texto={AVISO_SEM_ALTERNATIVA} />}
      <Botao titulo={ad && ad.every((a) => !a.usar) ? 'Adicionar o treino original' : 'Adicionar aos meus treinos'} onPress={onAdicionar} testID={`adicionar-${m.id}`} />
    </Cartao>
  );
}
