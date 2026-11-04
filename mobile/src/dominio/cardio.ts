import type { Equipamento } from './equipamentos';
import type { PerfilTreino } from './objetivo';
import type { Restricao, TempoTreino } from './tour';
import type { TreinoDoDia, ItemDoDia } from './treino-do-dia';
import type { ItemRotina } from './tipos';

/**
 * v0.11: exercícios por tempo (cardio). Cada série é um bloco de tempo (ex.: 20 min de esteira, ou 8 × 30 s de tiro).
 * Na tela do treino, o bloco tem cronômetro: ao acabar, o app avisa e já conta o descanso.
 */
export const DURACAO_PADRAO_CARDIO_S = 10 * 60;
export const ehPorTempo = (item?: Pick<ItemRotina, 'duracaoAlvoS'> | null, ex?: { categoria?: string } | null) => !!item?.duracaoAlvoS || ex?.categoria === 'cardio';
export const duracaoDoItem = (item?: Pick<ItemRotina, 'duracaoAlvoS'> | null) => item?.duracaoAlvoS ?? DURACAO_PADRAO_CARDIO_S;

/** 1200 → "20 min"; 90 → "1:30"; 30 → "30 s". */
export function formatarDuracao(s: number): string {
  if (s < 60) return `${s} s`;
  if (s % 60 === 0) return `${s / 60} min`;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Lê o tempo digitado: "20" = 20 min; "0,5" = 30 s; "1:30" = 1 min 30 s. null se não for válido (1 s a 4 h). */
export function lerMinutos(t: string): number | null {
  const x = t.trim().replace(',', '.');
  let s: number;
  const m = /^(\d{1,3}):([0-5]\d)$/.exec(x);
  if (m) s = +m[1] * 60 + +m[2];
  else if (/^\d+(\.\d+)?$/.test(x)) s = Math.round(+x * 60);
  else return null;
  return s >= 1 && s <= 4 * 3600 ? s : null;
}
/** Valor para o campo: 1200 → "20"; 90 → "1:30"; 30 → "0:30". */
export const minutosParaCampo = (s: number) => (s % 60 === 0 ? String(s / 60) : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);

// ---------- v0.11: treino de cardio do dia ----------

const EX = {
  caminhadaEsteira: '6e846730-b6f9-5b3f-a847-e231f6aa4cd4', caminhada: '4b9f4741-2b00-5832-bc2d-077412206f41',
  trote: '557baa3c-2f10-59e0-a48f-75c568529f6a', corrida: '467f4a6b-4e0e-5060-a57f-52ff60e4f375',
  bike: 'ba12ac34-dfd2-5f94-ac75-14f34d29a655', eliptico: 'e85996cd-245d-5dbd-96f8-676e335e041f', remo: '65d9324c-1586-58d3-8236-dd7d862f42bf',
  pularCorda: '0746b6e1-833f-59ef-abb3-5a3a729f4269', skipping: '55f631ba-1ac3-5b99-84cc-2885ee491fe4',
  escalador: '0a4b78e1-f094-5721-ab85-1602a8ffce01', estrela: 'ac910df9-ea71-5f17-b09d-0efa710f6c66', calcanhar: '459a2b21-5de2-56e6-8a45-78df004c720a',
} as const;
const NOMES: Record<string, string> = {
  [EX.caminhadaEsteira]: 'Caminhada na esteira', [EX.caminhada]: 'Caminhada', [EX.trote]: 'Trote na esteira', [EX.corrida]: 'Corrida na esteira',
  [EX.bike]: 'Bicicleta ergométrica', [EX.eliptico]: 'Elíptico', [EX.remo]: 'Remo', [EX.pularCorda]: 'Pular corda', [EX.skipping]: 'Skipping rápido',
  [EX.escalador]: 'Escalador (mountain climber)', [EX.estrela]: 'Salto estrela', [EX.calcanhar]: 'Calcanhar no glúteo',
};
/** Impacto e esforço por região: com lesão informada, o exercício sai da lista. */
const EVITAR_CARDIO: Record<Restricao, string[]> = {
  joelho: [EX.corrida, EX.trote, EX.pularCorda, EX.skipping, EX.estrela, EX.calcanhar, EX.escalador],
  coluna: [EX.remo, EX.corrida, EX.pularCorda, EX.estrela],
  ombro: [EX.remo, EX.escalador],
  outro: [],
};

/**
 * Cardio do dia. Referência geral da OMS/ACSM: 150 a 300 min por semana de atividade moderada (dá para conversar),
 * ou 75 a 150 min de vigorosa. Sempre com aquecimento e volta à calma de 5 min.
 * - Iniciante: contínuo leve a moderado (caminhada rápida, bike ou elíptico).
 * - Intermediário/avançado: alterna, pela `variacao` do dia, entre contínuo moderado e intervalado
 *   (blocos fortes com recuperação leve; o descanso do cronômetro vira a recuperação).
 * - Sem esteira/bike: caminhada (contínuo) ou circuito em casa (intervalado). Lesões tiram o que tem impacto na região.
 */
export function gerarCardio(p: { treino?: PerfilTreino | null; tem?: Equipamento[] | null; tempoMin?: TempoTreino | null; restricoes?: Restricao[]; variacao?: number }): TreinoDoDia {
  const nivel = p.treino?.nivel ?? 'iniciante';
  const total = Math.max(20, p.tempoMin ?? 30);
  const academia = !p.tem || p.tem.includes('esteira-bike');
  const evitar = new Set((p.restricoes ?? []).flatMap((r) => EVITAR_CARDIO[r] ?? []));
  const v = Math.abs(p.variacao ?? 0);
  const escolher = (l: string[]) => { const ok = l.filter((x) => !evitar.has(x)); return ok.length ? ok[v % ok.length] : (academia ? EX.bike : EX.caminhada); };
  const item = (id: string, series: number, duracaoS: number, descansoS: number, papel: string): ItemDoDia =>
    ({ exercicioId: id, nome: NOMES[id] ?? 'Cardio', seriesAlvo: series, repsAlvo: null, descansoS, duracaoS, papel });
  const principalMin = total - 5;
  // Em casa, o intervalado precisa de pelo menos um exercício de impacto liberado; senão, fica o contínuo (caminhada).
  const temCircuito = [EX.skipping, EX.estrela, EX.calcanhar, EX.pularCorda].some((x) => !evitar.has(x));
  const intervalado = nivel !== 'iniciante' && v % 2 === 0 && (academia || temCircuito);
  // Sem repetir exercício (a tela do treino junta os iguais): a volta à calma fica nos últimos 5 min do bloco principal.
  const aquecimentoPara = (principal: string) => [EX.caminhadaEsteira, EX.bike, EX.eliptico].find((x) => x !== principal && !evitar.has(x)) ?? EX.bike;

  let itens: ItemDoDia[];
  let titulo: string, motivo: string;
  if (!intervalado) {
    const leve = nivel === 'iniciante';
    if (!academia) {
      itens = [item(EX.caminhada, 1, total * 60, 0, `5 min leve, ${total - 10} min em ritmo rápido, 5 min leve`)];
    } else {
      const id = escolher(leve ? [EX.bike, EX.eliptico] : [EX.trote, EX.bike, EX.eliptico, EX.remo]);
      itens = [item(aquecimentoPara(id), 1, 5 * 60, 0, 'Aquecimento · ritmo leve'),
        item(id, 1, principalMin * 60, 0, `${leve ? 'Ritmo moderado: dá para conversar' : 'Ritmo moderado e constante'} · últimos 5 min leves (volta à calma)`)];
    }
    titulo = 'Cardio do dia · Contínuo';
    motivo = leve ? 'Para começar do zero: ritmo em que dá para conversar. Aos poucos, aumente o tempo.' : 'Contínuo em ritmo moderado: melhora o fôlego e ajuda no gasto de energia.';
  } else {
    const forte = nivel === 'avancado' ? 60 : 30, recup = 60;
    const blocosMin = principalMin - 5; // reserva 5 min de volta à calma no fim
    const blocos = Math.max(4, Math.floor((blocosMin * 60) / (forte + recup)));
    if (academia) {
      const id = escolher([EX.bike, EX.corrida, EX.remo, EX.eliptico]);
      itens = [item(aquecimentoPara(id), 1, 5 * 60, 0, 'Aquecimento · ritmo leve'), item(id, blocos, forte, recup, `Intervalado: ${forte} s forte, ${recup} s leve`),
        item(aquecimentoPara(id) === EX.caminhadaEsteira ? ([EX.bike, EX.eliptico].find((x) => x !== id && !evitar.has(x)) ?? EX.caminhada) : EX.caminhadaEsteira, 1, 5 * 60, 0, 'Volta à calma · ritmo leve')];
    } else {
      const a = escolher([EX.skipping, EX.estrela, EX.calcanhar, EX.pularCorda]);
      const b = [EX.escalador, EX.calcanhar, EX.skipping, EX.estrela].find((x) => x !== a && !evitar.has(x)) ?? null;
      const metade = Math.max(2, Math.round(blocos / (b ? 2 : 1)));
      itens = [item(EX.caminhada, 1, 5 * 60, 0, 'Aquecimento · caminhada leve'), item(a, metade, 30, 30, 'Circuito: 30 s forte, 30 s leve'),
        ...(b ? [item(b, metade, 30, 30, 'Circuito: 30 s forte, 30 s leve · depois, 5 min de caminhada leve')] : [])];
    }
    titulo = 'Cardio do dia · Intervalado';
    motivo = 'Intervalado: blocos fortes (falar fica difícil) com recuperação leve. O cronômetro avisa a hora de cada bloco.';
  }
  const minutos = Math.round(itens.reduce((t, i) => t + i.seriesAlvo * (i.duracaoS ?? 0) + (i.seriesAlvo - 1) * i.descansoS, 0) / 60);
  return { foco: 'cardio', titulo, motivo, itens, minutos };
}
