import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useColorScheme, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { FolhaApagar } from '@/componentes/folha-apagar';
import { Aviso, Botao, Cartao, Tela, Texto } from '@/componentes/ui';
import { ILUSTRACAO_SAIR } from '@/config/ilustracoes-r2-gerado';
import { acoes, useEstado } from '@/estado/armazem';
import { cancelarDescanso } from '@/servicos/notificacao';
import { encerrarSessaoRemota } from '@/servicos/sessao';
import { useCores } from '@/tema/tema';

export const TEXTO_SAIR = "Seus treinos e dados continuam salvos neste aparelho. Para voltar, toque em 'Continuar sem conta'. Não há cópia na nuvem; para guardar uma cópia, use Perfil › Exportar meus dados.";

/** Tela 05b – Sair (design r2 da RedBox). Sair mantém os dados; "Sair e apagar" abre a folha 05c. */
export default function Sair() {
  const c = useCores();
  const escuro = useColorScheme() === 'dark';
  const { aplicar, apagarDadosDoAparelho } = useEstado();
  const { apagar } = useLocalSearchParams<{ apagar?: string }>();
  const [folha, setFolha] = useState(apagar === '1');
  const [saindo, setSaindo] = useState<'nao' | 'sim' | 'erro'>('nao');
  const sair = async () => {
    setSaindo('sim');
    try { cancelarDescanso(); await encerrarSessaoRemota(); aplicar(acoes.sair); router.replace('/entrar'); } catch { setSaindo('erro'); }
  };
  const apagarTudo = async () => {
    cancelarDescanso();
    await encerrarSessaoRemota();
    await apagarDadosDoAparelho(); // apaga os arquivos primeiro; só então limpa a tela (lança se falhar)
    setFolha(false);
    router.replace('/entrar');
  };
  return (
    <>
      {/* Com a folha aberta, a tela de trás sai da árvore de acessibilidade (Android/iOS e web). */}
      <View style={{ flex: 1 }} testID="tela-sair" importantForAccessibility={folha ? 'no-hide-descendants' : 'auto'} accessibilityElementsHidden={folha} aria-hidden={folha}>
        <Tela titulo="Sair" voltar={router.back}>
          <Cartao>
            <View style={{ marginHorizontal: -16, marginTop: -16, aspectRatio: 3 / 2, backgroundColor: c['primaria-suave'], borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden' }}
              accessible accessibilityRole="image" accessibilityLabel={ILUSTRACAO_SAIR.titulo} testID="ilustracao-sair">
              <SvgXml xml={escuro ? ILUSTRACAO_SAIR.escuro : ILUSTRACAO_SAIR.claro} width="100%" height="100%" />
            </View>
            <Texto v="titulo-2">Sair?</Texto>
            <Texto suave>{TEXTO_SAIR}</Texto>
          </Cartao>
          {saindo === 'erro' && <Aviso tom="erro" titulo="Não foi possível sair." texto="Tente de novo; seus dados não foram alterados." />}
          <Botao titulo={saindo === 'sim' ? 'Saindo…' : saindo === 'erro' ? 'Tentar de novo' : 'Sair'} carregando={saindo === 'sim'} testID="sair" onPress={sair} />
          <Botao v="secundario" titulo="Cancelar" onPress={router.back} />
          <View style={{ height: 1, backgroundColor: c.divisoria }} />
          <Botao v="destrutivo" titulo="Sair e apagar meus dados deste aparelho" testID="sair-apagar" onPress={() => setFolha(true)} />
        </Tela>
      </View>
      <FolhaApagar aberta={folha} onFechar={() => setFolha(false)} onConfirmar={apagarTudo} />
    </>
  );
}
