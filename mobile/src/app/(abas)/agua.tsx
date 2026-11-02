import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Animacao } from '@/componentes/animacao';
import { Aviso, Botao, Campo, Cartao, Selo, Tela, Texto, Toast } from '@/componentes/ui';
import { AGUA_MAX_ML, AVISO_AGUA, diaLocal, formatarMl, META_MAX_ML, META_MIN_ML, metaPadraoMl, totalDoDia, ultimos7Dias } from '@/dominio/agua';
import { lerNumero } from '@/dominio/metricas';
import { acoes, temSaude, useEstado } from '@/estado/armazem';
import { novoId } from '@/servicos/id';
import Svg, { Circle } from 'react-native-svg';
import { useCoresBase } from '@/tema/tema';

const DIA_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

/** Tela 11b – Água do dia (v0.4.1). Zera à meia-noite (horário local): o total é calculado pelo dia de cada registro. */
export default function Agua() {
  const b = useCoresBase();
  const { estado, aplicar } = useEstado();
  const agora = new Date();
  const lista = estado.agua ?? [];
  const pesoAtual = estado.pesos.filter((p) => !p.excluidoEm).toSorted((a, b) => (a.medidoEm < b.medidoEm ? -1 : 1)).at(-1);
  const metaManual = estado.perfil?.metaAguaMl ?? null;
  const meta = metaManual ?? metaPadraoMl(pesoAtual?.pesoKg);
  const hoje = totalDoDia(lista, agora);
  const pct = meta ? Math.min(1, hoje / meta) : 0;
  const [ultimo, setUltimo] = useState<{ id: string; ml: number } | null>(null);
  const [outro, setOutro] = useState('');
  const [erro, setErro] = useState<string>();
  const [metaTxt, setMetaTxt] = useState('');
  const [erroMeta, setErroMeta] = useState<string>();
  const somar = (ml: number) => {
    if (!temSaude(estado)) return setErro('Autorize dados de saúde em Perfil → Consentimentos para registrar água.');
    const id = novoId(); const t = new Date().toISOString();
    aplicar((e) => acoes.registrarAgua(e, { id, ml, registradoEm: t, atualizadoEm: t }));
    setUltimo({ id, ml }); setErro(undefined);
  };
  const somarOutro = () => {
    const n = lerNumero(outro);
    if (n == null || !Number.isInteger(n) || n < 1 || n > AGUA_MAX_ML) return setErro(`Digite um valor inteiro de 1 a ${AGUA_MAX_ML} ml`);
    somar(n); setOutro('');
  };
  const salvarMeta = () => {
    if (!metaTxt.trim()) { aplicar((e) => acoes.definirMetaAgua(e, null)); return setErroMeta(undefined); }
    const n = lerNumero(metaTxt);
    if (n == null || !Number.isInteger(n) || n < META_MIN_ML || n > META_MAX_ML) return setErroMeta(`Digite uma meta de ${META_MIN_ML} a ${META_MAX_ML} ml`);
    aplicar((e) => acoes.definirMetaAgua(e, n)); setErroMeta(undefined); setMetaTxt('');
  };
  const semana = ultimos7Dias(lista, agora);
  const registrosHoje = lista.filter((r) => diaLocal(r.registradoEm) === diaLocal(agora)).toSorted((x, y) => (x.registradoEm < y.registradoEm ? 1 : -1));
  const maxSemana = Math.max(meta ?? 0, ...semana.map((d) => d.ml), 1);
  return (
    <Tela logo titulo="Água">
      <Cartao>
        <Selo texto={!meta ? 'SEM META' : hoje >= meta ? '✓ META BATIDA' : `FALTAM ${formatarMl(meta - hoje).toUpperCase()}`} tom={meta && hoje >= meta ? 'sucesso' : 'primaria'} />
        <Texto v="titulo-2">{meta && hoje >= meta ? 'Meta de hoje batida!' : 'Bora bater a meta!'}</Texto>
        <View style={{ alignItems: 'center', paddingVertical: 8 }}>
          {meta && hoje >= meta ? <Animacao nome="meta-de-agua" tamanho={180} /> : (
            <View accessibilityRole="progressbar" accessibilityLabel="Progresso da água de hoje" accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }} testID="barra-agua"
              style={{ width: 200, height: 200, alignItems: 'center', justifyContent: 'center' }}>
              <Svg width={200} height={200} viewBox="0 0 200 200" style={{ position: 'absolute' }} aria-hidden>
                <Circle cx={100} cy={100} r={82} stroke={b['superficie-2']} strokeWidth={22} fill="none" />
                <Circle cx={100} cy={100} r={82} stroke={b.secundaria} strokeWidth={22} fill="none" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 82}`} strokeDashoffset={2 * Math.PI * 82 * (1 - pct)} transform="rotate(-90 100 100)" />
              </Svg>
              <Texto v="numero-grande">{formatarMl(hoje)}</Texto>
              <Texto v="rotulo" suave>{meta ? `de ${formatarMl(meta)} · ${Math.round(pct * 100)}%` : 'Sem meta definida'}</Texto>
            </View>
          )}
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <BotaoAgua ml={250} rotulo="copo" onPress={() => somar(250)} testID="agua-250" />
          <BotaoAgua ml={500} rotulo="garrafa" onPress={() => somar(500)} testID="agua-500" />
        </View>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-end' }}>
          <Campo expandir rotulo="Outro valor (ml)" value={outro} onChangeText={(t) => { setOutro(t); setErro(undefined); }} keyboardType="number-pad" placeholder="300" erro={erro} testID="agua-outro" />
          <View style={{ width: 120, marginBottom: erro ? 20 : 0 }}><Botao v="secundario" titulo="Somar" onPress={somarOutro} testID="agua-somar" /></View>
        </View>
      </Cartao>
      {registrosHoje.length > 0 && (
        <Cartao>
          <Texto v="corpo-forte">Hoje</Texto>
          {registrosHoje.map((r) => (
            <View key={r.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 1, borderColor: b['superficie-2'] }}>
              <Texto>{new Date(r.registradoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Texto>
              <Texto v="corpo-forte">{formatarMl(r.ml)}</Texto>
            </View>
          ))}
        </Cartao>
      )}
      {ultimo && <Toast texto={`+${ultimo.ml} ml registrados`} acao="Desfazer" onAcao={() => { const id = ultimo.id; aplicar((e) => acoes.desfazerAgua(e, id)); setUltimo(null); }} onFim={() => setUltimo(null)} />}
      <Cartao>
        <Texto v="corpo-forte">Meta do dia</Texto>
        <Texto v="rotulo" suave>{metaManual ? `Meta definida por você: ${formatarMl(metaManual)}.` : pesoAtual ? `Padrão: 35 ml por kg do último peso (${pesoAtual.pesoKg.toLocaleString('pt-BR')} kg), arredondado: ${formatarMl(meta!)}.` : 'Registre seu peso para calcular a meta padrão, ou defina a meta abaixo.'}</Texto>
        {!pesoAtual && !metaManual && <Botao v="texto" titulo="Registrar peso" onPress={() => router.push('/peso')} />}
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-end' }}>
          <Campo expandir rotulo="Definir meta (ml)" value={metaTxt} onChangeText={(t) => { setMetaTxt(t); setErroMeta(undefined); }} keyboardType="number-pad" placeholder={meta ? String(meta) : '2000'} erro={erroMeta} ajuda="Deixe vazio e salve para voltar ao padrão." testID="agua-meta" />
          <View style={{ width: 120, marginBottom: erroMeta ? 20 : 24 }}><Botao v="secundario" titulo="Salvar" onPress={salvarMeta} testID="agua-salvar-meta" /></View>
        </View>
      </Cartao>
      <Cartao>
        <Texto v="corpo-forte">Últimos 7 dias</Texto>
        <View accessible accessibilityLabel={`Últimos 7 dias: ${semana.map((d) => `${DIA_SEMANA[new Date(d.dia + 'T12:00').getDay()]} ${formatarMl(d.ml)}`).join(', ')}`} style={{ flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 6 }}>
          {semana.map((d) => (
            <View key={d.dia} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <View style={{ width: '100%', height: Math.max(4, (d.ml / maxSemana) * 90), borderRadius: 4, backgroundColor: meta && d.ml >= meta ? b.secundaria : b['texto-suave'] }} />
              <Texto v="legenda" suave>{DIA_SEMANA[new Date(d.dia + 'T12:00').getDay()]}</Texto>
            </View>
          ))}
        </View>
      </Cartao>
      <Aviso tom="alerta" titulo="Referência geral" texto={AVISO_AGUA} />
    </Tela>
  );
}

/** Botão rápido de água (v3.2): azul da secundária, "+ 250 ml" grande e o recipiente embaixo. */
function BotaoAgua({ ml, rotulo, onPress, testID }: { ml: number; rotulo: string; onPress: () => void; testID: string }) {
  const b = useCoresBase();
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={`Somar ${ml} ml (${rotulo})`} onPress={onPress}
      style={(st) => [{ flex: 1, minHeight: 56, borderRadius: 14, backgroundColor: b.secundaria, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, opacity: (st as { pressed: boolean }).pressed ? 0.85 : 1 }]}>
      <Text style={{ color: b['sobre-secundaria'], fontSize: 17, lineHeight: 22, fontWeight: '800' }}>+ {ml} ml</Text>
      <Text style={{ color: b['sobre-secundaria'], fontSize: 12, lineHeight: 16 }}>{rotulo}</Text>
    </Pressable>
  );
}
