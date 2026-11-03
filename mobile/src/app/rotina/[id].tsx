import { DemonstracaoExercicio } from '@/componentes/demonstracao-exercicio';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Botao, BotaoIcone, Campo, Cartao, Tela, Texto, Toast } from '@/componentes/ui';
import type { ItemRotina, Rotina } from '@/dominio/tipos';
import { acoes, todosExercicios, useEstado } from '@/estado/armazem';
import { novoId } from '@/servicos/id';
import { doCatalogo } from '@/dominio/biblioteca';
import { descansoEntreSeries, tempoEstimadoTreino } from '@/dominio/descanso';
import { iniciarTreino } from '@/estado/treino';

/** Tela 4b – Editar treino (rotina no código). "nova" cria a rotina e redireciona para o id real. */
export default function EditarRotina() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { estado, aplicar } = useEstado();
  const rotina = estado.rotinas.find((r) => r.id === id);
  useEffect(() => {
    if (id !== 'nova') return;
    const nova = { id: novoId(), nome: `Treino ${String.fromCharCode(65 + estado.rotinas.filter((r) => !r.excluidoEm).length)}`, ordem: estado.rotinas.length + 1, itens: [], atualizadoEm: new Date().toISOString() };
    aplicar((e) => acoes.salvarRotina(e, nova));
    router.replace(`/rotina/${nova.id}`);
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!rotina) return <Tela voltar={router.back}><Texto suave>Carregando…</Texto></Tela>;
  return <Editor key={rotina.id} rotina={rotina} />;
}

function Editor({ rotina }: { rotina: Rotina }) {
  const { estado, aplicar } = useEstado();
  const [nome, setNome] = useState(rotina.nome);
  const [removido, setRemovido] = useState<{ item: ItemRotina; nome: string } | null>(null);
  const ex = new Map(todosExercicios(estado).map((e) => [e.id, e]));
  const itens = rotina.itens.toSorted((a, b) => a.ordem - b.ordem);
  const salvarItens = (l: ItemRotina[]) => aplicar((e) => acoes.salvarRotina(e, { ...rotina, nome: nome.trim() || rotina.nome, itens: l.map((x, i) => ({ ...x, ordem: i })) }));
  const mover = (i: number, d: number) => { const l = [...itens]; const j = i + d; if (j < 0 || j >= l.length) return; [l[i], l[j]] = [l[j], l[i]]; salvarItens(l); };
  const salvar = () => { aplicar((e) => acoes.salvarRotina(e, { ...rotina, nome: nome.trim().slice(0, 60) || rotina.nome })); router.back(); };
  // v0.7: começar direto daqui (salva o nome antes) e recalcular os descansos pelo tipo de exercício e objetivo.
  const comecar = () => { aplicar((e) => acoes.salvarRotina(e, { ...rotina, nome: nome.trim().slice(0, 60) || rotina.nome })); iniciarTreino(aplicar, estado, rotina.id); };
  const recalcular = () => salvarItens(itens.map((i) => ({ ...i, descansoS: descansoEntreSeries(doCatalogo(i.exercicioId), estado.perfil?.treino) })));
  const min = tempoEstimadoTreino(itens);
  const ativa = estado.sessoes.find((x) => !x.finalizadaEm && !x.excluidoEm);
  return (
    <Tela titulo="Editar treino" voltar={router.back} rodape={
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Botao flex v="secundario" titulo="Salvar" onPress={salvar} testID="salvar-treino" />
        <Botao flex grande titulo={ativa ? 'Continuar treino' : 'Começar este treino'} onPress={comecar} desabilitado={itens.length === 0 || (!!ativa && ativa.rotinaId !== rotina.id)} testID="comecar-treino" />
      </View>}>
      <Campo rotulo="Nome do treino" value={nome} onChangeText={setNome} maxLength={60} />
      {itens.length > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <Texto v="rotulo">{itens.length} {itens.length === 1 ? 'exercício' : 'exercícios'} · tempo estimado ~{min} min</Texto>
          <Botao v="texto" titulo="Recalcular descansos" onPress={recalcular} testID="recalcular-descansos" />
        </View>
      )}
      {itens.map((it, i) => (
        <Cartao key={it.id}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Texto v="corpo-forte">{ex.get(it.exercicioId)?.nome ?? 'Exercício'}</Texto>
              <Texto v="rotulo" suave>{it.seriesAlvo} séries × {it.repsAlvo ?? '–'} reps · descanso {it.descansoS >= 60 ? `${Math.floor(it.descansoS / 60)}min${it.descansoS % 60 ? ` ${it.descansoS % 60}s` : ''}` : `${it.descansoS}s`}</Texto>
              <DemonstracaoExercicio exercicioId={it.exercicioId} nome={ex.get(it.exercicioId)?.nome ?? 'exercício'} />
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <BotaoIcone rotulo={`Subir ${ex.get(it.exercicioId)?.nome ?? 'exercício'}`} onPress={() => mover(i, -1)}><Texto v="titulo-3">↑</Texto></BotaoIcone>
              <BotaoIcone rotulo={`Descer ${ex.get(it.exercicioId)?.nome ?? 'exercício'}`} onPress={() => mover(i, 1)}><Texto v="titulo-3">↓</Texto></BotaoIcone>
            </View>
            <View style={{ width: 16 }} />
            <BotaoIcone rotulo={`Remover ${ex.get(it.exercicioId)?.nome ?? 'exercício'}`} onPress={() => { setRemovido({ item: it, nome: ex.get(it.exercicioId)?.nome ?? 'Exercício' }); salvarItens(itens.filter((x) => x.id !== it.id)); }}><Texto v="titulo-3" suave>✕</Texto></BotaoIcone>
          </View>
        </Cartao>
      ))}
      {removido && <Toast texto={`${removido.nome} removido`} acao="Desfazer" onAcao={() => { salvarItens([...itens, removido.item].toSorted((a, b) => a.ordem - b.ordem)); setRemovido(null); }} onFim={() => setRemovido(null)} />}
      <Botao v="secundario" titulo="Adicionar exercícios" onPress={() => { salvarItens(itens); router.push(`/biblioteca?rotina=${rotina.id}`); }} />
      <Botao v="destrutivo" titulo="Excluir treino" onPress={() => { aplicar((e) => acoes.excluirRotina(e, rotina.id)); router.back(); }} />
    </Tela>
  );
}
