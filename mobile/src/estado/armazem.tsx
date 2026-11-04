import type { PreferenciaDescanso } from '@/dominio/descanso';
import { nomeVazio } from '@/dominio/validacao';
import { criarArmazenamento, type Armazenamento, type Modo } from '@/servicos/armazenamento';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import { BIBLIOTECA } from '@/dominio/biblioteca';
import { gerarExemplo } from '@/dominio/exemplo';
import { enfileirar, type ItemFila } from '@/dominio/sincronizacao';
import { ativo, conceder, revogar, type Finalidade, type RegistroConsentimento } from '@/dominio/consentimento';
import { novoId } from '@/servicos/id';
import { pedirArmazenamentoPersistente } from '@/servicos/protecao-dados';
import { AGUA_MAX_ML, AGUA_MIN_ML, META_MAX_ML, META_MIN_ML, type RegistroAgua } from '@/dominio/agua';
import { marcar, type Avaliacao, type RegistroDiario } from '@/dominio/diario';
import { definirDia, reagendar, type Agenda, type Planejado } from '@/dominio/agenda';
import { type Convite, aplicarTreinosDoTreinador, type TreinoAtribuido, type Vinculo } from '@/dominio/treinador';
import type { Momento } from '@/dominio/refeicoes';
import { DIAS_MAX, DIAS_MIN, type PerfilTreino } from '@/dominio/objetivo';
import { LIMITE_TEXTO_LOCAL, validarHora, type DadosTour } from '@/dominio/tour';
import type { Exercicio, PesoCorporal, Rotina, Serie, SessaoTreino } from '@/dominio/tipos';

/** Estado local do aparelho (offline-first), versionado. Persistido por servicos/armazenamento.ts (SQLCipher no aparelho – ADR-0010). */
export interface Estado {
  versao: 2;
  /** Modo local não coleta e-mail (minimização, ADR-0009). */
  usuario: { modo: 'local'; criadoEm: string } | null;
  /** v0.6: conta (Supabase Auth) dona dos dados deste aparelho. Só o id e o e-mail; a senha nunca passa por aqui. */
  conta?: { id: string; email: string } | null;
  /** Histórico de consentimentos: um registro por concessão, revogação sem apagar. */
  consentimentos: RegistroConsentimento[];
  /** Quando a pessoa passou pela tela de consentimentos inicial (mesmo sem autorizar). */
  consentimentosVistosEm: string | null;
  /** v0.4.1: quando a apresentação de primeiro acesso foi concluída ou pulada (null = ainda não viu). */
  apresentacaoVistaEm?: string | null;
  /** v0.4.1: perfil local (nunca sai do aparelho; não vai para o Supabase). Altura é dado de saúde. */
  perfil?: PerfilCompleto;
  /** v0.4.1: copos de água (dado de saúde, cifrado com o resto do estado). */
  agua?: RegistroAgua[];
  /** v0.5: diário alimentar simples (como foi cada refeição; dado de saúde). */
  diario?: RegistroDiario[];
  /** v0.7: agenda de treinos (padrão da semana e datas). */
  agenda?: Agenda;
  /** v0.8: treinadores a que a conta está vinculada (vem do servidor) e link de vínculo esperando o login. */
  vinculos?: Vinculo[];
  /** v0.10: convites de treinador esperando resposta; ID de aluno da conta; o resumo já publicado. */
  convites?: Convite[];
  idAluno?: string | null;
  evolucaoEnviada?: string | null;
  vinculoPendente?: string | null;
  /** v0.9: o aniversário que já foi para o servidor (chaveAniversario). */
  aniversarioEnviado?: string | null;
  /** v0.9: mascote do Início: fechado naquele dia (AAAA-MM-DD) ou desligado em Perfil. */
  mascote?: { fechadoEm?: string | null; desligado?: boolean } | null;
  /** v0.5: quando a pessoa exportou os dados pela última vez e quando adiou o lembrete de cópia. */
  ultimaExportacaoEm?: string | null;
  lembreteBackupAdiadoEm?: string | null;
  exercicios: Exercicio[]; // próprios do usuário (a biblioteca Domma vem de BIBLIOTECA)
  rotinas: Rotina[];
  sessoes: SessaoTreino[];
  series: Serie[];
  pesos: PesoCorporal[];
  fila: ItemFila[];
  permissaoNotificacao: 'nao_pedida' | 'concedida' | 'negada';
}

