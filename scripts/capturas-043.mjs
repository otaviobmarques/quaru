// Capturas da v0.4.3 (fotos das dietas, equipamentos, demonstração, Sair). Base: capturas da v0.4.2 (design v2.1: login, tour, início, treinos sugeridos, alimentação, água, perfil), celular, claro e escuro.
// Base: capturas da v0.4.1 (boas-vindas, tour guiado, avatar, IMC, água, dietas, refeições, treinos sugeridos, objetivo, área do corpo, logo).
// Build: cd mobile && EXPO_PUBLIC_CAPTURAS=1 npx expo export --platform web --output-dir dist-capturas
// Servir: node servir-pages.mjs mobile/dist-capturas 8091 &   ·   Rodar: node capturas-041.mjs
// Dados: sempre vazios ou de EXEMPLO (fictícios); o nome é "Pessoa Exemplo". Nenhum dado pessoal.
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.env.BASE ?? 'http://localhost:8091/quaru';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', 'capturas', 'v0.4.3');
// [pasta, nome, url, clique opcional (texto exato de um elemento com role=button/radio/tab)]
const telas = [
  ['equipamentos', '01-tour-equipamentos-casa', '/boas-vindas?novo=1&local=casa&passo=8', '@rolar:260'],
  ['equipamentos', '02-tour-equipamentos-academia', '/boas-vindas?novo=1&local=academia&passo=8', '@rolar:260'],
  ['equipamentos', '03-meus-dados', '/meus-dados?vazio=1&local=casa', '@ver:equip-peso-corpo'],
  ['equipamentos', '04-sugeridos-so-peso-do-corpo', '/treinos?vazio=1&equip=peso-corpo&secao=sugeridos', '@rolar:420'],
  ['equipamentos', '05-sugeridos-academia-icones', '/treinos?vazio=1&local=academia&secao=sugeridos', '@rolar:300'],
  ['sair', '01-perfil-botao-sair', '/perfil?exemplo=1&avatar=a6', '@ver:ir-sair'],
  ['sair', '02-tela-sair', '/sair?exemplo=1'],
  ['sair', '03-folha-apagar-bloqueado', '/sair?exemplo=1&apagar=1'],
  ['sair', '04-folha-apagar-liberado', '/sair?exemplo=1&apagar=1', '@digitar:campo-confirmar:excluir'],
  ['dietas', '01-lista', '/alimentacao?vazio=1'],
  ['dietas', '02-detalhe-vegana', '/dieta/vegana?vazio=1'],
  ['dietas', '03-detalhe-mediterranea', '/dieta/mediterranea?vazio=1'],
  ['dietas', '04-detalhe-jejum-intermitente', '/dieta/jejum-intermitente?vazio=1'],
  ['dietas', '05-sobre-creditos-das-fotos', '/sobre?vazio=1', '@rolar:1500'],
  ['refeicoes', '01-cafe-reserva', '/refeicoes?vazio=1'],
  ['refeicoes', '02-cafe-foto-real', '/refeicoes?vazio=1', '@ver:foto-receita-mingau-aveia'],
  ['refeicoes', '03-almoco-reserva', '/refeicoes?vazio=1', 'Almoço'],
  ['refeicoes', '04-lanche-fotos', '/refeicoes?vazio=1', 'Lanche'],
  ['refeicoes', '05-jantar-foto-e-reserva', '/refeicoes?vazio=1', 'Jantar'],
  ['demonstracao', '01-editar-rotina', '/rotina/e1000000-0000-4000-b000-000000000001?exemplo=1'],
  ['demonstracao', '02-durante-o-treino', '/treino?exemplo=1&treino=1'],
  ['demonstracao', '03-sugeridos', '/treinos?vazio=1&secao=sugeridos', '@rolar:420'],
];
const so = process.env.SO ? process.env.SO.split(',') : null;
const dispositivos = [['celular', 390, 844, 2, true]];
const porta = 9335;
const chrome = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${porta}`,
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'cap-'))}`, 'about:blank'], { stdio: 'ignore' });
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
let alvo;
for (let i = 0; i < 50 && !alvo; i++) { await espera(200); try { alvo = (await (await fetch(`http://127.0.0.1:${porta}/json`)).json()).find((t) => t.type === 'page'); } catch {} }
const ws = new WebSocket(alvo.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let n = 0; const pend = new Map();
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } });
const cmd = (method, params = {}) => new Promise((r) => { const id = ++n; pend.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
await cmd('Page.enable');
for (const tema of ['claro', 'escuro']) {
  await cmd('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: tema === 'escuro' ? 'dark' : 'light' }] });
  for (const [d, w, h, esc, mobile] of dispositivos) {
    await cmd('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: esc, mobile });
    for (const [pasta, nome, url, ...cliques] of telas) {
      if (so && !so.includes(pasta)) continue;
      await cmd('Storage.clearDataForOrigin', { origin: new URL(BASE).origin, storageTypes: 'local_storage' });
      await cmd('Page.navigate', { url: BASE + url });
      await espera(3000);
      for (const t of cliques) {
        if (t.startsWith('@ver:')) { await cmd('Runtime.evaluate', { expression: `document.querySelector('[data-testid="${t.slice(5)}"]')?.scrollIntoView({ block: 'start' })` }); await espera(400); continue; }
        if (t.startsWith('@digitar:')) { // escreve num TextInput do RN na web (setter nativo + evento input)
          const [, id, texto] = t.split(':');
          await cmd('Runtime.evaluate', { expression: `(() => { const e = document.querySelector('[data-testid="${id}"]'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(e, ${JSON.stringify('')}+'${texto}'); e.dispatchEvent(new Event('input', { bubbles: true })); })()` });
          await espera(500); continue;
        }
        if (t.startsWith('@rolar:')) { // rola a área de rolagem principal (ScrollView do RN na web)
          await cmd('Runtime.evaluate', { expression: `[...document.querySelectorAll('div')].filter((d) => d.scrollHeight > d.clientHeight + 20 && getComputedStyle(d).overflowY !== 'visible').forEach((d) => { d.scrollTop = ${Number(t.slice(7))}; })` });
          await espera(400); continue;
        }
        await cmd('Runtime.evaluate', { expression: `(() => { const els = [...document.querySelectorAll('[role=button],[role=radio],[role=tab]')]; const e = els.find((x) => x.getAttribute('aria-label') === ${JSON.stringify(t)} || x.textContent.trim() === ${JSON.stringify(t)}); e && e.click(); })()` });
        await espera(500);
      }
      const dir = join(RAIZ, pasta); mkdirSync(dir, { recursive: true });
      const r = await cmd('Page.captureScreenshot', { format: 'png' });
      const arq = join(dir, `${nome}_${d}${tema === 'escuro' ? '_escuro' : ''}.png`);
      writeFileSync(arq, Buffer.from(r.result.data, 'base64')); console.log('ok', arq.split('/').slice(-2).join('/'));
    }
  }
}
ws.close(); chrome.kill();
