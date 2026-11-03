import { useState } from 'react';
import { View } from 'react-native';

import { Aviso, Botao, Cartao, Texto } from '@/componentes/ui';
import type { Convite } from '@/dominio/treinador';
import { acoes, useEstado } from '@/estado/armazem';
import { buscarDoTreinador, meusConvites, responderConvite } from '@/servicos/treinador';

/** O que o treinador vê, explicado antes de aceitar (mesmo texto no convite e no link). */
export function OQueOTreinadorVe() {
  return (
    <View style={{ gap: 4 }}>
      <Texto v="rotulo">• Os treinos que ele montar aparecem no seu app e na sua agenda.</Texto>
      <Texto v="rotulo">• Ele vê o seu e-mail.</Texto>
      <Texto v="rotulo">• Se você compartilhar a evolução, ele vê também o seu peso, os treinos que você fez (data, séries, volume e tempo) e a sua agenda. Nada de alimentação, água, lesões ou notas.</Texto>
      <Texto v="rotulo">• Dá para parar de compartilhar ou desvincular quando quiser, em Perfil.</Texto>
    </View>
  );
}

/**
 * v0.10: convite de um treinador pelo ID do aluno. A pessoa aceita (compartilhando ou não a evolução) ou recusa.
 * Aparece no Início e no Perfil enquanto houver convite.
 */
export function CartaoConvite({ c }: { c: Convite }) {
  const { aplicar } = useEstado();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const responder = async (aceitar: boolean, compartilhar: boolean) => {
    setEnviando(true); setErro(null);
    const r = await responderConvite(c.aluno_ref, aceitar, compartilhar);
    setEnviando(false);
    if (r === 'erro') { setErro('Não deu para responder agora. Confira a internet e tente de novo.'); return; }
    aplicar((e) => acoes.receberConvites(e, (e.convites ?? []).filter((x) => x.aluno_ref !== c.aluno_ref)));
    const [d, cv] = await Promise.all([buscarDoTreinador().catch(() => null), meusConvites().catch(() => null)]);
    if (d) aplicar((e) => acoes.receberTreinosDoTreinador(e, d.vinculos, d.treinos));
    if (cv) aplicar((e) => acoes.receberConvites(e, cv));
  };
  return (
    <Cartao destaque>
      <View style={{ gap: 10 }} testID={`convite-${c.aluno_ref}`}>
        <Texto v="legenda" suave>CONVITE DE TREINADOR</Texto>
        <Texto v="titulo-3">{`${c.treinador} quer ser seu treinador`}</Texto>
        <OQueOTreinadorVe />
        {erro && <Aviso tom="erro" titulo={erro} />}
        <Botao titulo="Aceitar e compartilhar minha evolução" carregando={enviando} onPress={() => responder(true, true)} testID={`aceitar-compartilhar-${c.aluno_ref}`} />
        <Botao v="secundario" titulo="Aceitar sem compartilhar" desabilitado={enviando} onPress={() => responder(true, false)} testID={`aceitar-${c.aluno_ref}`} />
        <Botao v="texto" titulo="Recusar" desabilitado={enviando} onPress={() => responder(false, false)} testID={`recusar-${c.aluno_ref}`} />
      </View>
    </Cartao>
  );
}
