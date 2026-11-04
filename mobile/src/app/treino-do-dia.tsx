import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { DemonstracaoExercicio } from '@/componentes/demonstracao-exercicio';
import { Aviso, Botao, Cartao, Segmentado, Selo, Tela, Texto } from '@/componentes/ui';
import { formatarDuracao, gerarCardio } from '@/dominio/cardio';
import { equipamentosDoPerfil } from '@/dominio/equipamentos';
import { AVISO_RESTRICAO } from '@/dominio/tour';
import { comoItensRotina, gerarTreinoDoDia } from '@/dominio/treino-do-dia';
import { AVISO_TREINO } from '@/dominio/treinos-sugeridos';
import { acoes, useEstado } from '@/estado/armazem';
import { iniciarTreino } from '@/estado/treino';
import { DepoisDeAdicionar } from '@/componentes/treinos/depois-de-adicionar';
import { novoId } from '@/servicos/id';

const tempo = (s: number) => (s >= 60 ? `${Math.floor(s / 60)} min${s % 60 ? ` ${s % 60} s` : ''}` : `${s} s`);

/**
 * Treino do dia (v0.7): o app monta um treino para hoje (dominio/treino-do-dia.ts) com nível, objetivo,
 * equipamento, tempo, lesões e o último treino. "Começar agora" grava como o treino do dia (só existe um) e inicia;
 * "Salvar em Meus treinos" guarda uma cópia fixa; "Outra sugestão" troca os exercícios.
 */
export default function TreinoDoDia() {
  const { estado, aplicar } = useEstado();
  const [variacao, setVariacao] = useState(0);
  const [salvo, setSalvo] = useState<{ id: string; nome: string } | null>(null);
  const [agora] = useState(() => new Date().toISOString());
  const p = estado.perfil;
  const { tipo: tipo0 } = useLocalSearchParams<{ tipo?: string }>();
  const [tipo, setTipo] = useState<'forca' | 'cardio'>(tipo0 === 'cardio' ? 'cardio' : 'forca');
  // v0.11: também sugere cardio (contínuo ou intervalado, pelo nível, equipamento, tempo e lesões).
  const t = tipo === 'cardio'
    ? gerarCardio({ treino: p?.treino, tem: equipamentosDoPerfil(p), tempoMin: p?.tempoTreinoMin, restricoes: p?.restricoes ?? [], variacao })
    : gerarTreinoDoDia({ treino: p?.treino, tem: equipamentosDoPerfil(p), tempoMin: p?.tempoTreinoMin, restricoes: p?.restricoes ?? [],
      sessoes: estado.sessoes, series: estado.series, agora, variacao });
  const ativa = estado.sessoes.find((s) => !s.finalizadaEm && !s.excluidoEm);
  const montar = (nome: string) => ({ id: novoId(), nome, ordem: Math.max(0, ...estado.rotinas.filter((r) => !r.excluidoEm).map((r) => r.ordem)) + 1,
    itens: comoItensRotina(t.itens, novoId), atualizadoEm: new Date().toISOString() });
  const comecar = () => {
    const r = montar(t.titulo);
    aplicar((e) => acoes.salvarTreinoDoDia(e, r));
    iniciarTreino(aplicar, estado, r.id);
  };
  const salvar = () => {
    const dia = new Date(agora).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const r = montar(`${t.titulo.replace('Treino do dia · ', '').replace('Cardio do dia · ', 'Cardio ')} (${dia})`);
    aplicar((e) => acoes.salvarRotina(e, r));
    setSalvo({ id: r.id, nome: r.nome });
  };
  return (
    <Tela titulo="Treino do dia" voltar={router.back} rodape={
      <View style={{ gap: 8 }}>
        <Botao grande titulo={ativa ? 'Você já tem um treino em andamento' : 'Começar agora'} onPress={comecar} desabilitado={!!ativa || t.itens.length === 0} testID="comecar-treino-do-dia" />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Botao flex v="secundario" titulo="Outra sugestão" onPress={() => setVariacao((v) => v + 1)} testID="outra-sugestao" />
          <Botao flex v="secundario" titulo="Salvar em Meus treinos" onPress={salvar} testID="salvar-treino-do-dia" />
        </View>
      </View>}>
      <Segmentado opcoes={[{ valor: 'forca', rotulo: 'Musculação' }, { valor: 'cardio', rotulo: 'Cardio' }]} valor={tipo} onChange={(v) => { setTipo(v); setVariacao(0); setSalvo(null); }} />
      <Texto v="titulo-1">{t.titulo.replace('Treino do dia · ', '').replace('Cardio do dia · ', 'Cardio ')}</Texto>
      <Texto suave>{t.motivo}</Texto>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Selo texto={`${t.itens.length} exercícios`} tom="secundaria" />
        <Selo texto={`⏱ ~${t.minutos} min`} tom="secundaria" />
        <Selo texto={p?.treino ? `Nível ${p.treino.nivel === 'iniciante' ? 'iniciante' : p.treino.nivel === 'intermediario' ? 'intermediário' : 'avançado'}` : 'Começando do zero'} tom="primaria" />
      </View>
      {!p?.treino && (
        <Cartao rotulo="Personalizar: responder o tour" onPress={() => router.push('/boas-vindas?rever=1')}>
          <Texto v="corpo-forte">Quer um treino mais a sua cara?</Texto>
          <Texto v="rotulo" suave>Responda o tour (2 minutos): objetivo, nível, onde treina e quanto tempo tem. O treino do dia passa a usar isso.</Texto>
        </Cartao>
      )}
      {(p?.restricoes?.length ?? 0) > 0 && <Aviso tom="alerta" titulo="Você informou uma restrição" texto={`Tiramos os exercícios de mais carga na região. ${AVISO_RESTRICAO}`} />}
      {t.itens.map((i, k) => (
        <Cartao key={i.exercicioId}>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'baseline' }}>
            <Texto v="titulo-3">{k + 1}.</Texto>
            <View style={{ flex: 1, gap: 2 }}>
              <Texto v="corpo-forte">{i.nome}</Texto>
              {i.duracaoS
                ? <Texto v="rotulo" suave>{i.seriesAlvo > 1 ? `${i.seriesAlvo} × ${formatarDuracao(i.duracaoS)} · recuperação ${tempo(i.descansoS)}` : formatarDuracao(i.duracaoS)}{i.papel ? ` · ${i.papel}` : ''}</Texto>
                : <Texto v="rotulo" suave>{i.seriesAlvo} séries × {i.repsAlvo ?? 'tempo'}{i.repsAlvo ? ' repetições' : ''} · descanso {tempo(i.descansoS)}</Texto>}
            </View>
          </View>
          <DemonstracaoExercicio exercicioId={i.exercicioId} nome={i.nome} />
        </Cartao>
      ))}
      {t.itens.length === 0 && <Aviso tom="alerta" titulo="Não deu para montar um treino" texto="Com o equipamento e as restrições informadas, faltaram opções. Ajuste em Perfil → Meus dados." />}
      <Aviso tom="alerta" titulo="Antes de começar" texto={AVISO_TREINO} />
      {salvo && <Cartao destaque><DepoisDeAdicionar rotinaId={salvo.id} nome={salvo.nome} /></Cartao>}
    </Tela>
  );
}
