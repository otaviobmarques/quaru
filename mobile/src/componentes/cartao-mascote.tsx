import { useState } from 'react';
import { View } from 'react-native';

import { Mascote } from '@/componentes/mascote';
import { Botao, BotaoIcone, Campo, Cartao, Texto } from '@/componentes/ui';
import { hoje } from '@/dominio/agenda';
import { ehAniversario, idadeQueCompleta, lerAniversario, mascararAniversario } from '@/dominio/aniversario';
import { acoes, useEstado } from '@/estado/armazem';

const saudacao = (h: number) => (h < 5 ? 'Boa noite' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite');

/**
 * v0.9: o mascote no Início. Dá boas-vindas (e um recado do dia) e, no aniversário, os parabéns.
 * O X fecha até o dia seguinte; Perfil → Mascote no Início desliga de vez.
 * Sem aniversário informado, pergunta a data ali mesmo.
 */
export function CartaoMascote({ recado, agora = new Date() }: { recado: string; agora?: Date }) {
  const { estado, aplicar } = useEstado();
  const hojeDia = hoje(agora);
  const [txt, setTxt] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [perguntar, setPerguntar] = useState(true);
  if (estado.mascote?.desligado || estado.mascote?.fechadoEm === hojeDia) return null;
  const p = estado.perfil;
  const nome = p?.nome?.trim();
  const festa = ehAniversario(p?.aniversario, hojeDia);
  const idade = festa ? idadeQueCompleta(p?.aniversario, hojeDia) : null;
  const primeiraVez = !estado.sessoes.some((s) => !s.excluidoEm && !s.exemplo);
  const salvar = () => {
    const a = lerAniversario(txt, hojeDia);
    if (!a || a === 'invalido') { setErro('Digite dia e mês, como 05/11 (o ano é opcional: 05/11/1990).'); return; }
    setErro(null);
    aplicar((e) => acoes.atualizarPerfil(e, { aniversario: a }));
  };

  const titulo = festa ? `Feliz aniversário${nome ? `, ${nome}` : ''}! 🎉` : `${saudacao(agora.getHours())}${nome ? `, ${nome}` : ''}!`;
  const texto = festa
    ? `Hoje o dia é seu${idade ? `: ${idade} anos` : ''}! O Quaru deseja muita saúde e energia. Que tal um treino leve para comemorar?`
    : primeiraVez ? 'Que bom ter você aqui! Eu sou o Quaru, seu parceiro de treino. Vamos juntos, um treino de cada vez.' : recado;

  return (
    <Cartao>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }} testID={festa ? 'mascote-aniversario' : 'mascote-boas-vindas'}>
        <Mascote pose={festa ? 'festa' : 'oi'} tamanho={festa ? 104 : 88} />
        <View style={{ flex: 1, gap: 6 }}>
          <Texto v="titulo-3">{titulo}</Texto>
          <Texto v="rotulo" suave>{texto}</Texto>
        </View>
        <View style={{ alignSelf: 'flex-start' }}>
          <BotaoIcone rotulo="Fechar o mascote (volta amanhã)" onPress={() => aplicar((e) => acoes.fecharMascote(e, hojeDia))} testID="fechar-mascote"><Texto v="titulo-3" suave>✕</Texto></BotaoIcone>
        </View>
      </View>
      {!festa && !p?.aniversario && perguntar && (
        <View style={{ gap: 8 }} testID="perguntar-aniversario">
          <Texto v="corpo-forte">Quando é o seu aniversário? Quero te dar parabéns no dia.</Texto>
          <Campo rotulo="Dia e mês (ano opcional)" placeholder="05/11" value={txt} onChangeText={(t) => setTxt(mascararAniversario(t))} keyboardType="number-pad" maxLength={10} autoComplete="off" erro={erro ?? undefined} testID="mascote-campo-aniversario" />
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Botao titulo="Salvar" onPress={salvar} testID="mascote-salvar-aniversario" />
            <Botao v="texto" titulo="Agora não" onPress={() => setPerguntar(false)} />
          </View>
        </View>
      )}
    </Cartao>
  );
}
