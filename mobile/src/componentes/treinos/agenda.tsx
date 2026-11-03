import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';

import { Botao, Cartao, Ficha, Segmentado, Selo, Texto, Toast } from '@/componentes/ui';
import { datasDaSemana, diaDaSemana, hoje, NOMES_DIA, planejadoPara, rotuloData, SIGLAS_DIA, type Planejado } from '@/dominio/agenda';
import { SeletorDia } from '@/componentes/treinos/seletor-dia';
import { diasTreinados } from '@/dominio/treino-de-hoje';
import { acoes, useEstado } from '@/estado/armazem';
import { iniciarTreino } from '@/estado/treino';
import { novoId } from '@/servicos/id';
import { useContornoInterno, useCoresBase } from '@/tema/tema';

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const dm = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

/**
 * Agenda de treinos (v0.7): na semana e no mês, escolha o treino de cada dia (ou descanso).
 * "Repetir toda segunda" grava como padrão daquele dia da semana; o Início usa a agenda no card Hoje.
 * "Montar um treino novo" cria o treino, marca o dia e abre o editor para escolher os exercícios.
 */
export function AgendaTreinos() {
  const { estado, aplicar } = useEstado();
  const b = useCoresBase();
  const contorno = useContornoInterno();
  const [modo, setModo] = useState<'semana' | 'mes'>('semana');
  const [semana, setSemana] = useState(0);
  const hojeDia = hoje();
  const [mes, setMes] = useState(() => ({ a: +hojeDia.slice(0, 4), m: +hojeDia.slice(5, 7) - 1 }));
  const [sel, setSel] = useState<string | null>(hojeDia);
  const [mover, setMover] = useState<{ de: string; para: string | null } | null>(null);
  const [movido, setMovido] = useState<string | null>(null);
  const treinos = estado.rotinas.filter((r) => !r.excluidoEm).toSorted((a, b2) => a.ordem - b2.ordem);
  const existe = (id: string) => treinos.some((r) => r.id === id);
  const nome = (v: Planejado | null) => (v === 'descanso' ? 'Descanso' : v ? treinos.find((r) => r.id === v)?.nome ?? '' : '');
  const feitos = diasTreinados(estado.sessoes);
  const ativa = estado.sessoes.find((s) => !s.finalizadaEm && !s.excluidoEm);

  const escolha = (dia: string) => {
    const p = planejadoPara(estado.agenda, dia, existe);
    const repete = p.fonte === 'semana';
    const dow = diaDaSemana(dia);
    const marcar = (v: Planejado | null, repetir = repete) => aplicar((e) => acoes.planejarDia(e, dia, v, repetir));
    const novo = () => {
      const r = { id: novoId(), nome: `Treino de ${NOMES_DIA[dow].toLowerCase()}`, ordem: Math.max(0, ...treinos.map((x) => x.ordem)) + 1, itens: [], atualizadoEm: new Date().toISOString() };
      aplicar((e) => acoes.planejarDia(acoes.salvarRotina(e, r), dia, r.id, repete));
      router.push(`/rotina/${r.id}`);
    };
    return (
      <View testID={`escolha-${dia}`} style={{ gap: 10, paddingTop: 8 }}>
        <Texto v="rotulo">{NOMES_DIA[dow]}, {dm(dia)}: o que você vai treinar?</Texto>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {treinos.map((r) => <Ficha key={r.id} texto={r.nome} ativa={p.valor === r.id} onPress={() => marcar(r.id)} />)}
          <Ficha texto="Descanso" ativa={p.valor === 'descanso'} onPress={() => marcar('descanso')} />
          <Ficha texto="Livre" ativa={!p.valor} onPress={() => marcar(null)} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Switch value={repete} onValueChange={(v) => marcar(p.valor, v)} accessibilityLabel={`Repetir toda ${NOMES_DIA[dow].toLowerCase()}`} testID={`repetir-${dia}`} />
          <Texto v="rotulo" style={{ flex: 1 }}>Repetir toda {NOMES_DIA[dow].toLowerCase()}</Texto>
        </View>
        <Botao v="texto" titulo="+ Montar um treino novo para este dia" onPress={novo} testID={`novo-treino-${dia}`} />
        {dia === hojeDia && p.valor && p.valor !== 'descanso' && !ativa && <Botao titulo={`Começar ${nome(p.valor)}`} onPress={() => iniciarTreino(aplicar, estado, p.valor as string)} />}
        {/* v0.9: reagendar só esta data (o padrão "toda semana" continua nas outras). */}
        {p.valor && p.valor !== 'descanso' && dia >= hojeDia && mover?.de !== dia && (
          <Botao v="secundario" titulo={`Reagendar ${nome(p.valor)}`} onPress={() => setMover({ de: dia, para: null })} testID={`reagendar-${dia}`} />
        )}
        {p.valor && p.valor !== 'descanso' && mover?.de === dia && (
          <View style={{ gap: 8 }} testID={`reagendar-painel-${dia}`}>
            <Texto v="corpo-forte">{`Para qual dia mudar ${nome(p.valor)}?`}</Texto>
            {repete && <Texto v="rotulo" suave>{`Só ${NOMES_DIA[dow].toLowerCase()}, ${dm(dia)} muda. As outras ${NOMES_DIA[dow].toLowerCase()}s continuam com o treino.`}</Texto>}
            <SeletorDia hojeDia={hojeDia} valor={mover.para} onChange={(para) => setMover({ de: dia, para })} pular={dia} />
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <Botao titulo="Reagendar" desabilitado={!mover.para} testID={`confirmar-reagendar-${dia}`} onPress={() => {
                const para = mover.para; if (!para) return;
                aplicar((e) => acoes.reagendarDia(e, dia, para, p.valor as string));
                setMover(null); setMovido(`${nome(p.valor)} foi para ${rotuloData(para, hojeDia).toLowerCase()}.`); setSel(para);
              }} />
              <Botao v="texto" titulo="Cancelar" onPress={() => setMover(null)} />
            </View>
          </View>
        )}
      </View>
    );
  };

  const datas = datasDaSemana(hojeDia, semana);
  const primeiro = new Date(Date.UTC(mes.a, mes.m, 1, 12));
  const diasNoMes = new Date(Date.UTC(mes.a, mes.m + 1, 0, 12)).getUTCDate();
  const vazios = (primeiro.getUTCDay() + 6) % 7;
  const celulas: (string | null)[] = [...Array(vazios).fill(null), ...Array.from({ length: diasNoMes }, (_, i) => `${mes.a}-${String(mes.m + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`)];
  while (celulas.length % 7) celulas.push(null);
  const seta = (t: string, rot: string, f: () => void) => (
    <Pressable accessibilityRole="button" accessibilityLabel={rot} onPress={f} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 22, color: b.texto }}>{t}</Text></Pressable>
  );

  return (
    <>
      {movido && <Toast texto={movido} onFim={() => setMovido(null)} />}
      <Segmentado opcoes={[{ valor: 'semana', rotulo: 'Semana' }, { valor: 'mes', rotulo: 'Mês' }]} valor={modo} onChange={setModo} />
      {treinos.length === 0 && <Cartao><Texto v="corpo-forte">Monte um treino primeiro</Texto><Texto v="rotulo" suave>Depois é só escolher em que dias fazer cada um. Ou use “Montar um treino novo” num dia.</Texto></Cartao>}
      {modo === 'semana' ? (
        <Cartao>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {seta('‹', 'Semana anterior', () => setSemana((s) => s - 1))}
            <View style={{ flex: 1, alignItems: 'center' }}><Texto v="corpo-forte">{semana === 0 ? 'Esta semana' : `Semana de ${dm(datas[0])}`}</Texto><Texto v="legenda" suave>{dm(datas[0])} a {dm(datas[6])}</Texto></View>
            {seta('›', 'Próxima semana', () => setSemana((s) => s + 1))}
          </View>
          {datas.map((d) => {
            const p = planejadoPara(estado.agenda, d, existe);
            const aberto = sel === d;
            return (
              <View key={d} style={{ borderTopWidth: 1, borderColor: b['superficie-2'], paddingVertical: 6 }}>
                <Pressable testID={`dia-${d}`} accessibilityRole="button" accessibilityState={{ expanded: aberto }} accessibilityLabel={`${NOMES_DIA[diaDaSemana(d)]} ${dm(d)}: ${nome(p.valor) || 'livre'}${feitos.has(d) ? ', treino feito' : ''}`}
                  onPress={() => setSel(aberto ? null : d)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 }}>
                  <View style={{ width: 52 }}><Texto v="corpo-forte" cor={d === hojeDia ? b['primaria-texto'] : undefined}>{SIGLAS_DIA[diaDaSemana(d)]}</Texto><Texto v="legenda" suave>{dm(d)}</Texto></View>
                  <View style={{ flex: 1 }}>
                    <Texto v={p.valor ? 'corpo-forte' : 'rotulo'} suave={!p.valor}>{nome(p.valor) || 'Livre'}</Texto>
                    {p.fonte === 'semana' && <Texto v="legenda" suave>toda {NOMES_DIA[diaDaSemana(d)].toLowerCase()}</Texto>}
                  </View>
                  {feitos.has(d) && <Selo texto="✓ feito" tom="sucesso" />}
                  {d === hojeDia && <Selo texto="hoje" tom="primaria" />}
                  <Texto v="titulo-3" suave>{aberto ? '⌃' : '⌄'}</Texto>
                </Pressable>
                {aberto && escolha(d)}
              </View>
            );
          })}
        </Cartao>
      ) : (
        <Cartao>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {seta('‹', 'Mês anterior', () => setMes(({ a, m }) => (m === 0 ? { a: a - 1, m: 11 } : { a, m: m - 1 })))}
            <View style={{ flex: 1, alignItems: 'center' }}><Texto v="corpo-forte">{MESES[mes.m]} de {mes.a}</Texto><Texto v="legenda" suave>Toque num dia para escolher o treino</Texto></View>
            {seta('›', 'Próximo mês', () => setMes(({ a, m }) => (m === 11 ? { a: a + 1, m: 0 } : { a, m: m + 1 })))}
          </View>
          <View style={{ flexDirection: 'row' }} aria-hidden>{['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((x, i) => <View key={i} style={{ flex: 1, alignItems: 'center' }}><Texto v="legenda" suave>{x}</Texto></View>)}</View>
          {Array.from({ length: celulas.length / 7 }, (_, l) => (
            <View key={l} style={{ flexDirection: 'row' }}>
              {celulas.slice(l * 7, l * 7 + 7).map((d, i) => {
                if (!d) return <View key={i} style={{ flex: 1 }} />;
                const p = planejadoPara(estado.agenda, d, existe);
                const rotulo = p.valor === 'descanso' ? 'desc.' : p.valor ? nome(p.valor).replace(/^Treino\s+(de\s+)?/i, '').replace(/\s*\(.*\)\s*$/, '').slice(0, 5) : '';
                return (
                  <Pressable key={i} testID={`mes-${d}`} onPress={() => setSel(sel === d ? null : d)} accessibilityRole="button" accessibilityLabel={`${+d.slice(8)} de ${MESES[mes.m]}: ${nome(p.valor) || 'livre'}${feitos.has(d) ? ', treino feito' : ''}`}
                    style={{ flex: 1, minHeight: 52, margin: 2, borderRadius: 10, paddingVertical: 4, alignItems: 'center', borderWidth: sel === d || d === hojeDia ? 2 : 1, borderColor: sel === d ? b.primaria : d === hojeDia ? contorno : b['superficie-2'],
                      backgroundColor: feitos.has(d) ? b['primaria-suave'] : b.superficie }}>
                    <Text style={{ fontSize: 14, fontWeight: d === hojeDia ? '800' : '500', color: b.texto }}>{+d.slice(8)}</Text>
                    <Text numberOfLines={1} style={{ fontSize: 10, color: p.valor === 'descanso' ? b['texto-suave'] : b['primaria-texto'], fontWeight: '700' }}>{feitos.has(d) ? '✓' : rotulo}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
          {sel && sel.slice(0, 7) === `${mes.a}-${String(mes.m + 1).padStart(2, '0')}` && escolha(sel)}
        </Cartao>
      )}
    </>
  );
}
