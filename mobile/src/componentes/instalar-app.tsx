import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';

import { Botao, Cartao, Texto } from '@/componentes/ui';

/**
 * v0.6.1: instalar o Quaru como app (PWA). No Android (Chrome, Edge, Samsung Internet) o navegador oferece a
 * instalação e mostramos o botão "Instalar o app". No iPhone não há botão: explicamos o "Adicionar à Tela de Início".
 * Some quando o app já está instalado (aberto em tela cheia) e fora da web.
 */
type EventoInstalar = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };
let guardado: EventoInstalar | null = null;
const ouvintes = new Set<() => void>();
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); guardado = e as EventoInstalar; ouvintes.forEach((f) => f()); });
  window.addEventListener('appinstalled', () => { guardado = null; ouvintes.forEach((f) => f()); });
}

function instalado(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}
const ehIphone = () => typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);

export function InstalarApp({ compacto }: { compacto?: boolean }) {
  const [, setVersao] = useState(0);
  const [feito, setFeito] = useState(false);
  useEffect(() => { const f = () => setVersao((v) => v + 1); ouvintes.add(f); return () => { ouvintes.delete(f); }; }, []);
  if (Platform.OS !== 'web' || instalado() || feito) return null;
  const iphone = ehIphone();
  if (!guardado && !iphone) return null; // navegador sem suporte (ou já recusou): não insiste
  const instalar = async () => {
    const e = guardado; if (!e) return;
    await e.prompt();
    const { outcome } = await e.userChoice;
    if (outcome === 'accepted') { guardado = null; setFeito(true); }
  };
  return (
    <Cartao>
      <View testID="instalar-app" style={{ gap: 6 }}>
        <Texto v="corpo-forte">📲 Instale o Quaru no celular</Texto>
        {iphone
          ? <Texto v="rotulo" suave>No Safari, toque em Compartilhar (o quadrado com a seta) e depois em “Adicionar à Tela de Início”.</Texto>
          : <Texto v="rotulo" suave>{compacto ? 'Abre em tela cheia, como um app, direto da tela inicial.' : 'Fica na tela inicial e abre em tela cheia, como um app. Não ocupa quase nada de espaço.'}</Texto>}
        {!iphone && <Botao titulo="Instalar o app" onPress={instalar} testID="botao-instalar" />}
      </View>
    </Cartao>
  );
}
