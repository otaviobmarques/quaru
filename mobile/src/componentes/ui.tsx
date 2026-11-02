import { router } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Image, type ImageSourcePropType, Platform, Pressable, ScrollView, type ScrollViewInstance, StyleSheet, Switch, Text, TextInput, useWindowDimensions, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Simbolo } from '@/componentes/logo';
import { useEstado, temExemplo } from '@/estado/armazem';
import { Bloco, espaco, ProvedorSobreFundo, raio, tipografia, toque, useContornoInterno, useCores, useCoresBase, useSobreFundo } from '@/tema/tema';
import { apoio } from '@/tema/tokens';
import { useFonteTitulo } from '@/tema/fontes';

export const LARGURA_COLUNA = 480; // celular-primeiro; no computador a coluna não estica (P2-7)

const t = (k: keyof typeof tipografia) => {
  const v = tipografia[k] as { tamanho: number; alturaLinha: number; peso: string };
  return { fontSize: v.tamanho, lineHeight: v.alturaLinha, fontWeight: v.peso as '400' };
};

/** Contorno de foco de teclado (3 px, cor de foco) – web e teclado externo. */
const foco = (c: ReturnType<typeof useCores>, f?: boolean) => (f ? { outlineWidth: 3, outlineStyle: 'solid', outlineColor: c.foco, outlineOffset: 2 } as object : {});

/**
 * Contêiner de tela. O rodapé fica FORA da rolagem (não cobre conteúdo) e a rolagem tem folga inferior (P0-4).
 * `iconeVoltar` permite "▾" (minimizar) no treino.
 */
export function Tela({ titulo, children, rodape, voltar, iconeVoltar = '‹', rotuloVoltar = 'Voltar', acaoTopo, logo, semRolagem }: {
  titulo?: string; children: ReactNode; rodape?: ReactNode; voltar?: () => void; iconeVoltar?: string; rotuloVoltar?: string; acaoTopo?: ReactNode;
  /** v0.4.1: logotipo discreto no cabeçalho das abas principais (nunca no treino em andamento). */ logo?: boolean;
  /** v0.4.4: o conteúdo tem a própria lista virtualizada (FlatList); a Tela não envolve em ScrollView. */ semRolagem?: boolean;
}) {
  const c = useCoresBase(); // fundo rosa e cores do topo vêm da paleta sobre o fundo (abaixo)
  const f = paletaTopo(c);
  const { estado } = useEstado();
  const { width } = useWindowDimensions();
  // v3.2: título do topo sem corte — quebra linha (sem numberOfLines) e 1,25rem (20 px) até 400 px de largura.
  const tamTitulo = width <= 400 ? { fontSize: 20, lineHeight: 26 } : { fontSize: 24, lineHeight: 30 };
  const ft = useFonteTitulo();
  return (
    <ProvedorSobreFundo>
    <SafeAreaView style={{ flex: 1, backgroundColor: c.fundo }} edges={['top']}>
      <View style={[s.coluna, { flex: 1 }]}>
        {(titulo || voltar || logo || acaoTopo) && (
          <View style={[s.barra, { flexWrap: 'wrap', rowGap: 4 }]}>
            {logo && <View style={{ paddingLeft: espaco[2] }}><BlocoTinta raio={12} sombra={3} fundo="#FFFFFF"><View style={{ padding: 3 }}><Simbolo tamanho={30} /></View></BlocoTinta></View>}
            {voltar && <BotaoIcone rotulo={rotuloVoltar} onPress={voltar}><Text style={{ color: f, fontSize: 24 }}>{iconeVoltar}</Text></BotaoIcone>}
            {titulo ? <Text accessibilityRole="header" testID="titulo-topo" style={[t('titulo-2'), ft, tamTitulo, { color: f, flexGrow: 1, flexShrink: 1, flexBasis: 120, paddingLeft: logo ? espaco[1] : 0 }]}>{titulo}</Text> : null}
            {acaoTopo}
            {temExemplo(estado) && <SeloSimulacao />}
          </View>
        )}
        {temExemplo(estado) && !(titulo || voltar || logo || acaoTopo) && <View style={{ paddingHorizontal: espaco[4], paddingTop: espaco[2] }}><SeloSimulacao /></View>}
        {semRolagem
          ? <View style={{ flex: 1, paddingHorizontal: espaco[4], paddingTop: espaco[4], gap: espaco[3] }}>{children}</View>
          : <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: espaco[4], gap: espaco[4], paddingBottom: espaco[8] }}>{children}</ScrollView>}
        {rodape && <View style={{ padding: espaco[4], paddingTop: espaco[3], borderTopWidth: 1, borderColor: c.borda, backgroundColor: c.fundo }}>{rodape}</View>}
      </View>
    </SafeAreaView>
    </ProvedorSobreFundo>
  );
}
const paletaTopo = (c: ReturnType<typeof useCoresBase>) => c['texto-sobre-fundo'];

