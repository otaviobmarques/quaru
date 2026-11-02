import { Redirect } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Aviso, Botao, Campo, Cartao, Chave, Esqueleto, Ficha, Tela, Texto, Toast } from '@/componentes/ui';

/**
 * Galeria de estados de interação (pedido da Lorena, P1-5). SÓ em desenvolvimento ou no build de capturas;
 * em build normal redireciona para o início.
 */
export default function Estados() {
  const [chave, setChave] = useState(true);
  if (!(__DEV__ || process.env.EXPO_PUBLIC_CAPTURAS === '1')) return <Redirect href="/" />;
  const nada = () => {};
  return (
    <Tela titulo="Estados de interação">
      <Texto v="rotulo" suave>Galeria interna para revisão de design (não aparece para usuários).</Texto>
      <Cartao>
        <Texto v="corpo-forte">Botão principal</Texto>
        <Botao titulo="Normal" onPress={nada} />
        <Botao titulo="Pressionado" onPress={nada} forcarEstado="pressionado" />
        <Botao titulo="Foco (teclado)" onPress={nada} forcarEstado="foco" />
        <Botao titulo="Desabilitado" onPress={nada} desabilitado />
        <Botao titulo="Salvando" onPress={nada} carregando />
      </Cartao>
      <Cartao>
        <Texto v="corpo-forte">Botão secundário e destrutivo</Texto>
        <Botao v="secundario" titulo="Normal" onPress={nada} />
        <Botao v="secundario" titulo="Pressionado" onPress={nada} forcarEstado="pressionado" />
        <Botao v="secundario" titulo="Desabilitado" onPress={nada} desabilitado />
        <Botao v="destrutivo" titulo="Excluir" onPress={nada} />
      </Cartao>
      <Cartao>
        <Texto v="corpo-forte">Campos</Texto>
        <Campo rotulo="Normal" placeholder="78,5" />
        <Campo rotulo="Foco" placeholder="78,5" forcarFoco />
        <Campo rotulo="Erro" value="5" erro="Digite um peso entre 20 e 400 kg, como 78,5" />
        <Campo rotulo="Desabilitado" value="80" editable={false} style={{ opacity: 0.4 }} />
      </Cartao>
      <Cartao>
        <Texto v="corpo-forte">Chave e fichas</Texto>
        <Chave rotulo="Chave ligada/desligada" valor={chave} onChange={setChave} />
        <View style={{ flexDirection: 'row', gap: 8 }}><Ficha texto="Ativa" ativa onPress={nada} /><Ficha texto="Normal" onPress={nada} /></View>
      </Cartao>
      <Texto v="corpo-forte">Carregando (esqueleto)</Texto>
      <Esqueleto />
      <Aviso tom="erro" titulo="Erro" texto="Não foi possível salvar. Nada foi perdido: o registro continua no aparelho." />
      <Toast texto="Supino reto removido" acao="Desfazer" onAcao={nada} onFim={nada} fixo />
    </Tela>
  );
}
