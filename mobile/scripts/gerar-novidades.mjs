// Extrai a seção da versão atual do CHANGELOG.md para src/config/novidades-gerado.ts ("O que há de novo").
// Uso: node scripts/gerar-novidades.mjs   (lê a versão do package.json)
import { readFileSync, writeFileSync } from 'node:fs';
const versao = JSON.parse(readFileSync('package.json', 'utf8')).version;
const log = readFileSync('../CHANGELOG.md', 'utf8');
const ini = log.indexOf(`## [${versao}]`);
if (ini < 0) throw new Error(`CHANGELOG sem a seção ${versao}`);
const fim = log.indexOf('\n## [', ini + 5);
const secao = log.slice(ini, fim < 0 ? undefined : fim).trim();
// Tira marcação de Markdown pesada e caminhos internos; mantém títulos e itens.
const linhas = secao.split('\n').slice(1).map((l) => l.replace(/\*\*/g, '').replace(/`[^`]*\/[^`]*`/g, '').replace(/`/g, '').replace(/\s*\(ADR-\d+[^)]*\)/g, '').replace(/\s+copia os SVG oficiais\./, '').replace(/\s+\(\s*\)/g, '').trimEnd()).filter((l) => l.trim() && !/^Não publicado|Testes:|Capturas:|scripts\/|Fontes em|Notas:|Estado local|Service worker|app\.json|Seletor segmentado/.test(l.replace(/^- /, '')));
writeFileSync('src/config/novidades-gerado.ts', `// GERADO por scripts/gerar-novidades.mjs a partir do CHANGELOG.md. Não edite à mão.
export const VERSAO_NOVIDADES = ${JSON.stringify(versao)};
export const NOVIDADES: string[] = ${JSON.stringify(linhas, null, 2)};
`);
console.log(`novidades ${versao}: ${linhas.length} linhas`);
