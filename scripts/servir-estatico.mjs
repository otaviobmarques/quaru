// Servidor local mínimo para o build web estático (SPA): arquivo existente ou index.html.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
const raiz = process.argv[2] ?? 'mobile/dist-capturas';
const porta = Number(process.argv[3] ?? 8090);
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json', '.ttf': 'font/ttf' };
createServer(async (req, res) => {
  const caminho = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  let arq = join(raiz, caminho);
  try { if (!(await stat(arq)).isFile()) throw 0; } catch { arq = join(raiz, 'index.html'); }
  res.setHeader('Content-Type', tipos[extname(arq)] ?? 'application/octet-stream');
  res.end(await readFile(arq));
}).listen(porta, '127.0.0.1', () => console.log(`http://localhost:${porta}`));
