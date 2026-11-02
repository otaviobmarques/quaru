#!/usr/bin/env node
/**
 * Ilustrações r2 da RedBox (v0.4.3), aprovadas pelo Henriquiano: 10 ícones de equipamento e a ilustração da tela Sair.
 * Copia os SVGs e o LEIAME-r2.md SEM ALTERAR para assets/ilustracoes-redbox/r2/ e gera
 * src/config/ilustracoes-r2-gerado.ts com o XML de cada tema (as variáveis CSS --q-* resolvidas em cores,
 * porque o SvgXml do react-native-svg não entende CSS). Só usa o que o LEIAME-r2 lista; a r1 é ignorada.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const R2 = process.env.REDBOX_R2 ?? '/home/box/redbox/clientes/domma-tecnologia/app-treinos/imagens-v0.4.3/ilustracoes-r2';
const IDS = ['peso-corpo', 'halteres', 'barra-anilhas', 'banco', 'polia', 'maquinas', 'elastico', 'kettlebell', 'barra-fixa', 'esteira-bike'];
const DEST = 'assets/ilustracoes-redbox/r2';
if (!existsSync(join(R2, 'LEIAME-r2.md'))) { console.error(`LEIAME-r2.md não encontrado em ${R2}`); process.exit(1); }
mkdirSync(join(DEST, 'equipamentos'), { recursive: true });

/** Resolve var(--q-x) com o bloco do tema pedido e tira <style>, <title> e atributos aria do SVG (o app dá o rótulo). */
function resolver(xml, tema) {
  const estilo = /<style>([\s\S]*?)<\/style>/.exec(xml)?.[1] ?? '';
  const blocos = [...estilo.matchAll(/\{([^}]*)\}/g)].map((m) => Object.fromEntries([...m[1].matchAll(/(--q-[a-z0-9-]+):([^;]+)/g)].map((x) => [x[1], x[2].trim()])));
  const vars = tema === 'escuro' ? { ...blocos[0], ...blocos[1] } : blocos[0];
  return xml.replace(/<style>[\s\S]*?<\/style>/, '').replace(/<title[^>]*>[\s\S]*?<\/title>/, '')
    .replace(/ role="img"| aria-labelledby="[^"]*"| aria-hidden="true"/g, '')
    .replace(/var\((--q-[a-z0-9-]+)\)/g, (_, v) => { if (!vars[v]) throw new Error(`variável sem cor: ${v}`); return vars[v]; });
}
const titulo = (xml) => /<title[^>]*>([\s\S]*?)<\/title>/.exec(xml)?.[1] ?? '';

copyFileSync(join(R2, 'LEIAME-r2.md'), join(DEST, 'LEIAME-r2.md'));
const icones = {};
for (const id of IDS) {
  const f = join(R2, 'equipamentos', 'svg', `equipamento-${id}.svg`);
  const xml = readFileSync(f, 'utf8');
  copyFileSync(f, join(DEST, 'equipamentos', `equipamento-${id}.svg`));
  icones[id] = { claro: resolver(xml, 'claro'), escuro: resolver(xml, 'escuro'), titulo: titulo(xml) };
}
const fs = join(R2, 'tela-sair', 'ilustracao-sair.svg');
const sx = readFileSync(fs, 'utf8');
copyFileSync(fs, join(DEST, 'ilustracao-sair.svg'));
const sair = { claro: resolver(sx, 'claro'), escuro: resolver(sx, 'escuro'), titulo: titulo(sx) };

writeFileSync('src/config/ilustracoes-r2-gerado.ts', `// GERADO por scripts/importar-ilustracoes-r2.mjs a partir da r2 da RedBox — não edite à mão.
export type XmlTemas = { claro: string; escuro: string; titulo: string };
export const ICONES_EQUIPAMENTO: Record<string, XmlTemas> = ${JSON.stringify(icones, null, 1)};
export const ILUSTRACAO_SAIR: XmlTemas = ${JSON.stringify(sair, null, 1)};
`);
console.log(`ok: ${IDS.length} ícones + ilustração da tela Sair → ${DEST} e src/config/ilustracoes-r2-gerado.ts`);
