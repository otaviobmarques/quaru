import { useState } from 'react';
import { Pressable, Text, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import { useCoresBase } from '@/tema/tema';

/**
 * Gráficos v0.5 (uma série por gráfico, sem legenda: o título diz o que é).
 * Marcas finas (linha de 2 px, ponto final r=4 com anel na cor da superfície, área a 10%), grade de 1 px recessiva,
 * rótulo só no último valor e no mínimo/máximo do eixo. Tocar ou passar o mouse mostra o valor do ponto mais próximo;
 * "Ver tabela" lista todos os valores (para leitor de tela e para quem prefere números).
 */
export interface Ponto { rotulo: string; valor: number }

const ALTURA = 160;
const M = { esq: 44, dir: 16, topo: 16, base: 24 };

const fmt = (n: number, casas: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });

function useLargura() {
  const [w, setW] = useState(0);
  return [w, (e: LayoutChangeEvent) => setW(Math.round(e.nativeEvent.layout.width))] as const;
}

function Tabela({ pontos, unidade, casas }: { pontos: Ponto[]; unidade: string; casas: number }) {
  const b = useCoresBase();
  return (
    <View accessibilityRole="list" style={{ borderTopWidth: 1, borderColor: b['superficie-2'] }}>
      {pontos.map((p, i) => (
        <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderColor: b['superficie-2'] }}>
          <Text style={{ color: b['texto-suave'], fontSize: 14 }}>{p.rotulo}</Text>
          <Text style={{ color: b.texto, fontSize: 14, fontWeight: '600', fontVariant: ['tabular-nums'] }}>{fmt(p.valor, casas)} {unidade}</Text>
        </View>
      ))}
    </View>
  );
}

function Rodape({ tabela, setTabela }: { tabela: boolean; setTabela: (v: boolean) => void }) {
  const b = useCoresBase();
  return (
    <Pressable accessibilityRole="button" onPress={() => setTabela(!tabela)} style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' }}>
      <Text style={{ color: b['primaria-texto'], fontSize: 14, fontWeight: '700' }}>{tabela ? 'Ver gráfico' : 'Ver tabela'}</Text>
    </Pressable>
  );
}

/** Dica (tooltip) com o valor escolhido, sempre em tinta de texto. */
function Dica({ p, unidade, casas }: { p: Ponto | null; unidade: string; casas: number }) {
  const b = useCoresBase();
  return (
    <View style={{ minHeight: 22 }} accessibilityLiveRegion="polite">
      {p && <Text style={{ color: b.texto, fontSize: 14, fontVariant: ['tabular-nums'] }}><Text style={{ color: b['texto-suave'] }}>{p.rotulo}: </Text><Text style={{ fontWeight: '700' }}>{fmt(p.valor, casas)} {unidade}</Text></Text>}
    </View>
  );
}

