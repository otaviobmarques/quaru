import type { Sincronizavel } from './tipos';

/** Item da fila local (RF09). Enviado em ordem; 422 marca erro e não trava os demais (L2.6). */
export interface ItemFila {
  tabela: 'rotinas' | 'sessoes_treino' | 'series' | 'pesos_corporais' | 'exercicios';
  registro: Sincronizavel & Record<string, unknown>;
  erro?: string;
}

export type ResultadoEnvio = { ok: true; registro: Sincronizavel } | { ok: false; status: number; mensagem: string };
export type Enviar = (item: ItemFila) => Promise<ResultadoEnvio>;

/** Envia a fila em ordem. Retorna o que ficou (com erro ou por falta de rede) e o que foi aceito. */
export async function processarFila(fila: ItemFila[], enviar: Enviar) {
  const restantes: ItemFila[] = [];
  const aceitos: Sincronizavel[] = [];
  let semRede = false;
  for (const item of fila) {
    if (semRede) { restantes.push(item); continue; }
    try {
      const r = await enviar(item);
      if (r.ok) aceitos.push(r.registro);
      else if (r.status === 422) restantes.push({ ...item, erro: r.mensagem });
      else restantes.push(item);
    } catch {
      semRede = true; // sem conexão: para e mantém a ordem
      restantes.push(item);
    }
  }
  return { restantes, aceitos };
}

/** Coloca na fila substituindo envio pendente do mesmo registro (mantém só a última versão). */
export function enfileirar(fila: ItemFila[], item: ItemFila): ItemFila[] {
  return [...fila.filter((i) => !(i.tabela === item.tabela && i.registro.id === item.registro.id)), item];
}

/**
 * Aplica no aparelho a versão vinda do servidor (L2.3/L2.4): o servidor é a fonte de verdade,
 * e um registro excluído não volta.
 */
/** Ids com envio pendente na fila (BUG-12). */
export const idsPendentes = (fila: ItemFila[]): Set<string> => new Set(fila.map((i) => i.registro.id));

/** BUG-12: registro com edição pendente na fila não é sobrescrito pelo download; ele sobe no próximo envio. */
export function mesclar<T extends Sincronizavel>(local: T[], servidor: T[], pendentes: ReadonlySet<string>): T[] {
  const mapa = new Map(local.map((r) => [r.id, r]));
  for (const s of servidor) {
    const l = mapa.get(s.id);
    if (l?.excluidoEm && !s.excluidoEm) continue;
    if (l && pendentes.has(s.id)) continue;
    mapa.set(s.id, s);
  }
  return [...mapa.values()];
}
