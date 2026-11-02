import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, Text, useColorScheme, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, SvgXml } from 'react-native-svg';

import { BotaoGoogle } from '@/componentes/botao-google';
import { InstalarApp } from '@/componentes/instalar-app';
import { Ilustracao } from '@/componentes/ilustracoes';
import { AssinaturaDomma } from '@/componentes/simbolo-domma';
import { Aviso, Botao, Campo, LARGURA_COLUNA, Texto } from '@/componentes/ui';
import { LOGO_CLARO } from '@/config/logo-gerado';
import { autenticacaoDisponivel, linksJuridicos, marca, type LinkJuridico } from '@/config/marca';
import { acoes, useEstado } from '@/estado/armazem';
import { useSessao } from '@/estado/sessao';
import { Bloco, ProvedorSobreFundo, useCores, useCoresBase } from '@/tema/tema';
import { apoio, espaco, raio } from '@/tema/tokens';
import { useFonteTitulo } from '@/tema/fontes';

/** Estados visuais do design (tela-08). "carregando" e "erro" só aparecem pela galeria/capturas (?estado=). */
export type EstadoLogin = 'normal' | 'carregando' | 'erro';

export function abrirLinkJuridico(l: LinkJuridico) {
  if (l.tipo === 'interno') router.push(l.rota as never); else Linking.openURL(l.url);
}

/** A partir desta largura entra a vitrine ao lado do formulário (prancha v3.2 "computador"). */
const LARGURA_VITRINE = 1024;
const SOMBRA = 5; // deslocamento da sombra sólida dos blocos v3.2 (5px 5px 0 tinta)

/** Bloco v3.2: contorno tinta de 2 px e sombra sólida deslocada. A sombra é uma camada atrás (funciona também no Android). */
function BlocoTinta({ children, raio: r = raio.grande * 1.5, fundo, girar, estilo }: { children: ReactNode; raio?: number; fundo?: string; girar?: string; estilo?: object }) {
  const b = useCoresBase();
  return (
    <View style={[{ marginRight: SOMBRA, marginBottom: SOMBRA }, girar ? { transform: [{ rotate: girar }] } : null, estilo]}>
      <View aria-hidden style={{ position: 'absolute', top: SOMBRA, left: SOMBRA, right: -SOMBRA, bottom: -SOMBRA, borderRadius: r, backgroundColor: b.tinta }} />
      <View style={{ borderRadius: r, borderWidth: 2, borderColor: b.tinta, backgroundColor: fundo ?? b.superficie, overflow: 'hidden' }}>
        <Bloco>{children}</Bloco>
      </View>
    </View>
  );
}

/**
 * Botão de conta ainda indisponível (v3.2): contorno tracejado e texto suave, em vez de botão apagado com opacidade.
 * Continua focável e anuncia "desativado" (ADR-0019); o toque não faz nada.
 */
function BotaoConta({ titulo, desabilitado, carregando, testID }: { titulo: string; desabilitado?: boolean; carregando?: boolean; testID: string }) {
  const b = useCoresBase();
  const inativo = desabilitado || carregando;
  const ref = useRef<import('react-native').View | null>(null) as unknown as React.RefObject<never>;
  useEffect(() => {
    const el = ref.current as unknown as { setAttribute?: (k: string, v: string) => void; removeAttribute?: (k: string) => void } | null;
    if (Platform.OS !== 'web' || !el?.setAttribute) return;
    if (inativo) el.setAttribute('aria-disabled', 'true'); else el.removeAttribute?.('aria-disabled');
  }, [inativo]);
  return (
    <Pressable ref={ref} testID={testID} accessibilityRole="button" accessibilityLabel={titulo} accessibilityState={{ disabled: !!inativo, busy: !!carregando }} onPress={() => {}}
      style={{ minHeight: 52, borderRadius: 14, borderWidth: 2, borderStyle: inativo ? 'dashed' : 'solid', borderColor: inativo ? b['texto-suave'] : b.primaria,
        alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 20 }}>
      {carregando && <ActivityIndicator color={b['texto-suave']} />}
      <Text style={{ fontSize: 16, lineHeight: 24, fontWeight: '700', color: inativo ? b['texto-suave'] : b['primaria-texto'] }}>{titulo}</Text>
    </Pressable>
  );
}

/** Link de conta (v3.2): sublinhado tracejado quando ainda não funciona, sem apagar o texto. */
function LinkConta({ titulo, desabilitado, testID, onPress }: { titulo: string; desabilitado?: boolean; testID: string; onPress?: () => void }) {
  const b = useCoresBase();
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={titulo} accessibilityState={{ disabled: !!desabilitado }} aria-disabled={!!desabilitado} onPress={() => { if (!desabilitado) onPress?.(); }}
      style={{ minHeight: 44, justifyContent: 'center' }}>
      <Text style={{ color: b['primaria-texto'], fontSize: 16, lineHeight: 22, fontWeight: '700', textDecorationLine: 'underline', textDecorationStyle: desabilitado ? 'dashed' : 'solid' }}>{titulo}</Text>
    </Pressable>
  );
}

