// Pós-export da versão web (ADR-0013): manifest/ícones no <head>, service worker com a lista de arquivos,
// 404.html (fallback de SPA no GitHub Pages) e .nojekyll. Uso: node scripts/pos-export-web.mjs dist
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';

const dist = process.argv[2] ?? 'dist';
const BASE = '/quaru/'; // igual a experiments.baseUrl do app.json
const idx = join(dist, 'index.html');
const SITE = 'https://otaviobmarques.github.io' + BASE;
const TITULO = 'Quaru · Seu treino, no seu ritmo.';
const DESCRICAO = 'Registre seus treinos, acompanhe a evolução, a água e a alimentação. Acesso por convite.';
let html = readFileSync(idx, 'utf8');
if (!html.includes('manifest.webmanifest')) {
  html = html.replace(/<meta name="description"[^>]*>/g, '').replace('<html lang="en">', '<html lang="pt-BR">').replace(/<title>[^<]*<\/title>/, '<title>Quaru · Seu treino, no seu ritmo.</title>').replace(/<noscript>[^<]*<\/noscript>/, '<noscript>Ative o JavaScript para usar o Quaru.</noscript>').replace('</head>', [
    `<link rel="manifest" href="${BASE}manifest.webmanifest">`,
    `<link rel="icon" type="image/svg+xml" href="${BASE}icones/quaru.svg">`, // v0.4.1: símbolo oficial (quaru_v2)
    `<link rel="icon" type="image/png" sizes="32x32" href="${BASE}icones/favicon-32.png">`,
    // v0.6.1: pré-visualização do link (WhatsApp, Instagram, Facebook, X, LinkedIn, Telegram). A imagem precisa de URL absoluta.
    `<meta name="description" content="${DESCRICAO}">`,
    '<meta property="og:type" content="website">', '<meta property="og:site_name" content="Quaru">', '<meta property="og:locale" content="pt_BR">',
    `<meta property="og:title" content="${TITULO}">`, `<meta property="og:description" content="${DESCRICAO}">`, `<meta property="og:url" content="${SITE}">`,
    `<meta property="og:image" content="${SITE}og-quaru.jpg">`, '<meta property="og:image:type" content="image/jpeg">',
    '<meta property="og:image:width" content="1200">', '<meta property="og:image:height" content="630">',
    `<meta property="og:image:alt" content="Quaru: Seu treino, no seu ritmo. Telas do app de treino.">`,
    '<meta name="twitter:card" content="summary_large_image">', `<meta name="twitter:title" content="${TITULO}">`,
    `<meta name="twitter:description" content="${DESCRICAO}">`, `<meta name="twitter:image" content="${SITE}og-quaru.jpg">`,
    `<link rel="apple-touch-icon" href="${BASE}icones/apple-touch-icon.png">`,
    '<meta name="apple-mobile-web-app-capable" content="yes">',
    '<meta name="mobile-web-app-capable" content="yes">',
    '<meta name="apple-mobile-web-app-title" content="Quaru">',
    `<script>if('serviceWorker' in navigator){addEventListener('load',function(){navigator.serviceWorker.register('${BASE}sw.js',{scope:'${BASE}'}).catch(function(){})})}</script>`,
    '</head>'].join(''));
  writeFileSync(idx, html);
}
writeFileSync(join(dist, '404.html'), html); // GitHub Pages devolve isto para rotas da SPA (ex.: /quaru/perfil)