export type Avatar = { tipo: 'ilustrado'; id: string } | { tipo: 'foto'; uri: string };
export interface Perfil { nome: string | null; avatar: Avatar | null; alturaCm: number | null; /** meta editada pela pessoa; null = padrão 35 ml/kg */ metaAguaMl?: number | null; /** objetivo, nível e dias (v0.4.1) */ treino?: PerfilTreino | null;
  /** v0.11: descanso entre séries (padrão 60 s fixos) */ descanso?: PreferenciaDescanso | null }
/** Dados do tour guiado (v0.4.1): faixa de idade, experiência, tempo, local, restrições (saúde), preferência alimentar, lembretes, cidade/bairro. */
export type PerfilCompleto = Perfil & DadosTour;
export const perfilVazio = (): Perfil => ({ nome: null, avatar: null, alturaCm: null });

export const estadoInicial = (): Estado => ({
  versao: 2, usuario: null,
  consentimentos: [], consentimentosVistosEm: null, apresentacaoVistaEm: null, perfil: perfilVazio(), agua: [],
  exercicios: [], rotinas: [], sessoes: [], series: [], pesos: [], fila: [], permissaoNotificacao: 'nao_pedida',
});

const agora = () => new Date().toISOString();

/** Ações puras sobre o estado (testáveis sem React). */
export const acoes = {
  /** O 2º parâmetro (e-mail) é legado e IGNORADO: o modo local não coleta e-mail (ADR-0009). */
  entrar: (e: Estado, _emailIgnorado?: string): Estado => ({ ...e, usuario: { modo: 'local', criadoEm: agora() } }),
  /** Atalho: aplica as duas finalidades e marca a tela de consentimentos como vista. */
  consentir: (e: Estado, c: { dadosSaude: boolean; iaVisaoEua?: boolean }): Estado => {
    let x = acoes.definirConsentimento(e, 'dados_saude', c.dadosSaude);
    if (c.iaVisaoEua !== undefined) x = acoes.definirConsentimento(x, 'ia_visao_eua', c.iaVisaoEua);
    return acoes.concluirConsentimentos(x);
  },
  /** Liga (novo registro com versão e data/hora) ou desliga (revoga o ativo) uma finalidade. */
  definirConsentimento: (e: Estado, f: Finalidade, ligado: boolean): Estado => ({
    ...e, consentimentos: ligado ? conceder(e.consentimentos, f, agora(), novoId()) : revogar(e.consentimentos, f, agora()),
  }),
  concluirConsentimentos: (e: Estado): Estado => ({ ...e, consentimentosVistosEm: e.consentimentosVistosEm ?? agora() }),
  /** Concluir ou pular a apresentação: não volta a aparecer sozinha (pode ser reaberta pelo Perfil). */
  concluirApresentacao: (e: Estado): Estado => ({ ...e, apresentacaoVistaEm: e.apresentacaoVistaEm ?? agora() }),
  /** Nome de exibição opcional (até 40 caracteres); vazio remove. */
  definirNome: (e: Estado, nome: string): Estado => {
    const n = nome.trim();
    if (n.length > 40) throw new Error('valor_invalido');
    return { ...e, perfil: { ...(e.perfil ?? perfilVazio()), nome: n && !nomeVazio(n) ? n : null } };
  },
  /** Foto (data URI JPEG já recortada e comprimida) ou avatar ilustrado; null remove. */
  definirAvatar: (e: Estado, a: Avatar | null): Estado => {
    if (a?.tipo === 'foto' && !/^data:image\/(jpeg|png);base64,/.test(a.uri)) throw new Error('valor_invalido');
    return { ...e, perfil: { ...(e.perfil ?? perfilVazio()), avatar: a } };
  },
  /** Altura em cm (100–250), dado de saúde: exige o consentimento de saúde. null remove. */
  definirAltura: (e: Estado, cm: number | null): Estado => {
    if (cm != null) {
      if (!temSaude(e)) throw new Error('sem_consentimento');
      if (!(cm >= 100 && cm <= 250)) throw new Error('valor_invalido');
    }
    return { ...e, perfil: { ...(e.perfil ?? perfilVazio()), alturaCm: cm } };
  },
  /** Água: exige consentimento de saúde, como o peso. */
  registrarAgua: (e: Estado, r: RegistroAgua): Estado => {
    if (!temSaude(e)) throw new Error('sem_consentimento');
    if (!(Number.isInteger(r.ml) && r.ml >= AGUA_MIN_ML && r.ml <= AGUA_MAX_ML)) throw new Error('valor_invalido');
    return { ...e, agua: [...(e.agua ?? []), r] };
  },
  registrarExportacao: (e: Estado): Estado => ({ ...e, ultimaExportacaoEm: agora(), lembreteBackupAdiadoEm: null }),
  adiarLembreteBackup: (e: Estado): Estado => ({ ...e, lembreteBackupAdiadoEm: agora() }),
  /** Diário alimentar (v0.5): exige consentimento de saúde. `avaliacao` null desmarca. */
  marcarRefeicao: (e: Estado, dia: string, momento: Momento, avaliacao: Avaliacao | null): Estado => {
    if (!temSaude(e)) throw new Error('sem_consentimento');
    return { ...e, diario: marcar(e.diario ?? [], dia, momento, avaliacao, agora()) };
  },
  /** Desfazer: remove o registro (é o último toque da pessoa; não há sincronização de água). */
  desfazerAgua: (e: Estado, id: string): Estado => ({ ...e, agua: (e.agua ?? []).filter((r) => r.id !== id) }),
  definirMetaAgua: (e: Estado, ml: number | null): Estado => {
    if (ml != null && !(Number.isInteger(ml) && ml >= META_MIN_ML && ml <= META_MAX_ML)) throw new Error('valor_invalido');
    return { ...e, perfil: { ...(e.perfil ?? perfilVazio()), metaAguaMl: ml } };
  },
  /** Objetivo: só muda as sugestões; o plano (rotinas) fica como está. */
  /** Atualiza dados do tour (só os campos enviados). Restrições/lesões são dado de saúde: exigem o consentimento. */
  atualizarPerfil: (e: Estado, d: DadosTour): Estado => {
    const p: DadosTour = { ...d };
    if (p.restricoes && p.restricoes.length && !temSaude(e)) throw new Error('sem_consentimento');
    for (const k of ['cidade', 'bairro'] as const) if (k in p) { const t = (p[k] ?? '').trim().slice(0, LIMITE_TEXTO_LOCAL); p[k] = t || null; }
    if (p.lembretes?.treinoHora != null && !validarHora(p.lembretes.treinoHora)) throw new Error('valor_invalido');
    return { ...e, perfil: { ...(e.perfil ?? perfilVazio()), ...p } };
  },
  definirObjetivo: (e: Estado, t: PerfilTreino | null): Estado => {
    if (t && !(Number.isInteger(t.dias) && t.dias >= DIAS_MIN && t.dias <= DIAS_MAX)) throw new Error('valor_invalido');
    return { ...e, perfil: { ...(e.perfil ?? perfilVazio()), treino: t } };
  },
  salvarRotina: (e: Estado, r: Rotina): Estado => {
    if (nomeVazio(r.nome) || r.nome.length > 60) throw new Error('valor_invalido'); // BUG-06/08: mesmos limites do servidor
    const reg = { ...r, atualizadoEm: agora() };
    return { ...e, rotinas: [...e.rotinas.filter((x) => x.id !== r.id), reg], fila: enfileirar(e.fila, { tabela: 'rotinas', registro: reg as never }) };
  },
  /** v0.8: treinos do treinador vindos do servidor (troca o conjunto inteiro; não entra na fila de envio). */
  receberConvites: (e: Estado, convites: Convite[]): Estado => ({ ...e, convites }),
  guardarIdAluno: (e: Estado, id: string | null): Estado => ({ ...e, idAluno: id }),
  marcarEvolucaoEnviada: (e: Estado, ass: string | null): Estado => ({ ...e, evolucaoEnviada: ass }),
  receberTreinosDoTreinador: (e: Estado, vinculos: Vinculo[], treinos: TreinoAtribuido[]): Estado => {
    const ids = new Set(todosExercicios(e).map((x) => x.id));
    const r = aplicarTreinosDoTreinador(e, vinculos, treinos, (id) => ids.has(id), agora());
    return { ...e, rotinas: r.rotinas, agenda: r.agenda, vinculos: r.vinculos };
  },
  guardarVinculoPendente: (e: Estado, codigo: string | null): Estado => ({ ...e, vinculoPendente: codigo }),
  marcarAniversarioEnviado: (e: Estado, chave: string): Estado => ({ ...e, aniversarioEnviado: chave }),
  definirDescanso: (e: Estado, d: PreferenciaDescanso): Estado => ({ ...e, perfil: { ...(e.perfil ?? perfilVazio()), descanso: d } }),
  fecharMascote: (e: Estado, dia: string): Estado => ({ ...e, mascote: { ...(e.mascote ?? {}), fechadoEm: dia } }),
  ligarMascote: (e: Estado, ligado: boolean): Estado => ({ ...e, mascote: { ...(e.mascote ?? {}), desligado: !ligado, fechadoEm: null } }),
  /** v0.7: agenda. `repetir` grava como padrão do dia da semana. */
  planejarDia: (e: Estado, dia: string, valor: Planejado | null, repetir = false): Estado => ({ ...e, agenda: definirDia(e.agenda, dia, valor, repetir) }),
  /** v0.9: muda o treino de uma data para outra (só aquela data; o padrão da semana continua nas outras). */
  reagendarDia: (e: Estado, de: string, para: string, id: string): Estado => ({ ...e, agenda: reagendar(e.agenda, de, para, id) }),
  /** v0.7: grava o treino do dia gerado pelo app. Só existe um: o anterior é trocado (ou excluído, se já foi usado num treino). */
  salvarTreinoDoDia: (e: Estado, r: Rotina): Estado => {
    let x = e;
    for (const antigo of e.rotinas.filter((y) => y.origem === 'dia' && !y.excluidoEm && y.id !== r.id)) {
      const usado = e.sessoes.some((s) => s.rotinaId === antigo.id);
      x = usado ? acoes.excluirRotina(x, antigo.id) : { ...x, rotinas: x.rotinas.filter((y) => y.id !== antigo.id) };
    }
    return acoes.salvarRotina(x, { ...r, origem: 'dia' });
  },
  excluirRotina: (e: Estado, id: string): Estado => {
    const r = e.rotinas.find((x) => x.id === id);
    return r ? acoes.salvarRotina(e, { ...r, excluidoEm: agora() }) : e;
  },
  /** Sem consentimento de saúde, não grava treino nem peso (critério de aceite). */
  iniciarSessao: (e: Estado, s: SessaoTreino): Estado => {
    if (!temSaude(e)) throw new Error('sem_consentimento');
    // BUG-09: L2.5 também no armazém – uma sessão ativa por vez.
    if (!s.finalizadaEm && e.sessoes.some((x) => x.id !== s.id && !x.finalizadaEm && !x.excluidoEm)) throw new Error('sessao_ativa');
    return { ...e, sessoes: [...e.sessoes, s], fila: enfileirar(e.fila, { tabela: 'sessoes_treino', registro: s as never }) };
  },
  salvarSessao: (e: Estado, s: SessaoTreino): Estado => {
    const reg = { ...s, atualizadoEm: agora() };
    return { ...e, sessoes: e.sessoes.map((x) => (x.id === s.id ? reg : x)), fila: enfileirar(e.fila, { tabela: 'sessoes_treino', registro: reg as never }) };
  },
  /**
   * v0.8.2: descartar o treino em andamento (começou o treino errado). Some do aparelho junto com as séries,
   * para não contar no histórico, na sequência, nos recordes nem nos gráficos; a fila leva a exclusão ao servidor.
   */
  descartarSessao: (e: Estado, id: string): Estado => {
    const s = e.sessoes.find((x) => x.id === id);
    if (!s || s.finalizadaEm) return e;
    const quando = agora();
    let fila = enfileirar(e.fila, { tabela: 'sessoes_treino', registro: { ...s, excluidoEm: quando, atualizadoEm: quando } as never });
    for (const x of e.series.filter((y) => y.sessaoId === id)) fila = enfileirar(fila, { tabela: 'series', registro: { ...x, excluidoEm: quando, atualizadoEm: quando } as never });
    return { ...e, sessoes: e.sessoes.filter((x) => x.id !== id), series: e.series.filter((x) => x.sessaoId !== id), fila };
  },
  salvarSerie: (e: Estado, s: Serie): Estado => {
    if (!temSaude(e)) throw new Error('sem_consentimento');
    // BUG-06: mesmos limites do servidor (carga 0–1000 kg, reps 0–1000, RPE 1–10).
    if ((s.cargaKg != null && !(s.cargaKg >= 0 && s.cargaKg <= 1000)) || (s.reps != null && !(s.reps >= 0 && s.reps <= 1000))
      || (s.rpe != null && !(s.rpe >= 1 && s.rpe <= 10))) throw new Error('valor_invalido');
    const reg = { ...s, atualizadoEm: agora() };
    return { ...e, series: [...e.series.filter((x) => x.id !== s.id), reg], fila: enfileirar(e.fila, { tabela: 'series', registro: reg as never }) };
  },
  registrarPeso: (e: Estado, p: PesoCorporal): Estado => {
    if (!temSaude(e)) throw new Error('sem_consentimento');
    if (!(p.pesoKg >= 20 && p.pesoKg <= 400)) throw new Error('valor_invalido');
    if (+new Date(p.medidoEm) > Date.now() + 5 * 60_000) throw new Error('valor_invalido'); // BUG-07
    return { ...e, pesos: [...e.pesos, p], fila: enfileirar(e.fila, { tabela: 'pesos_corporais', registro: p as never }) };
  },
  carregarExemplo: (e: Estado): Estado => {
    const x = gerarExemplo();
    const limpa = acoes.removerExemplo(e);
    return { ...limpa, rotinas: [...limpa.rotinas, ...x.rotinas], sessoes: [...limpa.sessoes, ...x.sessoes], series: [...limpa.series, ...x.series], pesos: [...limpa.pesos, ...x.pesos] };
  },
  removerExemplo: (e: Estado): Estado => ({
    ...e, rotinas: e.rotinas.filter((r) => !r.exemplo), sessoes: e.sessoes.filter((r) => !r.exemplo),
    series: e.series.filter((r) => !r.exemplo), pesos: e.pesos.filter((r) => !r.exemplo),
  }),
  /** Exclusão de conta no aparelho. No servidor: rpc excluir_minha_conta (quando houver backend). */
  excluirTudo: (): Estado => estadoInicial(),
  /** v0.4.3: sair sem apagar. Só desliga o usuário; treinos, perfil e consentimentos ficam no aparelho. */
  sair: (e: Estado): Estado => ({ ...e, usuario: null }),
  /**
   * v0.6: entrar com conta. Os dados que já estão no aparelho passam a ser dessa conta. Se o aparelho tem dados de
   * OUTRA conta, recusa ('outra_conta'): a pessoa precisa sair e apagar os dados deste aparelho antes (nada se mistura).
   */
  entrarConta: (e: Estado, conta: { id: string; email: string }): Estado => {
    if (e.conta && e.conta.id !== conta.id && temDadosPessoais(e)) throw new Error('outra_conta');
    return { ...e, conta: { id: conta.id, email: conta.email }, usuario: e.usuario ?? { modo: 'local', criadoEm: agora() } };
  },
  /** Tela "Itens com erro": descarta um item da fila (o dado local fica como está). */
  descartarItemFila: (e: Estado, id: string): Estado => ({ ...e, fila: e.fila.filter((i) => i.registro.id !== id) }),
  /** Corrige o nome de um item recusado: grava a correção pela regra normal e tira a marca de erro. */
  corrigirNomeItemFila: (e: Estado, id: string, nome: string): Estado => {
    const item = e.fila.find((i) => i.registro.id === id);
    if (!item) return e;
    if (nomeVazio(nome) || nome.length > 60) throw new Error('valor_invalido');
    const registro = { ...item.registro, nome: nome.trim(), atualizadoEm: agora() };
    const fila = e.fila.map((i) => (i.registro.id === id ? { tabela: i.tabela, registro } : i));
    if (item.tabela === 'rotinas') return { ...e, fila, rotinas: e.rotinas.map((r) => (r.id === id ? { ...r, nome: registro.nome as string, atualizadoEm: registro.atualizadoEm } : r)) };
    if (item.tabela === 'exercicios') return { ...e, fila, exercicios: e.exercicios.map((x) => (x.id === id ? { ...x, nome: registro.nome as string } : x)) };
    return { ...e, fila };
  },
};

