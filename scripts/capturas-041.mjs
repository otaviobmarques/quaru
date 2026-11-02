// Capturas da v0.4.1 (boas-vindas, tour guiado, avatar, IMC, água, dietas, refeições, treinos sugeridos, objetivo, área do corpo, logo).
// Build: cd mobile && EXPO_PUBLIC_CAPTURAS=1 npx expo export --platform web --output-dir dist-capturas
// Servir: node servir-pages.mjs mobile/dist-capturas 8091 &   ·   Rodar: node capturas-041.mjs
// Dados: sempre vazios ou de EXEMPLO (fictícios); o nome é "Pessoa Exemplo". Nenhum dado pessoal.
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.env.BASE ?? 'http://localhost:8091/quaru';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', 'capturas');
// [pasta, nome, url, clique opcional (texto exato de um elemento com role=button/radio/tab)]
const telas = [
  ['boas-vindas', '01-passo1-bem-vindo', '/boas-vindas?novo=1'],
  ['tour', '01-bem-vindo', '/boas-vindas?novo=1'],
  ['tour', '02-nome', '/boas-vindas?novo=1&passo=2'],
  ['tour', '03-faixa-idade-menor', '/boas-vindas?novo=1&passo=3', 'Menos de 18'],
  ['tour', '04-area-inicio', '/boas-vindas?novo=1&passo=4'],
  ['tour', '05-experiencia', '/boas-vindas?novo=1&passo=6', 'Parado há um tempo'],
  ['tour', '06-tempo-e-local', '/boas-vindas?novo=1&passo=7', 'Em casa'],
  ['tour', '07-area-treinos', '/boas-vindas?novo=1&passo=8'],
  ['tour', '08-restricoes', '/boas-vindas?novo=1&passo=10', 'Joelho'],
  ['tour', '09-altura-peso', '/boas-vindas?novo=1&passo=11'],
  ['tour', '10-alimentacao-preferencia', '/boas-vindas?novo=1&passo=12', 'Vegetariana'],
  ['tour', '11-agua-lembretes', '/boas-vindas?novo=1&passo=13'],
  ['tour', '12-cidade-bairro', '/boas-vindas?novo=1&passo=14'],
  ['tour', '13-area-perfil', '/boas-vindas?novo=1&passo=15'],
  ['tour', '14-meus-dados', '/meus-dados?tour=completo&vazio=1'],
  ['tour', '15-inicio-recomendado-em-casa', '/inicio?tour=completo&objetivo=saude&vazio=1', '@ver:recomendado'],
  ['boas-vindas', '05-inicio-vazio-comece-aqui', '/inicio?vazio=1'],
  ['objetivo', '01-passo-objetivo', '/boas-vindas?novo=1&passo=5'],
  ['objetivo', '02-perfil-objetivo', '/objetivo?vazio=1'],
  ['objetivo', '03-inicio-recomendado', '/inicio?vazio=1&objetivo=emagrecer', '@ver:recomendado'],
  ['area-do-corpo', '01-passo-areas', '/boas-vindas?novo=1&passo=9', 'Superiores'],
  ['area-do-corpo', '02-sugeridos-filtro-inferiores', '/treinos-sugeridos?vazio=1&area=inferiores'],
  ['area-do-corpo', '03-sugeridos-filtro-core', '/treinos-sugeridos?vazio=1&area=core'],
  ['treinos-sugeridos', '01-lista-iniciante', '/treinos-sugeridos?vazio=1'],
  ['treinos-sugeridos', '02-lista-intermediario', '/treinos-sugeridos?vazio=1', 'Intermediário'],
  ['treinos-sugeridos', '03-rotinas-com-atalho', '/rotinas?vazio=1'],
  ['avatar', '01-escolher-avatar', '/foto-perfil?vazio=1'],
  ['avatar', '02-avatar-escolhido', '/foto-perfil?vazio=1&avatar=a3'],
  ['avatar', '03-inicio-ola-nome', '/inicio?exemplo=1&avatar=a4'],
  ['avatar', '04-perfil-com-avatar-imc', '/perfil?exemplo=1&avatar=a6&altura=172'],
  ['imc', '01-peso-com-imc', '/peso?exemplo=1&altura=172'],
  ['agua', '01-agua-sem-peso', '/agua?vazio=1'],
  ['agua', '02-agua-com-meta', '/agua?exemplo=1', '+250 ml (copo)'],
  ['agua', '03-alimentacao-atalho', '/alimentacao?exemplo=1'],
  ['dietas', '01-alimentacao-guia', '/alimentacao?vazio=1'],
  ['dietas', '02-mediterranea', '/dieta/mediterranea?vazio=1'],
  ['dietas', '03-cetogenica-alerta', '/dieta/cetogenica?vazio=1'],
  ['dietas', '04-jejum-alerta', '/dieta/jejum-intermitente?vazio=1'],
  ['refeicoes', '01-cafe', '/refeicoes?vazio=1'],
  ['refeicoes', '02-almoco-vegana', '/refeicoes?vazio=1', 'Almoço', 'Vegana'],
  ['refeicoes', '03-jantar', '/refeicoes?vazio=1', 'Jantar'],
  ['atualizacao', '01-aviso-nova-versao', '/inicio?exemplo=1&nova-versao=1'],
  ['atualizacao', '02-perfil-verificar', '/perfil?vazio=1', '@ver:rodape-marca'],
  ['atualizacao', '03-tela-o-que-ha-de-novo', '/atualizacao?vazio=1'],
  ['sobre', '01-sobre-o-app', '/sobre?vazio=1'],
  ['sobre', '02-inicio-rodape-credito', '/inicio?vazio=1', '@rolar:5000'],
  ['logo', '01-entrar', '/entrar?limpar=1'],
  ['logo', '03-treino-sem-logo', '/treino?exemplo=1&treino=1'],
];
const so = process.env.SO ? process.env.SO.split(',') : null;
const dispositivos = [['celular', 390, 844, 2, true], ['computador', 1440, 900, 1, false]];
const porta = 9334;
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
