import { router, useLocalSearchParams } from 'expo-router';
import { useDeferredValue, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';

import { Botao, Campo, EstadoVazio, FaixaFichas, Ficha, ItemLista, Tela, Texto } from '@/componentes/ui';
import { AREAS, EQUIPAMENTOS, filtrarExercicios, GRUPOS, type Area, doCatalogo } from '@/dominio/biblioteca';
import { midiaDoExercicio } from '@/dominio/midia-exercicios';
import type { Exercicio } from '@/dominio/tipos';
import { acoes, todosExercicios, useEstado } from '@/estado/armazem';
import { novoId } from '@/servicos/id';
import { descansoEntreSeries } from '@/dominio/descanso';
import { REGRAS } from '@/dominio/objetivo';
import { useCores } from '@/tema/tema';

export const ALTURA_ITEM = 72;

/**
 * Tela 5 – Biblioteca (v0.4.4): ~870 exercícios em lista virtualizada (só renderiza o que está na tela),
 * busca sem acento em português (e pelo nome original) e filtros de área, grupo e equipamento. Com ?rotina= adiciona à rotina.
 */
export default function Biblioteca() {
  const { rotina: rotinaId } = useLocalSearchParams<{ rotina?: string }>();
  const { estado, aplicar } = useEstado();
  const c = useCores();
  const [busca, setBusca] = useState('');
  const buscaAdiada = useDeferredValue(busca);
  const [grupo, setGrupo] = useState<string | null>(null);
  const [equip, setEquip] = useState<string | null>(null);
  const [area, setArea] = useState<Area | null>(null);
  const [sel, setSel] = useState<string[]>([]);
  const todos = useMemo(() => todosExercicios(estado), [estado]);
  const lista = useMemo(() => filtrarExercicios(todos, buscaAdiada, grupo, equip, area), [todos, buscaAdiada, grupo, equip, area]);
  const rotina = estado.rotinas.find((r) => r.id === rotinaId);
  const limpar = () => { setBusca(''); setGrupo(null); setEquip(null); setArea(null); };
  const adicionar = () => {
    if (!rotina) return;
    const base = rotina.itens.length;
    // v0.7: repetições pelo objetivo e descanso calculado pelo tipo de exercício (dominio/descanso.ts).
    const t = estado.perfil?.treino;
    const reps = t ? REGRAS[t.objetivo].reps : 10;
    aplicar((e) => acoes.salvarRotina(e, { ...rotina, itens: [...rotina.itens, ...sel.map((x, i) => ({ id: novoId(), exercicioId: x, ordem: base + i, seriesAlvo: 3, repsAlvo: reps, descansoS: descansoEntreSeries(doCatalogo(x), t) }))] }));
    router.back();
  };
  const item = ({ item: e, index }: { item: Exercicio; index: number }) => (
    <View style={{ height: ALTURA_ITEM, justifyContent: 'center' }}>
      <ItemLista umaLinha imagem={midiaDoExercicio(e.id).mini} ultimo={index === lista.length - 1} titulo={(sel.includes(e.id) ? '✓ ' : '') + e.nome} sub={`${e.grupoMuscular} · ${e.equipamento}`}
        onPress={() => (rotina ? setSel(sel.includes(e.id) ? sel.filter((x) => x !== e.id) : [...sel, e.id]) : router.push(`/exercicio/${e.id}`))} />
    </View>
  );
  return (
    <Tela semRolagem titulo="Biblioteca de exercícios" voltar={router.back} rodape={rotina ? <Botao grande titulo={`Adicionar ${sel.length || ''} ao treino`} desabilitado={!sel.length} onPress={adicionar} /> : undefined}>
      <Campo testID="busca-biblioteca" rotulo="Buscar" value={busca} onChangeText={setBusca} placeholder="Ex.: supino, agachamento, rosca" />
      <FaixaFichas rolar>{AREAS.map((a) => <Ficha key={a.id} texto={a.nome} ativa={area === a.id} onPress={() => setArea(area === a.id ? null : a.id)} />)}</FaixaFichas>
      <FaixaFichas rolar>{GRUPOS.map((g) => <Ficha key={g} texto={g} ativa={grupo === g} onPress={() => setGrupo(grupo === g ? null : g)} />)}</FaixaFichas>
      <FaixaFichas rolar>{EQUIPAMENTOS.map((g) => <Ficha key={g} texto={g} ativa={equip === g} onPress={() => setEquip(equip === g ? null : g)} />)}</FaixaFichas>
      <Texto v="legenda" suave>{lista.length} {lista.length === 1 ? 'exercício' : 'exercícios'} · nomes em revisão por profissional (CREF)</Texto>
      <FlatList testID="lista-biblioteca" style={{ flex: 1 }} data={lista} keyExtractor={(e) => e.id} renderItem={item}
        getItemLayout={(_, i) => ({ length: ALTURA_ITEM, offset: ALTURA_ITEM * i, index: i })}
        initialNumToRender={12} maxToRenderPerBatch={12} windowSize={7} removeClippedSubviews keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 32, backgroundColor: c.fundo }}
        ListEmptyComponent={<EstadoVazio titulo="Nada encontrado" texto="Tente outra busca ou limpe os filtros." acao={<Botao v="secundario" titulo="Limpar filtros" onPress={limpar} />} />} />
    </Tela>
  );
}
