/**
 * Texto para compartilhar um treino concluído (v0.5). Só números do treino que a pessoa escolhe mandar:
 * nada de peso corporal, altura ou outro dado de saúde.
 */
export function textoCompartilharTreino(p: { nome: string; series: number; volumeKg: string; duracaoMin: number | null; recordes: string[]; sequencia: number }): string {
  const linhas = [`💪 Treino concluído no Quaru: ${p.nome}`, `${p.series} séries · ${p.volumeKg} kg de volume${p.duracaoMin != null ? ` · ${p.duracaoMin} min` : ''}`];
  if (p.recordes.length) linhas.push(`🏆 Recorde: ${p.recordes.join(', ')}`);
  if (p.sequencia > 1) linhas.push(`🔥 Sequência de ${p.sequencia} dias`);
  linhas.push('Seu treino, no seu ritmo.');
  return linhas.join('\n');
}
