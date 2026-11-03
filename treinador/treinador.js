// Área do treinador do Quaru (v0.8, ADR-0023). Site estático separado do app, como o painel de administração.
// - Entra com a conta do Quaru; só treinador (ou admin) ativo passa (public.meu_acesso + RLS no servidor).
// - Alunos e treinos vão direto ao banco pela API do Supabase, protegidos pela RLS (cada treinador só vê os seus).
// - Criar a conta do aluno passa pela função admin-usuarios (o treinador só cria conta de aluno, papel usuário).
// - Dados vindos de fora só entram na tela por textContent.
import { createClient } from '../admin/supabase-2.45.4.js';

const cfg = window.QUARU_ADMIN ?? {};
const $ = (id) => document.getElementById(id);
const configurado = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(cfg.supabaseUrl ?? '') && !!cfg.supabaseAnonKey;
const URL_APP = cfg.urlApp || `${location.origin}/quaru/`;
const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const TELAS = ['tela-entrar', 'tela-alunos', 'tela-aluno', 'tela-treino'];

function msg(el, texto, tipo = '') { el.textContent = texto; el.className = `msg ${tipo}`; }
function mostrar(t) { for (const x of TELAS) $(x).hidden = x !== t; $('sair').hidden = t === 'tela-entrar'; window.scrollTo(0, 0); }
const el = (tag, props = {}, ...filhos) => { const e = document.createElement(tag); Object.assign(e, props); for (const f of filhos) if (f != null) e.append(f); return e; };
const botao = (texto, classe, fn, rotulo) => { const b = el('button', { type: 'button', className: `botao peq ${classe}`, textContent: texto }); if (rotulo) b.setAttribute('aria-label', rotulo); b.addEventListener('click', fn); return b; };
const linkDo = (codigo) => `${URL_APP}vincular?codigo=${codigo}`;
async function copiar(texto, b) { try { await navigator.clipboard.writeText(texto); b.textContent = 'Copiado ✓'; } catch { b.textContent = 'Selecione e copie'; } }

// Descanso calculado: mesma regra do app (mobile/src/dominio/descanso.ts).
const BASE = { forca: 120, massa: 90, saude: 90, emagrecer: 90, condicionamento: 60 };
const r15 = (s) => Math.round(s / 15) * 15;
function descanso(ex, objetivo) {
  if (ex.c === 'alongamento' || ex.c === 'cardio') return 30;
  const multi = ['powerlifting', 'levantamento olímpico', 'strongman'].includes(ex.c) || ex.s >= 2;
  const b = BASE[objetivo] ?? 90;
  return r15(multi ? Math.min(180, b + 30) : Math.max(45, b - 30));
}
function tempoMin(itens) {
  if (!itens.length) return 0;
  const s = itens.reduce((t, i, k) => t + i.series * (i.reps ?? 10) * 3 + (i.series - 1) * i.descansoS + (k < itens.length - 1 ? r15(Math.min(180, Math.max(90, i.descansoS + 30))) : 0), 0);
  return Math.max(5, Math.round(s / 60 / 5) * 5);
}
function gerarSenha() {
  const l = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ', n = '23456789';
  const s = (a, k) => Array.from(crypto.getRandomValues(new Uint32Array(k)), (x) => a[x % a.length]).join('');
  return `Quaru-${s(l + n, 4)}${s(n, 1)}-${s(l, 1)}${s(l + n, 4)}`;
}