/** Há algo da pessoa no aparelho (além de dados de exemplo)? */
export const temDadosPessoais = (e: Estado) =>
  e.rotinas.some((r) => !r.exemplo) || e.sessoes.some((r) => !r.exemplo) || e.pesos.some((r) => !r.exemplo) || (e.agua ?? []).length > 0 || (e.diario ?? []).length > 0;

export const temSaude = (e: Estado) => !!ativo(e.consentimentos, 'dados_saude');
export const temIa = (e: Estado) => !!ativo(e.consentimentos, 'ia_visao_eua');

/** Converte o estado gravado pela versão 0.1.0 (formato 1): descarta o e-mail e cria o histórico. */
export function migrarEstado(bruto: any): Estado | null {
  // v0.4.1: quem já usava o app (consentimentos vistos) não vê a apresentação de novo.
  if (bruto?.versao === 2) return { ...bruto, apresentacaoVistaEm: bruto.apresentacaoVistaEm !== undefined ? bruto.apresentacaoVistaEm : (bruto.consentimentosVistosEm ?? null), perfil: bruto.perfil ?? perfilVazio(), agua: bruto.agua ?? [] } as Estado;
  if (bruto?.versao !== 1) return null;
  const c = bruto.consentimentos ?? {};
  const lista: RegistroConsentimento[] = [];
  // Textos da v1 eram provisórios: o aceite antigo vira histórico já encerrado e a pessoa revê os novos textos.
  if (c.aceitoEm && c.dadosSaude) lista.push({ id: novoId(), finalidade: 'dados_saude', versao: c.versao ?? 'v1-rascunho', aceitoEm: c.aceitoEm, revogadoEm: c.aceitoEm });
  if (c.aceitoEm && c.iaVisaoEua) lista.push({ id: novoId(), finalidade: 'ia_visao_eua', versao: c.versao ?? 'v1-rascunho', aceitoEm: c.aceitoEm, revogadoEm: c.aceitoEm });
  const { usuario, ...resto } = bruto;
  return { ...resto, versao: 2, usuario: usuario ? { modo: 'local', criadoEm: c.aceitoEm ?? new Date().toISOString() } : null, consentimentos: lista, consentimentosVistosEm: null, apresentacaoVistaEm: null, perfil: perfilVazio(), agua: [] };
}

