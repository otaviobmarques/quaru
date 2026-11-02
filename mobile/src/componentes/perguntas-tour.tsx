import { useState } from 'react';
import { Switch, View } from 'react-native';

import { Aviso, Campo, Ficha, Texto } from '@/componentes/ui';
import { MOTIVO_CIDADE, validarHora, type Lembretes } from '@/dominio/tour';
import { pedirPermissaoNotificacao } from '@/servicos/notificacoes';
import { useCores } from '@/tema/tema';

/** Escolha única em fichas (44 px), com rótulo de grupo para leitor de tela. */
export function EscolhaUnica<T extends string | number>({ rotulo, opcoes, valor, onChange }: { rotulo: string; opcoes: { id: T; nome: string }[]; valor: T | null | undefined; onChange: (v: T | null) => void }) {
  return (
    <View style={{ gap: 8 }}>
      <Texto v="corpo-forte">{rotulo}</Texto>
      <View accessibilityRole="radiogroup" accessibilityLabel={rotulo} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {opcoes.map((o) => <Ficha key={String(o.id)} texto={o.nome} ativa={valor === o.id} onPress={() => onChange(valor === o.id ? null : o.id)} />)}
      </View>
    </View>
  );
}

export function EscolhaMultipla<T extends string>({ rotulo, opcoes, valor, onChange }: { rotulo: string; opcoes: { id: T; nome: string }[]; valor: T[]; onChange: (v: T[]) => void }) {
  return (
    <View style={{ gap: 8 }}>
      <Texto v="corpo-forte">{rotulo}</Texto>
      <View accessibilityLabel={rotulo} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {opcoes.map((o) => <Ficha key={o.id} texto={o.nome} ativa={valor.includes(o.id)} onPress={() => onChange(valor.includes(o.id) ? valor.filter((x) => x !== o.id) : [...valor, o.id])} />)}
      </View>
    </View>
  );
}

export function CamposCidade({ cidade, bairro, onChange }: { cidade: string; bairro: string; onChange: (c: string, b: string) => void }) {
  return (
    <View style={{ gap: 8 }}>
      <Texto suave>{MOTIVO_CIDADE}</Texto>
      <Campo rotulo="Cidade (opcional)" value={cidade} onChangeText={(t) => onChange(t, bairro)} maxLength={60} autoComplete="off" testID="campo-cidade" />
      <Campo rotulo="Bairro (opcional)" value={bairro} onChangeText={(t) => onChange(cidade, t)} maxLength={60} autoComplete="off" testID="campo-bairro" />
    </View>
  );
}

/** Lembretes: a permissão de notificação só é pedida quando a pessoa liga um lembrete. */
export function CamposLembretes({ valor, onChange }: { valor: Lembretes; onChange: (l: Lembretes) => void }) {
  const c = useCores();
  const [hora, setHora] = useState(valor.treinoHora ?? '');
  const [msg, setMsg] = useState<string | null>(null);
  const ativar = async (l: Lembretes) => {
    const r = await pedirPermissaoNotificacao();
    setMsg(r === 'negada' ? 'O navegador bloqueou as notificações. A preferência ficou salva; libere nas configurações do navegador.'
      : r === 'indisponivel' ? 'Preferência salva. Os avisos no celular chegam numa próxima versão do app.' : null);
    onChange(l);
  };
  const treinoLigado = valor.treinoHora != null;
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 44, gap: 12 }}>
        <Texto style={{ flex: 1 }}>Lembrete do treino</Texto>
        <Switch accessibilityLabel="Lembrete do treino" testID="lembrete-treino" value={treinoLigado} trackColor={{ true: c.primaria }}
          onValueChange={(v) => (v ? ativar({ ...valor, treinoHora: validarHora(hora) ? hora : '18:00' }) : onChange({ ...valor, treinoHora: null }))} />
      </View>
      {treinoLigado && <Campo rotulo="Horário (HH:MM)" value={hora || (valor.treinoHora ?? '')} keyboardType="numbers-and-punctuation" maxLength={5} testID="campo-hora"
        erro={hora && !validarHora(hora) ? 'Use o formato 07:30' : undefined}
        onChangeText={(t) => { setHora(t); if (validarHora(t)) onChange({ ...valor, treinoHora: t }); }} />}
      <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 44, gap: 12 }}>
        <Texto style={{ flex: 1 }}>Lembrete de beber água</Texto>
        <Switch accessibilityLabel="Lembrete de beber água" testID="lembrete-agua" value={valor.agua} trackColor={{ true: c.primaria }}
          onValueChange={(v) => (v ? ativar({ ...valor, agua: true }) : onChange({ ...valor, agua: false }))} />
      </View>
      {msg && <Aviso titulo="Lembretes" texto={msg} />}
    </View>
  );
}
