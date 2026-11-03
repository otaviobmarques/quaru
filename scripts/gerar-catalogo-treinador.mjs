// Gera treinador/catalogo.json (busca de exercícios do portal do treinador) a partir do catálogo do app.
// Uso: node scripts/gerar-catalogo-treinador.mjs   (também roda no deploy)
import { readFileSync, writeFileSync } from 'node:fs';
const { exercicios } = JSON.parse(readFileSync(new URL('../mobile/src/dominio/catalogo-fedb.json', import.meta.url), 'utf8'));
const lista = exercicios.map((e) => ({ id: e.id, n: e.nome, g: e.grupoMuscular, q: e.equipamento, c: e.categoria, s: (e.musculosSecundarios ?? []).length, m: e.midia ?? null }))
  .sort((a, b) => a.n.localeCompare(b.n, 'pt-BR'));
writeFileSync(new URL('../treinador/catalogo.json', import.meta.url), JSON.stringify(lista));
console.log(`catálogo do treinador: ${lista.length} exercícios`);
