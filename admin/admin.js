// Painel de administração do Quaru (v0.6, ADR-0022). Site estático separado do app.
// - Entra com e-mail e senha (Supabase Auth). A sessão fica no sessionStorage: some ao fechar a aba.
// - Só administradores ativos passam (confere public.meu_acesso()); a função de borda confere de novo no servidor.
// - Dados de usuários entram na tela só por textContent (nada de innerHTML com dado vindo de fora).
import { createClient } from './supabase-2.45.4.js'; // empacotado no repositório (sem CDN)

const cfg = window.QUARU_ADMIN ?? {};
const $ = (id) => document.getElementById(id);
const configurado = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(cfg.supabaseUrl ?? '') && !!cfg.supabaseAnonKey;

function msg(el, texto, tipo = '') { el.textContent = texto; el.className = `msg ${tipo}`; }
function mostrar(tela) { for (const t of ['tela-entrar', 'tela-painel']) $(t).hidden = t !== tela; $('sair').hidden = tela !== 'tela-painel'; }

if (!configurado) {
  $('aviso-config').hidden = false;
} else {
  const sb = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, { auth: { storage: window.sessionStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } });
  let usuarios = [];

  async function chamar(corpo) {
    const { data: s } = await sb.auth.getSession();
    const token = s.session?.access_token;
    if (!token) throw new Error('Sessão expirada. Entre de novo.');
    const r = await fetch(`${cfg.supabaseUrl}/functions/v1/admin-usuarios`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, apikey: cfg.supabaseAnonKey }, body: JSON.stringify(corpo),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.erro || 'Algo deu errado. Tente de novo.');
    return j;
  }

  async function conferirAdmin() {
    const { data, error } = await sb.rpc('meu_acesso');
    return !error && data?.papel === 'admin' && data?.ativo === true;
  }

  async function iniciar() {
    const { data } = await sb.auth.getSession();
    if (!data.session) return mostrar('tela-entrar');
    if (!(await conferirAdmin())) { await sb.auth.signOut(); msg($('msg-entrar'), 'Esta conta não é de administrador.', 'erro'); return mostrar('tela-entrar'); }
    mostrar('tela-painel');
    await carregar();
  }

  const fmtData = (iso) => (iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
  const el = (tag, props = {}, ...filhos) => { const e = document.createElement(tag); Object.assign(e, props); for (const f of filhos) e.append(f); return e; };
  const botao = (texto, classe, fn, rotulo) => { const b = el('button', { type: 'button', className: `botao peq ${classe}`, textContent: texto }); if (rotulo) b.setAttribute('aria-label', rotulo); b.addEventListener('click', fn); return b; };

  async function acao(corpo, ok) {
    msg($('msg-lista'), 'Salvando…');
    try { await chamar(corpo); msg($('msg-lista'), ok, 'ok'); await carregar(false); } catch (e) { msg($('msg-lista'), e.message, 'erro'); }
  }

  function desenhar() {
    const q = $('busca').value.trim().toLowerCase();
    const lista = usuarios.filter((u) => !q || u.email.toLowerCase().includes(q) || (u.nome ?? '').toLowerCase().includes(q));
    $('contagem').textContent = String(usuarios.length);
    const corpo = $('linhas');
    corpo.replaceChildren();
    if (!lista.length) { corpo.append(el('tr', {}, el('td', { colSpan: 5, textContent: q ? 'Ninguém encontrado.' : 'Nenhum usuário ainda.' }))); return; }
    for (const u of lista) {
      const quem = el('td', {}, el('div', { className: 'email', textContent: u.email }), ...(u.nome ? [el('div', { className: 'nome', textContent: u.nome })] : []));
      const papel = el('td', {}, el('span', { className: u.papel === 'admin' ? 'selo' : 'selo cinza', textContent: u.papel === 'admin' ? 'ADMIN' : 'USUÁRIO' }));
      const situacao = el('td', {}, el('span', { className: !u.ativo ? 'selo vermelho' : 'selo cinza', textContent: !u.ativo ? 'BLOQUEADO' : u.convite_pendente ? 'CONVITE ENVIADO' : 'ATIVO' }));
      const acesso = el('td', { textContent: fmtData(u.ultimo_acesso) });
      const acoes = el('td', { className: 'acoes' });
      acoes.append(botao(u.convite_pendente ? 'Reenviar convite' : 'Redefinir senha', 'secundario', () => acao({ acao: 'reenviar', usuario_id: u.id }, u.convite_pendente ? 'Convite reenviado.' : 'E-mail para redefinir a senha enviado.'), `${u.convite_pendente ? 'Reenviar convite' : 'Redefinir senha'} de ${u.email}`));
      if (!u.eu) {
        acoes.append(botao(u.papel === 'admin' ? 'Tirar admin' : 'Tornar admin', 'secundario', () => acao({ acao: 'papel', usuario_id: u.id, papel: u.papel === 'admin' ? 'usuario' : 'admin' }, 'Papel alterado.'), `${u.papel === 'admin' ? 'Tirar admin de' : 'Tornar admin'} ${u.email}`));
        acoes.append(botao(u.ativo ? 'Bloquear' : 'Desbloquear', 'secundario', () => acao({ acao: u.ativo ? 'bloquear' : 'desbloquear', usuario_id: u.id }, u.ativo ? 'Usuário bloqueado: não consegue mais entrar.' : 'Usuário desbloqueado.'), `${u.ativo ? 'Bloquear' : 'Desbloquear'} ${u.email}`));
        acoes.append(botao('Remover', 'perigo', () => confirmarRemocao(u), `Remover ${u.email}`));
      } else acoes.append(el('span', { className: 'nome', textContent: ' (você)' }));
      corpo.append(el('tr', {}, quem, papel, situacao, acesso, acoes));
    }
  }

  async function carregar(limpar = true) {
    if (limpar) msg($('msg-lista'), 'Carregando…');
    try { usuarios = (await chamar({ acao: 'listar' })).usuarios ?? []; if (limpar) msg($('msg-lista'), ''); desenhar(); }
    catch (e) { msg($('msg-lista'), e.message, 'erro'); }
  }

  function confirmarRemocao(u) {
    const d = $('confirmar');
    $('conf-texto').textContent = `Isto apaga a conta de ${u.email} e todos os dados dela no servidor. Não dá para desfazer.`;
    $('conf-campo').value = ''; $('conf-ok').disabled = true;
    $('conf-campo').oninput = () => { $('conf-ok').disabled = $('conf-campo').value.trim().toLowerCase() !== u.email.toLowerCase(); };
    d.onclose = () => { if (d.returnValue === 'ok') acao({ acao: 'remover', usuario_id: u.id }, 'Usuário removido.'); };
    d.showModal();
  }

  $('form-entrar').addEventListener('submit', async (e) => {
    e.preventDefault();
    msg($('msg-entrar'), 'Entrando…');
    const { error } = await sb.auth.signInWithPassword({ email: $('email').value.trim(), password: $('senha').value });
    $('senha').value = '';
    if (error) return msg($('msg-entrar'), /banned/i.test(error.message) ? 'Conta bloqueada.' : 'E-mail ou senha incorretos.', 'erro');
    msg($('msg-entrar'), '');
    await iniciar();
  });
  $('esqueci').addEventListener('click', async () => {
    const email = $('email').value.trim();
    if (!email) return msg($('msg-entrar'), 'Digite o seu e-mail acima e toque de novo.', 'erro');
    await sb.auth.resetPasswordForEmail(email, { redirectTo: cfg.urlApp || undefined });
    msg($('msg-entrar'), 'Se o e-mail tiver conta, enviamos um link para criar uma nova senha.', 'ok'); // não revela se existe
  });
  $('form-convidar').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('c-email').value.trim();
    msg($('msg-convidar'), 'Enviando convite…');
    try {
      await chamar({ acao: 'convidar', email, nome: $('c-nome').value.trim(), papel: $('c-papel').value });
      msg($('msg-convidar'), `Convite enviado para ${email}.`, 'ok');
      $('form-convidar').reset();
      await carregar(false);
    } catch (er) { msg($('msg-convidar'), er.message, 'erro'); }
  });
  $('busca').addEventListener('input', desenhar);
  $('sair').addEventListener('click', async () => { await sb.auth.signOut(); usuarios = []; $('linhas').replaceChildren(); mostrar('tela-entrar'); });

  iniciar();
}
