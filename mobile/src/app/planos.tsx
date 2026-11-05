import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';

import { Mascote } from '@/componentes/mascote';
import { Aviso, Botao, Campo, Cartao, Selo, Tela, Texto } from '@/componentes/ui';
import {
  cpfCnpjValido, dataCurtaBr, diasDeTeste, economia, mascararCpfCnpj, nomeDoPlano, PLANOS, podeTreinar, porMes, reais, type IdPlano,
} from '@/dominio/plano';
import { acoes, useEstado } from '@/estado/armazem';
import { useSessao } from '@/estado/sessao';
import { assinar, buscarPlano, cancelarAssinatura, linkDePagamento } from '@/servicos/assinatura';
import { useCores, useCoresBase, useContornoInterno } from '@/tema/tema';

const INCLUI = ['Treino do dia (musculação e cardio)', 'Agenda da semana e do mês', 'Cronômetro de descanso com aviso de tela bloqueada', 'Evolução: peso, IMC, volume e recordes', 'Treinos do seu treinador', 'Água e alimentação'];

/**
 * v0.12 (ADR-0026): planos de assinatura. Teste grátis de 7 dias sem cartão; depois, Mensal, Trimestral ou Anual.
 * O pagamento é na página do Asaas (Pix, boleto ou cartão): o app nunca vê dados de cartão. O CPF vai só para o Asaas.
 */