/**
 * Selo SIMULAÇÃO do topo (v3.2) quando há dados de exemplo. O leitor de tela ouve a explicação completa;
 * tocar leva ao Perfil, onde os dados de exemplo são removidos.
 */
export function SeloSimulacao() {
  const c = useCores();
  return (
    <Pressable testID="selo-simulacao" accessibilityRole="button" accessibilityLabel="Simulação: dados de EXEMPLO (fictícios) carregados. Toque para remover em Perfil."
      onPress={() => router.push('/perfil')} style={{ minHeight: 44, justifyContent: 'center', marginLeft: 'auto', paddingRight: espaco[2] }}>
      <View style={{ backgroundColor: apoio.energia, borderWidth: 1.5, borderColor: c.texto, paddingVertical: 3, paddingHorizontal: 10, borderRadius: raio.pilula }}>
        <Text style={[t('legenda'), { color: apoio['sobre-energia'], fontWeight: '800', letterSpacing: 0.6 }]}>SIMULAÇÃO</Text>
      </View>
    </Pressable>
  );
}

/** Selo amarelo (energia) com borda no tom do texto: SIMULAÇÃO/EXEMPLO e chamadas do design v2.1. */
export function SeloExemplo({ texto = 'EXEMPLO' }: { texto?: string }) {
  const c = useCores();
  return <View accessibilityRole="text" style={{ backgroundColor: apoio.energia, borderWidth: 1.5, borderColor: c.texto, paddingVertical: 4, paddingHorizontal: espaco[3], marginHorizontal: espaco[4], borderRadius: raio.pilula, alignSelf: 'flex-start' }}><Text style={[t('legenda'), { color: apoio['sobre-energia'], fontWeight: '700' }]}>{texto}</Text></View>;
}

/** Selo de chamada (energia): "Comece aqui", "Popular", "Novo". */
export function SeloEnergia({ texto }: { texto: string }) {
  const c = useCores();
  return <View style={{ alignSelf: 'flex-start', backgroundColor: apoio.energia, borderWidth: 1.5, borderColor: c.texto, borderRadius: raio.pilula, paddingHorizontal: 12, paddingVertical: 4 }}><Text style={[t('legenda'), { color: apoio['sobre-energia'], fontWeight: '700', letterSpacing: 0.5 }]}>{texto.toUpperCase()}</Text></View>;
}

/** Fundo em degradê da marca (marca → marca-escuro) dos destaques do design v2.1. Texto por cima: branco (4,65:1). */
export function FundoDegrade({ id = 'degrade', raioCanto = 0 }: { id?: string; raioCanto?: number }) {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Defs><LinearGradient id={id} x1="0" y1="0" x2="0.6" y2="1"><Stop offset="0" stopColor={apoio.marca} /><Stop offset="1" stopColor={apoio['marca-escuro']} /></LinearGradient></Defs>
      <Rect x="0" y="0" width="100%" height="100%" rx={raioCanto} fill={`url(#${id})`} />
    </Svg>
  );
}

export function Texto({ children, v = 'corpo', suave, cor, style, numberOfLines, lang }: { children: ReactNode; v?: keyof typeof tipografia; suave?: boolean; cor?: string; style?: object; numberOfLines?: number; /** v0.4.4: idioma do trecho (web), ex.: "en" no texto original da fonte. */ lang?: string }) {
  const c = useCores();
  const ft = useFonteTitulo();
  const titulo = v === 'titulo-1' || v === 'titulo-2' || v === 'numero-grande'; // v3.2: títulos e números grandes em Bricolage
  return <Text {...((lang ? { lang } : {}) as object)} numberOfLines={numberOfLines} style={[t(v), titulo && ft, { color: cor ?? (suave ? c['texto-suave'] : c.texto), fontVariant: ['tabular-nums'] }, style]}>{children}</Text>;
}

