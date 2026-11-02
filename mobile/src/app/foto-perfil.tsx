import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { AVATARES, AvatarIlustrado, FotoPerfil } from '@/componentes/avatares';
import { Aviso, Botao, Tela, Texto } from '@/componentes/ui';
import { acoes, useEstado } from '@/estado/armazem';
import { escolherFoto } from '@/servicos/foto-perfil';
import { raio, useCores } from '@/tema/tema';

const MSG = { sem_permissao: 'Sem permissão. Você pode liberar nos ajustes do aparelho ou escolher um avatar.', erro: 'Não deu para usar essa foto. Tente outra ou escolha um avatar.' } as const;

/** Tela 12g – Foto ou avatar do perfil (v0.4.1). */
export default function FotoPerfilTela() {
  const { estado, aplicar } = useEstado();
  const c = useCores();
  const [erro, setErro] = useState<string>();
  const atual = estado.perfil?.avatar;
  const usarFoto = async (o: 'galeria' | 'camera') => {
    setErro(undefined);
    const r = await escolherFoto(o);
    if (r.ok) aplicar((e) => acoes.definirAvatar(e, { tipo: 'foto', uri: r.uri }));
    else if (r.motivo !== 'cancelado') setErro(MSG[r.motivo]);
  };
  return (
    <Tela titulo="Foto do perfil" voltar={router.back}>
      <View style={{ alignItems: 'center' }}><FotoPerfil avatar={atual} tamanho={112} /></View>
      <Texto v="rotulo" suave style={{ textAlign: 'center' }}>{Platform.OS === 'web' ? 'A foto fica só neste navegador. Não é enviada para nenhum servidor.' : 'A foto fica só neste aparelho, no armazenamento cifrado do app. Não é enviada para nenhum servidor.'}</Texto>
      <Botao v="secundario" titulo="Escolher da galeria" onPress={() => usarFoto('galeria')} testID="foto-galeria" />
      {Platform.OS !== 'web' && <Botao v="secundario" titulo="Tirar foto com a câmera" onPress={() => usarFoto('camera')} testID="foto-camera" />}
      {erro && <Aviso tom="alerta" titulo="Foto não usada" texto={erro} />}
      <Texto v="corpo-forte">Ou escolha um avatar</Texto>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
        {AVATARES.map((a) => {
          const sel = atual?.tipo === 'ilustrado' && atual.id === a.id;
          return (
            <Pressable key={a.id} accessibilityRole="radio" accessibilityLabel={a.descricao} accessibilityState={{ checked: sel }} testID={`avatar-${a.id}`}
              onPress={() => aplicar((e) => acoes.definirAvatar(e, { tipo: 'ilustrado', id: a.id }))}
              style={{ width: 72, height: 72, borderRadius: raio.pilula, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: sel ? c.primaria : 'transparent' }}>
              <AvatarIlustrado id={a.id} tamanho={62} />
            </Pressable>
          );
        })}
      </View>
      {atual && <Botao v="destrutivo" titulo="Remover foto ou avatar" onPress={() => aplicar((e) => acoes.definirAvatar(e, null))} testID="remover-avatar" />}
    </Tela>
  );
}
