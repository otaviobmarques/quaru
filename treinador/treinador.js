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
  let treinosDoAluno = [];
  let evolucao = null; // { itens, agenda } ou null (não compartilha)
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
  const situacao = (a) => a.vinculado_em ? `Vinculado · ${a.email ?? ''}${a.compartilha ? ' · compartilha a evolução' : ''}`
    : a.pendente ? 'Convite enviado · aguardando o aluno aceitar no app'
    : a.recusado_em ? 'Recusou o convite' : 'Aguardando o aluno abrir o link';
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
        el('div', { className: 'suave peq', textContent: situacao(a) }));
      const b1 = botao('Abrir', '', () => abrirAluno(a), `Abrir ${a.nome}: treinos, agenda e evolução`);
      const b2 = botao('Copiar link', 'secundario', (ev) => copiar(linkDo(a.codigo), ev.currentTarget), `Copiar link de ${a.nome}`);
      ul.append(el('li', {}, info, el('div', { className: 'acoes' }, b1, a.vinculado_em || a.pendente ? null : b2)));
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

  const RESPOSTA_CONVITE = {
    convidado: 'Convite enviado. Assim que o aluno aceitar no app, ele aparece como vinculado.',
    ja_convidado: 'Você já convidou este aluno. Falta ele aceitar no app (Início ou Perfil).',
    ja_vinculado: 'Este aluno já está vinculado a você.',
    nao_encontrado: 'Não achamos esse ID. Confira com o aluno: fica no app, em Perfil → Meu ID de aluno.',
    proprio: 'Esse é o seu próprio ID.',
  };
  $('form-convite').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = $('cv-id').value.toUpperCase().replace(/[^A-Z0-9]/g, ''), nome = $('cv-nome').value.trim();
    if (!/^[A-HJKMNP-Z2-9]{7}$/.test(id)) return msg($('msg-convite'), 'O ID tem 7 letras e números, como K7M-2PQ9.', 'erro');
    if (!nome) return msg($('msg-convite'), 'Digite como você chama o aluno.', 'erro');
    msg($('msg-convite'), 'Enviando…');
    const { data, error } = await sb.rpc('convidar_aluno', { p_codigo: id, p_nome: nome });
    if (error) return msg($('msg-convite'), 'Não foi possível enviar o convite.', 'erro');
    const ok = data.resultado === 'convidado';
    msg($('msg-convite'), RESPOSTA_CONVITE[data.resultado] ?? 'Não foi possível enviar o convite.', ok ? 'ok' : 'erro');
    if (ok) { $('form-convite').reset(); await abrirAlunos(); msg($('msg-convite'), RESPOSTA_CONVITE.convidado, 'ok'); }
  });

  // ---------- Um aluno ----------
  async function abrirAluno(a) {
    aluno = a;
    mostrar('tela-aluno');
    $('aluno-titulo').textContent = a.nome;
    $('aluno-status').textContent = a.vinculado_em ? `Vinculado à conta ${a.email ?? ''}. Os treinos que você salvar aparecem no app dele.`
      : a.pendente ? 'Convite enviado. Falta o aluno aceitar no app.' : 'Ainda sem vínculo: mande o link abaixo ou crie a conta dele.';
    $('bloco-link').hidden = !!a.vinculado_em || !!a.pendente; $('criar-conta').hidden = !!a.vinculado_em || !!a.pendente;
    $('link-texto').textContent = linkDo(a.codigo); $('copiar-link').textContent = 'Copiar link';
    $('dados-conta').hidden = true; msg($('msg-conta'), '');
    await listarTreinos();
    await carregarEvolucao();
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
    const { data, error } = await sb.from('treinos_atribuidos').select('id, nome, itens, dias, datas, observacoes, atualizado_em').eq('aluno_ref', aluno.id).is('excluido_em', null).order('nome');
    const ul = $('lista-treinos'); ul.replaceChildren();
    if (error) return msg($('msg-treinos'), 'Não foi possível carregar os treinos.', 'erro');
    msg($('msg-treinos'), '');
    treinosDoAluno = data;
    const sel = $('ag-treino'); sel.replaceChildren(...data.map((t) => el('option', { value: t.id, textContent: t.nome })));
    $('form-agendar').hidden = !data.length;
    if (!data.length) ul.append(el('li', { textContent: 'Nenhum treino ainda. Monte o primeiro.' }));
    for (const t of data) {
      const dias = (t.dias ?? []).map((d) => DIAS[d]).join(', ');
      ul.append(el('li', {}, el('div', {}, el('div', { className: 'nome-aluno', textContent: t.nome }),
        el('div', { className: 'suave peq', textContent: `${t.itens.length} exercícios · ~${tempoMin(t.itens)} min${dias ? ` · ${dias}` : ''}` })),
      el('div', { className: 'acoes' }, botao('Editar', 'secundario', () => editar(t), `Editar ${t.nome}`))));
    }
  }

  // ---------- Evolução e agenda (v0.10) ----------
  const dia = (d) => d.toISOString().slice(0, 10);
  const hojeBr = () => new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const fmtDia = (iso) => { const d = new Date(`${iso}T12:00:00Z`); return `${DIAS[d.getUTCDay()]} ${iso.slice(8, 10)}/${iso.slice(5, 7)}`; };
  const fmtKg = (n) => `${String(Math.round(n * 10) / 10).replace('.', ',')} kg`;

  async function carregarEvolucao() {
    evolucao = null; $('evolucao').hidden = true;
    if (!aluno.vinculado_em) { msg($('msg-evolucao'), 'Aparece quando o aluno estiver vinculado e escolher compartilhar.'); return desenharAgenda(); }
    msg($('msg-evolucao'), 'Carregando…');
    const { data, error } = await sb.rpc('evolucao_do_aluno', { p_ref: aluno.id });
    if (error) { msg($('msg-evolucao'), 'Não foi possível carregar a evolução.', 'erro'); return desenharAgenda(); }
    evolucao = data;
    if (!data) msg($('msg-evolucao'), 'O aluno não compartilha a evolução. Ele pode ligar em Perfil → Meu treinador, no app.');
    else desenharEvolucao();
    desenharAgenda();
  }

  function desenharEvolucao() {
    const itens = evolucao.itens ?? [];
    const pesos = itens.filter((i) => i.tipo === 'peso').map((i) => ({ t: +new Date(i.quando), kg: +i.dados.kg })).filter((p) => p.kg > 0);
    const treinos = itens.filter((i) => i.tipo === 'treino').sort((a, b) => (a.quando < b.quando ? 1 : -1));
    const agora = Date.now();
    const em = (dias) => treinos.filter((t) => agora - +new Date(t.quando) <= dias * 86400000).length;
    msg($('msg-evolucao'), itens.length ? (evolucao.atualizado_em ? `Atualizado em ${new Date(evolucao.atualizado_em).toLocaleString('pt-BR')}` : '') : 'O aluno compartilha, mas ainda não registrou peso nem treinos.');
    const n = (rot, val) => el('div', {}, el('b', { textContent: val }), el('span', { textContent: rot }));
    const ult = pesos.at(-1), prim = pesos[0];
    $('ev-numeros').replaceChildren(
      n('treinos em 7 dias', String(em(7))), n('treinos em 30 dias', String(em(30))),
      n('peso atual', ult ? fmtKg(ult.kg) : '–'),
      n('variação do peso', ult && prim && pesos.length > 1 ? `${ult.kg - prim.kg > 0 ? '+' : ''}${fmtKg(ult.kg - prim.kg)}` : '–'));
    // gráfico de peso (SVG simples)
    const g = $('ev-grafico'); g.replaceChildren();
    if (pesos.length < 2) g.append(el('p', { className: 'suave peq', textContent: pesos.length ? 'Um registro de peso até agora.' : 'Sem registros de peso.' }));
    else {
      const NS = 'http://www.w3.org/2000/svg', W = 600, H = 180, P = 28;
      const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const t0 = pesos[0].t, t1 = pesos.at(-1).t || t0 + 1, k0 = Math.min(...pesos.map((p) => p.kg)) - 1, k1 = Math.max(...pesos.map((p) => p.kg)) + 1;
      const x = (t) => P + (W - 2 * P) * ((t - t0) / Math.max(1, t1 - t0)), y = (kg) => H - P - (H - 2 * P) * ((kg - k0) / Math.max(0.1, k1 - k0));
      const add = (tag, at) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(at)) e.setAttribute(k, String(v)); svg.append(e); return e; };
      add('line', { x1: P, y1: H - P, x2: W - P, y2: H - P, class: 'eixo' });
      add('path', { d: pesos.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)} ${y(p.kg).toFixed(1)}`).join(' '), class: 'linha' });
      for (const p of pesos) add('circle', { cx: x(p.t), cy: y(p.kg), r: 4, class: 'ponto' });
      add('text', { x: P, y: H - 8 }).textContent = new Date(t0).toLocaleDateString('pt-BR');
      add('text', { x: W - P, y: H - 8, 'text-anchor': 'end' }).textContent = new Date(t1).toLocaleDateString('pt-BR');
      add('text', { x: 4, y: y(k1 - 1) + 4 }).textContent = fmtKg(k1 - 1).replace(' kg', '');
      add('text', { x: 4, y: y(k0 + 1) + 4 }).textContent = fmtKg(k0 + 1).replace(' kg', '');
      g.setAttribute('aria-label', `Peso de ${fmtKg(prim.kg)} para ${fmtKg(ult.kg)}`);
      g.append(svg);
    }
    const ul = $('ev-treinos'); ul.replaceChildren();
    if (!treinos.length) ul.append(el('li', { className: 'suave', textContent: 'Nenhum treino registrado.' }));
    for (const t of treinos.slice(0, 12)) {
      const d = t.dados;
      ul.append(el('li', {}, el('div', {}, el('div', { className: 'nome-aluno', textContent: d.nome ?? 'Treino' }),
        el('div', { className: 'suave peq', textContent: `${new Date(t.quando).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })} · ${d.series ?? 0} séries · ${(d.volume ?? 0).toLocaleString('pt-BR')} kg de volume · ${d.min ?? '?'} min` }))));
    }
    $('evolucao').hidden = false;
  }

  function desenharAgenda() {
    const ul = $('lista-agenda'); ul.replaceChildren();
    const base = hojeBr(); base.setHours(12, 0, 0, 0);
    const hoje = dia(new Date(Date.UTC(base.getFullYear(), base.getMonth(), base.getDate(), 12)));
    $('ag-data').min = hoje; if (!$('ag-data').value) $('ag-data').value = hoje;
    const planoAluno = evolucao?.agenda ?? {};
    for (let i = 0; i < 28; i++) {
      const d = new Date(`${hoje}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + i); const iso = dia(d);
      const meus = treinosDoAluno.filter((t) => (t.datas ?? []).includes(iso));
      const doAluno = planoAluno[iso];
      const chips = meus.map((t) => {
        const tirar = el('button', { type: 'button', textContent: '✕' }); tirar.setAttribute('aria-label', `Tirar ${t.nome} de ${fmtDia(iso)}`);
        tirar.addEventListener('click', () => mudarDatas(t, (t.datas ?? []).filter((x) => x !== iso)));
        return el('span', { className: 'chip meu' }, t.nome, tirar);
      });
      if (doAluno && !meus.some((t) => t.nome === doAluno)) chips.push(el('span', { className: 'chip', textContent: doAluno }));
      ul.append(el('li', { className: i === 0 ? 'hoje' : '' }, el('span', { className: 'data', textContent: i === 0 ? `Hoje ${iso.slice(8, 10)}/${iso.slice(5, 7)}` : fmtDia(iso) }),
        el('div', { className: 'itens-dia' }, ...(chips.length ? chips : [el('span', { className: 'suave peq', textContent: evolucao ? 'livre' : '' })]))));
    }
    $('ag-legenda').textContent = evolucao ? 'Em vermelho, o que você agendou. Os outros são do planejamento do aluno.' : 'Em vermelho, o que você agendou. O planejamento do próprio aluno aparece se ele compartilhar a evolução.';
  }
  async function mudarDatas(t, datas) {
    msg($('msg-agenda'), 'Salvando…');
    const { error } = await sb.from('treinos_atribuidos').update({ datas: [...new Set(datas)].sort() }).eq('id', t.id);
    if (error) return msg($('msg-agenda'), 'Não foi possível salvar a agenda.', 'erro');
    t.datas = [...new Set(datas)].sort();
    msg($('msg-agenda'), 'Agenda salva. O aluno recebe ao abrir o app.', 'ok');
    desenharAgenda();
  }
  $('form-agendar').addEventListener('submit', async (e) => {
    e.preventDefault();
    const t = treinosDoAluno.find((x) => x.id === $('ag-treino').value), d = $('ag-data').value;
    if (!t) return msg($('msg-agenda'), 'Monte um treino primeiro.', 'erro');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || d < $('ag-data').min) return msg($('msg-agenda'), 'Escolha um dia de hoje em diante.', 'erro');
    if ((t.datas ?? []).includes(d)) return msg($('msg-agenda'), `${t.nome} já está em ${fmtDia(d)}.`, 'erro');
    await mudarDatas(t, [...(t.datas ?? []), d]);
  });

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