export type VarBotao = 'principal' | 'secundario' | 'texto' | 'destrutivo' | 'perigo';
/** Texto sobre o vermelho sólido do botão "perigo": branco no claro (#C62828, 5,6:1); escuro no tema escuro (#F87171). */
const lum = (h: string) => { const v = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
export const sobreErro = (erro: string) => ((1.05) / (lum(erro) + 0.05) >= 4.5 ? '#FFFFFF' : '#14141A');
export function Botao({ titulo, onPress, v = 'principal', grande, desabilitado, carregando, testID, forcarEstado, flex }: {
  titulo: string; onPress: () => void; v?: VarBotao; grande?: boolean; desabilitado?: boolean; carregando?: boolean; testID?: string;
  /** Só para a galeria de estados (capturas). */ forcarEstado?: 'pressionado' | 'foco'; flex?: boolean;
}) {
  const c = useCores();
  const b = useCoresBase();
  const rosa = useSobreFundo();
  // v3.2: direto sobre o rosa, o principal vira ação escura (acao-sobre-fundo + branco); dentro de bloco segue vermelho.
  const fundo = v === 'principal' ? (rosa ? b['acao-sobre-fundo'] : c.primaria) : v === 'perigo' ? b.erro : v === 'secundario' ? b.superficie : 'transparent';
  const cor = v === 'principal' ? (rosa ? b['sobre-acao-sobre-fundo'] : c['sobre-primaria']) : v === 'perigo' ? sobreErro(b.erro) : v === 'destrutivo' ? c.erro : v === 'secundario' ? b.texto : c['primaria-texto'];
  const borda = v === 'secundario' ? (rosa ? b.tinta : c['texto-suave']) : v === 'destrutivo' ? c.erro : v === 'perigo' && rosa ? b.tinta : 'transparent';
  const inativo = desabilitado || carregando;
  // Na web, o Pressable do react-native-web sobrescreve aria-disabled com a prop `disabled` (que tiraria o foco):
  // o atributo é posto direto no elemento.
  const ref = useRef<import("react-native").View | null>(null) as unknown as React.RefObject<never>;
  useEffect(() => {
    const el = ref.current as unknown as { setAttribute?: (k: string, v: string) => void; removeAttribute?: (k: string) => void } | null;
    if (Platform.OS !== 'web' || !el?.setAttribute) return;
    if (inativo) el.setAttribute('aria-disabled', 'true'); else el.removeAttribute?.('aria-disabled');
  }, [inativo]);
  return (
    // v0.4.3 (decisão no ADR-0019): desativado continua focável (equivale a aria-disabled), anuncia "desativado"
    // e o clique é barrado aqui. Assim o leitor de tela encontra o botão e entende por que não age.
    <Pressable ref={ref} testID={testID} accessibilityRole="button" accessibilityLabel={titulo} accessibilityState={{ disabled: !!inativo, busy: !!carregando }} aria-disabled={!!inativo}
      onPress={() => { if (!inativo) onPress(); }}
      style={(st) => {
        const { pressed, focused } = st as { pressed: boolean; focused?: boolean };
        const p = pressed || forcarEstado === 'pressionado';
        return [s.botao, flex && { flex: 1 }, { height: grande ? 64 : 52, backgroundColor: fundo, borderColor: borda, borderWidth: v === 'secundario' ? (rosa ? 1.5 : 1) : v === 'perigo' ? (rosa ? 1.5 : 0) : 1.5, opacity: desabilitado ? 0.4 : p ? 0.85 : 1 }, foco(c, focused || forcarEstado === 'foco')];
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {carregando && <ActivityIndicator color={cor} />}
        <Text style={[t('corpo-forte'), { color: cor }]}>{titulo}</Text>
      </View>
    </Pressable>
  );
}

/** Botão de ícone 44×44, sempre com rótulo de acessibilidade. */
export function BotaoIcone({ rotulo, onPress, children, testID }: { rotulo: string; onPress: () => void; children: ReactNode; testID?: string }) {
  const c = useCores();
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={rotulo} onPress={onPress}
      style={(st) => { const { pressed, focused } = st as { pressed: boolean; focused?: boolean }; return [s.icone, { borderRadius: raio.medio, backgroundColor: pressed ? c['superficie-2'] : 'transparent' }, foco(c, focused)]; }}>
      {children}
    </Pressable>
  );
}

/** Sombra sólida deslocada dos blocos v3.2 (5px 5px 0 tinta). */
export const SOMBRA_BLOCO = 5;

/**
 * Bloco v3.2: contorno tinta de 2 px e sombra sólida deslocada, feita com uma camada atrás
 * (funciona igual no Android, que não tem sombra deslocada sem desfoque).
 */
export function BlocoTinta({ children, raio: r = raio.grande * 1.5, fundo, girar, estilo, sombra = SOMBRA_BLOCO, testID }: { children: ReactNode; raio?: number; fundo?: string; girar?: string; estilo?: object; sombra?: number; testID?: string }) {
  const b = useCoresBase();
  return (
    <View testID={testID} style={[{ marginRight: sombra, marginBottom: sombra }, girar ? { transform: [{ rotate: girar }] } : null, estilo]}>
      <View aria-hidden style={{ position: 'absolute', top: sombra, left: sombra, right: -sombra, bottom: -sombra, borderRadius: r, backgroundColor: b.tinta }} />
      <View style={{ borderRadius: r, borderWidth: 2, borderColor: b.tinta, backgroundColor: fundo ?? b.superficie, overflow: 'hidden' }}>
        <Bloco>{children}</Bloco>
      </View>
    </View>
  );
}

/** Cartão v3.2 (bloco com contorno tinta e sombra). `destaque`: faixa vermelha no topo. Tocável quando tem onPress. */
export function Cartao({ children, destaque, onPress, rotulo }: { children: ReactNode; destaque?: boolean; onPress?: () => void; rotulo?: string }) {
  const c = useCores(); // foco: contra o rosa
  const b = useCoresBase();
  const corpo = <View style={[s.cartao, destaque && { borderTopWidth: 6, borderTopColor: b.primaria }]}><Bloco>{children}</Bloco></View>;
  if (!onPress) return <BlocoTinta raio={raio.grande + 4}>{corpo}</BlocoTinta>;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={rotulo} onPress={onPress}
      style={(st) => { const { pressed, focused } = st as { pressed: boolean; focused?: boolean }; return [{ borderRadius: raio.grande + 4, transform: [{ translateX: pressed ? 2 : 0 }, { translateY: pressed ? 2 : 0 }] }, foco(c, focused)]; }}>
      <BlocoTinta raio={raio.grande + 4} sombra={SOMBRA_BLOCO}>{corpo}</BlocoTinta>
    </Pressable>
  );
}

export function Selo({ texto, tom = 'secundaria' }: { texto: string; tom?: 'primaria' | 'sucesso' | 'secundaria' | 'alerta' | 'erro' }) {
  const c = useCoresBase(); // o selo é um bloco (fundo próprio)
  const fundo = tom === 'primaria' ? c['primaria-suave'] : tom === 'secundaria' ? c['secundaria-suave'] : c['superficie-2'];
  const cor = tom === 'primaria' ? c['primaria-texto'] : c[tom];
  return <View style={{ alignSelf: 'flex-start', backgroundColor: fundo, borderRadius: raio.pilula, paddingHorizontal: 10, paddingVertical: 2 }}><Text style={[t('legenda'), { color: cor }]}>{texto}</Text></View>;
}

/** Campo com rótulo visível. Altura fixa 52 (não encolhe: P0-1). `expandir` só em linhas (flex: 1). */
export function Campo({ rotulo, erro, ajuda, expandir, multilinha, forcarFoco, ...p }: TextInputProps & { rotulo: string; erro?: string; ajuda?: string; expandir?: boolean; multilinha?: boolean; forcarFoco?: boolean }) {
  const c = useCores();
  const b = useCoresBase(); // dentro do campo (superfície). Contorno: borda-campo no bloco; tinta sobre o rosa (v3.2 §5)
  const [focado, setFocado] = useState(false);
  const f = focado || forcarFoco;
  return (
    <View style={{ gap: 4, flexShrink: 0, ...(expandir ? { flex: 1, minWidth: 0 } : {}) }}>
      <Text style={[t('rotulo'), { color: c.texto }]}>{rotulo}</Text>
      <TextInput accessibilityLabel={rotulo} placeholderTextColor={b['texto-suave']} multiline={multilinha} {...p}
        onFocus={(e) => { setFocado(true); p.onFocus?.(e); }} onBlur={(e) => { setFocado(false); p.onBlur?.(e); }}
        style={[s.campo, multilinha && { height: 104, paddingTop: 12, textAlignVertical: 'top' }, { color: b.texto, backgroundColor: b.superficie, borderColor: erro ? c.erro : f ? c.foco : c['borda-campo'], borderWidth: erro || f ? 2 : 1 },
          Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null, p.style]} />
      {erro ? <Text accessibilityRole="alert" style={[t('legenda'), { color: c.erro }]}>⚠ {erro}</Text> : ajuda ? <Text style={[t('legenda'), { color: c['texto-suave'] }]}>{ajuda}</Text> : null}
    </View>
  );
}

/** Ficha de filtro em pílula: 44 de altura real (BUG-16; antes 36 + hitSlop). */
export function Ficha({ texto, ativa, onPress }: { texto: string; ativa?: boolean; onPress: () => void }) {
  const c = useCores();
  const b = useCoresBase(); // v3.2: pílula branca com contorno tinta; ativa = ação escura
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: !!ativa }} onPress={onPress} 
      style={(st) => [{ alignSelf: 'center', minHeight: toque.minimo, justifyContent: 'center', paddingHorizontal: 14, borderRadius: raio.pilula, borderWidth: 1.5, borderColor: b.tinta, backgroundColor: ativa ? b['acao-sobre-fundo'] : b.superficie }, foco(c, (st as { focused?: boolean }).focused)]}>
      <Text style={[t('rotulo'), { color: ativa ? b['sobre-acao-sobre-fundo'] : b.texto }]}>{texto}</Text>
    </Pressable>
  );
}

