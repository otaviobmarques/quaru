import { View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';

import { useCores, type Cores } from '@/tema/tema';

/**
 * Ilustrações próprias do Quaru (v0.4.1), desenhadas em código com react-native-svg nas cores do tema.
 * Formas simples e vetoriais, sem rostos e sem imagens de terceiros. Cada uma é uma "imagem" para o leitor de tela,
 * com a descrição em `descricao`; os traços internos ficam escondidos da acessibilidade.
 */
export type NomeIlustracao = 'boas-vindas' | 'rotinas' | 'series' | 'evolucao' | 'comece' | 'dieta-vegetal' | 'dieta-mediterranea' | 'dieta-proteina' | 'dieta-relogio' | 'agua';


const prato = (c: Cores, conteudo: React.ReactNode) => (
  <G>
    <Circle cx={120} cy={84} r={66} fill={c['secundaria-suave']} />
    <Circle cx={120} cy={84} r={52} fill={c.superficie} stroke={c.borda} strokeWidth={3} />
    <Circle cx={120} cy={84} r={40} fill={c['superficie-2']} />
    {conteudo}
    <Rect x={34} y={40} width={8} height={88} rx={4} fill={c['texto-suave']} />
    <Rect x={198} y={40} width={8} height={88} rx={4} fill={c['texto-suave']} />
  </G>
);
const FOLHA = '#2F855A';

/** Desenho por nome. viewBox 240×160 (3:2). */
const desenhos: Record<NomeIlustracao, (c: Cores) => React.ReactNode> = {
  // Halter grande sobre um círculo suave, com "brilhos".
  'boas-vindas': (c) => (
    <G>
      <Circle cx={120} cy={82} r={62} fill={c['primaria-suave']} />
      <Rect x={62} y={74} width={116} height={14} rx={7} fill={c['texto-suave']} />
      <Rect x={44} y={52} width={22} height={58} rx={8} fill={c.primaria} />
      <Rect x={174} y={52} width={22} height={58} rx={8} fill={c.primaria} />
      <Rect x={30} y={62} width={16} height={38} rx={6} fill={c.secundaria} />
      <Rect x={194} y={62} width={16} height={38} rx={6} fill={c.secundaria} />
      <Path d="M120 14 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 z" fill={c.secundaria} />
      <Circle cx={196} cy={28} r={5} fill={c.primaria} />
      <Circle cx={40} cy={132} r={4} fill={c.secundaria} />
    </G>
  ),
  // Três cartões A, B, C (o do meio em destaque), com linhas de exercícios.
  rotinas: (c) => (
    <G>
      {[0, 1, 2].map((i) => {
        const x = 20 + i * 72, dest = i === 1;
        return (
          <G key={i}>
            <Rect x={x} y={dest ? 22 : 34} width={56} height={dest ? 116 : 100} rx={10} fill={c.superficie} stroke={dest ? c.primaria : c.borda} strokeWidth={dest ? 3 : 2} />
            <Circle cx={x + 28} cy={dest ? 46 : 56} r={13} fill={dest ? c.primaria : c['secundaria-suave']} />
            {/* letra A/B/C desenhada com traços (sem fonte) */}
            {i === 0 && <Path d={`M${x + 22} 62 L${x + 28} 49 L${x + 34} 62 M${x + 24.5} 57 L${x + 31.5} 57`} stroke={c.secundaria} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
            {i === 1 && <Path d={`M${x + 23} 39 L${x + 23} 53 M${x + 23} 39 L${x + 30} 39 Q${x + 34} 39 ${x + 34} 42.5 Q${x + 34} 46 ${x + 30} 46 L${x + 23} 46 M${x + 30} 46 Q${x + 35} 46 ${x + 35} 49.5 Q${x + 35} 53 ${x + 30} 53 L${x + 23} 53`} stroke={c['sobre-primaria']} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
            {i === 2 && <Path d={`M${x + 34} 51 Q${x + 28} 48 ${x + 23} 52 Q${x + 20} 56 ${x + 23} 60 Q${x + 28} 64 ${x + 34} 61`} stroke={c.secundaria} strokeWidth={2.5} fill="none" strokeLinecap="round" />}
            {[0, 1, 2].map((k) => <Rect key={k} x={x + 10} y={(dest ? 72 : 80) + k * 16} width={k === 2 ? 24 : 36} height={6} rx={3} fill={dest ? c['primaria-suave'] : c['superficie-2']} />)}
          </G>
        );
      })}
    </G>
  ),
  // Lista de séries com marcas de feito e um cronômetro de descanso.
  series: (c) => (
    <G>
      <Rect x={18} y={24} width={124} height={112} rx={12} fill={c.superficie} stroke={c.borda} strokeWidth={2} />
      {[0, 1, 2].map((k) => (
        <G key={k}>
          <Circle cx={40} cy={50 + k * 30} r={10} fill={k < 2 ? c.sucesso : c['superficie-2']} />
          {k < 2 && <Path d={`M35 ${50 + k * 30} l4 4 l7 -8`} stroke={c.superficie} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
          <Rect x={58} y={46 + k * 30} width={64} height={8} rx={4} fill={c['superficie-2']} />
        </G>
      ))}
      <Circle cx={182} cy={86} r={42} fill={c['primaria-suave']} />
      <Circle cx={182} cy={86} r={32} fill="none" stroke={c.borda} strokeWidth={6} />
      <Path d="M182 54 A32 32 0 1 1 152 97" fill="none" stroke={c.primaria} strokeWidth={6} strokeLinecap="round" />
      <Line x1={182} y1={86} x2={182} y2={66} stroke={c.texto} strokeWidth={3} strokeLinecap="round" />
      <Line x1={182} y1={86} x2={196} y2={92} stroke={c.texto} strokeWidth={3} strokeLinecap="round" />
      <Rect x={174} y={34} width={16} height={8} rx={3} fill={c.primaria} />
    </G>
  ),
  // Gráfico de barras subindo com uma seta e um troféu simples.
  evolucao: (c) => (
    <G>
      <Line x1={24} y1={136} x2={216} y2={136} stroke={c.borda} strokeWidth={3} strokeLinecap="round" />
      {[40, 56, 50, 76, 96].map((h, i) => <Rect key={i} x={34 + i * 30} y={132 - h} width={20} height={h} rx={5} fill={i === 4 ? c.primaria : c.secundaria} />)}
      <Path d="M36 96 L74 78 L104 86 L134 58 L162 40" fill="none" stroke={c['primaria-texto']} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 7" />
      <Path d="M152 34 L166 38 L160 51" fill="none" stroke={c['primaria-texto']} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <G>
        <Path d="M188 30 h28 v10 a14 14 0 0 1 -28 0 z" fill={c.alerta} />
        <Rect x={199} y={53} width={6} height={10} fill={c.alerta} />
        <Rect x={192} y={63} width={20} height={6} rx={2} fill={c.alerta} />
      </G>
    </G>
  ),
  // Prancheta vazia com um "+", para o estado vazio do Início.
  comece: (c) => (
    <G>
      <Circle cx={120} cy={80} r={64} fill={c['secundaria-suave']} />
      <Rect x={78} y={30} width={84} height={108} rx={12} fill={c.superficie} stroke={c.borda} strokeWidth={2} />
      <Rect x={100} y={22} width={40} height={16} rx={6} fill={c.secundaria} />
      {[0, 1].map((k) => <Rect key={k} x={94} y={54 + k * 16} width={52 - k * 14} height={7} rx={3.5} fill={c['superficie-2']} />)}
      <Circle cx={120} cy={110} r={16} fill={c.primaria} />
      <Path d="M120 102 v16 M112 110 h16" stroke={c['sobre-primaria']} strokeWidth={3} strokeLinecap="round" />
      <Path d="M186 34 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 z" fill={c.primaria} />
    </G>
  ),
  'dieta-vegetal': (c) => prato(c, <G>
    <Path d="M96 78 Q104 54 128 60 Q118 84 96 78 Z" fill={FOLHA} />
    <Path d="M112 96 Q120 72 144 80 Q132 102 112 96 Z" fill={FOLHA} opacity={0.8} />
    {[[132, 64], [140, 70], [136, 76]].map(([x, y], i) => <Circle key={i} cx={x} cy={y} r={5} fill={c.alerta} />)}
    <Circle cx={104} cy={102} r={9} fill={c.primaria} />
  </G>),
  'dieta-mediterranea': (c) => prato(c, <G>
    <Path d="M92 84 Q110 66 136 80 L148 70 L146 92 L136 86 Q110 102 92 84 Z" fill={c.secundaria} />
    <Circle cx={104} cy={82} r={2.5} fill={c.superficie} />
    <Circle cx={118} cy={104} r={7} fill={c.primaria} /><Circle cx={132} cy={104} r={6} fill={FOLHA} />
    <Path d="M166 30 q8 10 0 18 q-8 -8 0 -18 z" fill={c.alerta} />
  </G>),
  'dieta-proteina': (c) => prato(c, <G>
    <Path d="M94 78 Q98 62 118 66 Q132 70 126 86 Q112 96 98 90 Z" fill={c.primaria} />
    <Circle cx={138} cy={78} r={12} fill={c.superficie} stroke={c.borda} strokeWidth={2} /><Circle cx={138} cy={78} r={5.5} fill={c.alerta} />
    <Path d="M104 100 Q120 90 140 100 Q120 110 104 100 Z" fill={FOLHA} />
  </G>),
  'dieta-relogio': (c) => (
    <G>
      {prato(c, <G><Path d="M100 92 Q120 70 142 92 Z" fill={FOLHA} /><Circle cx={112} cy={74} r={7} fill={c.primaria} /></G>)}
      <Circle cx={182} cy={40} r={26} fill={c.superficie} stroke={c.primaria} strokeWidth={5} />
      <Line x1={182} y1={40} x2={182} y2={24} stroke={c.texto} strokeWidth={3} strokeLinecap="round" />
      <Line x1={182} y1={40} x2={194} y2={46} stroke={c.texto} strokeWidth={3} strokeLinecap="round" />
    </G>
  ),
  // Copo com água e gotas.
  agua: (c) => (
    <G>
      <Circle cx={120} cy={82} r={62} fill={c['secundaria-suave']} />
      <Path d="M86 34 L154 34 L146 136 Q120 142 94 136 Z" fill={c.superficie} stroke={c.borda} strokeWidth={3} />
      <Path d="M90 70 L150 70 L146 132 Q120 138 94 132 Z" fill={c.secundaria} opacity={0.85} />
      <Path d="M182 40 q10 14 0 22 q-10 -8 0 -22 z" fill={c.secundaria} />
      <Path d="M58 92 q8 11 0 18 q-8 -7 0 -18 z" fill={c.secundaria} />
    </G>
  ),
};

export function Ilustracao({ nome, descricao, largura = 240 }: { nome: NomeIlustracao; descricao: string; largura?: number }) {
  const c = useCores();
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={descricao} testID={`ilustracao-${nome}`} style={{ alignSelf: 'center', width: largura, maxWidth: '100%', aspectRatio: 3 / 2 }}>
      <Svg width="100%" height="100%" viewBox="0 0 240 160" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden>
        {desenhos[nome](c)}
      </Svg>
    </View>
  );
}
