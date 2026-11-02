import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { LARGURA_COLUNA } from '@/componentes/ui';
import { useCoresBase } from '@/tema/tema';

type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

/** Traços dos ícones das abas (v3.2, mesmos do design: 24×24, traço 2,2, cantos redondos). */
const TRACOS: Record<string, string[]> = {
  inicio: ['M4 11l8-7 8 7v9h-5v-6H9v6H4z'],
  treinos: ['M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12'],
  alimentacao: ['M7 3v8a2 2 0 002 2v8M7 3v5M10 3v5M4 3v5a3 3 0 003 3M17 3c-2 2-2 6 0 8v10'],
  agua: ['M12 3c4 5 6 8 6 11a6 6 0 01-12 0c0-3 2-6 6-11z'],
  perfil: ['M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6'],
};

export function IconeAba({ nome, cor }: { nome: string; cor: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {nome === 'perfil' && <Circle cx={12} cy={8} r={4} />}
      {(TRACOS[nome] ?? []).map((d) => <Path key={d} d={d} />)}
    </Svg>
  );
}

/** Abas do design (v0.4.2): Início, Treinos (Meus treinos, Sugeridos, Histórico), Alimentação, Água e Perfil. */
export const ABAS = [
  { nome: 'inicio', titulo: 'Início' },
  { nome: 'treinos', titulo: 'Treinos' },
  { nome: 'alimentacao', titulo: 'Alimentação' },
  { nome: 'agua', titulo: 'Água' },
  { nome: 'perfil', titulo: 'Perfil' },
] as const;

/**
 * Barra de abas v3.2: bloco com contorno tinta e cantos de cima redondos, ícone SVG e rótulo inteiro
 * (sem reticências: "Alimentação" cabe em 360 px e quebra linha com fonte grande). Aba atual em pílula rosa-clara.
 */
function BarraAbas({ state, navigateToTab }: BottomTabBarProps) {
  const b = useCoresBase();
  const { bottom } = useSafeAreaInsets();
  return (
    <View style={{ backgroundColor: b.fundo }}>
    <View style={{ width: '100%', maxWidth: LARGURA_COLUNA, alignSelf: 'center', flexDirection: 'row', backgroundColor: b.superficie, borderWidth: 2, borderBottomWidth: 0, borderColor: b.tinta,
      borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 6, paddingTop: 6, paddingBottom: 8 + bottom }} accessibilityRole="tablist">
      {state.routes.map((r, i) => {
        const aba = ABAS.find((a) => a.nome === r.name);
        if (!aba) return null;
        const atual = state.index === i;
        const cor = atual ? b['primaria-texto'] : b['texto-suave'];
        return (
          <Pressable key={r.key} testID={`aba-${aba.nome}`} accessibilityRole="tab" accessibilityLabel={aba.titulo} accessibilityState={{ selected: atual }}
            onPress={() => { if (!atual) navigateToTab(r.key); }}
            style={(st) => [{ flex: 1, minWidth: 0, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: 14, paddingHorizontal: 2,
              backgroundColor: atual ? b['primaria-suave'] : 'transparent' }, (st as { focused?: boolean }).focused ? ({ outlineWidth: 3, outlineStyle: 'solid', outlineColor: b.foco } as object) : null]}>
            <IconeAba nome={aba.nome} cor={cor} />
            <Text style={{ color: cor, fontSize: 11, lineHeight: 14, fontWeight: atual ? '800' : '600', textAlign: 'center' }}>{aba.titulo}</Text>
          </Pressable>
        );
      })}
    </View>
    </View>
  );
}

export default function Abas() {
  const b = useCoresBase();
  return (
    <Tabs tabBar={(p) => <BarraAbas {...p} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: b.fundo } }}>
      {ABAS.map((a) => <Tabs.Screen key={a.nome} name={a.nome} options={{ title: a.titulo }} />)}
    </Tabs>
  );
}