/**
 * Faixa de fichas. Padrão (v3.2): as fichas quebram linha, então todas ficam visíveis em qualquer largura e tamanho de fonte.
 * `rolar`: faixa horizontal para listas longas (Biblioteca). Na web mostra a barra e aceita a roda do mouse,
 * porque com mouse não há como arrastar para o lado e as fichas do fim ficavam inacessíveis.
 */
export function FaixaFichas({ children, rolar }: { children: ReactNode; rolar?: boolean }) {
  const ref = useRef<ScrollViewInstance>(null);
  useEffect(() => {
    if (!rolar || Platform.OS !== 'web') return;
    const no = (ref.current as unknown as { getScrollableNode?: () => HTMLElement | null })?.getScrollableNode?.();
    if (!no) return;
    const roda = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || no.scrollWidth <= no.clientWidth) return;
      const fim = no.scrollLeft + no.clientWidth >= no.scrollWidth - 1;
      if ((e.deltaY > 0 && fim) || (e.deltaY < 0 && no.scrollLeft <= 0)) return; // na ponta, deixa a página rolar
      e.preventDefault();
      no.scrollLeft += e.deltaY;
    };
    no.addEventListener('wheel', roda, { passive: false });
    return () => no.removeEventListener('wheel', roda);
  }, [rolar]);
  if (!rolar) return <View testID="faixa-fichas" style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, paddingVertical: 4 }}>{children}</View>;
  return <ScrollView ref={ref} testID="faixa-fichas" horizontal showsHorizontalScrollIndicator={Platform.OS === 'web'} style={{ flexGrow: 0, marginHorizontal: -espaco[4] }} contentContainerStyle={{ alignItems: 'center', gap: 8, paddingHorizontal: espaco[4], paddingVertical: 4, paddingBottom: Platform.OS === 'web' ? 10 : 4 }}>{children}</ScrollView>;
}