if (!configurado) $('aviso-config').hidden = false;
else {
  const sb = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, { auth: { storage: window.sessionStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } });
  let eu = null;
  let catalogo = [];
  let porId = new Map();
  let aluno = null; // aluno aberto
  let treino = null; // treino em edição: { id?, nome, objetivo, dias:Set, obs, itens:[{exercicioId, series, reps, descansoS, obs}] }

  async function carregarCatalogo() {
    if (catalogo.length) return;
    catalogo = await (await fetch('catalogo.json')).json();
    porId = new Map(catalogo.map((e) => [e.id, e]));
  }

  async function iniciar() {
    const { data } = await sb.auth.getSession();
    if (!data.session) return mostrar('tela-entrar');
    const { data: acesso } = await sb.rpc('meu_acesso');
    if (!acesso?.ativo || !['treinador', 'admin'].includes(acesso.papel)) {
      await sb.auth.signOut(); msg($('msg-entrar'), 'Esta conta não é de treinador. Peça ao administrador do Quaru.', 'erro'); return mostrar('tela-entrar');
    }
    eu = data.session.user;
    await carregarCatalogo();
    await abrirAlunos();
  }

  // ---------- Alunos ----------
  async function abrirAlunos() {
    mostrar('tela-alunos');
    msg($('msg-lista'), 'Carregando…');
    const { data, error } = await sb.rpc('meus_alunos');
    if (error) return msg($('msg-lista'), 'Não foi possível carregar os alunos.', 'erro');
    msg($('msg-lista'), '');
    $('contagem').textContent = String(data.length);
    const ul = $('lista-alunos'); ul.replaceChildren();
    if (!data.length) ul.append(el('li', { textContent: 'Nenhum aluno ainda. Cadastre o primeiro acima.' }));
    for (const a of data) {
      const info = el('div', {}, el('div', { className: 'nome-aluno', textContent: a.nome }),
        el('div', { className: 'suave peq', textContent: a.vinculado_em ? `Vinculado · ${a.email ?? ''}` : 'Aguardando o aluno abrir o link' }));
      const b1 = botao('Treinos', '', () => abrirAluno(a), `Treinos de ${a.nome}`);
      const b2 = botao('Copiar link', 'secundario', (ev) => copiar(linkDo(a.codigo), ev.currentTarget), `Copiar link de ${a.nome}`);
      ul.append(el('li', {}, info, el('div', { className: 'acoes' }, b1, a.vinculado_em ? null : b2)));
    }
  }
  $('form-aluno').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = $('a-nome').value.trim();
    if (!nome) return msg($('msg-aluno'), 'Digite o nome do aluno.', 'erro');
    const { data, error } = await sb.from('alunos_treinador').insert({ treinador_id: eu.id, nome }).select('id, nome, codigo, vinculado_em').single();
    if (error) return msg($('msg-aluno'), 'Não foi possível cadastrar.', 'erro');
    $('form-aluno').reset(); msg($('msg-aluno'), `${nome} cadastrado. Agora mande o link ou crie a conta dele.`, 'ok');
    await abrirAluno({ ...data, email: null });
  });

  // ---------- Um aluno ----------
  async function abrirAluno(a) {
    aluno = a;
    mostrar('tela-aluno');
    $('aluno-titulo').textContent = a.nome;
    $('aluno-status').textContent = a.vinculado_em ? `Vinculado à conta ${a.email ?? ''}. Os treinos que você salvar aparecem no app dele.` : 'Ainda sem vínculo: mande o link abaixo ou crie a conta dele.';
    $('bloco-link').hidden = !!a.vinculado_em; $('criar-conta').hidden = !!a.vinculado_em;
    $('link-texto').textContent = linkDo(a.codigo); $('copiar-link').textContent = 'Copiar link';
    $('dados-conta').hidden = true; msg($('msg-conta'), '');
    await listarTreinos();
  }
  $('copiar-link').addEventListener('click', (ev) => copiar(`Oi, ${aluno.nome}! Seus treinos estão no Quaru. Abra este link no celular para receber: ${linkDo(aluno.codigo)}`, ev.currentTarget));
  $('voltar-alunos').addEventListener('click', abrirAlunos);
  $('gerar-senha').addEventListener('click', () => { $('c-senha').value = gerarSenha(); });
  $('form-conta').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('c-email').value.trim(), senha = $('c-senha').value;
    msg($('msg-conta'), 'Criando a conta…');
    const { data: s } = await sb.auth.getSession();
    const r = await fetch(`${cfg.supabaseUrl}/functions/v1/admin-usuarios`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.session?.access_token}`, apikey: cfg.supabaseAnonKey },
      body: JSON.stringify({ acao: 'criar', email, senha, nome: aluno.nome, papel: 'usuario', trocar: true, aluno_ref: aluno.id }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return msg($('msg-conta'), j.erro || 'Não foi possível criar a conta.', 'erro');
    msg($('msg-conta'), 'Conta criada e vinculada a você.', 'ok');
    $('dados-conta-texto').textContent = `Seu acesso ao Quaru\nEndereço: ${URL_APP}\nE-mail: ${email}\nSenha: ${senha}\nNo primeiro acesso, o app vai pedir para você criar a sua senha. Seus treinos já vão estar lá.`;
    $('dados-conta').hidden = false; $('copiar-conta').textContent = 'Copiar';
    aluno = { ...aluno, vinculado_em: new Date().toISOString(), email };
    $('aluno-status').textContent = `Vinculado à conta ${email}.`; $('bloco-link').hidden = true;
  });
  $('copiar-conta').addEventListener('click', (ev) => copiar($('dados-conta-texto').textContent, ev.currentTarget));

  async function listarTreinos() {
    const { data, error } = await sb.from('treinos_atribuidos').select('id, nome, itens, dias, observacoes, atualizado_em').eq('aluno_ref', aluno.id).is('excluido_em', null).order('nome');
    const ul = $('lista-treinos'); ul.replaceChildren();
    if (error) return msg($('msg-treinos'), 'Não foi possível carregar os treinos.', 'erro');
    msg($('msg-treinos'), '');
    if (!data.length) ul.append(el('li', { textContent: 'Nenhum treino ainda. Monte o primeiro.' }));
    for (const t of data) {
      const dias = (t.dias ?? []).map((d) => DIAS[d]).join(', ');
      ul.append(el('li', {}, el('div', {}, el('div', { className: 'nome-aluno', textContent: t.nome }),
        el('div', { className: 'suave peq', textContent: `${t.itens.length} exercícios · ~${tempoMin(t.itens)} min${dias ? ` · ${dias}` : ''}` })),
      el('div', { className: 'acoes' }, botao('Editar', 'secundario', () => editar(t), `Editar ${t.nome}`))));
    }
  }

  // ---------- Editor ----------
  function editar(t) {
    treino = t ? { id: t.id, nome: t.nome, objetivo: 'massa', dias: new Set(t.dias ?? []), obs: t.observacoes ?? '', itens: t.itens.map((i) => ({ ...i })) }
      : { nome: '', objetivo: 'massa', dias: new Set(), obs: '', itens: [] };
    mostrar('tela-treino');
    $('treino-titulo').textContent = t ? `Editar treino de ${aluno.nome}` : `Novo treino para ${aluno.nome}`;
    $('t-nome').value = treino.nome; $('t-obs').value = treino.obs; $('t-obj').value = treino.objetivo;
    $('excluir-treino').hidden = !t; msg($('msg-treino'), '');
    const caixa = $('t-dias'); caixa.replaceChildren();
    DIAS.forEach((d, i) => {
      const c = el('input', { type: 'checkbox', checked: treino.dias.has(i) });
      c.addEventListener('change', () => { if (c.checked) treino.dias.add(i); else treino.dias.delete(i); });
      caixa.append(el('label', {}, c, d));
    });
    $('busca-ex').value = ''; $('resultados').replaceChildren();
    desenharItens();
  }
  $('novo-treino').addEventListener('click', () => editar(null));
  $('voltar-aluno').addEventListener('click', () => abrirAluno(aluno));

  const numero = (rotulo, valor, min, max, set) => {
    const i = el('input', { type: 'number', min, max, value: valor ?? '', inputMode: 'numeric' });
    i.addEventListener('input', () => { const n = i.value === '' ? null : Math.max(min, Math.min(max, Math.round(+i.value))); set(n); atualizarResumo(); });
    return el('div', {}, el('label', { textContent: rotulo }), i);
  };
  function atualizarResumo() {
    $('t-contagem').textContent = `${treino.itens.length}`;
    $('t-tempo').textContent = treino.itens.length ? `· tempo estimado ~${tempoMin(treino.itens)} min` : '';
  }
  function desenharItens() {
    const ol = $('t-itens'); ol.replaceChildren();
    treino.itens.forEach((it, k) => {
      const ex = porId.get(it.exercicioId) ?? { n: 'Exercício', g: '', q: '' };
      const mover = (d) => { const j = k + d; if (j < 0 || j >= treino.itens.length) return; [treino.itens[k], treino.itens[j]] = [treino.itens[j], treino.itens[k]]; desenharItens(); };
      const cab = el('div', { className: 'cab' },
        ex.m ? el('img', { className: 'mini', src: `../exercicios/${ex.m}-m.webp`, alt: '' }) : null,
        el('span', { className: 'nome', textContent: ex.n }),
        botao('↑', 'secundario', () => mover(-1), `Subir ${ex.n}`), botao('↓', 'secundario', () => mover(1), `Descer ${ex.n}`),
        botao('✕', 'secundario', () => { treino.itens.splice(k, 1); desenharItens(); }, `Remover ${ex.n}`));
      const obs = el('input', { type: 'text', maxLength: 120, value: it.obs ?? '', placeholder: 'ex.: carga leve, foco na técnica' });
      obs.addEventListener('input', () => { it.obs = obs.value; });
      const campos = el('div', { className: 'campos' },
        numero('Séries', it.series, 1, 20, (n) => { it.series = n ?? 1; }),
        numero('Repetições', it.reps, 1, 100, (n) => { it.reps = n; }),
        numero('Descanso (s)', it.descansoS, 0, 900, (n) => { it.descansoS = n ?? 0; }),
        el('div', { className: 'obs' }, el('label', { textContent: 'Observação' }), obs));
      ol.append(el('li', {}, cab, campos));
    });
    atualizarResumo();
  }
  const sem = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  $('busca-ex').addEventListener('input', () => {
    const q = sem($('busca-ex').value.trim());
    const ul = $('resultados'); ul.replaceChildren();
    if (q.length < 2) return;
    const termos = q.split(/\s+/);
    const achados = catalogo.filter((e) => { const t = sem(`${e.n} ${e.g} ${e.q}`); return termos.every((x) => t.includes(x)); }).slice(0, 30);
    if (!achados.length) ul.append(el('li', { className: 'suave', textContent: 'Nenhum exercício encontrado.' }));
    for (const e of achados) {
      const b = el('button', { type: 'button' }, e.m ? el('img', { className: 'mini', src: `../exercicios/${e.m}-m.webp`, alt: '' }) : null,
        el('span', {}, el('div', { textContent: e.n }), el('div', { className: 'meta', textContent: `${e.g} · ${e.q}` })));
      b.setAttribute('aria-label', `Adicionar ${e.n}`);
      b.addEventListener('click', () => {
        treino.itens.push({ exercicioId: e.id, series: 3, reps: e.c === 'alongamento' ? null : 10, descansoS: descanso(e, $('t-obj').value), obs: '' });
        desenharItens(); msg($('msg-treino'), `${e.n} adicionado.`, 'ok');
      });
      ul.append(el('li', {}, b));
    }
  });
  $('t-obj').addEventListener('change', () => { for (const it of treino.itens) { const e = porId.get(it.exercicioId); if (e) it.descansoS = descanso(e, $('t-obj').value); } desenharItens(); });

  $('salvar-treino').addEventListener('click', async () => {
    const nome = $('t-nome').value.trim();
    if (!nome) return msg($('msg-treino'), 'Dê um nome ao treino.', 'erro');
    if (!treino.itens.length) return msg($('msg-treino'), 'Adicione pelo menos um exercício.', 'erro');
    const linha = { aluno_ref: aluno.id, treinador_id: eu.id, nome, itens: treino.itens.map(({ exercicioId, series, reps, descansoS, obs }) => ({ exercicioId, series, reps, descansoS, obs: obs?.trim() || undefined })),
      dias: [...treino.dias].sort(), observacoes: $('t-obs').value.trim() || null };
    msg($('msg-treino'), 'Salvando…');
    const r = treino.id ? await sb.from('treinos_atribuidos').update(linha).eq('id', treino.id) : await sb.from('treinos_atribuidos').insert(linha);
    if (r.error) return msg($('msg-treino'), 'Não foi possível salvar.', 'erro');
    await abrirAluno(aluno);
    msg($('msg-treinos'), `“${nome}” salvo. ${aluno.vinculado_em ? 'O aluno recebe ao abrir o app.' : 'O aluno recebe quando abrir o link.'}`, 'ok');
  });
  $('excluir-treino').addEventListener('click', async () => {
    if (!treino.id || !confirm('Excluir este treino? Ele some do app do aluno.')) return;
    const r = await sb.from('treinos_atribuidos').update({ excluido_em: new Date().toISOString() }).eq('id', treino.id);
    if (r.error) return msg($('msg-treino'), 'Não foi possível excluir.', 'erro');
    await abrirAluno(aluno);
  });

  $('form-entrar').addEventListener('submit', async (e) => {
    e.preventDefault();
    msg($('msg-entrar'), 'Entrando…');
    const { error } = await sb.auth.signInWithPassword({ email: $('email').value.trim(), password: $('senha').value });
    $('senha').value = '';
    if (error) return msg($('msg-entrar'), /banned/i.test(error.message) ? 'Conta bloqueada.' : 'E-mail ou senha incorretos.', 'erro');
    msg($('msg-entrar'), '');
    await iniciar();
  });
  $('sair').addEventListener('click', async () => { await sb.auth.signOut(); mostrar('tela-entrar'); });
  iniciar();
}
