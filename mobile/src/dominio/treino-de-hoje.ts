import type { Rotina, SessaoTreino } from './tipos';

export type CartaoHoje =
  | { estado: 'continuar'; sessao: SessaoTreino }
  | { estado: 'feito'; sessao: SessaoTreino; proxima: Rotina | null }
  | { estado: 'proxima'; rotina: Rotina }
  | { estado: 'sem_rotina' };

const ativos = <T extends { excluidoEm?: string | null }>(l: T[]) => l.filter((x) => !x.excluidoEm);

/** Dia local (YYYY-MM-DD) no fuso informado, padrão America/Sao_Paulo. */
export function diaLocal(iso: string, fuso = 'America/Sao_Paulo'): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: fuso, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));
}

/** Próxima rotina na sequência A → B → C → A, a partir da última sessão finalizada (regra L1). */
export function proximaRotina(rotinas: Rotina[], sessoes: SessaoTreino[]): Rotina | null {
  const lista = ativos(rotinas).toSorted((a, b) => a.ordem - b.ordem);
  if (lista.length === 0) return null;
  const ultima = ativos(sessoes)
    .filter((s) => s.finalizadaEm && s.rotinaId && lista.some((r) => r.id === s.rotinaId))
    .toSorted((a, b) => (b.finalizadaEm! < a.finalizadaEm! ? -1 : 1))[0];
  if (!ultima) return lista[0];
  const i = lista.findIndex((r) => r.id === ultima.rotinaId);
  return lista[(i + 1) % lista.length];
}

/** Cartão destaque do Início. Prioridade: em andamento > feito hoje > próxima da sequência (L1). */
export function cartaoTreinoDeHoje(rotinas: Rotina[], sessoes: SessaoTreino[], agora: string): CartaoHoje {
  const vivas = ativos(sessoes);
  const andamento = vivas.find((s) => !s.finalizadaEm);
  if (andamento) return { estado: 'continuar', sessao: andamento };
  const hoje = diaLocal(agora);
  const feitaHoje = vivas
    .filter((s) => s.finalizadaEm && diaLocal(s.finalizadaEm) === hoje)
    .toSorted((a, b) => (b.finalizadaEm! < a.finalizadaEm! ? -1 : 1))[0];
  const proxima = proximaRotina(rotinas, sessoes);
  if (feitaHoje) return { estado: 'feito', sessao: feitaHoje, proxima };
  if (proxima) return { estado: 'proxima', rotina: proxima };
  return { estado: 'sem_rotina' };
}

/** Treinos finalizados nos últimos 7 dias (contados a partir de agora). */
export function treinosUltimos7Dias(sessoes: SessaoTreino[], agora: string): number {
  const t = +new Date(agora);
  return ativos(sessoes).filter((s) => s.finalizadaEm && t - +new Date(s.finalizadaEm) < 7 * 86400000 && +new Date(s.finalizadaEm) <= t).length;
}

/** Dias (YYYY-MM-DD, fuso local) com pelo menos um treino finalizado. */
export function diasTreinados(sessoes: SessaoTreino[]): Set<string> {
  return new Set(ativos(sessoes).filter((s) => s.finalizadaEm).map((s) => diaLocal(s.finalizadaEm!)));
}

const diaAnterior = (dia: string) => { const d = new Date(`${dia}T12:00:00Z`); d.setUTCDate(d.getUTCDate() - 1); return d.toISOString().slice(0, 10); };

/**
 * Sequência de dias seguidos com treino. Conta até hoje; se hoje ainda não teve treino, conta até ontem
 * (a sequência só "quebra" depois de um dia inteiro sem treino). `hoje` diz se o dia de hoje já entrou.
 */
export function sequenciaDias(sessoes: SessaoTreino[], agora: string): { dias: number; hoje: boolean } {
  const feitos = diasTreinados(sessoes);
  const hojeDia = diaLocal(agora);
  const hoje = feitos.has(hojeDia);
  let dia = hoje ? hojeDia : diaAnterior(hojeDia);
  let dias = 0;
  while (feitos.has(dia)) { dias++; dia = diaAnterior(dia); }
  return { dias, hoje };
}

/** Os 7 dias terminando hoje, do mais antigo ao mais novo, marcando os que tiveram treino. */
export function semanaTreinos(sessoes: SessaoTreino[], agora: string): { dia: string; feito: boolean; hoje: boolean }[] {
  const feitos = diasTreinados(sessoes);
  const hojeDia = diaLocal(agora);
  const lista: string[] = [hojeDia];
  for (let i = 0; i < 6; i++) lista.unshift(diaAnterior(lista[0]));
  return lista.map((d) => ({ dia: d, feito: feitos.has(d), hoje: d === hojeDia }));
}