/** Mostrar a apresentação? Só no primeiro acesso. */
export const precisaApresentacao = (e: Estado) => !e.apresentacaoVistaEm;

export const temExemplo = (e: Estado) => [e.rotinas, e.sessoes, e.series, e.pesos].some((l) => l.some((r) => r.exemplo));
export const todosExercicios = (e: Estado) => [...BIBLIOTECA, ...e.exercicios];

type Ctx = { estado: Estado; pronto: boolean; aplicar: (f: (e: Estado) => Estado) => void; modoArmazenamento: Modo | 'memoria'; apagarDadosDoAparelho: () => Promise<void>; /** v0.5 (web): o navegador aceitou guardar os dados de forma persistente? null = sem resposta/suporte. */ persistente?: boolean | null };
const Contexto = createContext<Ctx | null>(null);

export function ProvedorEstado({ children, inicial }: { children: ReactNode; inicial?: Estado }) {
  const [estado, setEstado] = useState<Estado>(inicial ?? estadoInicial());
  const [pronto, setPronto] = useState(!!inicial);
  const [arm, setArm] = useState<Armazenamento | null>(null);
  const [persistente, setPersistente] = useState<boolean | null>(null);
  // ADR-0010: banco cifrado (SQLCipher) no aparelho; migra do AsyncStorage na primeira abertura.
  useEffect(() => {
    if (inicial) return;
    let vivo = true;
    (async () => {
      const a = await criarArmazenamento();
      const t = await a.ler().catch(() => null);
      if (!vivo) return;
      if (t) { try { const e = migrarEstado(JSON.parse(t)); if (e) setEstado(e); } catch { /* estado corrompido: começa vazio */ } }
      setArm(a); setPronto(true);
      if (a.modo === 'web') pedirArmazenamentoPersistente().then((r) => { if (vivo) setPersistente(r); }).catch(() => {});
    })();
    return () => { vivo = false; };
  }, [inicial]);
  useEffect(() => { if (pronto && arm) arm.gravar(JSON.stringify(estado)).catch((e) => console.warn('[armazem] falha ao gravar:', e)); }, [estado, pronto, arm]);
  /** "Excluir tudo": apaga o banco e a chave do SecureStore (ADR-0010) e volta ao estado inicial. */
  /**
   * v0.4.3 – exclusão mais robusta: (1) solta o banco, para nada ser gravado durante a exclusão; (2) apaga os
   * ARQUIVOS primeiro, com uma nova tentativa (apagar é idempotente: apagar o que já não existe não falha);
   * (3) só depois limpa a tela. Se falhar, o banco é reaberto e o estado fica como estava, e a
   * mensagem "Não foi possível concluir. Tente de novo." vale de verdade: tentar de novo repete o mesmo caminho.
   */
  const apagarDadosDoAparelho = async () => {
    const antigo = arm;
    setArm(null);
    try {
      if (antigo) { try { await antigo.apagarTudo(); } catch { await antigo.apagarTudo(); } }
    } catch (e) {
      // O banco antigo pode ter sido fechado no meio: abre de novo (não reaproveita a conexão fechada).
      setArm(antigo ? await criarArmazenamento().catch(() => null) : null);
      throw e;
    }
    setEstado(estadoInicial());
    if (antigo) setArm(await criarArmazenamento());
  };
  // REG-01: rede de segurança – uma regra recusada nunca derruba a tela; o estado fica como estava.
  const aplicar = (f: (e: Estado) => Estado) => setEstado((e) => { try { return f(e); } catch (err) { console.warn('[armazem] alteração recusada:', (err as Error).message); return e; } });
  return <Contexto value={{ estado, pronto, aplicar, modoArmazenamento: arm?.modo ?? 'memoria', apagarDadosDoAparelho, persistente }}>{children}</Contexto>;
}

export function useEstado() {
  const c = use(Contexto);
  if (!c) throw new Error('useEstado fora do ProvedorEstado');
  return c;
}
