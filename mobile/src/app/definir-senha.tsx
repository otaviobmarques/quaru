import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Aviso, Botao, Campo, Cartao, Tela, Texto } from '@/componentes/ui';
import { SENHA_MINIMA, useSessao } from '@/estado/sessao';

/**
 * v0.6: aberta pelo link do convite ("Crie sua senha") ou do "Esqueci minha senha" ("Nova senha").
 * O link já entrou com a pessoa (sessão de uso único do Supabase); aqui ela só escolhe a senha.
 */
export default function DefinirSenha() {
  const s = useSessao();
  const convite = s.link !== 'recovery';
  const troca = !s.link && s.trocarSenha; // senha criada pelo admin: a pessoa cria a própria no 1º acesso
  const [senha, setSenha] = useState('');
  const [conf, setConf] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const salvar = async () => {
    if (senha.length < SENHA_MINIMA) return setErro(`A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`);
    if (senha !== conf) return setErro('As duas senhas não são iguais.');
    setSalvando(true); setErro(null);
    const e = await s.definirSenha(senha);
    setSalvando(false);
    if (e) return setErro(e);
    router.replace('/');
  };
  if (!s.usuario) return (
    <Tela titulo="Link expirado">
      <Aviso tom="alerta" titulo="Este link não vale mais" texto='Links de convite e de nova senha valem por pouco tempo e só uma vez. Peça um novo convite ao administrador ou use "Esqueci minha senha" na tela de entrar.' />
      <Botao titulo="Ir para entrar" onPress={() => { s.limparLink(); router.replace('/entrar'); }} />
    </Tela>
  );
  return (
    <Tela titulo={convite ? 'Crie sua senha' : 'Nova senha'}>
      <Texto v="titulo-1">{troca ? 'Crie a sua senha' : convite ? 'Bem-vindo ao Quaru!' : 'Crie uma nova senha'}</Texto>
      <Texto suave>Conta: {s.usuario.email}</Texto>
      {troca && <Aviso tom="secundaria" titulo="Por segurança, troque a senha que você recebeu" texto="Ela foi criada pelo administrador. Depois de salvar a sua, a antiga deixa de valer." />}
      <Cartao>
        <View style={{ gap: 12 }}>
          <Campo rotulo="Senha" value={senha} onChangeText={(t) => { setSenha(t); setErro(null); }} secureTextEntry autoComplete="new-password" textContentType="newPassword"
            ajuda={`Pelo menos ${SENHA_MINIMA} caracteres. Use uma senha que você não usa em outro lugar.`} testID="nova-senha" />
          <Campo rotulo="Repita a senha" value={conf} onChangeText={(t) => { setConf(t); setErro(null); }} secureTextEntry autoComplete="new-password" textContentType="newPassword" testID="nova-senha-conf" onSubmitEditing={salvar} />
          {erro && <Aviso tom="erro" titulo={erro} />}
          <Botao grande titulo={salvando ? 'Salvando…' : 'Salvar senha e entrar'} onPress={salvar} carregando={salvando} testID="salvar-senha" />
        </View>
      </Cartao>
    </Tela>
  );
}
