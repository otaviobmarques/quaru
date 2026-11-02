import { Image, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import type { Avatar as TipoAvatar } from '@/estado/armazem';
import { useCores } from '@/tema/tema';

/**
 * 10 avatares ilustrados próprios (v0.4.1), em SVG, sem traços de rosto: só formas de cabeça, cabelo, acessórios
 * e tons de pele variados. Fundo nas cores do Quaru. Cada um tem descrição neutra para o leitor de tela.
 */
type Def = { id: string; descricao: string; pele: string; fundo: 'primaria' | 'secundaria'; cabelo?: (c: string) => React.ReactNode; corCabelo: string; extra?: React.ReactNode };
const PELES = ['#8D5524', '#C68642', '#E0AC69', '#F1C27D', '#FFDBAC', '#5C3A1E'];
export const AVATARES: Def[] = [
  { id: 'a1', descricao: 'Avatar com cabelo curto', pele: PELES[0], fundo: 'primaria', corCabelo: '#1F1412', cabelo: (k) => <Path d="M30 44 Q32 22 50 22 Q68 22 70 44 Q60 32 50 32 Q40 32 30 44 Z" fill={k} /> },
  { id: 'a2', descricao: 'Avatar com cabelo longo', pele: PELES[3], fundo: 'secundaria', corCabelo: '#6B3E1E', cabelo: (k) => <Path d="M28 70 Q24 24 50 22 Q76 24 72 70 L64 70 Q66 40 50 34 Q34 40 36 70 Z" fill={k} /> },
  { id: 'a3', descricao: 'Avatar com cabelo crespo volumoso', pele: PELES[5], fundo: 'primaria', corCabelo: '#120C0A', cabelo: (k) => <G fill={k}>{[[34, 30], [44, 22], [56, 22], [66, 30], [30, 42], [70, 42], [50, 18]].map(([x, y], i) => <Circle key={i} cx={x} cy={y} r={11} />)}</G> },
  { id: 'a4', descricao: 'Avatar com lenço na cabeça', pele: PELES[2], fundo: 'secundaria', corCabelo: '#285884', cabelo: (k) => <Path d="M26 76 Q22 20 50 18 Q78 20 74 76 L66 76 Q70 44 50 36 Q30 44 34 76 Z M30 44 Q50 26 70 44 Q60 30 50 30 Q40 30 30 44 Z" fill={k} /> },
  { id: 'a5', descricao: 'Avatar com coque', pele: PELES[1], fundo: 'primaria', corCabelo: '#2B1B12', cabelo: (k) => <G fill={k}><Circle cx={50} cy={16} r={9} /><Path d="M30 44 Q32 24 50 24 Q68 24 70 44 Q62 34 50 34 Q38 34 30 44 Z" /></G> },
  { id: 'a6', descricao: 'Avatar com óculos e cabelo grisalho', pele: PELES[4], fundo: 'secundaria', corCabelo: '#B8B2AE', cabelo: (k) => <Path d="M30 42 Q30 24 50 24 Q70 24 70 42 Q66 30 50 30 Q34 30 30 42 Z" fill={k} />,
    extra: <G fill="none" stroke="#14141A" strokeWidth={2.5}><Circle cx={42} cy={46} r={6} /><Circle cx={58} cy={46} r={6} /><Path d="M48 46 h4" /></G> },
  { id: 'a7', descricao: 'Avatar com cabeça raspada e barba', pele: PELES[0], fundo: 'primaria', corCabelo: '#1F1412', cabelo: () => null,
    extra: <Path d="M34 50 Q36 70 50 70 Q64 70 66 50 Q60 62 50 62 Q40 62 34 50 Z" fill="#1F1412" /> },
  { id: 'a8', descricao: 'Avatar com boné', pele: PELES[2], fundo: 'secundaria', corCabelo: '#C81E36', cabelo: (k) => <G fill={k}><Path d="M30 40 Q30 22 50 22 Q70 22 70 40 Z" /><Rect x={50} y={36} width={28} height={6} rx={3} /></G> },
  { id: 'a9', descricao: 'Avatar com tranças', pele: PELES[5], fundo: 'primaria', corCabelo: '#120C0A', cabelo: (k) => <G fill={k}><Path d="M30 44 Q32 22 50 22 Q68 22 70 44 Q60 32 50 32 Q40 32 30 44 Z" /><Rect x={26} y={40} width={7} height={34} rx={3.5} /><Rect x={67} y={40} width={7} height={34} rx={3.5} /></G> },
  { id: 'a10', descricao: 'Avatar com cabelo ondulado curto', pele: PELES[3], fundo: 'secundaria', corCabelo: '#A0522D', cabelo: (k) => <Path d="M28 46 Q26 26 40 22 Q50 16 60 22 Q74 26 72 46 Q68 34 62 36 Q56 28 50 34 Q44 28 38 36 Q32 34 28 46 Z" fill={k} /> },
];

export const descricaoAvatar = (a: TipoAvatar | null | undefined) =>
  !a ? 'Sem foto de perfil' : a.tipo === 'foto' ? 'Sua foto de perfil' : (AVATARES.find((x) => x.id === a.id)?.descricao ?? 'Avatar');

/** Desenho de um avatar ilustrado (viewBox 100×100). */
export function AvatarIlustrado({ id, tamanho = 64 }: { id: string; tamanho?: number }) {
  const c = useCores();
  const d = AVATARES.find((x) => x.id === id) ?? AVATARES[0];
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 100 100" aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Circle cx={50} cy={50} r={50} fill={d.fundo === 'primaria' ? c['primaria-suave'] : c['secundaria-suave']} />
      <Path d="M18 100 Q20 74 50 72 Q80 74 82 100 Z" fill={d.fundo === 'primaria' ? c.primaria : c.secundaria} />
      <Rect x={44} y={60} width={12} height={14} rx={4} fill={d.pele} />
      <Ellipse cx={50} cy={46} rx={19} ry={22} fill={d.pele} />
      {d.cabelo?.(d.corCabelo)}
      {d.extra}
    </Svg>
  );
}

/** Foto ou avatar do perfil, redondo, com descrição para o leitor de tela. Sem nada: círculo com a inicial. */
export function FotoPerfil({ avatar, tamanho = 56, inicial }: { avatar: TipoAvatar | null | undefined; tamanho?: number; inicial?: string }) {
  const c = useCores();
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={descricaoAvatar(avatar)} testID="foto-perfil"
      style={{ width: tamanho, height: tamanho, borderRadius: tamanho / 2, overflow: 'hidden', backgroundColor: c['primaria-suave'], alignItems: 'center', justifyContent: 'center' }}>
      {avatar?.tipo === 'foto' ? <Image source={{ uri: avatar.uri }} style={{ width: tamanho, height: tamanho }} accessibilityIgnoresInvertColors />
        : avatar?.tipo === 'ilustrado' ? <AvatarIlustrado id={avatar.id} tamanho={tamanho} />
        : <Svg width={tamanho} height={tamanho} viewBox="0 0 100 100" aria-hidden><Circle cx={50} cy={40} r={16} fill={c['primaria-texto']} /><Path d="M22 86 Q24 62 50 62 Q76 62 78 86 Z" fill={c['primaria-texto']} />{inicial ? null : null}</Svg>}
    </View>
  );
}
