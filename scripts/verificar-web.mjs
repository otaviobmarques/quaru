// Verificação da versão web (0.4.0) no build de PRODUÇÃO servido em /quaru/ (node servir-pages.mjs mobile/dist 8091).
// Chrome headless via DevTools; capturas em ../capturas/web/. Sem dados de exemplo: o fluxo é feito pela interface.
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.env.BASE ?? 'http://localhost:8091/quaru';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'capturas', 'web');
mkdirSync(OUT, { recursive: true });
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const resultados = [];
const conferir = (nome, ok, det = '') => { resultados.push({ nome, ok: !!ok, det }); console.log(ok ? 'OK ' : 'FALHOU', nome, det); };

async function sessao(porta, [disp, w, h, esc, mobile]) {
  const chrome = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${porta}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'web-'))}`, 'about:blank'], { stdio: 'ignore' });
  let alvo; for (let i = 0; i < 50 && !alvo; i++) { await espera(200); try { alvo = (await (await fetch(`http://127.0.0.1:${porta}/json`)).json()).find((t) => t.type === 'page'); } catch {} }
  const ws = new WebSocket(alvo.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r));
  let n = 0; const pend = new Map(); const erros = [];
  ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } else if (d.method === 'Runtime.exceptionThrown') erros.push(d.params.exceptionDetails.text); });
  const cmd = (method, params = {}) => new Promise((r) => { const id = ++n; pend.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
  const ev = async (expression) => (await cmd('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.result?.value;
  const clicar = async (t) => { const r = await ev(`(() => { const els = [...document.querySelectorAll('[role=button],[role=switch],[role=tab],[aria-label]')]; const el = els.find(e => (e.getAttribute('aria-label')||'').trim() === ${JSON.stringify(t)}) || els.find(e => e.textContent.trim() === ${JSON.stringify(t)}); if (!el) return false; el.click(); return true; })()`); await espera(900); return r; };
  const ir = async (p) => { await cmd('Page.navigate', { url: BASE + p }); await espera(3500); };
  const texto = () => ev('document.body.innerText');
  const foto = async (nome) => { const r = await cmd('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(OUT, `${nome}_${disp}.png`), Buffer.from(r.result.data, 'base64')); };
  const digitar = async (rotulo, valor) => { await ev(`document.querySelector('[aria-label=${JSON.stringify(rotulo)}]')?.focus()`); await cmd('Input.insertText', { text: valor }); await espera(200); };

  await cmd('Page.enable'); await cmd('Runtime.enable'); await cmd('Network.enable');
  await cmd('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: esc, mobile });
  // Instrumentos: relógio adiantável, registro de navigator.vibrate e de play() de áudio.
  await cmd('Page.addScriptToEvaluateOnNewDocument', { source: `window.__desloc=0;const __n=Date.now.bind(Date);Date.now=()=>__n()+window.__desloc;window.__vib=[];navigator.vibrate=(p)=>{window.__vib.push(p);return true};window.__play=[];const __p=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){window.__play.push({src:this.currentSrc||this.src,muted:this.muted});return __p.call(this).catch(()=>{})};` });

  await ir('/'); conferir(`${disp}: raiz redireciona para /quaru/entrar`, (await ev('location.pathname')) === '/quaru/entrar'); await foto('01-entrar');
  await clicar('Começar'); await foto('02-consentimentos');
  await clicar('Autorizo o tratamento dos meus dados de saúde de treino e peso'); await clicar('Continuar');
  conferir(`${disp}: onboarding chega ao Início`, (await ev('location.pathname')) === '/quaru/inicio'); await foto('03-inicio');
  const ls = await ev(`localStorage.getItem('app-academia:estado:v1')`);
  conferir(`${disp}: estado gravado no localStorage do navegador`, ls && JSON.parse(ls).versao === 2);

  await clicar('Treino livre'); await clicar('Supino reto com barra');
  await digitar('Carga em kg, série 1', '40'); await digitar('Repetições, série 1', '10');
  await clicar('Concluir série 1'); await foto('04-treino-descanso');
  conferir(`${disp}: descanso iniciou`, /descanso/i.test(await texto()));
  await ev('window.__desloc = 10*60*1000'); await espera(1500); await foto('05-treino-fim-descanso');
  const vib = await ev('window.__vib'), play = await ev('window.__play.filter(p=>!p.muted)');
  conferir(`${disp}: fim do descanso chamou navigator.vibrate`, vib?.length > 0, JSON.stringify(vib?.[0]));
  conferir(`${disp}: fim do descanso tocou descanso.wav`, play?.some((p) => /descanso\.[0-9a-f]+\.wav/.test(p.src)), play?.[0]?.src?.replace(/^https?:\/\/[^/]+/, ''));
  await ev('window.__desloc = 0');
  await clicar('Finalizar treino'); await espera(500); await clicar('Finalizar'); await foto('06-depois-de-finalizar');

  await ir('/historico'); await foto('07-historico');
  await ir('/rotinas'); await foto('08-rotinas');
  await ir('/biblioteca'); await foto('09-biblioteca');
  await ir('/peso'); await foto('10-peso');
  await ir('/perfil'); const tp = await texto(); await foto('11-perfil');
  conferir(`${disp}: Perfil avisa "Dados salvos neste navegador, sem criptografia do aparelho"`, tp.includes('Dados salvos neste navegador, sem criptografia do aparelho'));
  conferir(`${disp}: acesso direto a /quaru/perfil (fallback 404.html) abre o app`, tp.includes('Excluir minha conta'));
  await ir('/exportar'); await foto('12-exportar');
  await ir('/sobre'); await foto('13-sobre');

  const man = (await cmd('Page.getAppManifest')).result;
  conferir(`${disp}: manifest carregado sem erros`, man.url?.endsWith('/quaru/manifest.webmanifest') && !man.errors?.length, (man.errors ?? []).map((e) => e.message).join('; '));
  const sw = await ev(`navigator.serviceWorker.getRegistration('/quaru/').then(r => r && r.active ? r.scope : null)`);
  conferir(`${disp}: service worker ativo no escopo /quaru/`, sw?.endsWith('/quaru/'), sw?.replace(/^https?:\/\/[^/]+/, ''));
  await espera(1500);
  await cmd('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await ir('/inicio'); const off = await texto(); await foto('14-offline-inicio');
  conferir(`${disp}: abre SEM internet (service worker) e mantém os dados`, /Início/.test(off) && /1 treino/.test(off));
  await cmd('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });

  await ir('/perfil'); await clicar('Excluir minha conta e dados'); await espera(500);
  conferir(`${disp}: "Excluir tudo" explica que apaga só este navegador`, (await texto()).includes('NESTE navegador')); await foto('15-excluir-tudo');
  await digitar('Digite EXCLUIR para confirmar', 'EXCLUIR'); await clicar('Excluir tudo'); await espera(1000);
  const depois = await ev(`localStorage.getItem('app-academia:estado:v1')`);
  conferir(`${disp}: após Excluir tudo volta para Entrar e o estado salvo está vazio`, (await ev('location.pathname')) === '/quaru/entrar' && (!depois || JSON.parse(depois).usuario === null));
  await cmd('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] }); await ir('/'); await foto('16-entrar-escuro');
  conferir(`${disp}: sem erros de JavaScript`, erros.length === 0, erros.join(' | '));
  ws.close(); chrome.kill();
}

await sessao(9341, ['celular', 390, 844, 2, true]);
await sessao(9342, ['computador', 1440, 900, 1, false]);
writeFileSync(join(OUT, 'resultado.json'), JSON.stringify(resultados, null, 2));
const falhas = resultados.filter((r) => !r.ok).length;
console.log(`\n${resultados.length - falhas}/${resultados.length} verificações OK`);
process.exit(falhas ? 1 : 0);
