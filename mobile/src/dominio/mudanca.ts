import { migrarEstado, type Estado } from '@/estado/armazem';

/**
 * v0.12.1: levar os dados do aparelho do endereço antigo (GitHub Pages) para o novo (app.quaru.com.br).
 * Os dados ficam no navegador e cada endereço tem o seu espaço; então o antigo abre o novo numa janela e passa o
 * estado por postMessage, só entre as duas origens conhecidas. Plano B: um arquivo que a pessoa baixa e escolhe no novo.
 * Nada passa por servidor.
 */
export const TIPO_PRONTO = 'quaru-mudanca-pronto';
export const TIPO_DADOS = 'quaru-mudanca-dados';
export const TIPO_RECEBIDO = 'quaru-mudanca-recebido';
export const MARCA_ARQUIVO = 'quaru-dados-do-aparelho';

export const empacotar = (e: Estado) => JSON.stringify({ marca: MARCA_ARQUIVO, criadoEm: new Date().toISOString(), estado: e });

/** Lê o pacote (da janela antiga ou do arquivo). null se não for um pacote válido do Quaru. */
export function desempacotar(texto: unknown): Estado | null {
  if (typeof texto !== 'string' || texto.length > 20_000_000) return null;
  try {
    const j = JSON.parse(texto);
    if (j?.marca !== MARCA_ARQUIVO || !j.estado) return null;
    const e = migrarEstado(j.estado);
    if (!e || !Array.isArray(e.rotinas) || !Array.isArray(e.sessoes) || !Array.isArray(e.series) || !Array.isArray(e.pesos)) return null;
    return e;
  } catch { return null; }
}

/** Resumo para a pessoa conferir o que vai trazer. */
export const resumoDados = (e: Estado) => ({
  treinos: e.rotinas.filter((r) => !r.excluidoEm && !r.exemplo).length,
  sessoes: e.sessoes.filter((s) => s.finalizadaEm && !s.excluidoEm && !s.exemplo).length,
  pesos: e.pesos.filter((p) => !p.excluidoEm && !p.exemplo).length,
});
