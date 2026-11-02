/** Limites compartilhados com o banco (migrações 0001/0004/0005). Usados pela tela ANTES de gravar (REG-01). */
export const LIMITES = { cargaMaxKg: 1000, repsMax: 1000, nomeMax: 60 } as const;

/** Espaços Unicode (inclui U+00A0, tabulação, U+2000–U+200B, U+3000, U+FEFF) – mesma lista da migração 0005. */
const ESPACOS = /[\s\u00a0\u1680\u180e\u2000-\u200b\u2028\u2029\u202f\u205f\u3000\ufeff]/gu;
/** BUG-08/REG-03: nome vazio ou feito só de espaços (de qualquer tipo). */
export const nomeVazio = (nome: string) => nome.replace(ESPACOS, '') === '';

/** Mensagem amigável ou null se a série está dentro dos limites. */
export function problemaSerie(cargaKg: number | null, reps: number | null): string | null {
  if (cargaKg != null && cargaKg > LIMITES.cargaMaxKg) return `A carga máxima é ${LIMITES.cargaMaxKg} kg. Confira se não sobrou um zero.`;
  if (reps != null && reps > LIMITES.repsMax) return `O máximo é ${LIMITES.repsMax} repetições.`;
  return null;
}

/** REG-04: mensagem amigável para qualquer recusa de regra do armazém ao gravar. */
export function mensagemRecusa(codigo: string): string {
  switch (codigo) {
    case 'sem_consentimento': return 'A autorização para dados de saúde está desligada. Ative em Perfil → Consentimentos para registrar séries.';
    case 'valor_invalido': return 'Algum valor está fora dos limites (carga até 1000 kg, até 1000 repetições). Confira e tente de novo.';
    case 'sessao_ativa': return 'Já existe outro treino em andamento. Finalize-o antes de continuar.';
    default: return 'Não foi possível registrar a série. Confira os valores e tente de novo.';
  }
}
