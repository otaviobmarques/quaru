import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, View } from 'react-native';

import { Aviso, Botao, Campo, Texto } from '@/componentes/ui';
import { useCores } from '@/tema/tema';

/** Textos da folha (design r2 da RedBox, tela 05c). O caminho de exportação é o nome real do item em Perfil. */
export const TEXTOS_APAGAR = {
  titulo: 'Sair e apagar os dados deste aparelho?',
  copia: 'Se quiser guardar uma cópia, exporte antes em Perfil › Exportar meus dados.',
  rotulo: 'Digite EXCLUIR para confirmar',
  exemplo: 'Digite aqui',
  ajuda: 'O botão fica ativo quando você digitar EXCLUIR. Maiúsculas ou minúsculas, tanto faz.',
  confirmado: 'Confirmação digitada.',
  erro: 'Não foi possível concluir. Tente de novo.',
} as const;
/** Sem diferença entre maiúsculas e minúsculas; espaços nas pontas não contam. */
export const confirmacaoValida = (t: string) => t.trim().toUpperCase() === 'EXCLUIR';

/**
 * Folha "Sair e apagar" (v0.4.3). Acessibilidade: a folha é modal (accessibilityViewIsModal no iOS, aria-modal
 * na web, onde o Modal do react-native-web também prende o foco); quem abre esconde a tela de trás do leitor
 * de tela (importantForAccessibility/aria-hidden). "Apagar e sair" fica focável e anuncia "desativado" até a
 * confirmação (Botao, ADR-0019).
 */
export function FolhaApagar({ aberta, onFechar, onConfirmar }: { aberta: boolean; onFechar: () => void; onConfirmar: () => Promise<void> }) {
  const c = useCores();
  const [confirma, setConfirma] = useState('');
  const [estado, setEstado] = useState<'normal' | 'apagando' | 'erro'>('normal');
  const ok = confirmacaoValida(confirma);
  const fechar = () => { setConfirma(''); setEstado('normal'); onFechar(); };
  const confirmar = async () => {
    setEstado('apagando');
    try { await onConfirmar(); setConfirma(''); setEstado('normal'); } catch { setEstado('erro'); }
  };
  return (
    <Modal visible={aberta} transparent animationType="slide" onRequestClose={fechar}>
      {/* Achado no emulador (0.3.0): a folha ficava sob o teclado. */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <View testID="folha-apagar" accessibilityViewIsModal aria-modal role="dialog" accessibilityLabel={TEXTOS_APAGAR.titulo}
          style={{ backgroundColor: c.superficie, padding: 16, gap: 12, borderTopLeftRadius: 16, borderTopRightRadius: 16, width: '100%', maxWidth: 720, alignSelf: 'center' }}>
          <Texto v="titulo-3">{TEXTOS_APAGAR.titulo}</Texto>
          <Texto suave>{Platform.OS === 'web'
            ? 'Todos os seus treinos, rotinas, pesos, água, altura, foto de perfil e consentimentos salvos NESTE navegador serão apagados. Os dados web ficam sem criptografia do aparelho; outros navegadores e o app no celular não são afetados. Não dá para desfazer.'
            : 'Todos os seus treinos, rotinas, pesos, água, altura, foto de perfil e consentimentos serão apagados. Não dá para desfazer.'}</Texto>
          <Aviso tom="secundaria" titulo={TEXTOS_APAGAR.copia} />
          {estado === 'erro' && <Aviso tom="erro" titulo={TEXTOS_APAGAR.erro} />}
          <Campo rotulo={TEXTOS_APAGAR.rotulo} value={confirma} onChangeText={setConfirma} placeholder={TEXTOS_APAGAR.exemplo}
            ajuda={ok ? TEXTOS_APAGAR.confirmado : TEXTOS_APAGAR.ajuda} autoCapitalize="characters" autoCorrect={false} autoComplete="off" testID="campo-confirmar" />
          <Botao v="perigo" titulo={estado === 'apagando' ? 'Apagando…' : estado === 'erro' ? 'Tentar de novo' : 'Apagar e sair'} testID="confirmar-apagar"
            desabilitado={!ok} carregando={estado === 'apagando'} onPress={confirmar} />
          <Botao v="texto" titulo="Cancelar" testID="cancelar-apagar" onPress={fechar} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
