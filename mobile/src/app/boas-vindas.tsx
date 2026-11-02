import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Animacao } from '@/componentes/animacao';
import { Ilustracao } from '@/componentes/ilustracoes';
import { IlustracaoTour, type NomeIlustracaoTour } from '@/componentes/ilustracao-tour';
import { Logo } from '@/componentes/logo';
import { MENSAGEM_ERRO, PerguntaTour, rascunhoDe, salvarPasso, type Rascunho } from '@/componentes/pergunta-tour';
import { Aviso, Botao, Selo, Tela, Texto } from '@/componentes/ui';
import { PASSOS_TOUR, type IdPassoTour } from '@/dominio/apresentacao';
import { acoes, temSaude, useEstado } from '@/estado/armazem';
import { raio, useCores } from '@/tema/tema';

/**
 * Tour guiado do primeiro acesso (v0.4.1). Explica Início, Treinos, Alimentação, Água e Perfil e, no caminho,
 * faz perguntas. Cada pergunta tem "Pular" (não grava nada); "Próximo" grava só aquela resposta.
 * "Sair do tour" encerra a qualquer momento. Reaberto pelo Perfil com ?rever=1. ?passo=N abre num passo (capturas).
 */
/** Ilustração do design v2.1 para cada passo do tour (as 11 do lote 1). Passos sem par usam a ilustração antiga. */
export const ILUSTRACAO_DO_PASSO: Partial<Record<IdPassoTour, NomeIlustracaoTour>> = {
  inicio: 'dias', objetivo: 'objetivo', experiencia: 'nivel', 'tempo-local': 'tempo', equipamentos: 'onde-treina', treinos: 'onde-treina', areas: 'areas-do-corpo',
  restricoes: 'lesoes', medidas: 'altura-e-peso', alimentacao: 'preferencia-alimentar', agua: 'lembretes', cidade: 'cidade-e-bairro',
};

export default function BoasVindas() {
  const { estado, aplicar } = useEstado();
  const c = useCores();
  const { rever, passo: p0 } = useLocalSearchParams<{ rever?: string; passo?: string }>();
  const TOTAL = PASSOS_TOUR.length;
  const [passo, setPasso] = useState(() => Math.min(TOTAL - 1, Math.max(0, (Number(p0) || 1) - 1)));
  const [r, setR] = useState<Rascunho>(() => rascunhoDe(estado));
  const [erro, setErro] = useState<string | null>(null);
  const atual = PASSOS_TOUR[passo];
  const ultimo = passo === TOTAL - 1;
  const ir = (n: number) => { setErro(null); if (n >= TOTAL) sair(); else setPasso(n); };
  const avancar = () => {
    if (atual.pergunta) {
      // Valida antes (o aplicar só registra o erro no console).
      try { salvarPasso(estado, atual.id, r); aplicar((e) => salvarPasso(e, atual.id, r)); } catch (x) { return setErro(MENSAGEM_ERRO[(x as Error).message] ?? 'Não deu para salvar.'); }
    }
    ir(passo + 1);
  };
  const sair = () => {
    if (rever === '1') { if (router.canGoBack?.()) router.back(); else router.replace('/perfil'); return; }
    aplicar(acoes.concluirApresentacao);
    router.replace('/inicio');
  };
  return (
    <Tela acaoTopo={<View style={{ flex: 1, alignItems: 'flex-end' }}><View style={{ width: 140 }}><Botao v="texto" titulo="Sair do tour" onPress={sair} testID="pular-apresentacao" /></View></View>}
      voltar={passo > 0 ? () => ir(passo - 1) : undefined} rotuloVoltar="Passo anterior"
      rodape={<View style={{ gap: 8 }}>
        <Botao grande titulo={ultimo ? (rever === '1' ? 'Fechar' : 'Começar a usar') : 'Próximo'} onPress={avancar} testID="proximo-passo" />
        {atual.pergunta && <Botao v="texto" titulo="Pular esta pergunta" onPress={() => ir(passo + 1)} testID="pular-pergunta" />}
      </View>}>
      <View style={{ gap: 16, marginTop: 8 }}>
        {passo === 0 && <View style={{ alignSelf: 'center' }}><Logo largura={200} /></View>}
        {ILUSTRACAO_DO_PASSO[atual.id] ? <IlustracaoTour nome={ILUSTRACAO_DO_PASSO[atual.id]!} largura={300} />
          : atual.ilustracao && <Ilustracao nome={atual.ilustracao} descricao={atual.descricao ?? atual.titulo} largura={passo === 0 ? 220 : 240} />}
        <View accessible accessibilityLabel={`Passo ${passo + 1} de ${TOTAL}`} style={{ height: 6, backgroundColor: c['superficie-2'], borderRadius: raio.pilula, overflow: 'hidden' }}>
          <View style={{ width: `${((passo + 1) / TOTAL) * 100}%`, height: 6, backgroundColor: c.primaria }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, alignItems: 'center' }}>
          <Animacao nome="tour-progresso" tamanho={32} />
          <Texto v="legenda" suave>{`PASSO ${passo + 1} DE ${TOTAL}`}</Texto>
          {atual.area && <Selo texto={`Área: ${atual.area}`} />}
        </View>
        <Texto v="titulo-1" style={{ textAlign: 'center' }}>{atual.titulo}</Texto>
        <Texto suave style={{ textAlign: 'center' }}>{atual.texto}</Texto>
        {atual.pergunta && <PerguntaTour id={atual.id} r={r} set={setR} saude={temSaude(estado)} />}
        {erro && <Aviso tom="erro" titulo="Não salvamos" texto={erro} />}
      </View>
    </Tela>
  );
}