function Seta({ cor }: { cor: string }) {
  return <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden><Path d="M9 5l7 7-7 7" /></Svg>;
}

/** Botão principal do login: vermelho da marca, 60 px, com seta (prancha v3.2). */
function BotaoContinuar({ onPress, titulo = 'Continuar sem conta', testID = 'continuar', carregando }: { onPress: () => void; titulo?: string; testID?: string; carregando?: boolean }) {
  const b = useCoresBase();
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={titulo} accessibilityState={{ busy: !!carregando }} onPress={() => { if (!carregando) onPress(); }}
      style={(st) => {
        const { pressed, focused } = st as { pressed: boolean; focused?: boolean };
        return [{ minHeight: 60, borderRadius: 14, backgroundColor: b.primaria, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 20,
          shadowColor: b.primaria, shadowOpacity: 0.25, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 4, transform: [{ scale: pressed ? 0.98 : 1 }] },
        focused ? { outlineWidth: 3, outlineStyle: 'solid', outlineColor: b.foco, outlineOffset: 2 } as object : null];
      }}>
      {carregando && <ActivityIndicator color={b['sobre-primaria']} />}
      <Text style={{ color: b['sobre-primaria'], fontSize: 18, lineHeight: 24, fontWeight: '700' }}>{titulo}</Text>
      {!carregando && <Seta cor={b['sobre-primaria']} />}
    </Pressable>
  );
}

function IconeInfo({ cor }: { cor: string }) {
  return <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth={2.2} strokeLinecap="round" aria-hidden><Circle cx={12} cy={12} r={9} /><Path d="M12 11v6M12 7.5v.5" /></Svg>;
}

/** Linha "conta com login" separando o caminho que funciona do que ainda vem. */
function Separador({ texto }: { texto: string }) {
  const b = useCoresBase();
  const linha = useColorScheme() === 'dark' ? { backgroundColor: '#75716B' } : { backgroundColor: b.tinta, opacity: 0.6 }; // v3.2: no escuro a tinta some no bloco
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[3], marginVertical: 2 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[{ flex: 1, height: 1.5 }, linha]} />
      <Text style={{ color: b['texto-suave'], fontSize: 14, lineHeight: 20 }}>{texto}</Text>
      <View style={[{ flex: 1, height: 1.5 }, linha]} />
    </View>
  );
}

/** Vitrine do computador: adesivo amarelo e ilustração num bloco (prancha v3.2). Decorativa. */
function Vitrine() {
  const ft = useFonteTitulo();
  return (
    <View style={{ width: 340, gap: espaco[3], paddingTop: espaco[12] }}>
      <View style={{ alignSelf: 'flex-start', transform: [{ rotate: '-3deg' }], backgroundColor: apoio.energia, borderWidth: 2, borderColor: apoio['sobre-energia'], borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6,
        shadowColor: apoio['sobre-energia'], shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 3, height: 3 } }}>
        <Text style={{ color: apoio['sobre-energia'], fontSize: 15, lineHeight: 20, ...ft }}>Treino, água e comida num lugar só</Text>
      </View>
      <BlocoTinta>
        <View style={{ alignItems: 'center', padding: espaco[4] }}><Ilustracao nome="boas-vindas" descricao="Pessoa comemorando o treino" largura={280} /></View>
      </BlocoTinta>
    </View>
  );
}

/**
 * Tela de login (v0.4.5, identidade v3.2: design/telas-v3.2/html/tela-00-login_*.html).
 * A autenticação real ainda NÃO existe (Supabase não ligado, ADR-0017): Entrar, Criar conta, Esqueci minha senha e Google
 * ficam desativados com "em breve", e os campos não guardam nada. O caminho que funciona, "Continuar sem conta"
 * (modo local, ADR-0004/0009), vem primeiro e em destaque. Nada aqui simula login.
 */
