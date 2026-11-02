import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { Animacao } from '@/componentes/animacao';
import { Esqueleto, Texto } from '@/componentes/ui';
import { precisaApresentacao, useEstado } from '@/estado/armazem';

export default function Entrada() {
  const { estado, pronto } = useEstado();
  if (!pronto) return <View style={{ flex: 1, padding: 16, gap: 16, paddingTop: 72 }}><Animacao nome="carregando" tamanho={64} /><View accessibilityRole="text" accessibilityLiveRegion="polite"><Texto suave style={{ textAlign: 'center' }}>Carregando…</Texto></View><Esqueleto altura={160} /><Esqueleto /><Esqueleto /></View>;
  if (!estado.usuario) return <Redirect href="/entrar" />;
  if (!estado.consentimentosVistosEm) return <Redirect href="/consentimentos" />;
  if (precisaApresentacao(estado)) return <Redirect href="/boas-vindas" />;
  return <Redirect href="/inicio" />;
}
