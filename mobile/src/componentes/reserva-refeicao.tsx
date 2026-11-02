import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import type { Momento } from '@/dominio/refeicoes';
import { apoio, type temas } from '@/tema/tokens';
import { raio, useCores } from '@/tema/tema';

type Cores = Record<keyof (typeof temas)['claro'], string>;
/**
 * Cores do visual de reserva por refeição (v0.4.3), todas do DS. Ícone ≥ 3:1 sobre o fundo nos dois temas
 * (componente gráfico, WCAG 1.4.11) – conferido em __tests__/v043-imagens-redbox.test.tsx.
 */
export const CORES_RESERVA = (c: Cores): Record<Momento, { fundo: string; icone: string }> => ({
  cafe: { fundo: c['primaria-suave'], icone: c['primaria-texto'] },
  almoco: { fundo: c['secundaria-suave'], icone: c.secundaria },
  lanche: { fundo: apoio.energia, icone: apoio['sobre-energia'] },
  jantar: { fundo: c['superficie-2'], icone: c['texto-suave'] },
});

/** Ícones de traço (24×24) no estilo dos ícones do DS: xícara, prato com talheres, maçã e lua com tigela. */
function Icone({ momento, cor, t }: { momento: Momento; cor: string; t: number }) {
  const p = { stroke: cor, strokeWidth: 1.8, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  return (
    <Svg width={t} height={t} viewBox="0 0 24 24">
      {momento === 'cafe' && <><Path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9z" {...p} /><Path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16" {...p} /><Path d="M8 3c-.6.8-.6 1.7 0 2.5M12 3c-.6.8-.6 1.7 0 2.5" {...p} /></>}
      {momento === 'almoco' && <><Circle cx="12" cy="12" r="6" {...p} /><Circle cx="12" cy="12" r="3" {...p} /><Path d="M3 4v5a1.5 1.5 0 0 0 1.5 1.5V20M4.5 4v4M21 4c-1.5 1-2 2.5-2 5h2v11" {...p} /></>}
      {momento === 'lanche' && <><Path d="M12 8c-2-1.5-6-1-6 3.5 0 4 2.5 8.5 4.5 8.5.8 0 1-.4 1.5-.4s.7.4 1.5.4c2 0 4.5-4.5 4.5-8.5C18 7 14 6.5 12 8z" {...p} /><Path d="M12 8c0-2 .8-3.5 2.5-4.5" {...p} /></>}
      {momento === 'jantar' && <><Path d="M3 13h18a9 9 0 0 1-18 0z" {...p} /><Path d="M15 3.5a3.5 3.5 0 1 0 4 4 3 3 0 0 1-4-4z" {...p} /></>}
    </Svg>
  );
}

/** Visual de reserva para refeição sem foto: fundo do DS + ícone do momento. Oculto para o leitor de tela. */
export function ReservaRefeicao({ momento, largura, proporcao = 1, testID }: { momento: Momento; largura: number | '100%'; proporcao?: number; testID?: string }) {
  const c = useCores() as Cores;
  const k = CORES_RESERVA(c)[momento];
  const t = typeof largura === 'number' ? Math.round(largura * 0.5) : 48;
  return (
    <View testID={testID} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden
      style={{ width: largura, aspectRatio: proporcao, borderRadius: raio.medio, backgroundColor: k.fundo, alignItems: 'center', justifyContent: 'center' }}>
      <Icone momento={momento} cor={k.icone} t={t} />
    </View>
  );
}
