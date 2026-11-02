import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BotaoGoogle } from '@/componentes/botao-google';
import { PessoaLogin } from '@/componentes/ilustracao-tour';
import { LogoBranco } from '@/componentes/logo';
import { AssinaturaDomma } from '@/componentes/simbolo-domma';
import { Aviso, Botao, Campo, FundoDegrade, LARGURA_COLUNA, Texto } from '@/componentes/ui';
import { autenticacaoDisponivel, linksJuridicos, marca, type LinkJuridico } from '@/config/marca';
import { acoes, useEstado } from '@/estado/armazem';
import { espaco, raio, sombra } from '@/tema/tokens';
import { useCores } from '@/tema/tema';

/** Estados visuais do design (tela-08). "carregando" e "erro" só aparecem pela galeria/capturas (?estado=). */
export type EstadoLogin = 'normal' | 'carregando' | 'erro';

export function abrirLinkJuridico(l: LinkJuridico) {
  if (l.tipo === 'interno') router.push(l.rota as never); else Linking.openURL(l.url);
}

/**
 * Tela de login (v0.4.2, design v2.1). A autenticação real ainda NÃO existe (Supabase não ligado, ADR-0017):
 * Entrar, Criar conta, Esqueci minha senha e Google ficam desativados com "em breve", e os campos não guardam
 * nada. O caminho que funciona é "Continuar sem conta" (modo local, ADR-0004/0009). Nada aqui simula login.
 */
export default function Entrar() {
  const c = useCores();
  const { aplicar, estado: est } = useEstado();
  const { estado: e0 } = useLocalSearchParams<{ estado?: string }>();
  const demo = (__DEV__ || process.env.EXPO_PUBLIC_CAPTURAS === '1');
  const estado: EstadoLogin = demo && (e0 === 'carregando' || e0 === 'erro') ? e0 : 'normal';
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const contaOff = !autenticacaoDisponivel;
  const continuar = () => { aplicar((e) => acoes.entrar(e)); router.replace(est.consentimentosVistosEm ? '/' : '/consentimentos'); }; // v0.4.3: depois de Sair, retoma de onde parou
  const nada = () => {};
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.fundo }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: espaco[8] }}>
        <View style={{ width: '100%', maxWidth: LARGURA_COLUNA, alignSelf: 'center' }}>
          {/* Topo em degradê da marca, com a logo branca, o slogan e as duas pessoas (decorativas). */}
          <View style={{ overflow: 'hidden', borderBottomLeftRadius: raio.grande * 2, borderBottomRightRadius: raio.grande * 2, paddingTop: espaco[6], paddingBottom: espaco[12], alignItems: 'center', gap: espaco[2] }}>
            <FundoDegrade id="degrade-login" />
            <View style={{ position: 'absolute', top: 40, left: 8, right: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
              <PessoaLogin indice={0} /><PessoaLogin indice={1} />
            </View>
            <LogoBranco largura={176} />
            {/* Slogan (login v2.2): logo abaixo do logo, branco, Inter 18/600, centralizado, até 15em. Texto: marca.json. */}
            {marca.slogan ? <Text testID="slogan" accessibilityRole="text" style={{ color: '#FFFFFF', fontFamily: 'Inter', fontSize: 18, lineHeight: 24, fontWeight: '600', letterSpacing: 0.09, textAlign: 'center', maxWidth: 270, paddingHorizontal: espaco[2] }}>{marca.slogan}</Text> : null}
          </View>

          <View style={[{ marginTop: -espaco[8], marginHorizontal: espaco[4], backgroundColor: c.superficie, borderRadius: raio.grande, borderWidth: 1, borderColor: c.borda, padding: espaco[5], gap: espaco[3] }, sombra['2']]}
            accessibilityLabel={`Entrar no ${marca.nome}`}>
            {estado === 'erro' && <Aviso tom="erro" titulo="E-mail ou senha incorretos." texto="Confira os dados e tente de novo." />}
            {contaOff && <Aviso tom="secundaria" titulo="Conta com login: em breve" texto="Entrar, criar conta e Google ainda não funcionam nesta versão. Use “Continuar sem conta”: seus dados ficam só neste aparelho." />}
            <Campo rotulo="E-mail" value={email} onChangeText={setEmail} placeholder="voce@exemplo.com" keyboardType="email-address" autoCapitalize="none"
              autoComplete="email" textContentType="emailAddress" editable={!contaOff && estado !== 'carregando'} testID="campo-email" />
            <View>
              <Campo rotulo="Senha" value={senha} onChangeText={setSenha} placeholder="Sua senha" secureTextEntry={!verSenha} autoComplete="current-password"
                textContentType="password" editable={!contaOff && estado !== 'carregando'} testID="campo-senha" style={{ paddingRight: 52 }} />
              <Pressable accessibilityRole="button" accessibilityLabel={verSenha ? 'Ocultar senha' : 'Mostrar senha'} disabled={contaOff} onPress={() => setVerSenha(!verSenha)}
                style={{ position: 'absolute', right: 4, bottom: 4, width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: contaOff ? 0.5 : 1 }}>
                <Text style={{ color: c.texto, fontSize: 18 }}>{verSenha ? '◡' : '◉'}</Text>
              </Pressable>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Botao v="texto" titulo={contaOff ? 'Esqueci minha senha (em breve)' : 'Esqueci minha senha'} onPress={nada} desabilitado={contaOff} testID="esqueci-senha" />
            </View>
            <Botao titulo={estado === 'carregando' ? 'Entrando…' : contaOff ? 'Entrar (em breve)' : 'Entrar'} onPress={nada} v="secundario" desabilitado={contaOff} carregando={estado === 'carregando'} testID="entrar" />
            <Botao titulo={contaOff ? 'Criar conta (em breve)' : 'Criar conta'} onPress={nada} v="secundario" desabilitado={contaOff || estado === 'carregando'} testID="criar-conta" />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[3] }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <View style={{ flex: 1, height: 1, backgroundColor: c.divisoria }} /><Texto v="rotulo" suave>ou</Texto><View style={{ flex: 1, height: 1, backgroundColor: c.divisoria }} />
            </View>
            <BotaoGoogle onPress={nada} desabilitado={contaOff || estado === 'carregando'} />
            {contaOff && <Texto v="legenda" suave style={{ textAlign: 'center' }}>Login com Google: em breve.</Texto>}
            <Botao grande titulo="Continuar sem conta" onPress={continuar} testID="continuar" />
          </View>

          <View style={{ paddingHorizontal: espaco[4], paddingTop: espaco[4], gap: espaco[2], alignItems: 'center' }}>
            <Texto v="rotulo" suave style={{ textAlign: 'center' }}>Ao continuar, você concorda com os termos abaixo.</Texto>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: espaco[4] }}>
              <Botao v="texto" titulo="Termos de uso" onPress={() => abrirLinkJuridico(linksJuridicos.termos)} testID="link-termos" />
              <Botao v="texto" titulo="Política de Privacidade" onPress={() => abrirLinkJuridico(linksJuridicos.privacidade)} testID="link-privacidade" />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[3], marginTop: espaco[2] }}>
              <Texto v="rotulo" suave>Desenvolvido por</Texto><AssinaturaDomma largura={136} />
            </View>
            {Platform.OS === 'web' && <Texto v="legenda" suave>Versão {marca.versao}</Texto>}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
