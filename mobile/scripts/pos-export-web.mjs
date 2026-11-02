// Pós-export da versão web (ADR-0013): manifest/ícones no <head>, service worker com a lista de arquivos,
// 404.html (fallback de SPA no GitHub Pages) e .nojekyll. Uso: node scripts/pos-export-web.mjs dist
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const dist = process.argv[2] ?? 'dist';
const BASE = '/quaru/'; // igual a experiments.baseUrl do app.json
const idx = join(dist, 'index.html');
let html = readFileSync(idx, 'utf8');
if (!html.includes('manifest.webmanifest')) {
  html = html.replace('<html lang="en">', '<html lang="pt-BR">').replace(/<title>[^<]*<\/title>/, '<title>Quaru</title>').replace(/<noscript>[^<]*<\/noscript>/, '<noscript>Ative o JavaScript para usar o Quaru.</noscript>').replace('</head>', [
    `<link rel="manifest" href="${BASE}manifest.webmanifest">`,
    `<link rel="icon" type="image/svg+xml" href="${BASE}icones/quaru.svg">`, // v0.4.1: símbolo oficial (quaru_v2)
    `<link rel="apple-touch-icon" href="${BASE}icones/apple-touch-icon.png">`,
    '<meta name="apple-mobile-web-app-capable" content="yes">',
    '<meta name="mobile-web-app-capable" content="yes">',
    '<meta name="apple-mobile-web-app-title" content="Quaru">',
    `<script>if('serviceWorker' in navigator){addEventListener('load',function(){navigator.serviceWorker.register('${BASE}sw.js',{scope:'${BASE}'}).catch(function(){})})}</script>`,
    '</head>'].join(''));
  writeFileSync(idx, html);
}
writeFileSync(join(dist, '404.html'), html); // GitHub Pages devolve isto para rotas da SPA (ex.: /quaru/perfil)
writeFileSync(join(dist, '.nojekyll'), ''); // pasta _expo/ começa com "_": sem isto o Jekyll a ignora

const arquivos = [];
const andar = (d) => { for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) andar(p); else arquivos.push(relative(dist, p).split(sep).join('/')); } };
andar(dist);
// v0.4.4 (ADR-0020): as mídias do catálogo (exercicios/*.webp, ~876 animações) NÃO entram no pré-cache;
// são baixadas quando a pessoa abre o exercício e guardadas no cache de mídia (abaixo).
const lista = arquivos.filter((f) => !['sw.js', '404.html', '.nojekyll'].includes(f) && !f.endsWith('.map') && !f.startsWith('exercicios/')).sort();
const hash = createHash('sha256'); for (const f of lista) hash.update(f).update(readFileSync(join(dist, f)));
const versao = hash.digest('hex').slice(0, 12);
const sw = `// Service worker do Quaru web (gerado por scripts/pos-export-web.mjs). Só guarda os arquivos do app para uso offline;
// nunca guarda dados do usuário (esses ficam no localStorage). Sem push, sem sincronização.
const CACHE = 'quaru-${versao}';
const BASE = '${BASE}';
const MIDIA = 'quaru-midia-v1'; // mídias dos exercícios: cache em uso, sobrevive às atualizações do app
const ARQUIVOS = ${JSON.stringify(['', ...lista].map((f) => BASE + f))};
// v0.4.1: a versão nova fica "esperando" até a pessoa tocar em "Atualizar agora" (mensagem ATUALIZAR).
// Os dados (localStorage) não são tocados pelo service worker; a migração de esquema roda no app (migrarEstado).
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS))); });
self.addEventListener('message', (e) => { if (e.data === 'ATUALIZAR') self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('quaru-') && k !== CACHE && k !== MIDIA).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const r = e.request; const u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || !u.pathname.startsWith(BASE)) return;
  if (r.mode === 'navigate') { e.respondWith(fetch(r).catch(() => caches.match(BASE + 'index.html'))); return; }
  if (u.pathname.startsWith(BASE + 'exercicios/')) {
    e.respondWith(caches.open(MIDIA).then((c) => c.match(r).then((m) => m || fetch(r).then((res) => { if (res.ok) c.put(r, res.clone()); return res; }))));
    return;
  }
  e.respondWith(caches.match(r, { ignoreSearch: true }).then((c) => c || fetch(r)));
});
`;
writeFileSync(join(dist, 'sw.js'), sw);
console.log(`pós-export ok: ${lista.length} arquivos no cache, versão ${versao}`);
