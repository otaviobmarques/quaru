import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Botao, Chave, FaixaFichas, Ficha, Texto } from '@/componentes/ui';
import { diaDaSemana, hoje, NOMES_DIA, planejadoPara, SIGLAS_DIA } from '@/dominio/agenda';
import { acoes, useEstado } from '@/estado/armazem';
import { iniciarTreino } from '@/estado/treino';

const DIAS_PARA_ESCOLHER = 14;
const dm = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

/** As próximas `n` datas a partir de `inicio` (AAAA-MM-DD). */
export function proximasDatas(inicio: string, n = DIAS_PARA_ESCOLHER): string[] {
  const d = new Date(`${inicio}T12:00:00Z`);
  return Array.from({ length: n }, (_, i) => { const x = new Date(d); x.setUTCDate(d.getUTCDate() + i); return x.toISOString().slice(0, 10); });
}

export function rotuloData(dia: string, hojeDia: string): string {
  const [amanha] = proximasDatas(hojeDia, 2).slice(1);
  if (dia === hojeDia) return 'Hoje';
  if (dia === amanha) return 'Amanhã';
  return `${SIGLAS_DIA[diaDaSemana(dia)]} ${dm(dia)}`;
}

/**
 * v0.8.1: depois de adicionar um treino sugerido, o cartão pergunta o que fazer com ele:
 * começar agora (abre o treino na hora) ou agendar numa data (entra na agenda, com opção de repetir toda semana).
 */
export function DepoisDeAdicionar({ rotinaId, nome }: { rotinaId: string; nome: string }) {
  const { estado, aplicar } = useEstado();
  const hojeDia = hoje();
  const [modo, setModo] = useState<'perguntar' | 'agendar' | 'agendado'>('perguntar');
  const [dia, setDia] = useState(hojeDia);
  const [repetir, setRepetir] = useState(false);
  const existe = (id: string) => estado.rotinas.some((r) => r.id === id && !r.excluidoEm);
  const ativa = estado.sessoes.find((s) => !s.finalizadaEm && !s.excluidoEm);
  const atual = planejadoPara(estado.agenda, dia, existe).valor;
  const nomeAtual = atual === 'descanso' ? 'Descanso' : atual && atual !== rotinaId ? estado.rotinas.find((r) => r.id === atual)?.nome : null;

  if (modo === 'agendado') return (
    <View style={{ gap: 8 }} testID={`agendado-${rotinaId}`}>
      <Texto v="corpo-forte">{`✓ ${nome} agendado: ${repetir ? `toda ${NOMES_DIA[diaDaSemana(dia)].toLowerCase()}` : rotuloData(dia, hojeDia).toLowerCase()}`}</Texto>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Botao v="secundario" titulo="Ver agenda" onPress={() => router.navigate('/treinos?secao=agenda' as never)} testID={`ver-agenda-${rotinaId}`} />
        {dia === hojeDia && <Botao titulo="Começar agora" onPress={() => iniciarTreino(aplicar, estado, rotinaId)} />}
      </View>
    </View>
  );

  if (modo === 'agendar') return (
    <View style={{ gap: 10 }} testID={`agendar-${rotinaId}`}>
      <Texto v="corpo-forte">Em que dia?</Texto>
      <FaixaFichas rolar>
        {proximasDatas(hojeDia).map((d) => <Ficha key={d} texto={rotuloData(d, hojeDia)} ativa={d === dia} onPress={() => setDia(d)} />)}
      </FaixaFichas>
      {nomeAtual && <Texto v="rotulo" suave>{`Nesse dia estava marcado: ${nomeAtual}. Vai trocar por ${nome}.`}</Texto>}
      <Chave rotulo={`Repetir toda ${NOMES_DIA[diaDaSemana(dia)].toLowerCase()}`} valor={repetir} onChange={setRepetir} testID={`repetir-${rotinaId}`} />
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Botao titulo="Agendar" onPress={() => { aplicar((e) => acoes.planejarDia(e, dia, rotinaId, repetir)); setModo('agendado'); }} testID={`confirmar-agenda-${rotinaId}`} />
        <Botao v="texto" titulo="Voltar" onPress={() => setModo('perguntar')} />
      </View>
    </View>
  );

  return (
    <View style={{ gap: 8 }} testID={`depois-${rotinaId}`}>
      <Texto v="corpo-forte">{`✓ ${nome} está em Meus treinos. E agora?`}</Texto>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Botao titulo={ativa ? 'Continuar treino em andamento' : 'Começar agora'} onPress={() => iniciarTreino(aplicar, estado, rotinaId)} testID={`comecar-agora-${rotinaId}`} />
        <Botao v="secundario" titulo="Agendar" onPress={() => setModo('agendar')} testID={`agendar-botao-${rotinaId}`} />
      </View>
      <Botao v="texto" titulo="Ver em Meus treinos" onPress={() => router.navigate('/treinos?secao=meus' as never)} />
    </View>
  );
}
