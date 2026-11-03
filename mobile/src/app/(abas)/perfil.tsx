import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';

import { Aviso, Botao, Campo, Cartao, ItemLista, Tela, Texto } from '@/componentes/ui';
import { acoes, temExemplo, temSaude, useEstado } from '@/estado/armazem';
import { useSessao } from '@/estado/sessao';
import { buscarDoTreinador, desvincularTreinador } from '@/servicos/treinador';
import { OBJETIVOS } from '@/dominio/objetivo';
import { FotoPerfil } from '@/componentes/avatares';
import { marca } from '@/config/marca';
import { RodapeMarca } from '@/componentes/rodape-marca';
import { InstalarApp } from '@/componentes/instalar-app';
import { lerNumero } from '@/dominio/metricas';
import { imcSeAplica } from '@/dominio/tour';
import { useContornoInterno, useCoresBase } from '@/tema/tema';
import { ALTURA_MAX_CM, ALTURA_MIN_CM, AVISO_IMC, calcularImc, faixaImc, formatarImc, ROTULO_FAIXA } from '@/dominio/imc';

const TEXTO_MODO = {
  cifrado: 'Dados cifrados neste aparelho (SQLCipher)',
  'teste-sem-cifra': 'Modo de teste: dados SEM cifra (Expo Go/desenvolvimento)',
  web: 'Dados salvos neste navegador, sem criptografia do aparelho',
  bloqueado: 'Armazenamento seguro indisponível',
  memoria: 'Dados só em memória',
} as const;

