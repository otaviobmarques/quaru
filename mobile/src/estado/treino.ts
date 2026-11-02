import { router } from 'expo-router';
import type { Estado } from './armazem';
import { acoes, temSaude } from './armazem';
import { novoId } from '@/servicos/id';

/** Inicia sessão (ou continua a ativa – L2.5 no aparelho) e abre a tela de treino. */
export function iniciarTreino(aplicar: (f: (e: Estado) => Estado) => void, estado: Estado, rotinaId: string | null) {
  if (!temSaude(estado)) { router.push('/consentimentos'); return; }
  const ativa = estado.sessoes.find((s) => !s.finalizadaEm && !s.excluidoEm);
  if (!ativa) {
    const agora = new Date().toISOString();
    aplicar((e) => acoes.iniciarSessao(e, { id: novoId(), rotinaId, iniciadaEm: agora, finalizadaEm: null, notas: null, atualizadoEm: agora }));
  }
  router.push('/treino');
}
