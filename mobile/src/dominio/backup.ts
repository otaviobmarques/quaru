/** v0.5: lembrete de cópia de segurança (exportar), sobretudo na web, onde os dados ficam só no navegador. */
export const DIAS_LEMBRETE_BACKUP = 14;
export const DIAS_ADIAR_BACKUP = 7;
const DIA = 86400000;

/**
 * Mostra o lembrete quando há algo a perder (treino, peso ou água registrados), a última exportação tem mais de
 * 14 dias (ou nunca houve) e a pessoa não adiou nos últimos 7 dias.
 */
export function precisaLembrarBackup(p: { temDados: boolean; ultimaExportacaoEm?: string | null; lembreteBackupAdiadoEm?: string | null; agora: string }): boolean {
  if (!p.temDados) return false;
  const t = +new Date(p.agora);
  if (p.lembreteBackupAdiadoEm && t - +new Date(p.lembreteBackupAdiadoEm) < DIAS_ADIAR_BACKUP * DIA) return false;
  return !p.ultimaExportacaoEm || t - +new Date(p.ultimaExportacaoEm) >= DIAS_LEMBRETE_BACKUP * DIA;
}
