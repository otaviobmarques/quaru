import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { MENSAGEM_ERRO, PerguntaTour, rascunhoDe, salvarPasso, type Rascunho } from '@/componentes/pergunta-tour';
import { Aviso, Botao, Cartao, Tela, Texto, Toast } from '@/componentes/ui';
import { PASSOS_TOUR } from '@/dominio/apresentacao';
import { temSaude, useEstado } from '@/estado/armazem';

/** Perfil → Meus dados (v0.4.1): edita todas as respostas do tour. Cada bloco tem Salvar e Limpar. Só no aparelho. */
export default function MeusDados() {
  const { estado, aplicar } = useEstado();
  const [r, setR] = useState<Rascunho>(() => rascunhoDe(estado));
  const [msg, setMsg] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const salvar = (id: (typeof PASSOS_TOUR)[number]['id'], rr: Rascunho = r) => {
    setErro(null);
    try { salvarPasso(estado, id, rr); aplicar((e) => salvarPasso(e, id, rr)); setMsg('Salvo neste aparelho'); } catch (x) { setErro(MENSAGEM_ERRO[(x as Error).message] ?? 'Não deu para salvar.'); }
  };
  const limpar = (id: (typeof PASSOS_TOUR)[number]['id']) => {
    const vazio: Partial<Rascunho> = { nome: '', aniversarioTxt: '', faixaIdade: null, experiencia: null, tempoTreinoMin: null, local: null, restricoes: [], prefAlimentar: null, lembretes: { treinoHora: null, agua: false }, cidade: '', bairro: '', equipamentos: null };
    const campos: Record<string, (keyof Rascunho)[]> = { nome: ['nome'], idade: ['faixaIdade', 'aniversarioTxt'], experiencia: ['experiencia'], 'tempo-local': ['tempoTreinoMin', 'local'], restricoes: ['restricoes'], alimentacao: ['prefAlimentar'], agua: ['lembretes'], cidade: ['cidade', 'bairro'], equipamentos: ['equipamentos'] };
    const rr = { ...r }; for (const k of campos[id] ?? []) (rr as Record<string, unknown>)[k] = vazio[k];
    setR(rr); salvar(id, rr);
  };
  const editaveis = PASSOS_TOUR.filter((p) => p.pergunta && p.id !== 'objetivo' && p.id !== 'areas' && p.id !== 'medidas');
  return (
    <Tela titulo="Meus dados" voltar={router.back}>
      <Texto suave>Respostas do tour. Tudo é opcional e fica só neste aparelho; entra em Exportar e em Excluir tudo.</Texto>
      <Cartao onPress={() => router.push('/objetivo')}><Texto v="corpo-forte">Objetivo, nível, dias e áreas</Texto><Texto suave>Abrir</Texto></Cartao>
      <Cartao onPress={() => router.push('/peso')}><Texto v="corpo-forte">Altura e peso</Texto><Texto suave>A altura fica no Perfil; o peso, em Peso corporal</Texto></Cartao>
      {erro && <Aviso tom="erro" titulo="Não salvamos" texto={erro} />}
      {editaveis.map((p) => (
        <Cartao key={p.id}>
          <Texto v="titulo-3">{p.titulo}</Texto>
          <PerguntaTour id={p.id} r={r} set={setR} saude={temSaude(estado)} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}><Botao v="secundario" titulo="Salvar" onPress={() => salvar(p.id)} testID={`salvar-${p.id}`} /></View>
            <View style={{ flex: 1 }}><Botao v="texto" titulo="Limpar" onPress={() => limpar(p.id)} testID={`limpar-${p.id}`} /></View>
          </View>
        </Cartao>
      ))}
      {msg && <Toast texto={msg} onFim={() => setMsg(null)} />}
    </Tela>
  );
}