/** Tela 12 – Perfil/privacidade, com 12b (confirmar exclusão digitando EXCLUIR). */
export default function Perfil() {
  const { estado, aplicar, modoArmazenamento, persistente } = useEstado();
  const sessao = useSessao();
  const { excluir: pedirExcluir } = useLocalSearchParams<{ excluir?: string }>();
  // Compatibilidade: /perfil?excluir=1 (link de Consentimentos) abre direto a folha de apagar na tela Sair.
  useEffect(() => { if (pedirExcluir === '1') router.replace('/sair?apagar=1'); }, [pedirExcluir]);
  const [nome, setNome] = useState(estado.perfil?.nome ?? '');
  const [altura, setAltura] = useState(estado.perfil?.alturaCm != null ? String(estado.perfil.alturaCm) : '');
  const [erroAltura, setErroAltura] = useState<string>();
  const salvarAltura = () => {
    if (!altura.trim()) { aplicar((e) => acoes.definirAltura(e, null)); return setErroAltura(undefined); }
    const n = lerNumero(altura);
    if (n == null || n < ALTURA_MIN_CM || n > ALTURA_MAX_CM) return setErroAltura(`Digite uma altura entre ${ALTURA_MIN_CM} e ${ALTURA_MAX_CM} cm, como 172`);
    if (!temSaude(estado)) return setErroAltura('Autorize dados de saúde em Consentimentos para guardar a altura.');
    setErroAltura(undefined);
    aplicar((e) => acoes.definirAltura(e, Math.round(n)));
  };
  const ultimoPeso = estado.pesos.filter((p) => !p.excluidoEm).toSorted((a, b) => (a.medidoEm < b.medidoEm ? -1 : 1)).at(-1);
  const imc = calcularImc(ultimoPeso?.pesoKg, estado.perfil?.alturaCm);
  const b = useCoresBase();
  const contorno = useContornoInterno();
  return (
    <Tela logo titulo="Perfil">
      <Cartao>
        <View style={{ alignItems: 'center', gap: 8 }}>
          <View style={{ borderWidth: 2, borderColor: contorno, borderRadius: 60, padding: 3, backgroundColor: b['primaria-suave'] }}><FotoPerfil avatar={estado.perfil?.avatar} tamanho={96} /></View>
          <Texto v="titulo-2" style={{ textAlign: 'center' }}>{estado.perfil?.nome || 'Seu perfil'}</Texto>
          <Botao v="secundario" titulo={estado.perfil?.avatar ? 'Trocar foto ou avatar' : 'Escolher foto ou avatar'} onPress={() => router.push('/foto-perfil')} testID="abrir-foto-perfil" />
        </View>
        <Campo rotulo="Como quer ser chamado (opcional)" value={nome} maxLength={40} onChangeText={setNome} onBlur={() => aplicar((e) => acoes.definirNome(e, nome))} onSubmitEditing={() => aplicar((e) => acoes.definirNome(e, nome))} autoComplete="off" ajuda="Fica só neste aparelho." testID="campo-nome" />
      </Cartao>
      <View style={{ flexDirection: 'row', gap: 10 }} testID="numeros-perfil">
        {[
          ['Altura', estado.perfil?.alturaCm ? `${(estado.perfil.alturaCm / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} m` : '–'],
          ['Peso', ultimoPeso ? `${ultimoPeso.pesoKg.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg` : '–'],
          ['IMC', imc != null ? formatarImc(imc) : '–'],
        ].map(([r, v]) => (
          <View key={r} style={{ flex: 1 }}><Cartao><Texto v="legenda" suave>{r}</Texto><Texto v="titulo-3">{v}</Texto></Cartao></View>
        ))}
      </View>
      {temExemplo(estado) && <Texto v="rotulo">Valores de exemplo.</Texto>}
      {(estado.vinculos ?? []).map((v) => (
        <Cartao key={v.aluno_ref}>
          <Texto v="legenda" suave>MEU TREINADOR</Texto>
          <Texto v="titulo-3">{v.treinador}</Texto>
          <Texto v="rotulo" suave>Os treinos dele aparecem em Meus treinos. Ele vê o seu e-mail; seus registros ficam no seu aparelho.</Texto>
          <Botao v="destrutivo" titulo="Desvincular" testID={`desvincular-${v.aluno_ref}`} onPress={async () => {
            if (!(await desvincularTreinador(v.aluno_ref))) return;
            const d = await buscarDoTreinador().catch(() => null); // o que continua valendo (outros treinadores)
            if (d) aplicar((e) => acoes.receberTreinosDoTreinador(e, d.vinculos, d.treinos));
          }} />
        </Cartao>
      ))}
      <Cartao>
        <Texto v="corpo-forte">Altura e IMC</Texto>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-end' }}>
          <Campo expandir rotulo="Altura (cm)" value={altura} onChangeText={(t) => { setAltura(t); setErroAltura(undefined); }} keyboardType="number-pad" placeholder="172" erro={erroAltura} testID="campo-altura" />
          <View style={{ width: 120, marginBottom: erroAltura ? 20 : 0 }}><Botao v="secundario" titulo="Salvar" onPress={salvarAltura} testID="salvar-altura" /></View>
        </View>
        {imc != null && !imcSeAplica(estado.perfil?.faixaIdade) ? (
          <Texto v="rotulo" suave>IMC {formatarImc(imc)} · a faixa da OMS para adultos não se aplica a menores de 18 anos. Para crianças e adolescentes, o pediatra usa curvas por idade.</Texto>
        ) : imc != null ? (
          <View accessible accessibilityLabel={`IMC ${formatarImc(imc)}, faixa ${ROTULO_FAIXA[faixaImc(imc)]}, com o último peso`} testID="imc">
            <Texto v="titulo-2">IMC {formatarImc(imc)}</Texto>
            <Texto v="rotulo" suave>Faixa da OMS para adultos: {ROTULO_FAIXA[faixaImc(imc)]} · com o último peso registrado</Texto>
          </View>
        ) : <Texto v="rotulo" suave>{estado.perfil?.alturaCm ? 'Registre um peso para ver o IMC.' : 'Informe a altura e registre um peso para ver o IMC.'}</Texto>}
        <Aviso tom="secundaria" titulo="Sobre o IMC" texto={AVISO_IMC} />
      </Cartao>
      {sessao.modo === 'conta' && sessao.usuario
        ? <Texto suave>Conta: {sessao.usuario.email}{sessao.acesso?.papel === 'admin' ? ' · administrador' : ''} · treinos guardados {Platform.OS === 'web' ? 'neste navegador' : 'neste aparelho'}</Texto>
        : <Texto suave>{Platform.OS === 'web' ? 'Modo local · sem cadastro · dados só neste navegador' : 'Modo local · sem cadastro · dados só neste aparelho'}</Texto>}
      <Texto v="rotulo" suave>{TEXTO_MODO[modoArmazenamento]}</Texto>
      {modoArmazenamento === 'web' && <Aviso tom="alerta" titulo="Versão web" texto="Dados salvos neste navegador, sem criptografia do aparelho. Quem usar este navegador ou computador pode vê-los. Limpar os dados do site apaga tudo; exporte seus dados com frequência." />}
      {modoArmazenamento === 'web' && persistente != null && <Texto v="legenda" suave>{persistente ? 'O navegador aceitou guardar os dados de forma persistente (ele não apaga sozinho por falta de espaço).' : 'O navegador não garantiu guardar os dados de forma persistente. Instalar o app na tela inicial ajuda.'}</Texto>}
      {modoArmazenamento === 'bloqueado' && <Aviso tom="erro" titulo="Armazenamento seguro indisponível" texto="Este aparelho não abriu o banco cifrado. Nada é gravado até isso ser resolvido; exporte seus dados se puder." />}
      {Platform.OS !== 'web' && estado.permissaoNotificacao === 'negada' && <Aviso tom="alerta" titulo="Avisos de descanso desativados" texto="Ative as notificações nos ajustes do aparelho para ser avisado quando o descanso terminar." />}
      <Cartao>
        <ItemLista titulo="Meus dados" sub="Respostas do tour: idade, experiência, lembretes e mais" onPress={() => router.push('/meus-dados')} />
        <ItemLista titulo="Objetivo e foco" sub={estado.perfil?.treino ? `${OBJETIVOS.find((o) => o.id === estado.perfil!.treino!.objetivo)?.nome} · ${estado.perfil.treino.dias} dias por semana` : 'Ainda não escolhido'} onPress={() => router.push('/objetivo')} />
        <ItemLista titulo="Como usar o Quaru" sub="Rever a apresentação" onPress={() => router.push('/boas-vindas?rever=1')} />
        <ItemLista titulo="Consentimentos" sub={temSaude(estado) ? 'Dados de saúde autorizados' : 'Dados de saúde não autorizados'} onPress={() => router.push('/consentimentos')} />
        <ItemLista titulo="Peso corporal" onPress={() => router.push('/peso')} />
        <ItemLista titulo="Exportar meus dados" sub=".zip com JSON e CSV" onPress={() => router.push('/exportar')} />
        <ItemLista titulo="Sincronização: itens com erro" sub={`${estado.fila.filter((i) => i.erro).length} com erro · ${estado.fila.length} na fila`} onPress={() => router.push('/fila')} />
        <ItemLista titulo="Termos de uso e privacidade" sub="RASCUNHO · em revisão jurídica" onPress={() => router.push('/juridico')} />
        <ItemLista titulo={Platform.OS === 'web' ? 'Verificar atualizações' : 'Versão do app'} sub={`Versão ${marca.versao} · O que há de novo`} onPress={() => router.push('/atualizacao')} />
        <ItemLista titulo="Sobre o app" sub="Desenvolvido por Domma Tecnologia · licenças" onPress={() => router.push('/sobre')} ultimo />
      </Cartao>
      <Cartao>
        <Texto v="corpo-forte">Dados de exemplo</Texto>
        <Texto v="rotulo" suave>Carrega treinos, histórico e pesos FICTÍCIOS, marcados como exemplo, para conhecer o app.</Texto>
        {temExemplo(estado)
          ? <Botao v="secundario" titulo="Remover dados de exemplo" onPress={() => aplicar(acoes.removerExemplo)} />
          : <Botao v="secundario" titulo="Carregar dados de exemplo" onPress={() => aplicar((e) => acoes.carregarExemplo(e))} />}
      </Cartao>
      {/* v0.4.3: "Sair" é o botão principal comum; a tela Sair (05b) traz também "Sair e apagar". */}
      <Botao titulo="Sair" testID="ir-sair" onPress={() => router.push('/sair')} />
      <InstalarApp />
      <RodapeMarca />
    </Tela>
  );
}
