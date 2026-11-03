import { hoje, planejadoPara, proximasDatas } from './agenda';
import type { Agenda } from './agenda';
import { metricasPorSessao } from './consultas';
import type { PesoCorporal, Rotina, Serie, SessaoTreino } from './tipos';

/**
 * v0.10: resumo da evolução que o aluno compartilha com o treinador (só se ligar, em Perfil ou ao aceitar o convite).
 * Vai pouco: peso (data e kg), treinos feitos (data, nome, séries, volume, minutos) e a agenda dos próximos 60 dias
 * (nome do treino ou descanso). Nada de notas, restrições, alimentação ou água. Último ano, até 1000 itens.
 */
export interface ItemEvolucao { origem_id: string; tipo: 'peso' | 'treino'; quando: string; dados: Record<string, string | number | null> }
export interface ResumoEvolucao { itens: ItemEvolucao[]; agenda: Record<string, string> }

const ANO_MS = 365 * 86400000;

export function montarResumo(e: { rotinas: Rotina[]; sessoes: SessaoTreino[]; series: Serie[]; pesos: PesoCorporal[]; agenda?: Agenda }, agora = new Date()): ResumoEvolucao {
  const desde = agora.getTime() - ANO_MS;
  const nome = (id: string | null) => e.rotinas.find((r) => r.id === id)?.nome ?? 'Treino livre';
  const pesos: ItemEvolucao[] = e.pesos.filter((p) => !p.excluidoEm && !p.exemplo && +new Date(p.medidoEm) >= desde)
    .map((p) => ({ origem_id: p.id, tipo: 'peso', quando: p.medidoEm, dados: { kg: Math.round(p.pesoKg * 10) / 10 } }));
  const treinos: ItemEvolucao[] = e.sessoes.filter((s) => s.finalizadaEm && !s.excluidoEm && !s.exemplo && +new Date(s.iniciadaEm) >= desde)
    .map((s) => {
      const m = metricasPorSessao(e, s.id);
      const min = Math.max(1, Math.round((+new Date(s.finalizadaEm!) - +new Date(s.iniciadaEm)) / 60000));
      return { origem_id: s.id, tipo: 'treino', quando: s.iniciadaEm, dados: { nome: nome(s.rotinaId).slice(0, 60), series: m.series, volume: Math.round(m.volume), exercicios: m.exercicios, min } };
    });
  const itens = [...pesos, ...treinos].sort((a, b) => (a.quando < b.quando ? 1 : -1)).slice(0, 1000);
  const existe = (id: string) => e.rotinas.some((r) => r.id === id && !r.excluidoEm);
  const agenda: Record<string, string> = {};
  for (const d of proximasDatas(hoje(agora), 60)) {
    const v = planejadoPara(e.agenda, d, existe).valor;
    if (v) agenda[d] = v === 'descanso' ? 'Descanso' : nome(v).slice(0, 60);
  }
  return { itens, agenda };
}

/** Impressão digital do resumo, para não publicar de novo o que não mudou. */
export function assinatura(r: ResumoEvolucao): string {
  const t = JSON.stringify(r);
  let h = 5381;
  for (let i = 0; i < t.length; i++) h = ((h * 33) ^ t.charCodeAt(i)) >>> 0;
  return `${t.length}:${h.toString(36)}`;
}
