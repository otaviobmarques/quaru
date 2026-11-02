import { router } from 'expo-router';
import { Image, Pressable, View } from 'react-native';

import { Texto } from '@/componentes/ui';
import { midiaDoExercicio } from '@/dominio/midia-exercicios';
import { raio, useCores } from '@/tema/tema';

/**
 * Atalho para a demonstração de um exercício (v0.4.3): miniatura da mesma foto da Biblioteca (Free Exercise DB,
 * domínio público) e toque para o mesmo detalhe (/exercicio/[id]). Usado em Meus treinos (editar rotina) e no treino.
 * v0.4.4: a miniatura vem do catálogo; o detalhe mostra a animação (ADR-0020).
 */
export function DemonstracaoExercicio({ exercicioId, nome, tamanho = 56 }: { exercicioId: string; nome: string; tamanho?: number }) {
  const c = useCores();
  const img = { fonte: midiaDoExercicio(exercicioId).mini };
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Ver demonstração de ${nome}`} testID={`demonstracao-${exercicioId}`}
      onPress={() => router.push(`/exercicio/${exercicioId}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 }}>
      {img.fonte
        ? <Image source={img.fonte} accessibilityIgnoresInvertColors style={{ width: tamanho, height: (tamanho * 2) / 3, borderRadius: raio.pequeno, backgroundColor: c['superficie-2'] }} />
        : <View style={{ width: tamanho, height: (tamanho * 2) / 3, borderRadius: raio.pequeno, backgroundColor: c['superficie-2'], alignItems: 'center', justifyContent: 'center' }}><Texto v="legenda" suave>sem foto</Texto></View>}
      <Texto v="rotulo" cor={c['primaria-texto']}>Ver demonstração ›</Texto>
    </Pressable>
  );
}
