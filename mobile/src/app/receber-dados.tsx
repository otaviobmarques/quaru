import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { Aviso, Botao, Cartao, Tela, Texto } from '@/componentes/ui';
import { ORIGEM_ANTIGA } from '@/config/endereco';
import { desempacotar, resumoDados, TIPO_DADOS, TIPO_PRONTO, TIPO_RECEBIDO } from '@/dominio/mudanca';
import { temDadosPessoais, useEstado, type Estado } from '@/estado/armazem';

/**
 * v0.12.1: recebe os dados do aparelho vindos do endereço antigo (janela aberta por ele, ou arquivo baixado lá).
 * Só aceita mensagens da origem antiga. Se este navegador já tem dados aqui, pergunta antes de substituir.
 */
export default function ReceberDados() {
  const { estado, pronto, aplicar } = useEstado();
  const [fase, setFase] = useState<'esperando' | 'conferir' | 'ok' | 'erro'>('esperando');
  const [vindo, setVindo] = useState<Estado | null>(null);
  const origem = useRef<MessageEventSource | null>(null);
  const jaTem = temDadosPessoais(estado);

  const gravar = (e: Estado) => {
    aplicar(() => e);
    setFase('ok');
    try { (origem.current as Window | null)?.postMessage({ tipo: TIPO_RECEBIDO }, ORIGEM_ANTIGA); } catch { /* janela fechada */ }
  };
  const receber = (e: Estado | null) => {
    if (!e) { setFase('erro'); return; }
    setVindo(e);
    setFase('conferir');
  };

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function' || !pronto) return;
    const ouvir = (ev: MessageEvent) => {
      if (ev.origin !== ORIGEM_ANTIGA || ev.data?.tipo !== TIPO_DADOS) return;
      origem.current = ev.source;
      receber(desempacotar(ev.data.pacote));
    };
    window.addEventListener('message', ouvir);
    try { window.opener?.postMessage({ tipo: TIPO_PRONTO }, ORIGEM_ANTIGA); } catch { /* sem janela de origem */ }
    return () => window.removeEventListener('message', ouvir);
  }, [pronto]);

  const escolherArquivo = () => {
    const i = document.createElement('input');
    i.type = 'file'; i.accept = 'application/json,.json';
    i.onchange = async () => { const f = i.files?.[0]; if (f) receber(desempacotar(await f.text())); };
    i.click();
  };

  const r = vindo ? resumoDados(vindo) : null;
  return (
    <Tela titulo="Trazer meus dados" voltar={() => router.replace('/')}>
      {fase === 'esperando' && (
        <>
          <Texto v="titulo-2">Trazendo os seus dados…</Texto>
          <Texto suave>Se você abriu esta página pelo botão “Levar meus dados” no endereço antigo, aguarde alguns segundos.</Texto>
          {Platform.OS === 'web' && (
            <Cartao>
              <Texto v="corpo-forte">Baixou o arquivo “quaru-meus-dados.json”?</Texto>
              <Botao v="secundario" titulo="Escolher o arquivo" onPress={escolherArquivo} testID="escolher-arquivo" />
            </Cartao>
          )}
        </>
      )}
      {fase === 'erro' && <Aviso tom="erro" titulo="Não deu para ler os dados" texto="Volte ao endereço antigo e tente de novo, ou baixe o arquivo de novo." />}
      {fase === 'conferir' && r && (
        <Cartao destaque>
          <Texto v="titulo-3">Dados encontrados</Texto>
          <Texto v="rotulo">{`${r.treinos} treinos montados · ${r.sessoes} treinos feitos · ${r.pesos} registros de peso`}</Texto>
          {jaTem && <Aviso tom="alerta" titulo="Este navegador já tem dados do Quaru" texto="Trazer os dados do endereço antigo substitui os que estão aqui." />}
          <Botao grande titulo={jaTem ? 'Substituir pelos dados antigos' : 'Trazer meus dados'} onPress={() => gravar(vindo!)} testID="confirmar-trazer" />
          <Botao v="texto" titulo="Cancelar" onPress={() => router.replace('/')} />
        </Cartao>
      )}
      {fase === 'ok' && (
        <>
          <Aviso tom="sucesso" titulo="Pronto! Seus dados estão aqui." texto="Agora é só entrar com a sua conta. Se tinha o app instalado, instale de novo por este endereço." />
          <Botao grande titulo="Continuar" onPress={() => router.replace('/')} testID="continuar-depois" />
        </>
      )}
    </Tela>
  );
}
