import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Mascote } from '@/componentes/mascote';
import { Aviso, Botao, Campo, Cartao, Chave, Tela, Texto } from '@/componentes/ui';
import { DIAS_TESTE } from '@/dominio/plano';
import { useSessao } from '@/estado/sessao';
import { abrirLinkJuridico } from '@/app/entrar';
import { linksJuridicos } from '@/config/marca';

/**
 * v0.12 (ADR-0026): criar conta sozinho, com 7 dias de teste grátis e sem cartão. O Auth manda um e-mail de
 * confirmação; depois de confirmar, a pessoa entra e o teste já está contando.
 */
export default function CriarConta() {
  const s = useSessao();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [aceito, setAceito] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [pronto, setPronto] = useState(false);

  const criar = async () => {
    setErro(null);
    if (nome.trim().length < 2) return setErro('Digite o seu nome.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setErro('Digite um e-mail válido.');
    if (!aceito) return setErro('Para criar a conta, aceite os Termos de uso e a Política de Privacidade.');
    setEnviando(true);
    const e = await s.criarConta(nome, email, senha);
    setEnviando(false);
    if (e) return setErro(e);
    setSenha(''); setPronto(true);
  };

  if (pronto) return (
    <Tela titulo="Criar conta" voltar={() => router.replace('/entrar')}>
      <Cartao destaque>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Mascote tamanho={84} />
          <View style={{ flex: 1, gap: 6 }}>
            <Texto v="titulo-3">Quase lá! Confira o seu e-mail</Texto>
            <Texto v="rotulo" suave>{`Mandamos um link para ${email.trim().toLowerCase()}. Toque nele para confirmar a conta e depois entre com o e-mail e a senha. O seu teste de ${DIAS_TESTE} dias começa já.`}</Texto>
          </View>
        </View>
      </Cartao>
      <Texto v="rotulo" suave>Não chegou? Olhe a caixa de spam ou de promoções. O e-mail pode levar alguns minutos.</Texto>
      <Botao grande titulo="Ir para Entrar" onPress={() => router.replace('/entrar')} testID="ir-entrar" />
    </Tela>
  );

  return (
    <Tela titulo="Criar conta" voltar={() => router.replace('/entrar')}>
      <Texto v="titulo-1">{`${DIAS_TESTE} dias grátis, sem cartão`}</Texto>
      <Texto suave>Crie a sua conta e use o Quaru completo por 7 dias. Depois, escolha um plano: Mensal, Trimestral ou Anual. Se não assinar, nada é cobrado.</Texto>
      {erro && <Aviso tom="erro" titulo={erro} />}
      <Campo rotulo="Nome" value={nome} onChangeText={setNome} autoComplete="name" maxLength={80} testID="cc-nome" />
      <Campo rotulo="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" testID="cc-email" />
      <Campo rotulo="Senha" value={senha} onChangeText={setSenha} secureTextEntry autoComplete="new-password" textContentType="newPassword" ajuda="Pelo menos 8 caracteres, com letras e números." testID="cc-senha" />
      <Chave rotulo="Li e aceito os Termos de uso e a Política de Privacidade" valor={aceito} onChange={setAceito} testID="cc-aceito" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <Botao v="texto" titulo="Termos de uso" onPress={() => abrirLinkJuridico(linksJuridicos.termos)} />
        <Botao v="texto" titulo="Política de Privacidade" onPress={() => abrirLinkJuridico(linksJuridicos.privacidade)} />
      </View>
      <Botao grande titulo={enviando ? 'Criando…' : 'Criar conta e começar o teste'} carregando={enviando} onPress={criar} testID="cc-criar" />
      <Botao v="texto" titulo="Já tenho conta: entrar" onPress={() => router.replace('/entrar')} />
    </Tela>
  );
}
