import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { Adesivo, Aviso, Botao, BotaoIcone, Cartao, Ficha, Selo, Tela, Texto, SeloEnergia, Trilho } from '@/componentes/ui';
import { CreditoDomma } from '@/componentes/rodape-marca';
import { FotoPerfil } from '@/componentes/avatares';
import { IlustracaoTour } from '@/componentes/ilustracao-tour';
import { COMECE_AQUI } from '@/dominio/apresentacao';
import { precisaLembrarBackup } from '@/dominio/backup';
import { formatarMl, metaPadraoMl, totalDoDia } from '@/dominio/agua';
import { metricasPorSessao } from '@/dominio/consultas';
import { formatarKg } from '@/dominio/metricas';
import { cartaoTreinoDeHoje, semanaTreinos, sequenciaDias, treinosUltimos7Dias } from '@/dominio/treino-de-hoje';
import { agoraIso } from '@/servicos/relogio';
import { acoes, temExemplo as temExemploLocal, useEstado } from '@/estado/armazem';
import { useContornoInterno, useCores, useCoresBase } from '@/tema/tema';
import { CartaoModelo } from '@/componentes/cartao-modelo';
import { DICA_EMAGRECER, OBJETIVOS, } from '@/dominio/objetivo';
import { recomendarPara } from '@/dominio/tour';
import { equipamentosDoPerfil, modeloAdaptado } from '@/dominio/equipamentos';
import { rotinaDoModelo } from '@/dominio/treinos-sugeridos';
import { novoId } from '@/servicos/id';
import { iniciarTreino } from '@/estado/treino';