/** Seletor segmentado para trocar de visão (P2-5). */
export function Segmentado<T extends string>({ opcoes, valor, onChange }: { opcoes: { valor: T; rotulo: string }[]; valor: T; onChange: (v: T) => void }) {
  const c = useCoresBase(); // bloco próprio
  return (
    <View accessibilityRole="tablist" style={{ flexDirection: 'row', backgroundColor: c['superficie-2'], borderRadius: raio.medio, padding: 4, gap: 4, borderWidth: 1.5, borderColor: c.tinta }}>
      {opcoes.map((o) => {
        const ativo = o.valor === valor;
        return (
          <Pressable key={o.valor} accessibilityRole="tab" accessibilityState={{ selected: ativo }} onPress={() => onChange(o.valor)}
            style={{ flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: raio.pequeno, backgroundColor: ativo ? c.superficie : 'transparent', ...(ativo ? { shadowColor: '#1A1918', shadowOpacity: 0.08, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 } : {}) }}>
            <Text style={[t('rotulo'), { color: c.texto }]}>{o.rotulo}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ItemLista({ titulo, sub, valor, onPress, perigo, ultimo, imagem, umaLinha }: { titulo: string; sub?: string; valor?: string; onPress?: () => void; perigo?: boolean; ultimo?: boolean; imagem?: ImageSourcePropType | null; /** v0.4.4: título e subtítulo em uma linha (listas virtualizadas de altura fixa); o nome completo vai para o leitor de tela. */ umaLinha?: boolean }) {
  const c = useCores();
  return (
    <Pressable accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={umaLinha ? [titulo, sub].filter(Boolean).join(', ') : undefined} onPress={onPress} disabled={!onPress}
      style={{ minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: espaco[3], paddingVertical: espaco[2], borderBottomWidth: ultimo ? 0 : 1, borderColor: c.borda }}>
      {imagem ? <Image source={imagem} accessibilityIgnoresInvertColors style={{ width: 64, height: 43, borderRadius: raio.pequeno, backgroundColor: c['superficie-2'] }} /> : null}
      <View style={{ flex: 1 }}>
        <Text numberOfLines={umaLinha ? 1 : undefined} style={[t('corpo-forte'), { color: perigo ? c.erro : c.texto }]}>{titulo}</Text>
        {sub ? <Text numberOfLines={umaLinha ? 1 : undefined} style={[t('rotulo'), { color: c['texto-suave'] }]}>{sub}</Text> : null}
      </View>
      {valor ? <Text style={[t('corpo-forte'), { color: c.texto, fontVariant: ['tabular-nums'] }]}>{valor}</Text> : null}
      {onPress ? <Text style={{ color: c['texto-suave'], fontSize: 20 }}>›</Text> : null}
    </Pressable>
  );
}

export function Aviso({ titulo, texto, tom = 'secundaria', children }: { titulo: string; texto?: string; tom?: 'alerta' | 'erro' | 'sucesso' | 'secundaria'; children?: ReactNode }) {
  const c = useCoresBase(); // bloco: a faixa colorida fica dentro, sobre a superfície
  return (
    <View accessibilityRole="alert" style={{ borderLeftWidth: 4, borderColor: c[tom], borderWidth: 1.5, borderTopColor: c.tinta, borderRightColor: c.tinta, borderBottomColor: c.tinta, backgroundColor: c.superficie, padding: espaco[3], borderRadius: raio.medio, gap: 4 }}>
      <Text style={[t('corpo-forte'), { color: c.texto }]}>{titulo}</Text>
      {texto ? <Text style={[t('rotulo'), { color: c['texto-suave'] }]}>{texto}</Text> : null}
      <Bloco>{children}</Bloco>
    </View>
  );
}

/** Chave liga/desliga com cores dos tokens; a linha inteira é tocável (≥ 44 px) – P1-4. */
export function Chave({ rotulo, valor, onChange, testID, children }: { rotulo: string; valor: boolean; onChange: (v: boolean) => void; testID?: string; children?: ReactNode }) {
  const c = useCores();
  return (
    <Pressable accessibilityRole="switch" accessibilityLabel={rotulo} accessibilityState={{ checked: valor }} aria-checked={valor} onPress={() => onChange(!valor)} testID={testID}
      style={(st) => [{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56 }, foco(c, (st as { focused?: boolean }).focused)]}>
      <View style={{ flex: 1 }}>{children ?? <Text style={[t('corpo-forte'), { color: c.texto }]}>{rotulo}</Text>}</View>
      {Platform.OS === 'web' ? (
        // BUG-15: na web, desenho sem controle aninhado; o estado vai no aria-checked da linha.
        <View aria-hidden style={{ width: 44, height: 24, borderRadius: 12, padding: 2, backgroundColor: valor ? c.primaria : c['texto-suave'], alignItems: valor ? 'flex-end' : 'flex-start' }}>
          <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: c.superficie }} />
        </View>
      ) : (
        <Switch value={valor} onValueChange={onChange} trackColor={{ false: c['texto-suave'], true: c.primaria }} thumbColor={c.superficie}
          importantForAccessibility="no" accessibilityElementsHidden />
      )}
    </Pressable>
  );
}

export function EstadoVazio({ titulo, texto, acao, icone }: { titulo: string; texto: string; acao?: ReactNode; icone?: string }) {
  const c = useCores();
  return (
    <View style={{ alignItems: 'center', gap: espaco[2], paddingVertical: espaco[8] }}>
      {icone && <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: c['primaria-suave'], alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 30, color: c['primaria-texto'] }}>{icone}</Text></View>}
      <Texto v="titulo-3">{titulo}</Texto>
      <Texto suave style={{ textAlign: 'center' }}>{texto}</Texto>
      {acao ? <View style={{ alignSelf: 'stretch', marginTop: espaco[3] }}>{acao}</View> : null}
    </View>
  );
}

/** Esqueleto de carregamento (> 300 ms). */
export function Esqueleto({ altura = 96 }: { altura?: number }) {
  const c = useCores();
  return <View accessibilityLabel="Carregando" style={{ height: altura, borderRadius: raio.grande, backgroundColor: c['superficie-2'] }} />;
}

/** Aviso rápido (toast) de até 4 s, com ação opcional (ex.: Desfazer). */
export function Toast({ texto, acao, onAcao, onFim, fixo }: { texto: string; acao?: string; onAcao?: () => void; onFim: () => void; fixo?: boolean }) {
  const c = useCores();
  useEffect(() => { if (fixo) return; const id = setTimeout(onFim, 4000); return () => clearTimeout(id); }, [onFim, fixo]);
  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.texto, borderRadius: raio.medio, paddingLeft: 16, paddingRight: 4, minHeight: 52 }}>
      <Text style={[t('rotulo'), { color: c.fundo, flex: 1 }]}>{texto}</Text>
      {acao && <Pressable accessibilityRole="button" onPress={onAcao} style={{ height: 44, justifyContent: 'center', paddingHorizontal: 12 }}><Text style={[t('corpo-forte'), { color: c.fundo }]}>{acao}</Text></Pressable>}
    </View>
  );
}

