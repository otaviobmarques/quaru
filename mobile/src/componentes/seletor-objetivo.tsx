import { Pressable, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { Ficha, Segmentado, Texto } from '@/componentes/ui';
import { DIAS_MAX, DIAS_MIN, NIVEIS, OBJETIVOS, type NivelPessoa, type Objetivo, type PerfilTreino } from '@/dominio/objetivo';
import { AREAS, type Area } from '@/dominio/treinos-sugeridos';
import { raio, useCores } from '@/tema/tema';

/** Ícones próprios (SVG, 40×40) dos objetivos – v0.4.1. */
export function IconeObjetivo({ id, cor, fundo }: { id: Objetivo; cor: string; fundo: string }) {
  return (
    <Svg width={40} height={40} viewBox="0 0 40 40" aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Circle cx={20} cy={20} r={20} fill={fundo} />
      {id === 'emagrecer' && <Path d="M12 14 h16 l-2 16 h-12 z M16 20 h8" stroke={cor} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />}
      {id === 'massa' && <><Rect x={9} y={17} width={22} height={6} rx={3} fill={cor} /><Rect x={7} y={12} width={5} height={16} rx={2} fill={cor} /><Rect x={28} y={12} width={5} height={16} rx={2} fill={cor} /></>}
      {id === 'condicionamento' && <Path d="M7 21 h6 l3 -7 l4 13 l3 -9 l2 3 h8" stroke={cor} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />}
      {id === 'saude' && <Path d="M20 30 C8 22 9 12 15 12 C18 12 20 15 20 15 C20 15 22 12 25 12 C31 12 32 22 20 30 Z" fill={cor} />}
      {id === 'forca' && <Path d="M23 8 L13 22 h7 l-3 10 l10 -14 h-7 z" fill={cor} />}
    </Svg>
  );
}

export const PADRAO_TREINO: PerfilTreino = { objetivo: 'saude', nivel: 'iniciante', dias: 3, areas: [] };

export function SeletorObjetivo({ valor, onChange }: { valor: PerfilTreino; onChange: (v: PerfilTreino) => void }) {
  const c = useCores();
  return (
    <View style={{ gap: 12 }}>
      <Texto v="corpo-forte">Qual é o seu objetivo?</Texto>
      <View accessibilityRole="radiogroup" style={{ gap: 8 }}>
        {OBJETIVOS.map((o) => {
          const sel = valor.objetivo === o.id;
          return (
            <Pressable key={o.id} accessibilityRole="radio" accessibilityLabel={`${o.nome}. ${o.descricao}`} accessibilityState={{ checked: sel }} testID={`objetivo-${o.id}`}
              onPress={() => onChange({ ...valor, objetivo: o.id })}
              style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 8, borderRadius: raio.medio, borderWidth: sel ? 2 : 1, borderColor: sel ? c.primaria : c.borda, backgroundColor: c.superficie }}>
              <IconeObjetivo id={o.id} cor={sel ? c['sobre-primaria'] : c['primaria-texto']} fundo={sel ? c.primaria : c['primaria-suave']} />
              <View style={{ flex: 1 }}><Texto v="corpo-forte">{o.nome}</Texto><Texto v="rotulo" suave>{o.descricao}</Texto></View>
              <Texto v="corpo-forte" cor={c['primaria-texto']}>{sel ? '✓' : ''}</Texto>
            </Pressable>
          );
        })}
      </View>
      <Texto v="corpo-forte">Seu nível</Texto>
      <Segmentado opcoes={NIVEIS.map((n) => ({ valor: n.id, rotulo: n.nome }))} valor={valor.nivel} onChange={(n: NivelPessoa) => onChange({ ...valor, nivel: n })} />
      <Texto v="corpo-forte">Quantos dias por semana?</Texto>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {Array.from({ length: DIAS_MAX - DIAS_MIN + 1 }, (_, i) => DIAS_MIN + i).map((d) => <Ficha key={d} texto={`${d} dias`} ativa={valor.dias === d} onPress={() => onChange({ ...valor, dias: d })} />)}
      </View>
    </View>
  );
}

export function SeletorAreas({ valor, onChange }: { valor: Area[]; onChange: (v: Area[]) => void }) {
  return (
    <View style={{ gap: 8 }}>
      <Texto v="corpo-forte">Quais áreas você quer focar? (opcional)</Texto>
      <Texto v="rotulo" suave>Escolha quantas quiser. Dá para mudar depois no Perfil.</Texto>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {AREAS.map((a) => <Ficha key={a.id} texto={a.nome} ativa={valor.includes(a.id)} onPress={() => onChange(valor.includes(a.id) ? valor.filter((x) => x !== a.id) : [...valor, a.id])} />)}
      </View>
    </View>
  );
}
