import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { CartaoModelo } from '@/componentes/cartao-modelo';
import { View } from 'react-native';

import { MapaMuscular } from '@/componentes/mapa-muscular';
import { Aviso, Cartao, FaixaFichas, Ficha, Segmentado, Tela, Texto, Toast, EstadoVazio } from '@/componentes/ui';
import { AREAS, AVISO_TREINO, MODELOS, modeloDaArea, rotinaDoModelo, type Area, type Modelo, type Nivel } from '@/dominio/treinos-sugeridos';
import { equipamentosDoPerfil, itensCompativeis, modeloAdaptado } from '@/dominio/equipamentos';
import { acoes, useEstado } from '@/estado/armazem';
import { novoId } from '@/servicos/id';

/** Tela 4c – Treinos sugeridos (v0.4.1): modelos prontos que viram rotinas editáveis com um toque. */
export default function TreinosSugeridos() {
  const { area } = useLocalSearchParams<{ area?: string }>();
  return <Tela titulo="Treinos sugeridos" voltar={router.back}><ConteudoSugeridos area0={area} /></Tela>;
}

/** Conteúdo dos treinos sugeridos: tela própria (/treinos-sugeridos) e seção "Sugeridos" da aba Treinos. */
export function ConteudoSugeridos({ area0 }: { area0?: string }) {
  const { estado, aplicar } = useEstado();
  const [nivel, setNivel] = useState<Nivel>('iniciante');
  const [area, setArea] = useState<Area | null>(AREAS.some((a) => a.id === area0) ? (area0 as Area) : null);
  const tem = equipamentosDoPerfil(estado.perfil);
  // v0.4.3: com equipamento conhecido, quem dá para fazer sem trocas vem antes (nada é escondido).
  const lista = MODELOS.filter((m) => m.nivel === nivel && (!area || modeloDaArea(m, area)))
    .map((m, i) => ({ m, i })).sort((a, b) => (tem ? itensCompativeis(b.m, tem) - itensCompativeis(a.m, tem) : 0) || a.i - b.i).map((x) => x.m);
  const [adicionado, setAdicionado] = useState<{ id: string; nome: string } | null>(null);
  const adicionar = (m: Modelo) => {
    const ordem = Math.max(0, ...estado.rotinas.filter((r) => !r.excluidoEm).map((r) => r.ordem)) + 1;
    const r = rotinaDoModelo(tem ? modeloAdaptado(m, tem) : m, ordem, novoId, new Date().toISOString());
    aplicar((e) => acoes.salvarRotina(e, r));
    setAdicionado({ id: r.id, nome: r.nome });
  };
  return (
    <>
      {adicionado && <Toast fixo texto={`“${adicionado.nome}” foi para o seu plano.`} acao="Editar" onAcao={() => router.push(`/rotina/${adicionado.id}`)} onFim={() => setAdicionado(null)} />}
      <Texto v="titulo-1">Escolha o foco de hoje</Texto>
      <FaixaFichas>
        <Ficha texto="Todas" ativa={!area} onPress={() => setArea(null)} />
        {AREAS.map((a) => <Ficha key={a.id} texto={a.nome} ativa={area === a.id} onPress={() => setArea(area === a.id ? null : a.id)} />)}
      </FaixaFichas>
      <Cartao>
        <Texto v="legenda" suave>Frente e costas · {area ? `${AREAS.find((a) => a.id === area)?.nome} em destaque` : 'escolha uma área para destacar'}</Texto>
        <View style={{ alignItems: 'center' }}><MapaMuscular regioes={area ? AREAS.find((a) => a.id === area)!.regioes : []} altura={200} /></View>
      </Cartao>
      <Aviso tom="alerta" titulo="Antes de começar" texto={AVISO_TREINO} />
      <Segmentado opcoes={[{ valor: 'iniciante', rotulo: 'Iniciante' }, { valor: 'intermediario', rotulo: 'Intermediário' }]} valor={nivel} onChange={setNivel} />
      {lista.length === 0 && <EstadoVazio titulo="Nenhum treino nesta área" texto="Troque o nível ou escolha outra área." />}
      {lista.map((m) => <CartaoModelo key={m.id} m={m} tem={tem} onAdicionar={() => adicionar(m)} />)}
      <Texto v="legenda" suave>Tempo estimado: séries × (repetições × 3 s) + descanso entre séries + 1 min de troca por exercício. Referência geral: recomendações do ACSM para treino de força.</Texto>
    </>
  );
}

