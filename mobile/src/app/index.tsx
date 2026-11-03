import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { Animacao } from '@/componentes/animacao';
import { Aviso, Botao, Esqueleto, Tela, Texto } from '@/componentes/ui';
import { acoes, precisaApresentacao, temDadosPessoais, useEstado } from '@/estado/armazem';
import { useSessao } from '@/estado/sessao';

function Carregando() {
  return <View style={{ flex: 1, padding: 16, gap: 16, paddingTop: 72 }}><Animacao nome="carregando" tamanho={64} /><View accessibilityRole="text" accessibilityLiveRegion="polite"><Texto suave style={{ textAlign: 'center' }}>Carregando…</Texto></View><Esqueleto altura={160} /><Esqueleto /><Esqueleto /></View>;
}

export default function Entrada() {
  const { estado, pronto, aplicar } = useEstado();
  const s = useSessao();
  const conta = s.modo === 'conta';
  const logado = conta && !!s.usuario && !!s.acesso?.ativo;
  // v0.6: com conta, o estado local passa a ser da conta logada; se o aparelho tem dados de OUTRA conta, nada se mistura.
  const outraConta = logado && !!estado.conta && estado.conta.id !== s.usuario?.id && temDadosPessoais(estado);
  const u = s.usuario;
  const precisaVincular = pronto && logado && !outraConta && !!u && (estado.conta?.id !== u.id || !estado.usuario);
  useEffect(() => { if (precisaVincular && u) aplicar((e) => acoes.entrarConta(e, u)); }, [precisaVincular, u, aplicar]);

  if (!pronto || !s.pronta) return <Carregando />;
  if (conta) {
    if (s.link || (logado && s.trocarSenha)) return <Redirect href="/definir-senha" />;
    if (!logado) return <Redirect href="/entrar" />;
    if (outraConta) return (
      <Tela titulo="Outra conta neste aparelho">
        <Aviso tom="alerta" titulo="Este aparelho tem dados de outra conta" texto={`Os treinos guardados aqui são de ${estado.conta?.email ?? 'outra pessoa'}. Para entrar como ${s.usuario?.email}, saia e apague os dados deste aparelho antes. Se quiser guardar uma cópia, entre na outra conta e exporte os dados.`} />
        <Botao titulo="Sair desta conta" onPress={() => s.sair()} testID="sair-outra-conta" />
      </Tela>
    );
    if (!estado.usuario || estado.conta?.id !== s.usuario?.id) return <Carregando />;
    if (estado.vinculoPendente) return <Redirect href={`/vincular?codigo=${estado.vinculoPendente}` as never} />; // v0.8: link do treinador antes do login
  } else if (!estado.usuario) return <Redirect href="/entrar" />;
  if (!estado.consentimentosVistosEm) return <Redirect href="/consentimentos" />;
  if (precisaApresentacao(estado)) return <Redirect href="/boas-vindas" />;
  return <Redirect href="/inicio" />;
}
