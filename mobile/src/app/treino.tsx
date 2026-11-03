import { DemonstracaoExercicio } from '@/componentes/demonstracao-exercicio';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, TextInput, View } from 'react-native';

import { mensagemRecusa, problemaSerie } from '@/dominio/validacao';
import { Aviso, Botao, Cartao, Selo, Tela, Texto } from '@/componentes/ui';
import { seriesDaSessao } from '@/dominio/consultas';
import { ehRecorde, formatarKg, lerNumero, ultimaVez } from '@/dominio/metricas';
import { AVISO_PROGRESSAO, sugerirProgressao } from '@/dominio/progressao';
import { descansoEntreExercicios, descansoEntreSeries } from '@/dominio/descanso';
import { doCatalogo } from '@/dominio/biblioteca';
import type { Serie, TipoSerie } from '@/dominio/tipos';
import { acoes, todosExercicios, useEstado } from '@/estado/armazem';
import { novoId } from '@/servicos/id';
import { alertarFimDescanso, prepararAlertaDescanso } from '@/servicos/alerta-descanso';
import { agendarFimDescanso, cancelarDescanso, pedirPermissao } from '@/servicos/notificacao';
import { useContornoInterno, useCores, useCoresBase } from '@/tema/tema';
import { agoraMs } from '@/servicos/relogio';

const TIPOS: TipoSerie[] = ['normal', 'aquecimento', 'falha', 'drop'];
const SIGLA: Record<TipoSerie, string> = { normal: 'N', aquecimento: 'A', falha: 'F', drop: 'D' };