/** Tela 3 – Início com o cartão "Treino de hoje" (regra L1, telas 03/03c/03d/03e). */
export default function Inicio() {
  const { estado, aplicar } = useEstado();
  const [escolher, setEscolher] = useState(false);
  const [agora] = useState(agoraIso);
  const cartao = cartaoTreinoDeHoje(estado.rotinas, estado.sessoes, agora);
  const rotinas = estado.rotinas.filter((r) => !r.excluidoEm).toSorted((a, b) => a.ordem - b.ordem);
  const nome = (id: string | null) => rotinas.find((r) => r.id === id)?.nome ?? 'Treino livre';
  const pesoAtual = estado.pesos.filter((p) => !p.excluidoEm).toSorted((a, b) => (a.medidoEm < b.medidoEm ? -1 : 1)).at(-1);
  const semana = treinosUltimos7Dias(estado.sessoes, agora);
  const c = useCores();
  const b = useCoresBase();
  const contorno = useContornoInterno();
  const seq = sequenciaDias(estado.sessoes, agora);
  const dias7 = semanaTreinos(estado.sessoes, agora);
  const nomePessoa = estado.perfil?.nome;
  const aguaHoje = totalDoDia(estado.agua ?? [], agora);
  const metaAgua = estado.perfil?.metaAguaMl ?? metaPadraoMl(pesoAtual?.pesoKg);
  const vazio = rotinas.length === 0;
  const perfilTreino = estado.perfil?.treino;
  const rec = perfilTreino ? recomendarPara(perfilTreino, estado.perfil ?? {}) : null;
  const recomendados = rec?.modelos ?? [];
  const [adicionados, setAdicionados] = useState<string[]>([]);

  let principal = null;
  let conteudo = null;
  if (cartao.estado === 'continuar') {
    conteudo = <><Selo texto="● Em andamento" tom="primaria" /><Texto v="titulo-2">{nome(cartao.sessao.rotinaId)}</Texto><Texto suave>Seu treino continua de onde parou.</Texto></>;
    principal = <Botao grande titulo="Continuar treino" onPress={() => router.push('/treino')} testID="continuar-treino" />;
  } else if (cartao.estado === 'feito') {
    const m = metricasPorSessao(estado, cartao.sessao.id);
    conteudo = <><Selo texto="✓ Feito hoje" tom="sucesso" /><Texto v="titulo-2">Treino de hoje feito</Texto><Texto suave>{nome(cartao.sessao.rotinaId)} · {m.series} séries · {formatarKg(m.volume)} kg de volume</Texto>
      {cartao.proxima && <Botao v="secundario" titulo="Treinar de novo" onPress={() => iniciarTreino(aplicar, estado, cartao.proxima!.id)} />}</>;
    principal = <Botao grande titulo="Ver resumo" onPress={() => router.push(`/resumo/${cartao.sessao.id}`)} />;
  } else if (cartao.estado === 'proxima') {
    conteudo = <><View style={{ flexDirection: 'row', alignItems: 'flex-start' }}><View style={{ flex: 1, gap: 4 }}><Texto v="legenda" suave>TREINO DE HOJE · PRÓXIMO DA SEQUÊNCIA</Texto><Texto v="titulo-2">{cartao.rotina.nome}</Texto></View>
      <BotaoIcone rotulo="Mais opções do treino de hoje" onPress={() => setEscolher(!escolher)}><Texto v="titulo-3">⋮</Texto></BotaoIcone></View><Texto suave>{cartao.rotina.itens.length} exercícios</Texto>
      <Botao v="texto" titulo={escolher ? 'Fechar' : 'Escolher outra'} onPress={() => setEscolher(!escolher)} />
      {escolher && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{rotinas.map((r) => <Ficha key={r.id} texto={r.nome} onPress={() => iniciarTreino(aplicar, estado, r.id)} />)}<Ficha texto="Treino livre" onPress={() => iniciarTreino(aplicar, estado, null)} /></View>}</>;
    principal = <Botao grande titulo="Iniciar treino" onPress={() => iniciarTreino(aplicar, estado, cartao.rotina.id)} testID="iniciar-treino" />;
  } else {
    // v0.4.1: estado vazio ilustrado com "Comece aqui" (1, 2, 3).
    conteudo = <><SeloEnergia texto="Comece aqui" /><IlustracaoTour nome="dias" largura={280} />
      <Texto v="titulo-3">Você ainda não tem rotinas</Texto><Texto suave>Comece aqui, em três passos:</Texto>
      <View accessibilityRole="list" style={{ gap: 12 }}>
        {COMECE_AQUI.map((p, i) => (
          <View key={i} accessible accessibilityLabel={`Passo ${i + 1}: ${p.titulo}. ${p.texto}`} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c['primaria-suave'], alignItems: 'center', justifyContent: 'center' }}><Texto v="corpo-forte" cor={c['primaria-texto']}>{i + 1}</Texto></View>
            <View style={{ flex: 1 }}><Texto v="corpo-forte">{p.titulo}</Texto><Texto v="rotulo" suave>{p.texto}</Texto></View>
          </View>
        ))}
      </View>
      <Botao v="secundario" titulo="Treino livre" onPress={() => iniciarTreino(aplicar, estado, null)} /></>;
    principal = <Botao grande titulo="Criar primeira rotina" onPress={() => router.push('/rotina/nova')} testID="criar-rotina" />;
  }

  const temDados = estado.sessoes.some((x) => !x.excluidoEm && !x.exemplo && x.finalizadaEm) || estado.pesos.some((p) => !p.excluidoEm && !p.exemplo) || (estado.agua ?? []).length > 0;
  const lembrarBackup = precisaLembrarBackup({ temDados, ultimaExportacaoEm: estado.ultimaExportacaoEm, lembreteBackupAdiadoEm: estado.lembreteBackupAdiadoEm, agora });
  const LETRAS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  return (
    <Tela logo titulo={nomePessoa ? `Olá, ${nomePessoa}` : 'Olá!'}
      acaoTopo={<Pressable accessibilityRole="button" accessibilityLabel="Abrir o perfil" onPress={() => router.push('/perfil')} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
        <FotoPerfil avatar={estado.perfil?.avatar} tamanho={40} />
      </Pressable>}>
      {lembrarBackup && (
        <Aviso tom="alerta" titulo="Faça uma cópia dos seus dados" texto={Platform.OS === 'web' ? 'Na versão web, seus treinos ficam só neste navegador. Se ele for limpo, tudo se perde. Exporte uma cópia de vez em quando.' : 'Exporte uma cópia dos seus treinos de vez em quando, para não perder nada se trocar de aparelho.'}>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
            <Botao v="secundario" titulo="Exportar agora" onPress={() => router.push('/exportar')} testID="lembrete-exportar" />
            <Botao v="texto" titulo="Agora não" onPress={() => aplicar(acoes.adiarLembreteBackup)} testID="lembrete-adiar" />
          </View>
        </Aviso>
      )}
      <Adesivo texto={cartao.estado === 'feito' ? 'Mandou bem hoje!' : 'Bora treinar hoje?'} />

      {!perfilTreino && (
        <Cartao>
          <SeloEnergia texto="Comece aqui" />
          <Texto v="titulo-1">Seu treino sob medida em 2 minutos</Texto>
          <Texto suave>Responda perguntas rápidas sobre objetivo, rotina e preferências. Todas podem ser puladas.</Texto>
          <View style={{ alignItems: 'center', marginHorizontal: -16, backgroundColor: b['primaria-suave'] }}><IlustracaoTour nome="objetivo" largura={260} /></View>
          <Botao grande titulo="Começar o tour" onPress={() => router.push('/boas-vindas?rever=1')} testID="comecar-tour" />
        </Cartao>
      )}

      <Cartao rotulo={`Sequência de ${seq.dias} ${seq.dias === 1 ? 'dia' : 'dias'}`} onPress={() => router.push('/historico')}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }} testID="sequencia">
          <Texto v="titulo-2">🔥</Texto>
          <View style={{ flex: 1 }}>
            <Texto v="corpo-forte">{seq.dias === 0 ? 'Comece uma sequência hoje' : `Sequência de ${seq.dias} ${seq.dias === 1 ? 'dia' : 'dias'}`}</Texto>
            <Texto v="rotulo" suave>{seq.hoje ? 'Treino de hoje garantido.' : seq.dias > 0 ? `Treine hoje para chegar a ${seq.dias + 1}.` : 'Cada dia seguido com treino conta.'}{temExemploLocal(estado) ? ' Dado de exemplo.' : ''}</Texto>
          </View>
          {seq.hoje && <Selo texto="+1 hoje" tom="primaria" />}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }} accessibilityLabel={`Últimos 7 dias: ${semana} ${semana === 1 ? 'treino' : 'treinos'}`} testID="semana">
          {dias7.map((d) => {
            const dow = new Date(`${d.dia}T12:00:00Z`).getUTCDay();
            return (
              <View key={d.dia} style={{ alignItems: 'center', gap: 4 }} aria-hidden>
                <Texto v="legenda" suave>{LETRAS[dow]}</Texto>
                <View style={{ width: 30, height: 30, borderRadius: 15, borderWidth: d.hoje ? 2 : 1.5, borderColor: contorno, backgroundColor: d.feito ? b.primaria : b.superficie, alignItems: 'center', justifyContent: 'center' }}>
                  {d.feito && <Texto v="legenda" cor={b['sobre-primaria']}>✓</Texto>}
                </View>
              </View>
            );
          })}
        </View>
      </Cartao>

      <Cartao destaque>{conteudo}{principal}</Cartao>
      {vazio && (
        <Cartao onPress={() => router.push('/treinos-sugeridos')}>
          <Texto v="titulo-3">Não sabe por onde começar?</Texto>
          <Texto suave>Escolha um treino sugerido (iniciante ou intermediário) e adicione ao seu plano com um toque.</Texto>
          <Texto v="corpo-forte" cor={b['primaria-texto']}>Ver treinos sugeridos ›</Texto>
        </Cartao>
      )}
      {perfilTreino && (
        <View style={{ gap: 12 }} testID="recomendado">
          <Texto v="titulo-3">Recomendado para você</Texto>
          <Texto v="rotulo" suave>{OBJETIVOS.find((o) => o.id === perfilTreino.objetivo)?.nome} · {perfilTreino.dias} dias por semana · mude em Perfil → Objetivo e foco.</Texto>
          {rec?.avisos.map((a) => <Aviso key={a} tom="alerta" titulo="Atenção" texto={a} />)}
          {perfilTreino.objetivo === 'emagrecer' && <Cartao><Texto v="corpo-forte">Dica</Texto><Texto v="rotulo" suave>{DICA_EMAGRECER}</Texto></Cartao>}
          {recomendados.map((m) => adicionados.includes(m.id)
            ? <Cartao key={m.id}><Texto v="corpo-forte">{m.nome}: adicionado ao seu plano ✓</Texto></Cartao>
            : <CartaoModelo key={m.id} m={m} tem={equipamentosDoPerfil(estado.perfil)} onAdicionar={() => {
              const ordem = Math.max(0, ...rotinas.map((r) => r.ordem)) + 1;
              aplicar((e) => acoes.salvarRotina(e, rotinaDoModelo(equipamentosDoPerfil(estado.perfil) ? modeloAdaptado(m, equipamentosDoPerfil(estado.perfil)!) : m, ordem, novoId, new Date().toISOString())));
              setAdicionados((l) => [...l, m.id]);
            }} />)}
        </View>
      )}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}><Cartao rotulo="Peso" onPress={() => router.push('/peso')}><Texto v="legenda" suave>PESO</Texto><Texto v="titulo-2">{pesoAtual ? `${formatarKg(pesoAtual.pesoKg)} kg` : '–'}</Texto><Texto v="rotulo" suave>{pesoAtual ? 'Ver gráfico ›' : 'Registrar ›'}</Texto></Cartao></View>
        <View style={{ flex: 1 }}><Cartao rotulo="Água hoje" onPress={() => router.push('/agua')}><Texto v="legenda" suave>ÁGUA HOJE</Texto>
          <Texto v="titulo-2">{formatarMl(aguaHoje)}</Texto>
          {metaAgua ? <Trilho valor={aguaHoje / metaAgua} rotulo={`Água de hoje: ${formatarMl(aguaHoje)} de ${formatarMl(metaAgua)}`} /> : null}
          <Texto v="rotulo" suave>{metaAgua ? `de ${formatarMl(metaAgua)}` : 'Registrar ›'}</Texto></Cartao></View>
      </View>
      {estado.fila.length > 0 && <Texto v="legenda" suave>{estado.fila.length} registros guardados no aparelho, aguardando sincronização (servidor ainda não configurado).</Texto>}
      <CreditoDomma />
    </Tela>
  );
}
