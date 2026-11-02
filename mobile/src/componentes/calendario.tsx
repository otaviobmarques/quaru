import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Texto } from '@/componentes/ui';
import { diasTreinados, diaLocal } from '@/dominio/treino-de-hoje';
import type { SessaoTreino } from '@/dominio/tipos';
import { useContornoInterno, useCoresBase } from '@/tema/tema';

const SEMANA = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

/** Calendário do mês (v0.5): dias com treino em vermelho, hoje com contorno. Setas trocam o mês. */
export function CalendarioTreinos({ sessoes }: { sessoes: SessaoTreino[] }) {
  const b = useCoresBase();
  const contorno = useContornoInterno();
  const hoje = diaLocal(new Date().toISOString());
  const [mes, setMes] = useState(() => ({ a: +hoje.slice(0, 4), m: +hoje.slice(5, 7) - 1 }));
  const feitos = diasTreinados(sessoes);
  const primeiro = new Date(Date.UTC(mes.a, mes.m, 1, 12));
  const diasNoMes = new Date(Date.UTC(mes.a, mes.m + 1, 0, 12)).getUTCDate();
  const vazios = (primeiro.getUTCDay() + 6) % 7; // semana começa na segunda
  const chave = (d: number) => `${mes.a}-${String(mes.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const noMes = Array.from({ length: diasNoMes }, (_, i) => i + 1).filter((d) => feitos.has(chave(d))).length;
  const mudar = (delta: number) => setMes(({ a, m }) => { const x = m + delta; return { a: a + Math.floor(x / 12), m: ((x % 12) + 12) % 12 }; });
  const celulas: (number | null)[] = [...Array(vazios).fill(null), ...Array.from({ length: diasNoMes }, (_, i) => i + 1)];
  while (celulas.length % 7) celulas.push(null);
  const seta = (t: string, r: string, d: number) => (
    <Pressable accessibilityRole="button" accessibilityLabel={r} onPress={() => mudar(d)} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 22, color: b.texto }}>{t}</Text>
    </Pressable>
  );
  return (
    <View style={{ gap: 6 }} testID="calendario">
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {seta('‹', 'Mês anterior', -1)}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Texto v="corpo-forte">{MESES[mes.m]} de {mes.a}</Texto>
          <Texto v="legenda" suave>{noMes} {noMes === 1 ? 'dia com treino' : 'dias com treino'}</Texto>
        </View>
        {seta('›', 'Próximo mês', 1)}
      </View>
      <View style={{ flexDirection: 'row' }} aria-hidden>{SEMANA.map((d, i) => <View key={i} style={{ flex: 1, alignItems: 'center' }}><Texto v="legenda" suave>{d}</Texto></View>)}</View>
      {Array.from({ length: celulas.length / 7 }, (_, l) => (
        <View key={l} style={{ flexDirection: 'row' }}>
          {celulas.slice(l * 7, l * 7 + 7).map((d, i) => {
            const k = d ? chave(d) : '';
            const feito = d != null && feitos.has(k);
            const eHoje = k === hoje;
            return (
              <View key={i} style={{ flex: 1, alignItems: 'center', paddingVertical: 2 }}
                accessible={d != null} accessibilityLabel={d ? `${d} de ${MESES[mes.m]}${feito ? ', com treino' : ''}${eHoje ? ', hoje' : ''}` : undefined}>
                {d != null && (
                  <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: feito ? b.primaria : 'transparent', borderWidth: eHoje ? 2 : 0, borderColor: contorno }}>
                    <Text style={{ fontSize: 14, fontWeight: feito || eHoje ? '700' : '400', color: feito ? b['sobre-primaria'] : b.texto, fontVariant: ['tabular-nums'] }}>{d}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