/** Linha ao longo do tempo (peso corporal, carga, 1RM estimado). Os pontos vêm em ordem cronológica. */
export function GraficoLinha({ pontos, unidade, casas = 1, descricao, testID }: { pontos: Ponto[]; unidade: string; casas?: number; descricao: string; testID?: string }) {
  const b = useCoresBase();
  const [w, onLayout] = useLargura();
  const [sel, setSel] = useState<number | null>(null);
  const [tabela, setTabela] = useState(false);
  if (pontos.length === 0) return null;
  const vals = pontos.map((p) => p.valor);
  let min = Math.min(...vals), max = Math.max(...vals);
  if (max - min < 1e-9) { min -= 1; max += 1; }
  const folga = (max - min) * 0.1; min -= folga; max += folga;
  const iw = Math.max(1, w - M.esq - M.dir), ih = ALTURA - M.topo - M.base;
  const x = (i: number) => M.esq + (pontos.length === 1 ? iw / 2 : (i / (pontos.length - 1)) * iw);
  const y = (v: number) => M.topo + (1 - (v - min) / (max - min)) * ih;
  const linha = pontos.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.valor).toFixed(1)}`).join(' ');
  const area = `${linha} L${x(pontos.length - 1).toFixed(1)} ${M.topo + ih} L${x(0).toFixed(1)} ${M.topo + ih} Z`;
  const ultimo = pontos.length - 1;
  const escolher = (e: GestureResponderEvent) => {
    const px = e.nativeEvent.locationX;
    let melhor = 0;
    pontos.forEach((_, i) => { if (Math.abs(x(i) - px) < Math.abs(x(melhor) - px)) melhor = i; });
    setSel(melhor);
  };
  const resumo = `${descricao}. ${pontos.length} ${pontos.length === 1 ? 'registro' : 'registros'}, de ${fmt(vals[0], casas)} a ${fmt(vals[ultimo], casas)} ${unidade}; mínimo ${fmt(Math.min(...vals), casas)}, máximo ${fmt(Math.max(...vals), casas)}.`;
  const marcado = sel ?? ultimo;
  return (
    <View style={{ gap: 4 }} testID={testID}>
      <Dica p={pontos[marcado]} unidade={unidade} casas={casas} />
      {tabela ? <Tabela pontos={pontos} unidade={unidade} casas={casas} /> : (
        <View onLayout={onLayout} accessible accessibilityRole="image" accessibilityLabel={resumo} style={{ height: ALTURA }}
          onStartShouldSetResponder={() => true} onResponderGrant={escolher} onResponderMove={escolher}
          {...({ onMouseMove: (e: { nativeEvent: { offsetX: number } }) => escolher({ nativeEvent: { locationX: e.nativeEvent.offsetX } } as never), onMouseLeave: () => setSel(null) } as object)}>
          {w > 0 && (
            <Svg width={w} height={ALTURA} aria-hidden pointerEvents="none">
              {[0, 0.5, 1].map((t) => <Line key={t} x1={M.esq} x2={w - M.dir} y1={M.topo + t * ih} y2={M.topo + t * ih} stroke={b['superficie-2']} strokeWidth={1} />)}
              <Path d={area} fill={b.primaria} fillOpacity={0.1} />
              <Path d={linha} stroke={b.primaria} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
              {sel != null && <Line x1={x(sel)} x2={x(sel)} y1={M.topo} y2={M.topo + ih} stroke={b['texto-suave']} strokeWidth={1} />}
              <Circle cx={x(marcado)} cy={y(pontos[marcado].valor)} r={5} fill={b.primaria} stroke={b.superficie} strokeWidth={2} />
            </Svg>
          )}
          {/* Eixo: só o topo e a base da escala, e as datas das pontas. */}
          <Text style={{ position: 'absolute', left: 0, top: M.topo - 8, width: M.esq - 6, textAlign: 'right', fontSize: 11, color: b['texto-suave'] }}>{fmt(max, casas === 0 ? 0 : 1)}</Text>
          <Text style={{ position: 'absolute', left: 0, top: M.topo + ih - 8, width: M.esq - 6, textAlign: 'right', fontSize: 11, color: b['texto-suave'] }}>{fmt(min, casas === 0 ? 0 : 1)}</Text>
          <Text style={{ position: 'absolute', left: M.esq, bottom: 2, fontSize: 11, color: b['texto-suave'] }}>{pontos[0].rotulo}</Text>
          {pontos.length > 1 && <Text style={{ position: 'absolute', right: M.dir, bottom: 2, fontSize: 11, color: b['texto-suave'] }}>{pontos[ultimo].rotulo}</Text>}
        </View>
      )}
      <Rodape tabela={tabela} setTabela={setTabela} />
    </View>
  );
}

/** Colunas por período (volume por semana). Coluna de até 24 px, ponta arredondada de 4 px, base reta. */
export function GraficoColunas({ pontos, unidade, casas = 0, descricao, testID }: { pontos: Ponto[]; unidade: string; casas?: number; descricao: string; testID?: string }) {
  const b = useCoresBase();
  const [w, onLayout] = useLargura();
  const [sel, setSel] = useState<number | null>(null);
  const [tabela, setTabela] = useState(false);
  if (pontos.length === 0) return null;
  const max = Math.max(1, ...pontos.map((p) => p.valor));
  const iw = Math.max(1, w - M.dir), ih = ALTURA - M.topo - M.base;
  const faixa = iw / pontos.length;
  const larg = Math.min(24, faixa - 4);
  const marcado = sel ?? pontos.length - 1;
  const resumo = `${descricao}. ${pontos.map((p) => `${p.rotulo}: ${fmt(p.valor, casas)} ${unidade}`).join('; ')}.`;
  return (
    <View style={{ gap: 4 }} testID={testID}>
      <Dica p={pontos[marcado]} unidade={unidade} casas={casas} />
      {tabela ? <Tabela pontos={pontos} unidade={unidade} casas={casas} /> : (
        <View onLayout={onLayout} accessible accessibilityRole="image" accessibilityLabel={resumo} style={{ height: ALTURA }}
          onStartShouldSetResponder={() => true}
          onResponderGrant={(e) => setSel(Math.max(0, Math.min(pontos.length - 1, Math.floor(e.nativeEvent.locationX / faixa))))}
          onResponderMove={(e) => setSel(Math.max(0, Math.min(pontos.length - 1, Math.floor(e.nativeEvent.locationX / faixa))))}
          {...({ onMouseMove: (e: { nativeEvent: { offsetX: number } }) => setSel(Math.max(0, Math.min(pontos.length - 1, Math.floor(e.nativeEvent.offsetX / faixa)))), onMouseLeave: () => setSel(null) } as object)}>
          {w > 0 && (
            <Svg width={w} height={ALTURA} aria-hidden pointerEvents="none">
              <Line x1={0} x2={w} y1={M.topo + ih} y2={M.topo + ih} stroke={b['superficie-2']} strokeWidth={1} />
              {pontos.map((p, i) => {
                const h = (p.valor / max) * ih;
                const cx = i * faixa + faixa / 2;
                const r = Math.min(4, h / 2, larg / 2);
                const x0 = cx - larg / 2, y0 = M.topo + ih - h;
                // Ponta de cima arredondada, base reta.
                const d = h <= 0 ? '' : `M${x0} ${M.topo + ih} L${x0} ${y0 + r} Q${x0} ${y0} ${x0 + r} ${y0} L${x0 + larg - r} ${y0} Q${x0 + larg} ${y0} ${x0 + larg} ${y0 + r} L${x0 + larg} ${M.topo + ih} Z`;
                return d ? <Path key={i} d={d} fill={b.primaria} fillOpacity={sel == null || sel === i ? 1 : 0.45} /> : <Rect key={i} x={x0} y={M.topo + ih - 1} width={larg} height={1} fill={b['texto-suave']} />;
              })}
            </Svg>
          )}
          {pontos.map((p, i) => (i === 0 || i === pontos.length - 1 || pontos.length <= 6) && (
            <Text key={i} style={{ position: 'absolute', bottom: 2, left: i * faixa, width: faixa, textAlign: 'center', fontSize: 11, color: b['texto-suave'] }}>{p.rotulo}</Text>
          ))}
        </View>
      )}
      <Rodape tabela={tabela} setTabela={setTabela} />
    </View>
  );
}
