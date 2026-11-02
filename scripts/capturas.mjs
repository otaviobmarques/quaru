// Capturas das telas principais com Chrome headless via protocolo DevTools (sem dependências).
// Pré-requisito: build web estático de capturas servido em BASE (ver README, seção Capturas).
// Usa ?exemplo=1 para carregar dados de EXEMPLO (fictícios) — só no build de capturas/dev.
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.env.BASE ?? 'http://localhost:8090';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'capturas');
mkdirSync(OUT, { recursive: true });
const R1 = 'e1000000-0000-4000-b000-000000000001', S5 = 'e3000000-0000-4000-b000-000000000005', EX = '00000000-0000-4000-a000-000000000001';
const telas = [
  ['01-entrar', '/entrar?limpar=1'], ['02-consentimentos', '/consentimentos?limpar=1'],
  ['03-inicio', '/inicio?exemplo=1'], ['03e-inicio-sem-rotina', '/inicio?vazio=1'],
  ['04-rotinas', '/rotinas?exemplo=1'], ['04b-rotina-editar', `/rotina/${R1}?exemplo=1`],
  ['05-biblioteca', '/biblioteca?exemplo=1'], ['06-treino', '/treino?exemplo=1&treino=1'],
  ['07-resumo', `/resumo/${S5}?exemplo=1`], ['08-historico', '/historico?exemplo=1'],
  ['09-exercicio', `/exercicio/${EX}?exemplo=1`], ['10-peso', '/peso?exemplo=1'],
  ['11-alimentacao', '/alimentacao?exemplo=1'], ['12-perfil', '/perfil?exemplo=1'],
  ['12c-exportar', '/exportar?exemplo=1'], ['12d-sobre-licencas', '/sobre?exemplo=1'],
  ['02b-consentimento-ia', '/consentimento-ia?vazio=1'], ['12e-termos-rascunho', '/juridico?doc=termos&vazio=1'],
  ['12f-privacidade-rascunho', '/juridico?doc=politica&vazio=1'], ['99-galeria-estados', '/estados?vazio=1'],
];
// Filtro opcional: SO=03-inicio,06-treino node capturas.mjs
const so = process.env.SO ? process.env.SO.split(',') : null;
const temas = (process.env.TEMAS ?? 'claro,escuro').split(',');
const dispositivos = [['celular', 390, 844, 2, true], ['computador', 1440, 900, 1, false]];

const porta = 9333;
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

const foto = async (arq) => { const r = await cmd('Page.captureScreenshot', { format: 'png' }); writeFileSync(arq, Buffer.from(r.result.data, 'base64')); console.log('ok', arq.split('/').slice(-2).join('/')); };
const abrir = async (url) => {
  await cmd('Storage.clearDataForOrigin', { origin: new URL(BASE).origin, storageTypes: 'local_storage' });
  await cmd('Page.navigate', { url: BASE + url });
  await espera(3500);
};
/** Centro do elemento pelo rótulo acessível (aria-label) ou texto. */
const centro = async (seletor) => {
  const r = await cmd('Runtime.evaluate', { returnByValue: true, expression: `(() => { const el = document.querySelector(${JSON.stringify(seletor)}); if (!el) return null; const b = el.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; })()` });
  return r.result.result.value;
};
const mouse = (type, p) => cmd('Input.dispatchMouseEvent', { type, x: p.x, y: p.y, button: 'left', clickCount: 1 });

await cmd('Page.enable');
for (const tema of temas) {
  await cmd('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: tema === 'escuro' ? 'dark' : 'light' }] });
  const sufixo = tema === 'escuro' ? '_escuro' : '';
  for (const [d, w, h, esc, mobile] of dispositivos) {
    await cmd('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: esc, mobile });
    for (const [nome, url] of telas) {
      if (so && !so.includes(nome)) continue;
      await abrir(url);
      await foto(join(OUT, `${nome}_${d}${sufixo}.png`));
    }
  }
  // Estados de interação reais (celular): erro, foco por teclado, pressionado e treino com séries concluídas.
  if (so && !so.includes('estados')) continue;
  const EST = join(OUT, 'estados'); mkdirSync(EST, { recursive: true });
  await cmd('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await abrir('/peso?exemplo=1');
  const campo = await centro('input[aria-label="Peso de hoje (kg)"]');
  if (campo) { await mouse('mousePressed', campo); await mouse('mouseReleased', campo); await cmd('Input.insertText', { text: '5' }); }
  const reg = await centro('[aria-label="Registrar"]');
  if (reg) { await mouse('mousePressed', reg); await mouse('mouseReleased', reg); }
  await espera(500); await foto(join(EST, `erro-campo-peso${sufixo}.png`));
  await abrir('/peso?exemplo=1');
  for (let i = 0; i < 2; i++) { await cmd('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 }); await cmd('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 }); }
  await espera(400); await foto(join(EST, `foco-teclado-peso${sufixo}.png`));
  await abrir('/entrar?limpar=1');
  const comecar = await centro('[aria-label="Começar"]');
  if (comecar) { await mouse('mouseMoved', comecar); await mouse('mousePressed', comecar); await espera(300); await foto(join(EST, `pressionado-comecar${sufixo}.png`)); await cmd('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 1, y: 1, button: 'left', clickCount: 1 }); }
  await abrir('/treino?exemplo=1&treino=1');
  for (let i = 0; i < 2; i++) { const b = await centro('[aria-label^="✓ Concluir série"]'); if (b) { await mouse('mousePressed', b); await mouse('mouseReleased', b); await espera(500); } }
  const agora = await centro('[aria-label="Agora não"]'); if (agora) { await mouse('mousePressed', agora); await mouse('mouseReleased', agora); await espera(300); }
  await foto(join(EST, `treino-series-concluidas-descanso${sufixo}.png`));
  await abrir('/biblioteca?exemplo=1');
  await cmd('Runtime.evaluate', { expression: `[...document.querySelectorAll('[role=button]')].find((e) => e.textContent === 'Pernas')?.click()` });
  await espera(400); await foto(join(EST, `biblioteca-ficha-ativa${sufixo}.png`));
}
ws.close(); chrome.kill();
