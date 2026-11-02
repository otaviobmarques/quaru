import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useCores } from '@/tema/tema';
import { LARGURA_COLUNA } from '@/componentes/ui';

const icone = (g: string) => function Icone({ color }: { color: import('react-native').ColorValue }) { return <Text style={{ color, fontSize: 20 }}>{g}</Text>; };

/** Abas do design v2.1 (v0.4.2): Início, Treinos (Meus treinos, Sugeridos, Histórico), Alimentação, Água e Perfil. */
export const ABAS = [
  { nome: 'inicio', titulo: 'Início', icone: '⌂' },
  { nome: 'treinos', titulo: 'Treinos', icone: '☰' },
  { nome: 'alimentacao', titulo: 'Alimentação', icone: '◔' },
  { nome: 'agua', titulo: 'Água', icone: '◍' },
  { nome: 'perfil', titulo: 'Perfil', icone: '●' },
] as const;

export default function Abas() {
  const c = useCores();
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: c['primaria-texto'], tabBarInactiveTintColor: c['texto-suave'],
      tabBarStyle: { width: '100%', maxWidth: LARGURA_COLUNA, alignSelf: 'center', height: 72, paddingTop: 6, paddingBottom: 10, backgroundColor: c.superficie, borderTopColor: c.borda }, tabBarLabelStyle: { fontSize: 12 } }}>
      {ABAS.map((a) => <Tabs.Screen key={a.nome} name={a.nome} options={{ title: a.titulo, tabBarIcon: icone(a.icone) }} />)}
    </Tabs>
  );
}
