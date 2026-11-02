#!/usr/bin/env node
/**
 * Importa as imagens da RedBox para o app (v0.4.3).
 * Origem padrão: /home/box/redbox/clientes/domma-tecnologia/app-treinos/imagens-v0.4.3/ (ou REDBOX_IMAGENS=<pasta>).
 * Nomes esperados:
 *   dieta-<id>_1x1.webp   → assets/dietas/<id>_mini.webp  (lista; 176×176 recomendado)
 *   dieta-<id>_16x9.webp  → assets/dietas/<id>.webp       (topo do detalhe; 1280×720, como a RedBox entrega)
 *   receita-<id>_1x1.webp / receita-<id>_16x9.webp → assets/receitas/  (ids de src/dominio/refeicoes.ts)
 *   ilustracao-<nome>.(svg|webp) → assets/ilustracoes-redbox/ (ligadas à tela à mão, depois de revisar)
 *   legendas.json (opcional): { "dieta-vegana": "Foto de …" } → texto alternativo.
 * Regras: só WebP (cabeçalho RIFF/WEBP) de até 80 KB; arquivo fora do padrão é listado e ignorado.
 * Gera src/dominio/imagens-redbox-gerado.ts. Sem argumentos copia; com --verificar só confere (não grava nada).
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = process.env.REDBOX_IMAGENS ?? '/home/box/redbox/clientes/domma-tecnologia/app-treinos/imagens-v0.4.3';
// Lote aprovado (rev. 3): as fotos ficam em fotos/; fotos/descartadas/ NUNCA é lida (só a pasta de cima, sem recursão).
const PASTA = existsSync(join(RAIZ, 'fotos')) ? join(RAIZ, 'fotos') : RAIZ;
const EXCECOES = JSON.parse(readFileSync('scripts/imagens-redbox-excecoes.json', 'utf8'));
/** Largura e altura de um WebP (VP8, VP8L ou VP8X). */
function dimensoes(b) {
  const t = b.subarray(12, 16).toString();
  if (t === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
  if (t === 'VP8L') { const v = b.readUInt32LE(21); return [1 + (v & 0x3fff), 1 + ((v >> 14) & 0x3fff)]; }
  if (t === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  return null;
}
/** Créditos do LEIAME.md da RedBox: | arquivos | descrição | origem | autor | licença |. Nada é inventado. */
function lerCreditos() {
  const f = join(PASTA, 'LEIAME.md'); if (!existsSync(f)) return {};
  const out = {};
  for (const l of readFileSync(f, 'utf8').split('\n')) {
    const c = l.split('|').map((x) => x.trim()); if (c.length < 7 || !/\.webp/.test(c[1])) continue;
    const lic = /\[([^\]]+)\]\(([^)]+)\)/.exec(c[5]);
    const base = /^([a-z0-9-]+)_/.exec(c[1])?.[1];
    if (base) out[base] = { descricao: c[2], origem: c[3], autor: c[4], licenca: lic ? lic[1] : c[5], licencaUrl: lic ? lic[2] : null };
  }
  return out;
}
const CREDITOS = existsSync(RAIZ) ? lerCreditos() : {};
const altDe = (base) => { const d = CREDITOS[base]?.descricao; if (!d) return null; const t = d.includes(':') ? d.slice(d.indexOf(':') + 1).trim() : d; const u = t.replace(/\s*\([^)]*\)/g, '').trim(); return `Foto de ${u.charAt(0).toLowerCase()}${u.slice(1)}`; };
const SO_VERIFICAR = process.argv.includes('--verificar');
const DIETAS = ['vegetariana', 'vegana', 'mediterranea', 'paleo', 'cetogenica', 'low-carb', 'jejum-intermitente', 'atkins'];
const RECEITAS = [...readFileSync('src/dominio/refeicoes.ts', 'utf8').matchAll(/\{ id: '([a-z0-9-]+)', momento:/g)].map((m) => m[1]);
const LIMITE = 80 * 1024;
const ORIGEM = 'assets/dietas/origem.json';

const origem = existsSync(ORIGEM) ? JSON.parse(readFileSync(ORIGEM, 'utf8')) : {};
const problemas = []; const copiados = []; const medidas = []; const usados = new Set();
const ehWebp = (f) => { const b = readFileSync(f); return b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP'; };
const ok = (f, prop) => {
  const arq = f.split('/').pop();
  if (!ehWebp(f)) { problemas.push(`${arq}: não é WebP`); return false; }
  const d = dimensoes(readFileSync(f));
  if (d && prop && Math.abs(d[0] / d[1] - prop) > 0.01) { problemas.push(`${arq}: ${d[0]}×${d[1]}, proporção errada`); return false; }
  medidas.push(`${arq}: ${d ? `${d[0]}×${d[1]}` : '?'}, ${Math.round(statSync(f).size / 1024)} KB`);
  if (statSync(f).size > LIMITE) { problemas.push(`${arq}: ${Math.round(statSync(f).size / 1024)} KB (máx. 80 KB)`); return false; }
  return true;
};
const copiar = (de, para) => { if (!SO_VERIFICAR) { mkdirSync(join(para, '..'), { recursive: true }); copyFileSync(de, para); } copiados.push(`${de.split('/').pop()} → ${para}`); };

if (existsSync(PASTA)) {
  const legendas = existsSync(join(PASTA, 'legendas.json')) ? JSON.parse(readFileSync(join(PASTA, 'legendas.json'), 'utf8')) : {};
  const sub = join(PASTA, 'ilustracoes');
  const entradas = [...readdirSync(PASTA).map((a) => [a, join(PASTA, a)]), ...(existsSync(sub) ? readdirSync(sub).map((a) => [a, join(sub, a)]) : [])]
    .filter(([, f]) => statSync(f).isFile());
  for (const [arq, f] of entradas) {
    let m;
    const prop = /_1x1\.webp$/.test(arq) ? 1 : /_16x9\.webp$/.test(arq) ? 16 / 9 : null;
    const baseArq = /^([a-z0-9-]+)_(1x1|16x9)\.webp$/.exec(arq)?.[1];
    if (baseArq && EXCECOES[baseArq]) { problemas.push(`${arq}: não entra – ${EXCECOES[baseArq]}`); continue; }
    if ((m = /^dieta-([a-z-]+)_(1x1|16x9)\.webp$/.exec(arq)) && DIETAS.includes(m[1])) {
      if (!ok(f, prop)) continue; usados.add(`dieta-${m[1]}`);
      copiar(f, `assets/dietas/${m[1]}${m[2] === '1x1' ? '_mini' : ''}.webp`);
      const alt = legendas[`dieta-${m[1]}`] ?? altDe(`dieta-${m[1]}`);
      origem[m[1]] = { ...(origem[m[1]] ?? {}), [m[2]]: 'redbox', ...(alt ? { alt } : {}) };
    } else if ((m = /^(?:receita|refeicao)-([a-z0-9-]+)_(1x1|16x9)\.webp$/.exec(arq)) && RECEITAS.includes(m[1])) {
      if (!ok(f, prop)) continue; usados.add(`refeicao-${m[1]}`);
      copiar(f, `assets/receitas/${m[1]}_${m[2]}.webp`);
      const alt = legendas[`receita-${m[1]}`] ?? legendas[`refeicao-${m[1]}`] ?? altDe(arq.split('_')[0]);
      if (alt) origem[`receita:${m[1]}`] = { alt };
    } else if (/^ilustracao-[a-z0-9-]+\.(svg|webp)$/.test(arq)) {
      copiar(f, `assets/ilustracoes-redbox/${arq}`);
    } else if (/^(?:dieta|receita|refeicao)-/.test(arq)) problemas.push(`${arq}: id sem correspondência no app (ignorado)`);
    else if (arq !== 'legendas.json' && arq !== 'LEIAME.md') problemas.push(`${arq}: nome fora do padrão (ignorado)`);
  }
} else problemas.push(`Pasta da RedBox ainda não existe: ${PASTA}. Mantidas as imagens provisórias.`);

if (!SO_VERIFICAR) {
  writeFileSync(ORIGEM, JSON.stringify(origem, null, 2) + '\n');
  const rel = (p) => `require('../../${p}')`;
  const linhasDieta = DIETAS.map((id) => {
    const o = origem[id] ?? {};
    const prov = o['16x9'] === 'redbox' && o['1x1'] === 'redbox' ? 'false' : 'true';
    return `  '${id}': { foto: ${rel(`assets/dietas/${id}.webp`)}, mini: ${rel(`assets/dietas/${id}_mini.webp`)}, provisoria: ${prov}${o.alt ? `, alt: ${JSON.stringify(o.alt)}` : ''} },`;
  });
  const linhasReceita = RECEITAS.filter((id) => existsSync(`assets/receitas/${id}_1x1.webp`) && existsSync(`assets/receitas/${id}_16x9.webp`))
    .map((id) => `  '${id}': { foto: ${rel(`assets/receitas/${id}_16x9.webp`)}, mini: ${rel(`assets/receitas/${id}_1x1.webp`)}${origem[`receita:${id}`]?.alt ? `, alt: ${JSON.stringify(origem[`receita:${id}`].alt)}` : ''} },`);
  writeFileSync('src/dominio/imagens-redbox-gerado.ts', `// GERADO por scripts/importar-imagens-redbox.mjs — não edite à mão.
import type { ImageSourcePropType } from 'react-native';

type Img = { foto: ImageSourcePropType; mini: ImageSourcePropType; alt?: string };
/** provisoria = true: imagem provisória (gerada por IA na 0.4.3) até a RedBox entregar a final. */
export const IMAGENS_DIETAS: Record<string, Img & { provisoria: boolean }> = {
${linhasDieta.join('\n')}
};
/** Créditos copiados do LEIAME.md da RedBox, só das fotos que entraram no app. */
export const CREDITOS_FOTOS: { arquivo: string; descricao: string; origem: string; autor: string; licenca: string; licencaUrl: string | null }[] = ${JSON.stringify([...usados].sort().filter((b) => CREDITOS[b]).map((b) => ({ arquivo: b, ...CREDITOS[b] })), null, 2)};
/** Fotos das receitas (ideias de refeições) já entregues pela RedBox. Sem foto: a tela mostra o espaço provisório. */
export const IMAGENS_RECEITAS: Record<string, Img> = {
${linhasReceita.join('\n')}
};
`);
}
for (const b of usados) if (!CREDITOS[b]) problemas.push(`${b}: sem crédito no LEIAME.md`);
console.log('medidas:'); for (const x of medidas) console.log('  ' + x);
console.log(`${SO_VERIFICAR ? '[verificar] ' : ''}copiados: ${copiados.length}`); for (const c of copiados) console.log('  ' + c);
if (problemas.length) { console.log('avisos:'); for (const p of problemas) console.log('  ' + p); }
