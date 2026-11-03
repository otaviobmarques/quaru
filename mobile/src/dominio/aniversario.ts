/**
 * v0.9: aniversário da pessoa, para o Quaru dar parabéns (mascote no Início e, no futuro, notificação).
 * Dia e mês bastam; o ano é opcional (minimização de dados: não precisamos da idade exata).
 */
export interface Aniversario { dia: number; mes: number; ano?: number | null }

const DIAS_NO_MES = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // 29/02 vale (comemorado em 28/02 nos anos comuns)
const bissexto = (a: number) => (a % 4 === 0 && a % 100 !== 0) || a % 400 === 0;

/** Lê "DD/MM" ou "DD/MM/AAAA". Vazio = null (apagar). Retorna 'invalido' se não for uma data possível. */
export function lerAniversario(texto: string, hojeDia: string): Aniversario | null | 'invalido' {
  const t = texto.trim();
  if (!t) return null;
  const m = /^(\d{1,2})\s*[/.-]\s*(\d{1,2})(?:\s*[/.-]\s*(\d{4}))?$/.exec(t);
  if (!m) return 'invalido';
  const dia = +m[1], mes = +m[2], ano = m[3] ? +m[3] : null;
  if (mes < 1 || mes > 12 || dia < 1 || dia > DIAS_NO_MES[mes - 1]) return 'invalido';
  if (ano != null) {
    const anoHoje = +hojeDia.slice(0, 4);
    if (ano < 1900 || ano > anoHoje) return 'invalido';
    if (mes === 2 && dia === 29 && !bissexto(ano)) return 'invalido';
    if (`${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}` > hojeDia) return 'invalido';
  }
  return { dia, mes, ano };
}

export const formatarAniversario = (a: Aniversario | null | undefined) =>
  a ? `${String(a.dia).padStart(2, '0')}/${String(a.mes).padStart(2, '0')}${a.ano ? `/${a.ano}` : ''}` : '';

/** É aniversário hoje? 29/02 comemora em 28/02 nos anos que não são bissextos. */
export function ehAniversario(a: Aniversario | null | undefined, hojeDia: string): boolean {
  if (!a) return false;
  const ano = +hojeDia.slice(0, 4), mes = +hojeDia.slice(5, 7), dia = +hojeDia.slice(8, 10);
  if (a.mes === 2 && a.dia === 29 && !bissexto(ano)) return mes === 2 && dia === 28;
  return a.mes === mes && a.dia === dia;
}

/** Idade que a pessoa completa hoje (só se informou o ano). */
export const idadeQueCompleta = (a: Aniversario | null | undefined, hojeDia: string) => (a?.ano ? +hojeDia.slice(0, 4) - a.ano : null);

/** Máscara de digitação: 0511 → 05/11; 05111990 → 05/11/1990. */
export function mascararAniversario(texto: string): string {
  const d = texto.replace(/\D/g, '').slice(0, 8);
  return [d.slice(0, 2), d.slice(2, 4), d.slice(4)].filter(Boolean).join('/');
}
