import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { SeletorDia } from '@/componentes/treinos/seletor-dia';
import { Botao, Chave, Texto } from '@/componentes/ui';
import { amanhaDe, diaDaSemana, hoje, NOMES_DIA, planejadoPara, rotuloData } from '@/dominio/agenda';
import { acoes, useEstado } from '@/estado/armazem';
import { iniciarTreino } from '@/estado/treino';

export { proximasDatas, rotuloData } from '@/dominio/agenda';

/**
 * Depois de adicionar um treino (sugerido, novo ou o treino do dia salvo), pergunta para qual dia:
 * Hoje, Amanhã ou Escolher o dia (próximos 30 dias, com "repetir toda semana"). O treino entra na agenda.
 * Depois de agendado, "Reagendar" troca a data (v0.9). Também dá para começar na hora ou deixar sem data.
 */
export function DepoisDeAdicionar({ rotinaId, nome, aoConcluir }: { rotinaId: string; nome: string; aoConcluir?: () => void }) {
  const { estado, aplicar } = useEstado();
  const hojeDia = hoje();
  const [modo, setModo] = useState<'perguntar' | 'escolher' | 'agendado'>('perguntar');
  const [dia, setDia] = useState<string | null>(null);
  const [marcado, setMarcado] = useState<{ dia: string; repetir: boolean } | null>(null);
  const [repetir, setRepetir] = useState(false);
  const existe = (id: string) => estado.rotinas.some((r) => r.id === id && !r.excluidoEm);
  const ativa = estado.sessoes.find((s) => !s.finalizadaEm && !s.excluidoEm);
  const atual = dia ? planejadoPara(estado.agenda, dia, existe).valor : null;
  const nomeAtual = atual === 'descanso' ? 'Descanso' : atual && atual !== rotinaId ? estado.rotinas.find((r) => r.id === atual)?.nome : null;

  const agendar = (d: string, rep: boolean) => {
    aplicar((e) => {
      let x = e;
      if (marcado) x = marcado.repetir ? acoes.planejarDia(x, marcado.dia, null, true) : acoes.planejarDia(x, marcado.dia, null); // reagendar: tira da data antiga
      return acoes.planejarDia(x, d, rotinaId, rep);
    });
    setMarcado({ dia: d, repetir: rep }); setDia(d); setModo('agendado');
  };
  const comecar = <Botao v="texto" titulo={ativa ? 'Continuar treino em andamento' : 'Começar agora'} onPress={() => iniciarTreino(aplicar, estado, rotinaId)} testID={`comecar-agora-${rotinaId}`} />;

  if (modo === 'agendado' && marcado) return (
    <View style={{ gap: 8 }} testID={`agendado-${rotinaId}`}>
      <Texto v="corpo-forte">{`✓ ${nome} agendado: ${marcado.repetir ? `toda ${NOMES_DIA[diaDaSemana(marcado.dia)].toLowerCase()}` : rotuloData(marcado.dia, hojeDia).toLowerCase()}`}</Texto>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Botao v="secundario" titulo="Reagendar" onPress={() => { setRepetir(marcado.repetir); setModo('escolher'); }} testID={`reagendar-${rotinaId}`} />
        <Botao v="secundario" titulo="Ver agenda" onPress={() => router.navigate('/treinos?secao=agenda' as never)} testID={`ver-agenda-${rotinaId}`} />
      </View>
      {marcado.dia === hojeDia && comecar}
      {aoConcluir && <Botao titulo="Concluir" onPress={aoConcluir} testID="concluir-agenda" />}
    </View>
  );

  if (modo === 'escolher') return (
    <View style={{ gap: 10 }} testID={`agendar-${rotinaId}`}>
      <Texto v="corpo-forte">{marcado ? 'Para qual dia mudar?' : 'Escolha o dia'}</Texto>
      <SeletorDia hojeDia={hojeDia} valor={dia} onChange={setDia} />
      {nomeAtual && <Texto v="rotulo" suave>{`Nesse dia estava marcado: ${nomeAtual}. Vai trocar por ${nome}.`}</Texto>}
      {dia && <Chave rotulo={`Repetir toda ${NOMES_DIA[diaDaSemana(dia)].toLowerCase()}`} valor={repetir} onChange={setRepetir} testID={`repetir-${rotinaId}`} />}
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Botao titulo={marcado ? 'Reagendar' : 'Agendar'} desabilitado={!dia} onPress={() => dia && agendar(dia, repetir)} testID={`confirmar-agenda-${rotinaId}`} />
        <Botao v="texto" titulo="Voltar" onPress={() => setModo(marcado ? 'agendado' : 'perguntar')} />
      </View>
    </View>
  );

  return (
    <View style={{ gap: 8 }} testID={`depois-${rotinaId}`}>
      <Texto v="corpo-forte">{`✓ ${nome} está em Meus treinos. Para qual dia?`}</Texto>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Botao titulo="Hoje" onPress={() => agendar(hojeDia, false)} testID={`agendar-hoje-${rotinaId}`} />
        <Botao titulo="Amanhã" onPress={() => agendar(amanhaDe(hojeDia), false)} testID={`agendar-amanha-${rotinaId}`} />
        <Botao v="secundario" titulo="Escolher o dia" onPress={() => { setDia(null); setModo('escolher'); }} testID={`agendar-botao-${rotinaId}`} />
      </View>
      {comecar}
      <Botao v="texto" titulo="Deixar sem data" onPress={aoConcluir ?? (() => router.navigate('/treinos?secao=meus' as never))} testID={`sem-data-${rotinaId}`} />
    </View>
  );
}
