import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Aviso, Botao, Campo, Cartao, EstadoVazio, Tela, Texto } from '@/componentes/ui';
import type { ItemFila } from '@/dominio/sincronizacao';
import { nomeVazio } from '@/dominio/validacao';
import { acoes, useEstado } from '@/estado/armazem';

const NOME_TABELA: Record<ItemFila['tabela'], string> = {
  rotinas: 'Rotina', exercicios: 'Exercício', sessoes_treino: 'Treino', series: 'Série', pesos_corporais: 'Peso',
};

/** Itens da fila de sincronização que o servidor recusou: corrigir (quando há nome) ou descartar. */
export default function Fila() {
  const { estado, aplicar } = useEstado();
  const comErro = estado.fila.filter((i) => i.erro);
  return (
    <Tela titulo="Itens com erro" voltar={() => router.back()}>
      <Texto suave>Estes registros não foram aceitos na sincronização. Corrija o que der ou descarte o envio. Descartar não apaga o dado deste aparelho.</Texto>
      {comErro.length === 0
        ? <EstadoVazio icone="✓" titulo="Nenhum item com erro" texto="Tudo o que está na fila pode ser enviado." />
        : comErro.map((i) => <Item key={i.registro.id} item={i} onCorrigir={(nome) => aplicar((e) => acoes.corrigirNomeItemFila(e, i.registro.id, nome))} onDescartar={() => aplicar((e) => acoes.descartarItemFila(e, i.registro.id))} />)}
    </Tela>
  );
}

function Item({ item, onCorrigir, onDescartar }: { item: ItemFila; onCorrigir: (nome: string) => void; onDescartar: () => void }) {
  const nomeAtual = typeof item.registro.nome === 'string' ? item.registro.nome : null;
  const [nome, setNome] = useState(nomeAtual ?? '');
  const [confirmar, setConfirmar] = useState(false);
  const invalido = nomeAtual != null && (nomeVazio(nome) || nome.length > 60);
  const rotulo = `${NOME_TABELA[item.tabela]}${nomeAtual ? `: ${nomeAtual.slice(0, 40)}${nomeAtual.length > 40 ? '…' : ''}` : ''}`;
  return (
    <Cartao>
      <Texto v="corpo-forte">{rotulo}</Texto>
      <Aviso tom="erro" titulo="Motivo" texto={item.erro ?? ''} />
      {nomeAtual != null && (
        <>
          <Campo rotulo="Nome corrigido (1 a 60 caracteres)" value={nome} onChangeText={setNome}
            erro={invalido ? 'Use de 1 a 60 caracteres, sem ser só espaços.' : undefined} accessibilityLabel={`Nome corrigido, ${rotulo}`} />
          <Botao titulo="Salvar correção" desabilitado={invalido} onPress={() => onCorrigir(nome)} />
        </>
      )}
      {confirmar ? (
        <View style={{ gap: 8 }}>
          <Texto>Descartar o envio deste item?</Texto>
          <Botao v="destrutivo" titulo="Descartar" onPress={onDescartar} />
          <Botao v="texto" titulo="Cancelar" onPress={() => setConfirmar(false)} />
        </View>
      ) : <Botao v="secundario" titulo="Descartar envio" onPress={() => setConfirmar(true)} />}
    </Cartao>
  );
}
