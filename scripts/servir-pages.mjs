// Simula o GitHub Pages localmente: publica a pasta em /quaru/ e devolve 404.html (status 404) para rotas inexistentes.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
const raiz = process.argv[2] ?? 'mobile/dist';
const porta = Number(process.argv[3] ?? 8091);
const BASE = '/quaru';
const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.wav': 'audio/wav', '.ttf': 'font/ttf' };
createServer(async (req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (!p.startsWith(BASE)) { res.writeHead(404); return res.end('fora do subcaminho'); }
  let rel = normalize(p.slice(BASE.length) || '/').replace(/^(\.\.[/\\])+/, '');
  if (rel.endsWith('/')) rel += 'index.html';
  let arq = join(raiz, rel), status = 200;
  try { if (!(await stat(arq)).isFile()) throw 0; } catch { arq = join(raiz, '404.html'); status = 404; }
  res.writeHead(status, { 'Content-Type': tipos[extname(arq)] ?? 'application/octet-stream' });
  res.end(await readFile(arq));
}).listen(porta, '127.0.0.1', () => console.log(`http://localhost:${porta}${BASE}/`));
