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
import { DepoisDeAdicionar } from '@/componentes/treinos/depois-de-adicionar';

/** Tela 4b – Editar treino (rotina no código). "nova" cria a rotina e redireciona para o id real. */
export default function EditarRotina() {
  const { id, nova: ehNova } = useLocalSearchParams<{ id: string; nova?: string }>();
  const { estado, aplicar } = useEstado();
  const rotina = estado.rotinas.find((r) => r.id === id);
  useEffect(() => {
    if (id !== 'nova') return;
    const nova = { id: novoId(), nome: `Treino ${String.fromCharCode(65 + estado.rotinas.filter((r) => !r.excluidoEm).length)}`, ordem: estado.rotinas.length + 1, itens: [], atualizadoEm: new Date().toISOString() };
    aplicar((e) => acoes.salvarRotina(e, nova));
    router.replace(`/rotina/${nova.id}?nova=1` as never);
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!rotina) return <Tela voltar={router.back}><Texto suave>Carregando…</Texto></Tela>;
  return <Editor key={rotina.id} rotina={rotina} nova={ehNova === '1'} />;
}

function Editor({ rotina, nova }: { rotina: Rotina; nova?: boolean }) {
  const { estado, aplicar } = useEstado();
  const [perguntarDia, setPerguntarDia] = useState(false);
  const [nome, setNome] = useState(rotina.nome);
  const [removido, setRemovido] = useState<{ item: ItemRotina; nome: string } | null>(null);
  const ex = new Map(todosExercicios(estado).map((e) => [e.id, e]));
  const itens = rotina.itens.toSorted((a, b) => a.ordem - b.ordem);
  const salvarItens = (l: ItemRotina[]) => aplicar((e) => acoes.salvarRotina(e, { ...rotina, nome: nome.trim() || rotina.nome, itens: l.map((x, i) => ({ ...x, ordem: i })) }));
  const mover = (i: number, d: number) => { const l = [...itens]; const j = i + d; if (j < 0 || j >= l.length) return; [l[i], l[j]] = [l[j], l[i]]; salvarItens(l); };
  // v0.9: treino novo, com exercícios e fora da agenda? Ao salvar, pergunta para qual dia (Hoje, Amanhã, Escolher).
  const naAgenda = Object.values(estado.agenda?.dias ?? {}).includes(rotina.id) || Object.values(estado.agenda?.semana ?? {}).includes(rotina.id);
  const salvar = () => {
    aplicar((e) => acoes.salvarRotina(e, { ...rotina, nome: nome.trim().slice(0, 60) || rotina.nome }));
    if (nova && itens.length > 0 && !naAgenda) setPerguntarDia(true); else router.back();
  };
  // v0.7: começar direto daqui (salva o nome antes) e recalcular os descansos pelo tipo de exercício e objetivo.
  const comecar = () => { aplicar((e) => acoes.salvarRotina(e, { ...rotina, nome: nome.trim().slice(0, 60) || rotina.nome })); iniciarTreino(aplicar, estado, rotina.id); };
  const recalcular = () => salvarItens(itens.map((i) => ({ ...i, descansoS: descansoEntreSeries(doCatalogo(i.exercicioId), estado.perfil?.treino) })));
  const min = tempoEstimadoTreino(itens);
  const ativa = estado.sessoes.find((x) => !x.finalizadaEm && !x.excluidoEm);
  // v0.8: treino do treinador é só leitura (a próxima sincronização traria a versão dele de volta). Dá para copiar.
  if (rotina.origem === 'treinador') {
    const copiar = () => {
      const c = { id: novoId(), nome: `${rotina.nome} (cópia)`.slice(0, 60), ordem: Math.max(0, ...estado.rotinas.map((r) => r.ordem)) + 1,
        itens: itens.map((i) => ({ ...i, id: novoId() })), atualizadoEm: new Date().toISOString() };
      aplicar((e) => acoes.salvarRotina(e, c));
      router.replace(`/rotina/${c.id}`);
    };
    return (
      <Tela titulo="Treino do seu treinador" voltar={router.back} rodape={
        <Botao grande titulo={ativa ? 'Continuar treino' : 'Começar este treino'} onPress={() => iniciarTreino(aplicar, estado, rotina.id)} desabilitado={itens.length === 0 || (!!ativa && ativa.rotinaId !== rotina.id)} testID="comecar-treino" />}>
        <Texto v="titulo-1">{rotina.nome}</Texto>
        <Texto suave>Enviado por {rotina.treinador ?? 'seu treinador'} · {itens.length} exercícios · ~{min} min</Texto>
        {rotina.observacoes ? <Cartao><Texto v="corpo-forte">Recado do treinador</Texto><Texto>{rotina.observacoes}</Texto></Cartao> : null}
        {itens.map((it, k) => (
          <Cartao key={it.id}>
            <Texto v="corpo-forte">{k + 1}. {ex.get(it.exercicioId)?.nome ?? 'Exercício'}</Texto>
            <Texto v="rotulo" suave>{it.seriesAlvo} séries × {it.repsAlvo ?? '–'} reps · descanso {it.descansoS}s</Texto>
            {it.obs ? <Texto v="rotulo">📝 {it.obs}</Texto> : null}
            <DemonstracaoExercicio exercicioId={it.exercicioId} nome={ex.get(it.exercicioId)?.nome ?? 'exercício'} />
          </Cartao>
        ))}
        <Texto v="rotulo" suave>Só o treinador muda este treino. Quer ajustar do seu jeito? Faça uma cópia.</Texto>
        <Botao v="secundario" titulo="Fazer uma cópia para editar" onPress={copiar} testID="copiar-treino" />
      </Tela>
    );
  }
  return (
    <Tela titulo={nova ? 'Novo treino' : 'Editar treino'} voltar={router.back} rodape={perguntarDia
      ? <DepoisDeAdicionar rotinaId={rotina.id} nome={nome.trim() || rotina.nome} aoConcluir={() => router.back()} />
      : <View style={{ flexDirection: 'row', gap: 12 }}>
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