export const s = StyleSheet.create({
  coluna: { width: '100%', maxWidth: LARGURA_COLUNA, alignSelf: 'center' },
  barra: { height: 56, flexDirection: 'row', alignItems: 'center', gap: espaco[2], paddingHorizontal: espaco[2] },
  icone: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  botao: { borderRadius: raio.medio, alignItems: 'center', justifyContent: 'center', paddingHorizontal: espaco[4] },
  cartao: { padding: espaco[4], gap: espaco[2] },
  campo: { height: 52, minWidth: 0, borderRadius: raio.medio, paddingHorizontal: espaco[3], fontSize: 16 },
  linha: { flexDirection: 'row', gap: espaco[3], alignItems: 'center' },
});

/** Adesivo amarelo levemente girado (v3.2): "Bora treinar hoje?", "Leva 2 minutos". Decorativo, texto lido normalmente. */
export function Adesivo({ texto, girar = '-3deg' }: { texto: string; girar?: string }) {
  const ft = useFonteTitulo();
  return (
    <View style={{ alignSelf: 'flex-start', transform: [{ rotate: girar }], marginBottom: 3, marginRight: 3 }}>
      <View aria-hidden style={{ position: 'absolute', top: 3, left: 3, right: -3, bottom: -3, borderRadius: 10, backgroundColor: apoio['sobre-energia'] }} />
      <View style={{ backgroundColor: apoio.energia, borderWidth: 2, borderColor: apoio['sobre-energia'], borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4 }}>
        <Text style={[{ color: apoio['sobre-energia'], fontSize: 15, lineHeight: 20 }, ft]}>{texto}</Text>
      </View>
    </View>
  );
}

/** Barra de progresso (trilho + preenchimento) com papel de progressbar para o leitor de tela. */
export function Trilho({ valor, rotulo, cor }: { valor: number; rotulo: string; cor?: string }) {
  const b = useCoresBase();
  const contorno = useContornoInterno();
  const v = Math.max(0, Math.min(1, valor));
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={rotulo} accessibilityValue={{ min: 0, max: 100, now: Math.round(v * 100) }}
      style={{ height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: contorno, backgroundColor: b['superficie-2'], overflow: 'hidden' }}>
      <View style={{ width: `${v * 100}%`, height: '100%', backgroundColor: cor ?? b.secundaria }} />
    </View>
  );
}