export default function Entrar() {
  const c = useCores();
  const b = useCoresBase();
  const { width } = useWindowDimensions();
  const ft = useFonteTitulo();
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
  const sessao = useSessao();
  const contaLigada = autenticacaoDisponivel;
  const [enviando, setEnviando] = useState(false);
  const [erroConta, setErroConta] = useState<string | null>(null);
  const [okConta, setOkConta] = useState<string | null>(null);
  const entrarConta = async () => {
    if (enviando) return;
    if (!email.trim() || !senha) return setErroConta('Digite o e-mail e a senha.');
    setEnviando(true); setErroConta(null); setOkConta(null);
    const erro = await sessao.entrar(email, senha);
    setEnviando(false); setSenha('');
    if (erro) return setErroConta(erro);
    router.replace('/');
  };
  const esqueci = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setErroConta('Digite o seu e-mail acima e toque de novo em "Esqueci minha senha".');
    setErroConta(null);
    const erro = await sessao.esqueci(email);
    if (erro) setErroConta(erro); else setOkConta('Se o e-mail tiver conta, enviamos um link para criar uma nova senha.');
  };
  const largo = width >= LARGURA_VITRINE;
  const campoOff = contaOff ? { borderStyle: 'dashed' as const, borderWidth: 1.5, borderColor: b['texto-suave'], backgroundColor: b['superficie-2'] } : null;
  const tituloGrande = Math.min(44, Math.max(34, width * 0.1));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.fundo }} edges={['top']}>
      <ProvedorSobreFundo>
        <ScrollView contentContainerStyle={{ paddingBottom: espaco[8], flexDirection: 'row', justifyContent: 'center', gap: espaco[12], paddingHorizontal: largo ? espaco[8] : 0 }}>
          {largo && <Vitrine />}
          <View style={{ width: '100%', maxWidth: LARGURA_COLUNA }}>
            {/* Topo v3.2: logo colorida num "adesivo" branco levemente girado e o slogan grande na fonte de títulos. */}
            <View style={{ padding: espaco[4], paddingTop: espaco[5], gap: espaco[4], alignItems: 'flex-start' }}>
              <BlocoTinta raio={22} fundo="#FFFFFF" girar="-2deg">
                <View accessible accessibilityRole="image" accessibilityLabel={marca.nome} testID="logo-quaru" style={{ paddingHorizontal: 18, paddingVertical: 10 }}>
                  <View style={{ width: 168, height: (168 * 180) / 480 }}>
                    <SvgXml xml={LOGO_CLARO} width="100%" height="100%" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
                  </View>
                </View>
              </BlocoTinta>
              {marca.slogan ? (
                <Text testID="slogan" accessibilityRole="header" aria-level={1}
                  style={{ color: c.texto, ...ft, fontSize: tituloGrande, lineHeight: tituloGrande * 1.02, letterSpacing: -0.02 * tituloGrande }}>
                  {marca.slogan}
                </Text>
              ) : null}
            </View>

            <View style={{ marginHorizontal: espaco[4] }}>
              <BlocoTinta>
                {contaLigada ? (
                <View style={{ padding: espaco[4], gap: espaco[3] }} accessibilityLabel={`Entrar no ${marca.nome}`}>
                  <Text accessibilityRole="header" style={{ color: b.texto, ...ft, fontSize: 20, lineHeight: 26 }}>Entre na sua conta</Text>
                  {(erroConta || sessao.aviso) && <Aviso tom="erro" titulo={erroConta ?? sessao.aviso ?? ''} />}
                  {okConta && <Aviso tom="sucesso" titulo={okConta} />}
                  <Campo rotulo="E-mail" value={email} onChangeText={(t) => { setEmail(t); setErroConta(null); }} placeholder="voce@exemplo.com" keyboardType="email-address" autoCapitalize="none"
                    autoComplete="email" textContentType="emailAddress" editable={!enviando} testID="campo-email" />
                  <View>
                    <Campo rotulo="Senha" value={senha} onChangeText={(t) => { setSenha(t); setErroConta(null); }} placeholder="Sua senha" secureTextEntry={!verSenha} autoComplete="current-password"
                      textContentType="password" editable={!enviando} testID="campo-senha" style={{ paddingRight: 52 }} onSubmitEditing={entrarConta} />
                    <Pressable accessibilityRole="button" accessibilityLabel={verSenha ? 'Ocultar senha' : 'Mostrar senha'} onPress={() => setVerSenha(!verSenha)}
                      style={{ position: 'absolute', right: 4, bottom: 4, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: b.texto, fontSize: 18 }}>{verSenha ? '◡' : '◉'}</Text>
                    </Pressable>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <LinkConta titulo="Esqueci minha senha" testID="esqueci-senha" onPress={esqueci} desabilitado={enviando} />
                  </View>
                  <BotaoContinuar titulo={enviando ? 'Entrando…' : 'Entrar'} testID="entrar" onPress={entrarConta} carregando={enviando} />
                  <Separador texto="sem conta?" />
                  <Texto v="rotulo" cor={b['texto-suave']} style={{ textAlign: 'center' }}>O acesso ao {marca.nome} é por convite. Peça o seu ao administrador: você recebe um e-mail para criar a senha.</Texto>
                </View>
                ) : (
                <View style={{ padding: espaco[4], gap: espaco[3] }} accessibilityLabel={`Entrar no ${marca.nome}`}>
                    {estado === 'erro' && <Aviso tom="erro" titulo="E-mail ou senha incorretos." texto="Confira os dados e tente de novo." />}
                    <Text accessibilityRole="header" style={{ color: b.texto, ...ft, fontSize: 20, lineHeight: 26 }}>Comece agora</Text>
                    <BotaoContinuar onPress={continuar} />
                    <Texto v="rotulo" cor={b['texto-suave']}>Sem cadastro: seus dados ficam só neste aparelho.</Texto>
  
                    <Separador texto="conta com login" />
  
                    {contaOff && (
                      <View accessibilityRole="alert" style={{ flexDirection: 'row', gap: espaco[3], padding: espaco[3], paddingLeft: espaco[3] + 4, borderRadius: raio.medio, borderWidth: 2, borderLeftWidth: 8, borderColor: b.tinta, backgroundColor: b.superficie }}>
                        <IconeInfo cor={b.secundaria} />
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text style={{ color: b.texto, fontSize: 16, lineHeight: 22, fontWeight: '700' }}>Conta com login: em breve</Text>
                          <Text style={{ color: b.texto, fontSize: 15, lineHeight: 22 }}>Entrar, criar conta e Google ainda não funcionam nesta versão. Use “Continuar sem conta”: seus dados ficam só neste aparelho.</Text>
                        </View>
                      </View>
                    )}
                    <Campo rotulo="E-mail" value={email} onChangeText={setEmail} placeholder="voce@exemplo.com" keyboardType="email-address" autoCapitalize="none"
                      autoComplete="email" textContentType="emailAddress" editable={!contaOff && estado !== 'carregando'} testID="campo-email" style={campoOff} />
                    <View>
                      <Campo rotulo="Senha" value={senha} onChangeText={setSenha} placeholder="Sua senha" secureTextEntry={!verSenha} autoComplete="current-password"
                        textContentType="password" editable={!contaOff && estado !== 'carregando'} testID="campo-senha" style={[{ paddingRight: 52 }, campoOff]} />
                      {!contaOff && (
                        <Pressable accessibilityRole="button" accessibilityLabel={verSenha ? 'Ocultar senha' : 'Mostrar senha'} onPress={() => setVerSenha(!verSenha)}
                          style={{ position: 'absolute', right: 4, bottom: 4, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: b.texto, fontSize: 18 }}>{verSenha ? '◡' : '◉'}</Text>
                        </Pressable>
                      )}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <LinkConta titulo={contaOff ? 'Esqueci minha senha (em breve)' : 'Esqueci minha senha'} desabilitado={contaOff} testID="esqueci-senha" />
                    </View>
                    <BotaoConta titulo={estado === 'carregando' ? 'Entrando…' : contaOff ? 'Entrar (em breve)' : 'Entrar'} desabilitado={contaOff} carregando={estado === 'carregando'} testID="entrar" />
                    <BotaoConta titulo={contaOff ? 'Criar conta (em breve)' : 'Criar conta'} desabilitado={contaOff || estado === 'carregando'} testID="criar-conta" />
                    <BotaoGoogle onPress={nada} desabilitado={contaOff || estado === 'carregando'} />
                    {contaOff && <Texto v="legenda" cor={b['texto-suave']} style={{ textAlign: 'center' }}>Login com Google: em breve.</Texto>}
                  </View>
                )}
              </BlocoTinta>
            </View>

            <View style={{ paddingHorizontal: espaco[4], paddingTop: espaco[5], gap: espaco[2], alignItems: 'center' }}>
              <Texto v="rotulo" style={{ textAlign: 'center' }}>Ao continuar, você concorda com os termos abaixo.</Texto>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: espaco[4] }}>
                <Botao v="texto" titulo="Termos de uso" onPress={() => abrirLinkJuridico(linksJuridicos.termos)} testID="link-termos" />
                <Botao v="texto" titulo="Política de Privacidade" onPress={() => abrirLinkJuridico(linksJuridicos.privacidade)} testID="link-privacidade" />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[3], marginTop: espaco[2] }}>
                <Texto v="rotulo">Desenvolvido por</Texto><AssinaturaDomma largura={136} />
              </View>
              <View style={{ alignSelf: 'stretch', marginTop: espaco[2] }}><InstalarApp compacto /></View>
              {Platform.OS === 'web' && <Texto v="legenda" suave>Versão {marca.versao}</Texto>}
            </View>
          </View>
        </ScrollView>
      </ProvedorSobreFundo>
    </SafeAreaView>
  );
}
