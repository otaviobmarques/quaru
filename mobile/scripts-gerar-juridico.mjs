// Gera src/dominio/juridico-gerado.ts a partir dos rascunhos da Jéssica em ../../juridico/*.md.
// Remove a nota interna inicial (bloco de citação antes da primeira seção) e troca o marcador do nome
// pelo token {NOME_DO_APP}, preenchido em tempo de execução com marca.nome. Rode: node scripts-gerar-juridico.mjs
import { readFileSync, writeFileSync } from 'node:fs';
const ler = (n) => {
  const linhas = readFileSync(new URL(`../../juridico/${n}.md`, import.meta.url), 'utf8').split('\n');
  const i = linhas.findIndex((l) => l.startsWith('## '));
  const cab = linhas.slice(0, i).filter((l) => !l.startsWith('>'));
  return [...cab, ...linhas.slice(i)].join('\n').replace(/\[NOME DO APP( — VERIFICAR)?\]/g, '{NOME_DO_APP}').trim();
};
const saida = `// GERADO por scripts-gerar-juridico.mjs a partir de juridico/*.md (RASCUNHO). Não editar à mão.
export const TERMOS = ${JSON.stringify(ler('termos-de-uso'))};
export const POLITICA = ${JSON.stringify(ler('politica-de-privacidade'))};
`;
writeFileSync(new URL('./src/dominio/juridico-gerado.ts', import.meta.url), saida);
console.log('ok');
