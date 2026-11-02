import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { ImagemOuEspaco } from '@/componentes/imagem-ou-espaco';
import { Botao, Texto } from '@/componentes/ui';
import { midiaDoExercicio } from '@/dominio/midia-exercicios';
import { useReduzirMovimento } from '@/servicos/movimento';

/**
 * Demonstração animada (v0.4.4): alterna as fotos de início e fim do movimento (~0,8 s cada, transição suave).
 * "Reduzir movimento" ligado: começa na foto parada e mostra "Reproduzir". Sempre há Pausar/Reproduzir
 * (a animação repete sem fim: WCAG 2.2.2). Falha ao baixar: fica a foto parada.
 */
export function AnimacaoExercicio({ exercicioId, nome }: { exercicioId: string; nome: string }) {
  const reduzir = useReduzirMovimento();
  const m = midiaDoExercicio(exercicioId);
  const [escolha, setEscolha] = useState<boolean | null>(null); // null = segue o sistema
  const tocando = escolha ?? !reduzir;
  const [falhou, setFalhou] = useState(false);
  const anima = !!m.animacao && !falhou;
  const fonte = anima && tocando ? m.animacao : m.poster;
  if (!fonte) return (
    <View style={{ gap: 4 }}>
      <ImagemOuEspaco largura="100%" proporcao={3 / 2} cantos="grande" simbolo="🏋" testID="demo-sem-midia" />
      <Texto v="legenda" suave>A fonte não tem fotos deste exercício.</Texto>
    </View>
  );
  return (
    <View style={{ gap: 8 }}>
        <ImagemOuEspaco key={String(fonte && (fonte as { uri?: string }).uri) + tocando} fonte={fonte} largura="100%" proporcao={3 / 2} cantos="grande"
          testID={anima && tocando ? 'demo-animacao' : 'demo-parada'}
          alt={anima && tocando ? `Animação: ${nome}, alternando posição inicial e final` : `Foto ilustrativa: ${nome}, posição inicial`} />
      {anima && (
        <Botao v="secundario" titulo={tocando ? 'Pausar demonstração' : '▶ Reproduzir demonstração'} onPress={() => setEscolha(!tocando)} />
      )}
      {reduzir && anima && !tocando && <Texto v="legenda" suave>“Reduzir movimento” está ligado no aparelho: a animação só roda se você tocar em Reproduzir.</Texto>}
      <Texto v="legenda" suave>Imagens: Free Exercise DB · domínio público (Unlicense)</Texto>
      {falhou ? <Texto v="legenda" suave>Não deu para baixar a animação agora (sem internet?). Mostrando a foto.</Texto> : null}
      <ErroCarga uri={(m.animacao as { uri?: string } | null)?.uri} onErro={() => setFalhou(true)} />
    </View>
  );
}

/** Na web, testa a animação antes de exibir (onError do Image da RNW não dispara para background-image). */
function ErroCarga({ uri, onErro }: { uri?: string; onErro: () => void }) {
  useEffect(() => {
    if (!uri || typeof window === 'undefined' || typeof (globalThis as { Image?: unknown }).Image !== 'function') return;
    const im = new (globalThis as unknown as { Image: new () => HTMLImageElement }).Image();
    im.onerror = onErro; im.src = uri;
    return () => { im.onerror = null; };
  }, [uri]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