/** Tela 6 – Treino em andamento (RF04/RF05, L5). Séries pré-preenchidas com a "última vez": concluir = 1 toque. */
export default function Treino() {
  const { estado, aplicar } = useEstado();
  const c = useCores();
  const b = useCoresBase();
  const contorno = useContornoInterno();
  const sessao = estado.sessoes.find((s) => !s.finalizadaEm && !s.excluidoEm);
  const [rascunho, setRascunho] = useState<Record<string, { kg: string; reps: string; tipo: TipoSerie }>>({});
  const [descanso, setDescanso] = useState<{ fim: number; exercicio: string; troca?: boolean } | null>(null);
  const [agora, setAgora] = useState(agoraMs);
  const [pedirAviso, setPedirAviso] = useState(false);
  const [erroSerie, setErroSerie] = useState<string | null>(null);
  const [recorde, setRecorde] = useState<string | null>(null);
  const [extras, setExtras] = useState<string[]>([]);
  const [mais, setMais] = useState<Record<string, number>>({});
  const [confirmarFim, setConfirmarFim] = useState(false);
  useEffect(() => { if (!descanso) return; const t = setInterval(() => setAgora(agoraMs()), 500); return () => clearInterval(t); }, [descanso]);
  // BUG-17: com o app em primeiro plano, vibra quando o descanso chega a zero.
  const zerou = !!descanso && agora >= descanso.fim;
  useEffect(() => { if (zerou) alertarFimDescanso(); }, [zerou]); // web: som + navigator.vibrate (ADR-0013)

  if (!sessao) return <Tela titulo="Treino" voltar={() => router.replace('/inicio')}><Texto suave>Nenhum treino em andamento.</Texto></Tela>;
  const rotina = estado.rotinas.find((r) => r.id === sessao.rotinaId);
  const exs = new Map(todosExercicios(estado).map((e) => [e.id, e]));
  const feitas = seriesDaSessao(estado, sessao.id);
  const ids = [...new Set([...(rotina?.itens.toSorted((a, b) => a.ordem - b.ordem).map((i) => i.exercicioId) ?? []), ...feitas.map((s) => s.exercicioId), ...extras])];
  const restante = descanso ? Math.max(0, Math.round((descanso.fim - agora) / 1000)) : 0;

  const concluir = async (exId: string, ordem: number, sugestao: { kg: string; reps: string }) => {
    prepararAlertaDescanso(); // web: destrava o áudio no toque
    const k = `${exId}:${ordem}`;
    const r = rascunho[k] ?? { ...sugestao, tipo: 'normal' as TipoSerie };
    const carga = r.kg === '' ? null : lerNumero(r.kg);
    const reps = lerNumero(r.reps);
    if ((r.kg !== '' && carga == null) || reps == null) { setErroSerie('Confira a carga e as repetições: use só números, como 52,5.'); return; }
    // REG-01: valida os limites ANTES de gravar (o armazém lança erro e a tela não pode cair).
    const msg = problemaSerie(carga, reps);
    if (msg) { setErroSerie(msg); return; }
    setErroSerie(null);
    const nova: Serie = { id: feitas.find((s) => s.exercicioId === exId && s.ordem === ordem)?.id ?? novoId(), sessaoId: sessao.id, exercicioId: exId, ordem, tipo: r.tipo,
      cargaKg: carga, reps, duracaoS: null, rpe: null, concluidaEm: new Date().toISOString(), atualizadoEm: '' };
    // REG-04: qualquer regra do armazém que recusar a série (consentimento revogado, limite, etc.) é checada
    // ANTES: mensagem clara, série continua pendente e não começa descanso nem notificação.
    try { acoes.salvarSerie(estado, nova); } catch (err) { setErroSerie(mensagemRecusa((err as Error).message)); return; }
    setRecorde(ehRecorde(nova, estado.series) ? `${exs.get(exId)?.nome}: ${formatarKg(carga)} kg × ${reps}` : null);
    aplicar((e) => acoes.salvarSerie(e, nova));
    // v0.7: descanso calculado. Terminou todas as séries do exercício? Descanso de troca e o nome do próximo.
    const item = rotina?.itens.find((i) => i.exercicioId === exId);
    const entreSeries = item?.descansoS ?? descansoEntreSeries(doCatalogo(exId), estado.perfil?.treino);
    const totalSeries = Math.max(item?.seriesAlvo ?? 1, ...feitas.filter((x) => x.exercicioId === exId).map((x) => x.ordem)) + (mais[exId] ?? 0);
    const feitasDoEx = new Set(feitas.filter((x) => x.exercicioId === exId && x.concluidaEm).map((x) => x.ordem)); feitasDoEx.add(ordem);
    const proximoId = feitasDoEx.size >= totalSeries ? ids[ids.indexOf(exId) + 1] : undefined;
    const troca = !!proximoId;
    const seg = troca ? descansoEntreExercicios(entreSeries) : entreSeries;
    const nome = exs.get(troca ? proximoId! : exId)?.nome ?? 'exercício';
    const t0 = agoraMs(); setDescanso({ fim: t0 + seg * 1000, exercicio: nome, troca }); setAgora(t0);
    if (Platform.OS === 'web') { /* web: sem notificações; som + vibração com a página aberta (ADR-0013) */ }
    else if (estado.permissaoNotificacao === 'nao_pedida') setPedirAviso(true);
    else if (estado.permissaoNotificacao === 'concedida') await agendarFimDescanso(seg, nome);
  };
  // BUG-01: ±15 s também reagenda o aviso com o tempo que resta.
  const ajustar = (d: number) => {
    if (!descanso) return;
    const fim = descanso.fim + d * 1000; setDescanso({ ...descanso, fim });
    if (estado.permissaoNotificacao === 'concedida') agendarFimDescanso(Math.max(0, Math.round((fim - agoraMs()) / 1000)), descanso.exercicio);
  };
  const pular = () => { cancelarDescanso(); setDescanso(null); };
  const finalizar = () => {
    cancelarDescanso();
    aplicar((e) => acoes.salvarSessao(e, { ...sessao, finalizadaEm: new Date().toISOString() }));
    router.replace(`/resumo/${sessao.id}`);
  };

  // Próxima série pendente (para o botão principal "Concluir série N" no rodapé – P0-3).
  const planos = ids.map((exId) => {
    const alvo = rotina?.itens.find((i) => i.exercicioId === exId);
    const minhas = feitas.filter((s) => s.exercicioId === exId);
    const n = Math.max(alvo?.seriesAlvo ?? 1, ...minhas.map((s) => s.ordem)) + (mais[exId] ?? 0);
    const ult = ultimaVez(exId, estado.series, estado.sessoes, sessao.id);
    return { exId, alvo, minhas, n, ult };
  });
  const sugestao = (p: (typeof planos)[number], ordem: number) => {
    const ref = p.ult.find((s) => s.ordem === ordem) ?? p.ult.at(-1);
    return { kg: ref?.cargaKg != null ? String(ref.cargaKg).replace('.', ',') : '', reps: String(ref?.reps ?? p.alvo?.repsAlvo ?? '') };
  };
  const total = planos.reduce((a, p) => a + p.n, 0);
  const concluidas = feitas.filter((s) => s.concluidaEm).length;
  let proxima: { p: (typeof planos)[number]; ordem: number } | null = null;
  for (const p of planos) { for (let o = 1; o <= p.n && !proxima; o++) if (!p.minhas.some((s) => s.ordem === o && s.concluidaEm)) proxima = { p, ordem: o }; if (proxima) break; }
  const minutos = Math.max(0, Math.round((agora - +new Date(sessao.iniciadaEm)) / 60000));

  const rodape = (
    <View style={{ gap: 12 }}>
      {descanso && (
        <View accessibilityRole="timer" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Botao v="secundario" titulo="−15 s" onPress={() => ajustar(-15)} />
          <View style={{ flex: 1, alignItems: 'center' }}><Texto v="legenda" suave>{descanso.troca ? 'TROCA DE EXERCÍCIO' : 'DESCANSO'}</Texto><Texto v="titulo-2">{restante === 0 ? 'Pronto!' : `${Math.floor(restante / 60)}:${String(restante % 60).padStart(2, '0')}`}</Texto></View>
          <Botao v="secundario" titulo="+15 s" onPress={() => ajustar(15)} />
        </View>
      )}
      {descanso && <Texto v="rotulo" suave style={{ textAlign: 'center' }} >{descanso.troca ? `Próximo: ${descanso.exercicio}` : `Próxima série: ${descanso.exercicio}`}</Texto>}
      {descanso && <Botao v="texto" titulo="Pular descanso" onPress={pular} />}
      {confirmarFim ? (
        <View style={{ gap: 8 }}>
          <Texto v="corpo-forte">Finalizar o treino agora?{proxima ? ` Ainda faltam ${total - concluidas} séries.` : ''}</Texto>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Botao flex v="secundario" titulo="Continuar treinando" onPress={() => setConfirmarFim(false)} />
            <Botao flex titulo="Finalizar" onPress={finalizar} testID="confirmar-finalizar" />
          </View>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ width: 128 }}><Botao v="secundario" titulo="Finalizar" onPress={() => (proxima ? setConfirmarFim(true) : finalizar())} testID="finalizar" /></View>
          {proxima
            ? <Botao flex grande titulo={`✓ Concluir série ${proxima.ordem}`} onPress={() => concluir(proxima!.p.exId, proxima!.ordem, sugestao(proxima!.p, proxima!.ordem))} testID="concluir-proxima" />
            : <Botao flex grande titulo="Finalizar treino" onPress={finalizar} />}
        </View>
      )}
    </View>
  );

  return (
    <Tela titulo={rotina?.nome ?? 'Treino livre'} voltar={() => router.replace('/inicio')} iconeVoltar="▾" rodape={rodape}>
      <Texto v="rotulo" suave>{concluidas} de {total} séries · {minutos} min{proxima ? ` · próxima: ${exs.get(proxima.p.exId)?.nome}, série ${proxima.ordem}` : ''}</Texto>
      {erroSerie && <Aviso tom="erro" titulo="Série não registrada" texto={erroSerie} />}
      {recorde && <Aviso tom="sucesso" titulo="Novo recorde pessoal" texto={recorde} />}
      {pedirAviso && (
        <Cartao destaque>
          <Texto v="corpo-forte">Avisar quando o descanso acabar?</Texto>
          <Texto v="rotulo" suave>Mesmo com o app fechado, você recebe: “Descanso terminou — próxima série: {descanso?.exercicio ?? 'exercício'}”. Nenhum dado de carga ou peso aparece no aviso.</Texto>
          <Botao titulo="Ativar avisos" onPress={async () => { const ok = await pedirPermissao(); aplicar((e) => ({ ...e, permissaoNotificacao: ok ? 'concedida' : 'negada' })); setPedirAviso(false);
            // BUG-14: agenda o descanso que já está correndo.
            if (ok && descanso) { const seg = Math.round((descanso.fim - agoraMs()) / 1000); if (seg > 0) await agendarFimDescanso(seg, descanso.exercicio); } }} />
          <Botao v="texto" titulo="Agora não" onPress={() => { aplicar((e) => ({ ...e, permissaoNotificacao: 'negada' })); setPedirAviso(false); }} />
        </Cartao>
      )}
      {ids.length === 0 && <Texto suave>Treino livre: adicione um exercício.</Texto>}
      {planos.map((p) => {
        const { exId, minhas, n, ult } = p;
        const ex = exs.get(exId);
        const linhas = Array.from({ length: n }, (_, i) => i + 1);
        return (
          <Cartao key={exId}>
            <Pressable accessibilityRole="button" onPress={() => router.push(`/exercicio/${exId}`)}><Texto v="titulo-3">{ex?.nome}</Texto></Pressable>
            <DemonstracaoExercicio exercicioId={exId} nome={ex?.nome ?? 'exercício'} />
            <Texto v="rotulo" suave>{ult.length ? `Última vez: ${ult.map((s) => `${formatarKg(s.cargaKg)} kg × ${s.reps}`).join(' · ')}` : 'Primeira vez neste exercício'}</Texto>
            {(() => {
              const prog = sugerirProgressao(ult, p.alvo?.repsAlvo ?? null);
              if (!prog || minhas.some((s) => s.concluidaEm)) return null;
              const texto = prog.tipo === 'carga'
                ? `Você bateu as ${p.alvo?.repsAlvo} repetições em todas as séries. Que tal ${formatarKg(prog.paraKg)} kg hoje (+${formatarKg(prog.incrementoKg)} kg)?`
                : `Você bateu as ${p.alvo?.repsAlvo} repetições em todas as séries. Que tal ${prog.paraReps} repetições hoje?`;
              const aplicarProg = () => {
                const novo = { ...rascunho };
                for (let o = 1; o <= n; o++) {
                  const k = `${exId}:${o}`; const base = novo[k] ?? { ...sugestao(p, o), tipo: 'normal' as TipoSerie };
                  if (base.tipo === 'aquecimento') continue;
                  novo[k] = prog.tipo === 'carga' ? { ...base, kg: String(prog.paraKg).replace('.', ',') } : { ...base, reps: String(prog.paraReps) };
                }
                setRascunho(novo);
              };
              return (
                <View testID={`progressao-${exId}`} style={{ gap: 6, padding: 10, borderRadius: 12, borderWidth: 1.5, borderColor: contorno, backgroundColor: b['primaria-suave'] }}>
                  <Texto v="rotulo" cor={b.texto}>📈 {texto}</Texto>
                  <Texto v="legenda" cor={b['texto-suave']}>{AVISO_PROGRESSAO}</Texto>
                  <Botao v="secundario" titulo={prog.tipo === 'carga' ? `Usar ${formatarKg(prog.paraKg)} kg` : `Usar ${prog.paraReps} repetições`} onPress={aplicarProg} testID={`usar-progressao-${exId}`} />
                </View>
              );
            })()}
            <View style={{ flexDirection: 'row', gap: 8 }} importantForAccessibility="no-hide-descendants">
              <Texto v="legenda" suave style={{ width: 44, textAlign: 'center' }}>SÉRIE</Texto>
              <Texto v="legenda" suave style={{ flex: 1, textAlign: 'center' }}>KG</Texto>
              <Texto v="legenda" suave style={{ flex: 1, textAlign: 'center' }}>REPS</Texto>
              <View style={{ width: 56 }} />
            </View>
            {linhas.map((ordem) => {
              const k = `${exId}:${ordem}`;
              const feita = minhas.find((s) => s.ordem === ordem && s.concluidaEm);
              const sug = sugestao(p, ordem);
              const r = rascunho[k] ?? { ...sug, tipo: (feita?.tipo ?? 'normal') as TipoSerie };
              const set = (p: Partial<typeof r>) => setRascunho({ ...rascunho, [k]: { ...r, ...p } });
              return (
                <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 56 }}>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Tipo da série ${ordem}: ${r.tipo}`} onPress={() => set({ tipo: TIPOS[(TIPOS.indexOf(r.tipo) + 1) % TIPOS.length] })} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: c['superficie-2'] }}>
                    <Texto v="corpo-forte">{r.tipo === 'normal' ? String(ordem) : SIGLA[r.tipo]}</Texto>
                  </Pressable>
                  <TextInput accessibilityLabel={`Carga em kg, série ${ordem}`} value={feita ? String(feita.cargaKg ?? '').replace('.', ',') : r.kg} editable={!feita} onChangeText={(t) => set({ kg: t })} keyboardType="decimal-pad" placeholder="kg"
                    style={{ flex: 1, minWidth: 0, width: 0, height: 52, borderRadius: 12, borderWidth: 1, borderColor: c['borda-campo'], color: c.texto, backgroundColor: c.superficie, textAlign: 'center', fontSize: 18 }} />
                  <TextInput accessibilityLabel={`Repetições, série ${ordem}`} value={feita ? String(feita.reps ?? '') : r.reps} editable={!feita} onChangeText={(t) => set({ reps: t })} keyboardType="number-pad" placeholder="reps"
                    style={{ flex: 1, minWidth: 0, width: 0, height: 52, borderRadius: 12, borderWidth: 1, borderColor: c['borda-campo'], color: c.texto, backgroundColor: c.superficie, textAlign: 'center', fontSize: 18 }} />
                  <Pressable testID={`concluir-${ordem}`} accessibilityRole="button" accessibilityLabel={`Concluir série ${ordem}`} disabled={!!feita} onPress={() => concluir(exId, ordem, sug)}
                    style={{ width: 56, height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: feita ? c.sucesso : c.superficie, borderWidth: feita ? 0 : 2, borderColor: c['texto-suave'] }}>
                    <Texto v="titulo-3" cor={feita ? c.superficie : c['texto-suave']}>✓</Texto>
                  </Pressable>
                </View>
              );
            })}
            <Botao v="texto" titulo="+ Adicionar série" onPress={() => setMais({ ...mais, [exId]: (mais[exId] ?? 0) + 1 })} />
            {minhas.length > 0 && <Selo texto={`${minhas.length} concluída(s)`} tom="sucesso" />}
          </Cartao>
        );
      })}
      <Texto v="corpo-forte">Adicionar exercício</Texto>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {todosExercicios(estado).filter((e) => !ids.includes(e.id)).slice(0, 8).map((e) => (
          <Botao key={e.id} v="secundario" titulo={e.nome} onPress={() => setExtras([...extras, e.id])} />
        ))}
      </View>
    </Tela>
  );
}