// v0.6.2: cada tela fixa do app ganha um <rota>.html com o mesmo conteúdo. O GitHub Pages serve /quaru/entrar a partir
// de entrar.html com status 200; sem isso a resposta era o 404.html com status 404, e WhatsApp, Instagram e
// Facebook não montam a pré-visualização de páginas 404 (o app abre direto em /quaru/entrar).
const ROTAS_APP = [];
const pastaApp = new URL('../src/app/', import.meta.url).pathname;
const varrer = (d, prefixo) => {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) { if (!n.startsWith('[')) varrer(p, /^\(.*\)$/.test(n) ? prefixo : prefixo + n + '/'); continue; }
    const nome = n.replace(/\.tsx$/, '');
    if (!n.endsWith('.tsx') || nome.startsWith('_') || nome.startsWith('[') || nome === 'index' || nome.includes('+')) continue;
    ROTAS_APP.push(prefixo + nome);
  }
};
varrer(pastaApp, '');
for (const r of ROTAS_APP) {
  const destino = join(dist, r + '.html');
  if (!existsSync(dirname(destino))) mkdirSync(dirname(destino), { recursive: true });
  if (!existsSync(destino)) writeFileSync(destino, html);
}
console.log(`páginas das telas: ${ROTAS_APP.length} (${ROTAS_APP.slice(0, 6).join(', ')}…)`);
writeFileSync(join(dist, '.nojekyll'), ''); // pasta _expo/ começa com "_": sem isto o Jekyll a ignora

const arquivos = [];
const andar = (d) => { for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) andar(p); else arquivos.push(relative(dist, p).split(sep).join('/')); } };
andar(dist);
// v0.4.4 (ADR-0020): as mídias do catálogo (exercicios/*.webp, ~876 animações) NÃO entram no pré-cache;
// são baixadas quando a pessoa abre o exercício e guardadas no cache de mídia (abaixo).
const lista = arquivos.filter((f) => !['sw.js', '404.html', '.nojekyll'].includes(f) && !f.endsWith('.map') && !f.startsWith('exercicios/') && !f.startsWith('admin/') && !f.startsWith('treinador/') && !f.startsWith('loja/') && f !== 'og-quaru.jpg' && !ROTAS_APP.some((r) => f === r + '.html')).sort();
const hash = createHash('sha256'); for (const f of lista) hash.update(f).update(readFileSync(join(dist, f)));
const versao = hash.digest('hex').slice(0, 12);
const sw = `// Service worker do Quaru web (gerado por scripts/pos-export-web.mjs). Só guarda os arquivos do app para uso offline;
// nunca guarda dados do usuário (esses ficam no localStorage). v0.11: recebe o push do fim do descanso (sem conteúdo).
const CACHE = 'quaru-${versao}';
const BASE = '${BASE}';
const MIDIA = 'quaru-midia-v1'; // mídias dos exercícios: cache em uso, sobrevive às atualizações do app
const ARQUIVOS = ${JSON.stringify(['', ...lista].map((f) => BASE + f))};
// v0.4.1: a versão nova fica "esperando" até a pessoa tocar em "Atualizar agora" (mensagem ATUALIZAR).
// Os dados (localStorage) não são tocados pelo service worker; a migração de esquema roda no app (migrarEstado).
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS))); });
self.addEventListener('message', (e) => { if (e.data === 'ATUALIZAR') self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('quaru-') && k !== CACHE && k !== MIDIA).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
// v0.11 (ADR-0025): fim do descanso com a tela bloqueada. O push não tem conteúdo; o texto é fixo e sem dado de saúde.
// Com o app aberto e em foco, o próprio app já tocou o alerta: a notificação sai silenciosa (o navegador exige mostrar uma).
self.addEventListener('push', (e) => {
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
    const emFoco = cs.some((c) => c.visibilityState === 'visible' && c.focused);
    return self.registration.showNotification('⏱ Acabou o tempo', {
      body: 'Bora para a próxima série do seu treino!', tag: 'quaru-descanso', renotify: !emFoco, silent: emFoco,
      icon: BASE + 'icones/icone-192.png', badge: BASE + 'icones/icone-192.png', vibrate: [0, 400, 200, 400], data: { url: BASE + 'treino' },
    });
  }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || BASE;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
    const c = cs.find((x) => new URL(x.url).pathname.startsWith(BASE));
    return c ? c.focus() : self.clients.openWindow(url);
  }));
});
self.addEventListener('fetch', (e) => {
  const r = e.request; const u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || !u.pathname.startsWith(BASE)) return;
  if (u.pathname.startsWith(BASE + 'admin/') || u.pathname.startsWith(BASE + 'treinador/')) return; // v0.6/v0.8: painel e área do treinador são outros sites; fora do cache do app
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
