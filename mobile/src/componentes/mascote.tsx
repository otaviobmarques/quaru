import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

/**
 * v0.9: o mascote do Quaru (cabeça em forma de Q, camiseta com o Q, short preto e tênis), em vetor.
 * pose "oi": acenando com o punho; "festa": com chapéu de aniversário e confete.
 * Para trocar pela arte oficial em PNG, basta substituir este componente por uma <Image>.
 */
const TINTA = '#2A1E22';
const VERMELHO = '#E0283F';
const PELE = '#FCE3D6';
const ROSTO = '#FFF4EC';
const BOCHECHA = '#F7A8B8';
const AMARELO = '#F7C51E';

export function Mascote({ pose = 'oi', tamanho = 120 }: { pose?: 'oi' | 'festa'; tamanho?: number }) {
  const festa = pose === 'festa';
  const braco = (d: string) => (<G><Path d={d} stroke={TINTA} strokeWidth={17} strokeLinecap="round" fill="none" /><Path d={d} stroke={PELE} strokeWidth={11} strokeLinecap="round" fill="none" /></G>);
  return (
    <Svg width={tamanho} height={tamanho * 1.25} viewBox="-10 -34 220 280" accessibilityRole="image"
      accessibilityLabel={festa ? 'Mascote do Quaru com chapéu de festa, comemorando' : 'Mascote do Quaru acenando'}>
      {/* sombra */}
      <Ellipse cx={100} cy={240} rx={62} ry={8} fill={BOCHECHA} opacity={0.6} />
      {festa && (
        <G>
          {[[18, 30, VERMELHO], [178, 40, '#9B6BDF'], [30, 150, AMARELO], [186, 170, VERMELHO], [10, 90, '#9B6BDF'], [192, 110, AMARELO], [150, -10, VERMELHO], [40, -6, AMARELO]].map(([x, y, c], i) => (
            <Rect key={i} x={x as number} y={y as number} width={9} height={5} rx={1.5} fill={c as string} transform={`rotate(${(i * 47) % 90 - 45} ${x} ${y})`} />
          ))}
        </G>
      )}
      {/* pernas, short e tênis */}
      <Rect x={78} y={214} width={14} height={18} fill={PELE} stroke={TINTA} strokeWidth={3} />
      <Rect x={108} y={214} width={14} height={18} fill={PELE} stroke={TINTA} strokeWidth={3} />
      <Rect x={66} y={194} width={68} height={26} rx={5} fill={TINTA} />
      <Rect x={70} y={196} width={5} height={22} fill={VERMELHO} />
      <Rect x={125} y={196} width={5} height={22} fill={VERMELHO} />
      <Ellipse cx={80} cy={236} rx={19} ry={9} fill="#FFFFFF" stroke={TINTA} strokeWidth={3} />
      <Ellipse cx={122} cy={236} rx={19} ry={9} fill="#FFFFFF" stroke={TINTA} strokeWidth={3} />
      <Path d="M70 236 L88 233" stroke={VERMELHO} strokeWidth={3} strokeLinecap="round" />
      <Path d="M112 233 L130 236" stroke={VERMELHO} strokeWidth={3} strokeLinecap="round" />
      {/* braço na cintura, com relógio */}
      {braco('M68 156 Q44 174 64 192')}
      <Rect x={47} y={170} width={12} height={10} rx={2} fill={AMARELO} stroke={TINTA} strokeWidth={2.5} transform="rotate(-30 53 175)" />
      {/* camiseta */}
      <Path d="M60 150 Q100 134 140 150 L150 176 L134 181 L134 200 L66 200 L66 181 L50 176 Z" fill="#FFFFFF" stroke={TINTA} strokeWidth={3.5} strokeLinejoin="round" />
      <Circle cx={100} cy={170} r={9} stroke={VERMELHO} strokeWidth={5} fill="none" />
      <Path d="M104 175 L111 182" stroke={VERMELHO} strokeWidth={5} strokeLinecap="round" />
      {/* braço levantado, punho e munhequeira */}
      {braco('M136 156 Q160 142 162 116')}
      <Rect x={153} y={116} width={18} height={8} rx={2} fill={VERMELHO} stroke={TINTA} strokeWidth={2.5} />
      <Circle cx={162} cy={106} r={11} fill={PELE} stroke={TINTA} strokeWidth={3} />
      <Path d="M156 104 Q162 100 168 104" stroke={TINTA} strokeWidth={2} fill="none" strokeLinecap="round" />
      {!festa && (
        <G stroke={AMARELO} strokeWidth={5} strokeLinecap="round">
          <Path d="M178 92 L190 84" /><Path d="M182 106 L196 104" /><Path d="M172 80 L178 68" />
        </G>
      )}
      {/* cabeça em Q: capuz vermelho, rabinho do Q e o rosto */}
      <Path d="M126 120 Q150 142 174 146 Q182 150 175 157 Q146 162 116 132 Z" fill={VERMELHO} stroke={TINTA} strokeWidth={3.5} strokeLinejoin="round" />
      <Circle cx={100} cy={80} r={64} fill={VERMELHO} stroke={TINTA} strokeWidth={3.5} />
      {!festa && <Circle cx={100} cy={16} r={11} fill={VERMELHO} stroke={TINTA} strokeWidth={3.5} />}
      <Ellipse cx={98} cy={86} rx={46} ry={42} fill={ROSTO} stroke={TINTA} strokeWidth={3} />
      <Ellipse cx={80} cy={80} rx={6} ry={8.5} fill={TINTA} />
      <Path d="M106 82 Q116 70 126 82" stroke={TINTA} strokeWidth={4} fill="none" strokeLinecap="round" />
      <Ellipse cx={68} cy={98} rx={8} ry={5} fill={BOCHECHA} />
      <Ellipse cx={128} cy={98} rx={8} ry={5} fill={BOCHECHA} />
      <Path d="M84 98 Q100 122 116 98 Z" fill={TINTA} />
      <Ellipse cx={100} cy={109} rx={7} ry={4} fill={BOCHECHA} />
      {festa && (
        <G>
          {/* chapéu de festa listrado, com pompom */}
          <Path d="M70 28 L118 20 L86 -22 Z" fill="#FFFFFF" stroke={TINTA} strokeWidth={3.5} strokeLinejoin="round" />
          <Path d="M76 20 L110 14 L104 6 L78 11 Z" fill={VERMELHO} />
          <Path d="M80 2 L98 -1 L93 -8 L82 -6 Z" fill={VERMELHO} />
          <Circle cx={86} cy={-24} r={8} fill={AMARELO} stroke={TINTA} strokeWidth={3} />
        </G>
      )}
    </Svg>
  );
}
