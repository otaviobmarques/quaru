import { router } from 'expo-router';
import { useState } from 'react';
import { Platform } from 'react-native';

import { Aviso, Botao, Cartao, Tela, Texto } from '@/componentes/ui';
import { NOVIDADES, VERSAO_NOVIDADES } from '@/config/novidades-gerado';
import { marca } from '@/config/marca';
import { aplicarAtualizacao, suportaAtualizacao, verificarAtualizacao, type EstadoAtualizacao } from '@/servicos/atualizacao';

const TEXTO: Record<EstadoAtualizacao, string> = {
  indisponivel: 'Este navegador não permite verificar atualizações. Recarregue a página para buscar a versão nova.',
  atualizado: 'Você está na versão mais recente.',
  verificando: 'Verificando…',
  'nova-versao': 'Há uma versão nova pronta.',
  erro: 'Não deu para verificar agora. Confira a internet e tente de novo.',
};

/** Tela 12i – Atualizações e "O que há de novo" (v0.4.1). No Android: só a versão (ADR-0015). */
export default function Atualizacao() {
  const [estado, setEstado] = useState<EstadoAtualizacao | null>(null);
  const web = Platform.OS === 'web';
  return (
    <Tela titulo="Atualizações" voltar={router.back}>
      <Cartao>
        <Texto v="legenda" suave>VERSÃO INSTALADA</Texto>
        <Texto v="titulo-2" >{marca.versao}</Texto>
        {web ? (<>
          <Botao v="secundario" titulo="Verificar atualizações" carregando={estado === 'verificando'} testID="verificar-atualizacoes"
            onPress={async () => { setEstado('verificando'); setEstado(await verificarAtualizacao()); }} />
          {estado && estado !== 'verificando' && <Texto v="rotulo" suave>{suportaAtualizacao ? TEXTO[estado] : TEXTO.indisponivel}</Texto>}
          {estado === 'nova-versao' && <Botao titulo="Atualizar agora" onPress={aplicarAtualizacao} testID="atualizar-agora-perfil" />}
        </>) : <Texto v="rotulo" suave>No Android, as atualizações chegam pela loja de aplicativos. Atualização dentro do app virá numa versão futura.</Texto>}
      </Cartao>
      {web && <Aviso tom="secundaria" titulo="Seus dados ficam" texto="Atualizar não apaga treinos, pesos nem configurações deste navegador." />}
      <Texto v="titulo-3">O que há de novo na {VERSAO_NOVIDADES}</Texto>
      <Cartao>{NOVIDADES.map((l, i) => l.startsWith('### ') ? <Texto key={i} v="corpo-forte">{l.slice(4)}</Texto> : <Texto key={i} v="rotulo">{l.replace(/^- /, '• ')}</Texto>)}</Cartao>
    </Tela>
  );
}
