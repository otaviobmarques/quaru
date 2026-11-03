import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { Aviso, Botao, Cartao, Tela, Texto } from '@/componentes/ui';
import { codigoValido } from '@/dominio/treinador';
import { acoes, useEstado } from '@/estado/armazem';
import { useSessao } from '@/estado/sessao';
import { aceitarVinculo, buscarDoTreinador } from '@/servicos/treinador';

const MENSAGENS: Record<string, string> = {
  codigo_invalido: 'Este link não vale mais. Peça um link novo ao seu treinador.',
  ja_usado: 'Este link já foi usado por outra conta. Peça um link novo ao seu treinador.',
  proprio_treinador: 'Este é um link seu, para mandar ao aluno: não dá para vincular a si mesmo.',
  ja_vinculado: 'Sua conta já está vinculada a este treinador.',
  sem_servidor: 'O vínculo com treinador precisa de conta no Quaru.',
  erro: 'Não deu para vincular agora. Confira a internet e tente de novo.',
};

/**
 * v0.8: aberta pelo link do treinador (…/quaru/vincular?codigo=…). Sem login, guarda o código e leva para entrar;
 * depois do login, volta aqui. A pessoa confirma antes: o treinador passa a ver o e-mail dela e a mandar treinos.
 */
export default function Vincular() {
  const { codigo: c0 } = useLocalSearchParams<{ codigo?: string }>();
  const s = useSessao();
  const { estado, aplicar } = useEstado();
  const codigo = (c0 ?? estado.vinculoPendente ?? '').trim().toLowerCase();
  const logado = s.modo === 'conta' && !!s.usuario && !!s.acesso?.ativo;
  const [estadoTela, setEstadoTela] = useState<'pergunta' | 'enviando' | 'ok' | 'erro'>('pergunta');
  const [texto, setTexto] = useState('');
  const valido = codigoValido(codigo);
  useEffect(() => {
    if (valido && !logado && estado.vinculoPendente !== codigo) aplicar((e) => acoes.guardarVinculoPendente(e, codigo));
  }, [valido, logado, codigo, estado.vinculoPendente, aplicar]);

  const vincular = async () => {
    setEstadoTela('enviando');
    const r = await aceitarVinculo(codigo);
    if (r.resultado === 'vinculado' || r.resultado === 'ja_vinculado') {
      aplicar((e) => acoes.guardarVinculoPendente(e, null));
      setTexto(r.resultado === 'vinculado' ? `Pronto! Agora você treina com ${r.treinador}.` : MENSAGENS.ja_vinculado);
      setEstadoTela('ok');
      const d = await buscarDoTreinador().catch(() => null);
      if (d) aplicar((e) => acoes.receberTreinosDoTreinador(e, d.vinculos, d.treinos));
    } else { setTexto(MENSAGENS[r.resultado] ?? MENSAGENS.erro); setEstadoTela('erro'); if (r.resultado !== 'erro') aplicar((e) => acoes.guardarVinculoPendente(e, null)); }
  };

  if (!valido) return (
    <Tela titulo="Vincular treinador" voltar={() => router.replace('/')}>
      <Aviso tom="erro" titulo="Link incompleto" texto="Abra o link inteiro que o seu treinador mandou." />
    </Tela>
  );
  if (!logado) return (
    <Tela titulo="Vincular treinador">
      <Texto v="titulo-1">Seu treinador está no Quaru</Texto>
      <Texto suave>Entre na sua conta para receber os treinos dele. Depois de entrar, você volta para cá.</Texto>
      <Botao grande titulo="Entrar" onPress={() => router.replace('/entrar')} testID="vincular-entrar" />
      <Texto v="rotulo" suave>Ainda não tem conta? Peça ao seu treinador ou ao administrador do Quaru.</Texto>
    </Tela>
  );
  return (
    <Tela titulo="Vincular treinador" voltar={() => router.replace('/')}>
      {estadoTela === 'ok' ? (
        <>
          <Texto v="titulo-1">Vinculado ✓</Texto>
          <Texto>{texto}</Texto>
          <Texto suave>Os treinos que ele montar aparecem em Meus treinos e na sua agenda.</Texto>
          <Botao grande titulo="Ver meus treinos" onPress={() => router.replace('/treinos?secao=meus' as never)} testID="ver-treinos-treinador" />
        </>
      ) : (
        <>
          <Texto v="titulo-1">Vincular sua conta a um treinador?</Texto>
          <Cartao>
            <Texto v="corpo-forte">O que muda</Texto>
            <Texto v="rotulo">• Os treinos que ele montar para você aparecem no seu app.</Texto>
            <Texto v="rotulo">• Ele passa a ver o seu e-mail.</Texto>
            <Texto v="rotulo">• Seus registros de treino, peso e água continuam só no seu aparelho.</Texto>
            <Texto v="rotulo">• Você pode desvincular quando quiser, em Perfil.</Texto>
          </Cartao>
          {estadoTela === 'erro' && <Aviso tom="erro" titulo={texto} />}
          <Botao grande titulo={estadoTela === 'enviando' ? 'Vinculando…' : 'Vincular'} carregando={estadoTela === 'enviando'} onPress={vincular} testID="confirmar-vinculo" />
          <Botao v="texto" titulo="Agora não" onPress={() => { aplicar((e) => acoes.guardarVinculoPendente(e, null)); router.replace('/'); }} />
        </>
      )}
    </Tela>
  );
}