export default function Planos() {
  const { motivo: motivo0 } = useLocalSearchParams<{ motivo?: string }>();
  const { estado, aplicar } = useEstado();
  const s = useSessao();
  const c = useCores(); const b = useCoresBase(); const contorno = useContornoInterno();
  const p = estado.plano ?? null;
  const [escolhido, setEscolhido] = useState<IdPlano>(p?.plano ?? 'anual');
  const [nome, setNome] = useState(estado.perfil?.nome ?? '');
  const [doc, setDoc] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [cancelar, setCancelar] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [agora] = useState(() => new Date());
  const dias = diasDeTeste(p, agora);
  const pode = podeTreinar(p, agora);
  const pagoAte = p?.valido_ate && +new Date(p.valido_ate) > agora.getTime() ? p.valido_ate : null;
  const temAssinatura = !!p?.plano && p.status !== 'cancelada' && p.status !== 'teste';

  const atualizar = async () => {
    setMsg(null);
    const pl = await buscarPlano().catch(() => null);
    if (pl) { aplicar((e) => acoes.receberPlano(e, pl)); setMsg(pl.motivo === 'assinante' ? 'Pagamento confirmado. Bom treino! 💪' : 'Ainda não recebemos a confirmação. Pix confirma em segundos; boleto, em até 2 dias úteis.'); }
    else setMsg('Sem conexão. Tente de novo em instantes.');
  };
  const pedirAssinatura = async () => {
    setErro(null);
    if (nome.trim().split(/\s+/).length < 2) return setErro('Digite o seu nome completo (como no documento).');
    if (!cpfCnpjValido(doc)) return setErro('Confira o CPF (ou CNPJ). Ele é exigido para emitir a cobrança.');
    setEnviando(true);
    const r = await assinar(escolhido, doc, nome);
    setEnviando(false);
    if (r.erro) return setErro(r.erro);
    if (r.url) setLink(r.url); else setMsg('Assinatura criada. A cobrança aparece no seu e-mail.');
    atualizar();
  };
  const pagarAgora = async () => {
    setErro(null); setEnviando(true);
    const r = await linkDePagamento();
    setEnviando(false);
    if (r.erro) setErro(r.erro); else if (r.url) setLink(r.url);
  };

  return (
    <Tela titulo="Planos" voltar={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
      {motivo0 === 'bloqueado' && !pode && (
        <Cartao destaque>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Mascote tamanho={72} />
            <View style={{ flex: 1, gap: 4 }}>
              <Texto v="titulo-3">{pagoAte === null && p?.valido_ate ? 'Sua assinatura venceu' : 'Seu teste grátis acabou'}</Texto>
              <Texto v="rotulo" suave>Escolha um plano para continuar treinando. Seu histórico e a sua evolução continuam aqui.</Texto>
            </View>
          </View>
        </Cartao>
      )}

      {/* Situação atual */}
      {p && (
        <Cartao>
          <Texto v="legenda" suave>MEU PLANO</Texto>
          {p.motivo === 'isento' ? <Texto v="corpo-forte">{p.cortesia ? 'Acesso cortesia do Quaru 🎁' : 'Acesso liberado (conta de treinador ou administração)'}</Texto>
            : pagoAte ? (
              <>
                <Texto v="titulo-3">{`Plano ${nomeDoPlano(p.plano) ?? ''}`}</Texto>
                <Texto v="rotulo" suave>{p.status === 'cancelada' ? `Cancelado. Você treina até ${dataCurtaBr(pagoAte)}.` : `Válido até ${dataCurtaBr(pagoAte)}. Renova sozinho.`}</Texto>
              </>
            ) : dias != null && dias > 0 ? (
              <>
                <Texto v="titulo-3">{`Teste grátis: ${dias === 1 ? 'falta 1 dia' : `faltam ${dias} dias`}`}</Texto>
                <Texto v="rotulo" suave>{`Até ${dataCurtaBr(p.teste_ate!)}. Assine agora e não perca nenhum treino.`}</Texto>
              </>
            ) : p.motivo === 'livre' ? <Texto v="rotulo" suave>Por enquanto, o Quaru está liberado para você.</Texto>
            : <Texto v="corpo-forte">Sem plano ativo</Texto>}
          {(p.status === 'pendente' || p.status === 'atrasada') && (
            <View style={{ gap: 8 }}>
              <Aviso tom={p.status === 'atrasada' ? 'alerta' : 'secundaria'} titulo={p.status === 'atrasada' ? 'Pagamento em atraso' : 'Aguardando o pagamento'} texto="Pague pela página do Asaas (Pix, boleto ou cartão). O acesso libera sozinho quando o pagamento é confirmado." />
              <Botao titulo="Pagar agora" carregando={enviando} onPress={pagarAgora} testID="pagar-agora" />
            </View>
          )}
        </Cartao>
      )}

      {link && (
        <Cartao destaque>
          <Texto v="corpo-forte">Falta pagar 👇</Texto>
          <Texto v="rotulo" suave>Abra a página de pagamento do Asaas e escolha Pix, boleto ou cartão. Pix confirma em segundos.</Texto>
          <Botao grande titulo="Abrir pagamento" onPress={() => Linking.openURL(link)} testID="abrir-pagamento" />
          <Botao v="secundario" titulo="Já paguei" onPress={atualizar} testID="ja-paguei" />
        </Cartao>
      )}
      {msg && <Aviso tom={/confirmado/.test(msg) ? 'sucesso' : 'secundaria'} titulo={msg} />}

      {!(p?.motivo === 'isento') && (
        <>
          <Texto v="titulo-2">{temAssinatura ? 'Trocar de plano' : 'Escolha o seu plano'}</Texto>
          <View style={{ gap: 12 }} accessibilityRole="radiogroup">
            {PLANOS.map((pl) => {
              const ativo = escolhido === pl.id;
              const eco = economia(pl);
              return (
                <Pressable key={pl.id} accessibilityRole="radio" accessibilityState={{ checked: ativo }} accessibilityLabel={`Plano ${pl.nome}, ${reais(pl.valor)}`} onPress={() => setEscolhido(pl.id)} testID={`plano-${pl.id}`}
                  style={{ borderWidth: ativo ? 3 : 2, borderColor: ativo ? c.primaria : contorno, borderRadius: 20, padding: 16, backgroundColor: b.superficie, gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Texto v="titulo-3">{pl.nome}</Texto>
                    {pl.destaque && <Selo texto={pl.destaque} tom="primaria" />}
                    {eco > 0 && <Selo texto={`Economize ${eco}%`} tom="sucesso" />}
                  </View>
                  <Texto v="titulo-2">{reais(pl.valor)}<Texto v="rotulo" suave>{pl.meses === 1 ? ' por mês' : pl.meses === 3 ? ' a cada 3 meses' : ' por ano'}</Texto></Texto>
                  {pl.meses > 1 && <Texto v="rotulo" suave>{`Sai por ${reais(porMes(pl))} por mês`}</Texto>}
                </Pressable>
              );
            })}
          </View>
          <Cartao>
            <Texto v="corpo-forte">Todos os planos incluem</Texto>
            {INCLUI.map((t) => <Texto key={t} v="rotulo">{`✓ ${t}`}</Texto>)}
          </Cartao>
          {s.modo === 'conta' ? (
            <Cartao>
              <Texto v="corpo-forte">Dados para a cobrança</Texto>
              <Texto v="rotulo" suave>O CPF é exigido para emitir a cobrança e vai só para o Asaas, a empresa que processa o pagamento. O Quaru não guarda o seu CPF nem dados de cartão.</Texto>
              {erro && <Aviso tom="erro" titulo={erro} />}
              <Campo rotulo="Nome completo" value={nome} onChangeText={setNome} autoComplete="name" maxLength={100} testID="campo-nome-cobranca" />
              <Campo rotulo="CPF (ou CNPJ)" value={doc} onChangeText={(t) => setDoc(mascararCpfCnpj(t))} keyboardType="number-pad" maxLength={18} testID="campo-cpf" />
              <Botao grande titulo={enviando ? 'Gerando a cobrança…' : `Assinar o plano ${nomeDoPlano(escolhido)}`} carregando={enviando} onPress={pedirAssinatura} testID="assinar" />
              <Texto v="legenda" suave>Renova automaticamente no fim de cada período. Cancele quando quiser, aqui mesmo: você treina até o fim do período pago.</Texto>
            </Cartao>
          ) : <Aviso titulo="A assinatura precisa de uma conta no Quaru." />}
        </>
      )}

      {temAssinatura && (
        cancelar ? (
          <Cartao destaque>
            <Texto v="corpo-forte">Cancelar a assinatura?</Texto>
            <Texto v="rotulo" suave>{pagoAte ? `Você continua treinando até ${dataCurtaBr(pagoAte)}. Depois, o treino fica bloqueado até assinar de novo.` : 'A cobrança em aberto é cancelada.'}</Texto>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Botao flex v="secundario" titulo="Manter" onPress={() => setCancelar(false)} />
              <Botao flex v="perigo" titulo="Cancelar assinatura" testID="confirmar-cancelar" onPress={async () => {
                const r = await cancelarAssinatura(); setCancelar(false);
                if (r.erro) setErro(r.erro); else { setMsg('Assinatura cancelada.'); atualizar(); }
              }} />
            </View>
          </Cartao>
        ) : <Botao v="texto" titulo="Cancelar assinatura" onPress={() => setCancelar(true)} testID="cancelar-assinatura" />
      )}
      <Texto v="legenda" cor={b['texto-suave']} style={{ textAlign: 'center' }}>Pagamentos processados pelo Asaas. Dúvidas: fale com o suporte do Quaru.</Texto>
    </Tela>
  );
}
