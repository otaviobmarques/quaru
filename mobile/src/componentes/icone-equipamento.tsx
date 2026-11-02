import { useState } from 'react';
import { Pressable, useColorScheme, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { Texto } from '@/componentes/ui';
import { ICONES_EQUIPAMENTO } from '@/config/ilustracoes-r2-gerado';
import type { Equipamento } from '@/dominio/equipamentos';
import { raio, useCores } from '@/tema/tema';

/** Ícone de equipamento da RedBox (r2: só contorno, traço 4/6, raio 4), na versão do tema. Decorativo: o texto ao lado dá o nome. */
export function IconeEquipamento({ id, tamanho = 24 }: { id: Equipamento; tamanho?: number }) {
  const escuro = useColorScheme() === 'dark';
  const x = ICONES_EQUIPAMENTO[id];
  if (!x) return null;
  return (
    <View testID={`icone-equipamento-${id}`} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: tamanho, height: tamanho }}>
      <SvgXml xml={escuro ? x.escuro : x.claro} width="100%" height="100%" />
    </View>
  );
}

/** Múltipla escolha de equipamentos com ícone (v0.4.3): cartões de 2 colunas, cada um é uma caixa de seleção acessível. */
export function EscolhaEquipamentos({ rotulo, opcoes, valor, onChange }: { rotulo: string; opcoes: { id: Equipamento; nome: string }[]; valor: Equipamento[]; onChange: (v: Equipamento[]) => void }) {
  const c = useCores();
  // Duas colunas quando cabe (≥ 340 px); em cartões estreitos, uma coluna, para o nome não quebrar no meio.
  const [largura, setLargura] = useState(360);
  const base = largura >= 340 ? '47%' : '100%';
  return (
    <View style={{ gap: 8 }} onLayout={(e) => setLargura(e.nativeEvent.layout.width)}>
      <Texto v="corpo-forte">{rotulo}</Texto>
      <View accessibilityLabel={rotulo} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {opcoes.map((o) => {
          const ativo = valor.includes(o.id);
          return (
            <Pressable key={o.id} testID={`equip-${o.id}`} accessibilityRole="checkbox" accessibilityLabel={o.nome} accessibilityState={{ checked: ativo }}
              onPress={() => onChange(ativo ? valor.filter((x) => x !== o.id) : [...valor, o.id])}
              style={({ pressed }) => ({ flexBasis: base, flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 56, paddingHorizontal: 10, paddingVertical: 8,
                borderRadius: raio.medio, borderWidth: ativo ? 2 : 1, borderColor: ativo ? c.primaria : c.borda, backgroundColor: ativo ? c['primaria-suave'] : pressed ? c['superficie-2'] : c.superficie })}>
              <IconeEquipamento id={o.id} tamanho={36} />
              <View style={{ flex: 1 }}><Texto v="rotulo">{o.nome}</Texto></View>
              <Texto v="corpo-forte" cor={ativo ? c['primaria-texto'] : 'transparent'}>✓</Texto>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
