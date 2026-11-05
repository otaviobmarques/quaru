import { useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';

import { Botao, Texto } from '@/componentes/ui';
import { ORIGEM_ANTIGA, ORIGEM_NOVA, URL_APP_NOVA } from '@/config/endereco';
import { empacotar, TIPO_DADOS, TIPO_PRONTO, TIPO_RECEBIDO } from '@/dominio/mudanca';
import { temDadosPessoais, useEstado } from '@/estado/armazem';
import { useCoresBase } from '@/tema/tema';

/**
 * v0.12.1: só no endereço antigo (GitHub Pages). Avisa que o Quaru mudou para app.quaru.com.br e leva os dados
 * deste aparelho para lá (janela nova + postMessage). Plano B: baixar um arquivo e escolher no endereço novo.
 */
export function AvisoNovoEndereco() {
  const { estado } = useEstado();
  const b = useCoresBase();
  const [fase, setFase] = useState<'inicio' | 'enviando' | 'ok' | 'erro'>('inicio');
  const ref = useRef(estado);
  useEffect(() => { ref.current = estado; }, [estado]);
  if (Platform.OS !== 'web' || typeof window === 'undefined' || window.location.origin !== ORIGEM_ANTIGA) return null;
  const temDados = temDadosPessoais(estado);

  const levar = () => {
    if (!temDados) { window.location.href = URL_APP_NOVA; return; }
    const w = window.open(`${URL_APP_NOVA}receber-dados`, '_blank');
    if (!w) { setFase('erro'); return; }
    setFase('enviando');
    const ouvir = (ev: MessageEvent) => {
      if (ev.origin !== ORIGEM_NOVA || ev.source !== w) return;
      if (ev.data?.tipo === TIPO_PRONTO) w.postMessage({ tipo: TIPO_DADOS, pacote: empacotar(ref.current) }, ORIGEM_NOVA);
      if (ev.data?.tipo === TIPO_RECEBIDO) { setFase('ok'); window.removeEventListener('message', ouvir); }
    };
    window.addEventListener('message', ouvir);
  };
  const baixar = () => {
    const blob = new Blob([empacotar(ref.current)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'quaru-meus-dados.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };

  return (
    <View testID="aviso-novo-endereco" style={{ backgroundColor: b.tinta, paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}>
      <Texto v="corpo-forte" cor="#FFFFFF">{fase === 'ok' ? 'Pronto! Seus dados já estão no novo endereço.' : 'O Quaru mudou de endereço: app.quaru.com.br'}</Texto>
      <Texto v="rotulo" cor="#F7F3F4">{fase === 'ok' ? 'Continue por lá (e instale o app de novo pelo endereço novo). Este endereço vai sair do ar.'
        : temDados ? 'Seus treinos ficam guardados neste aparelho. Toque abaixo para levar tudo para o endereço novo.' : 'Toque abaixo para abrir o endereço novo.'}</Texto>
      {fase === 'erro' && <Texto v="rotulo" cor="#FBBF24">O navegador bloqueou a nova janela. Permita pop-ups para este site ou use “Baixar meus dados”.</Texto>}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {fase === 'ok'
          ? <Botao titulo="Abrir app.quaru.com.br" onPress={() => { window.location.href = URL_APP_NOVA; }} testID="abrir-novo-endereco" />
          : <Botao titulo={fase === 'enviando' ? 'Levando…' : temDados ? 'Levar meus dados' : 'Abrir o endereço novo'} onPress={levar} testID="levar-dados" />}
        {temDados && fase !== 'ok' && <Botao v="secundario" titulo="Baixar meus dados" onPress={baixar} testID="baixar-dados" />}
      </View>
    </View>
  );
}
