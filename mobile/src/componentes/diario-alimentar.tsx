import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Botao, Cartao, Texto } from '@/componentes/ui';
import { AVALIACOES, doDia, type Avaliacao } from '@/dominio/diario';
import { MOMENTOS } from '@/dominio/refeicoes';
import { diaLocal } from '@/dominio/treino-de-hoje';
import { acoes, temSaude, useEstado } from '@/estado/armazem';
import { useCoresBase } from '@/tema/tema';

/**
 * "Como foi hoje?" (v0.5): para cada refeição, três opções (comi bem, mais ou menos, pulei). Tocar de novo desmarca.
 * Sem calorias nem alimentos: é só para a pessoa perceber o próprio padrão. Exige o consentimento de dados de saúde.
 */
export function DiarioDoDia() {
  const { estado, aplicar } = useEstado();
  const b = useCoresBase();
  const [agora] = useState(() => new Date().toISOString());
  const dia = diaLocal(agora);
  const hoje = doDia(estado.diario ?? [], dia);
  const feitas = hoje.filter((r) => r.avaliacao === 'bem').length;
  if (!temSaude(estado)) {
    return (
      <Cartao>
        <Texto v="corpo-forte">Como foi sua alimentação hoje?</Texto>
        <Texto v="rotulo" suave>Para marcar suas refeições, autorize dados de saúde. Fica só neste aparelho.</Texto>
        <Botao v="secundario" titulo="Abrir consentimentos" onPress={() => router.push('/consentimentos')} />
      </Cartao>
    );
  }
  const marcar = (momento: (typeof MOMENTOS)[number]['id'], a: Avaliacao) => {
    const atual = hoje.find((r) => r.momento === momento)?.avaliacao;
    aplicar((e) => acoes.marcarRefeicao(e, dia, momento, atual === a ? null : a));
  };
  return (
    <Cartao>
      <View testID="diario-alimentar" style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <Texto v="corpo-forte">Como foi hoje?</Texto>
          <Texto v="rotulo" suave>{feitas} de {MOMENTOS.length} refeições bem</Texto>
        </View>
        {MOMENTOS.map((m) => {
          const atual = hoje.find((r) => r.momento === m.id)?.avaliacao;
          return (
            <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <View style={{ flexGrow: 1, flexBasis: 100 }}><Texto v="rotulo" style={{ fontWeight: '600' }}>{m.nome}</Texto></View>
              <View style={{ flexDirection: 'row', gap: 6 }} accessibilityRole="radiogroup" accessibilityLabel={`${m.nome}: como foi`}>
                {AVALIACOES.map((a) => {
                  const sel = atual === a.id;
                  return (
                    <Pressable key={a.id} testID={`diario-${m.id}-${a.id}`} accessibilityRole="radio" accessibilityState={{ checked: sel }} accessibilityLabel={`${m.nome}: ${a.nome}`}
                      onPress={() => marcar(m.id, a.id)}
                      style={{ width: 52, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 999,
                        borderWidth: 1.5, borderColor: b.tinta, backgroundColor: sel ? b['acao-sobre-fundo'] : b.superficie }}>
                      <Text aria-hidden style={{ fontSize: 20 }}>{a.emoji}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
        <Texto v="legenda" suave>{AVALIACOES.map((a) => `${a.emoji} ${a.nome}`).join(' · ')}. Sem calorias: só um jeito rápido de perceber seu padrão. Fica só neste aparelho.</Texto>
      </View>
    </Cartao>
  );
}
