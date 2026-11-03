import { router } from 'expo-router';
import { useState } from 'react';

import { PADRAO_TREINO, SeletorAreas, SeletorObjetivo } from '@/componentes/seletor-objetivo';
import { Botao, Tela, Texto } from '@/componentes/ui';
import type { PerfilTreino } from '@/dominio/objetivo';
import { acoes, useEstado } from '@/estado/armazem';

/** Tela 12h – Objetivo, nível, dias e áreas (v0.4.1). Salvar só recalcula as sugestões; o plano atual fica. */
export default function ObjetivoTela() {
  const { estado, aplicar } = useEstado();
  const [v, setV] = useState<PerfilTreino>(estado.perfil?.treino ?? PADRAO_TREINO);
  return (
    <Tela titulo="Objetivo e foco" voltar={router.back}
      rodape={<Botao grande titulo="Salvar" testID="salvar-objetivo" onPress={() => { aplicar((e) => acoes.definirObjetivo(e, v)); router.back(); }} />}>
      <SeletorObjetivo valor={v} onChange={setV} />
      <SeletorAreas valor={v.areas ?? []} onChange={(areas) => setV({ ...v, areas })} />
      <Texto v="rotulo" suave>Mudar o objetivo atualiza as sugestões em “Recomendado para você”. Seus treinos atuais não são apagados.</Texto>
    </Tela>
  );
}
