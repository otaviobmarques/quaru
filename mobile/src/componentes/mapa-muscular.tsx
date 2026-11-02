import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { MAPA_MUSCULOS, MAPA_SILHUETAS, MAPA_VIEWBOX } from '@/config/design-v042-gerado';
import type { Regiao } from '@/dominio/treinos-sugeridos';
import { useCores, type Cores } from '@/tema/tema';

/**
 * Mapa muscular do design v2.1 (frente e costas), colorido pelo código a partir de data-musculo/data-lado.
 * Silhueta = superficie-2; músculo inativo = superficie com contorno texto-suave (≥ 3:1); ativo = primaria.
 * Os músculos extras do design (trapézio, lombar, antebraço, oblíquos, adutores) ficam inativos até o catálogo
 * de exercícios usá-los.
 */
const NOMES: Record<Regiao, string> = { peito: 'peito', ombros: 'ombros', biceps: 'bíceps', abdomen: 'abdômen', quadriceps: 'quadríceps', costas: 'costas', triceps: 'tríceps', gluteos: 'glúteos', posterior: 'posterior de coxa', panturrilha: 'panturrilha' };

/** Região do domínio → grupo data-musculo do design. */
export const MUSCULO_DA_REGIAO: Record<Regiao, string> = {
  peito: 'peito', ombros: 'ombros', biceps: 'biceps', abdomen: 'abdomen', quadriceps: 'quadriceps',
  costas: 'costas', triceps: 'triceps', gluteos: 'gluteos', posterior: 'posteriores', panturrilha: 'panturrilhas',
};

export const descricaoMapa = (r: Regiao[]) => (r.length ? `Mapa muscular: trabalha ${r.map((x) => NOMES[x]).join(', ')}` : 'Mapa muscular, frente e costas, sem área destacada');

/** Cor de preenchimento e contorno de um músculo do design, dadas as regiões ativas. */
export function corDoMusculo(musculo: string, regioes: Regiao[], c: Cores) {
  const ativo = regioes.some((r) => MUSCULO_DA_REGIAO[r] === musculo);
  return ativo ? { fill: c.primaria, stroke: c.primaria, ativo } : { fill: c.superficie, stroke: c['texto-suave'], ativo };
}

export function MapaMuscular({ regioes, altura = 120 }: { regioes: Regiao[]; altura?: number }) {
  const c = useCores();
  const [, , w, h] = MAPA_VIEWBOX.split(' ').map(Number);
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={descricaoMapa(regioes)} testID="mapa-muscular" style={{ height: altura, aspectRatio: w / h }}>
      <Svg width="100%" height="100%" viewBox={MAPA_VIEWBOX} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {MAPA_SILHUETAS.map((d, i) => <Path key={i} d={d} fill={c['superficie-2']} />)}
        {MAPA_MUSCULOS.map((m) => {
          const k = corDoMusculo(m.musculo, regioes, c);
          return <Path key={m.id} testID={`musculo-${m.id}${k.ativo ? '-ativo' : ''}`} d={m.d} fill={k.fill} stroke={k.stroke} strokeWidth={1.5} />;
        })}
      </Svg>
    </View>
  );
}
