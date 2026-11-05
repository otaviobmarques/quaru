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
    if (!lista.length) { corpo.append(el('tr', {}, el('td', { colSpan: 6, textContent: q ? 'Ninguém encontrado.' : 'Nenhum usuário ainda.' }))); return; }
    for (const u of lista) {
      const quem = el('td', {}, el('div', { className: 'email', textContent: u.email }), ...(u.nome ? [el('div', { className: 'nome', textContent: u.nome })] : []),
        ...(u.aniversario ? [el('div', { className: 'nome', textContent: `🎂 ${u.aniversario}` })] : []));
      const NOMES_PAPEL = { admin: 'Admin', treinador: 'Treinador', usuario: 'Usuário' };
      let papel;
      if (u.eu) papel = el('td', {}, el('span', { className: 'selo', textContent: NOMES_PAPEL[u.papel].toUpperCase() }));
      else {
        const sel = el('select', { className: 'papel' });
        sel.setAttribute('aria-label', `Papel de ${u.email}`);
        for (const [v, t] of Object.entries(NOMES_PAPEL)) sel.append(el('option', { value: v, textContent: t, selected: u.papel === v }));
        sel.addEventListener('change', () => acao({ acao: 'papel', usuario_id: u.id, papel: sel.value }, `${u.email} agora é ${NOMES_PAPEL[sel.value].toLowerCase()}.`));
        papel = el('td', {}, sel);
      }
      const situacao = el('td', {}, el('span', { className: !u.ativo ? 'selo vermelho' : 'selo cinza', textContent: !u.ativo ? 'BLOQUEADO' : u.convite_pendente ? 'CONVITE ENVIADO' : 'ATIVO' }));
      const acesso = el('td', { textContent: fmtData(u.ultimo_acesso) });
      // v0.12: plano de assinatura e cortesia
      const a = assinaturas.get(u.id);
      const plano = el('td', {}, el('div', { className: 'nome', textContent: textoPlano(u, a) }));
      if (a && u.papel === 'usuario') {
        const cort = el('label', { className: 'nome' }); const ck = el('input', { type: 'checkbox', checked: !!a.cortesia });
        ck.setAttribute('aria-label', `Cortesia (não paga) para ${u.email}`);
        ck.addEventListener('change', async () => {
          msg($('msg-lista'), 'Salvando…');
          const { error } = await sb.rpc('admin_definir_cortesia', { p_usuario: u.id, p_cortesia: ck.checked });
          if (error) { ck.checked = !ck.checked; return msg($('msg-lista'), 'Não foi possível salvar a cortesia.', 'erro'); }
          a.cortesia = ck.checked; msg($('msg-lista'), ck.checked ? `${u.email} agora tem cortesia (não paga).` : `Cortesia de ${u.email} retirada.`, 'ok'); desenhar();
        });
        cort.append(ck, ' Cortesia'); plano.append(cort);
      }
      const acoes = el('td', { className: 'acoes' });
      acoes.append(botao('Definir senha', 'secundario', () => definirSenha(u), `Definir nova senha de ${u.email}`));
      acoes.append(botao(u.convite_pendente ? 'Reenviar convite' : 'E-mail de senha', 'secundario', () => acao({ acao: 'reenviar', usuario_id: u.id }, u.convite_pendente ? 'Convite reenviado.' : 'E-mail para redefinir a senha enviado.'), `${u.convite_pendente ? 'Reenviar convite' : 'Enviar e-mail para redefinir a senha'} de ${u.email}`));
      if (!u.eu) {
        acoes.append(botao(u.ativo ? 'Bloquear' : 'Desbloquear', 'secundario', () => acao({ acao: u.ativo ? 'bloquear' : 'desbloquear', usuario_id: u.id }, u.ativo ? 'Usuário bloqueado: não consegue mais entrar.' : 'Usuário desbloqueado.'), `${u.ativo ? 'Bloquear' : 'Desbloquear'} ${u.email}`));
        acoes.append(botao('Remover', 'perigo', () => confirmarRemocao(u), `Remover ${u.email}`));
      } else acoes.append(el('span', { className: 'nome', textContent: ' (você)' }));
      corpo.append(el('tr', {}, quem, papel, situacao, plano, acesso, acoes));
    }
  }

  // v0.12: assinaturas (plano, teste, cortesia) e a chave geral da cobrança
  let assinaturas = new Map();
  const dataBr = (iso) => new Date(iso).toLocaleDateString('pt-BR');
  const NOMES_PLANO = { mensal: 'Mensal', trimestral: 'Trimestral', anual: 'Anual' };
  function textoPlano(u, a) {
    if (u.papel !== 'usuario') return 'Não paga (equipe)';
    if (!a) return '—';
    if (a.cortesia) return 'Cortesia';
    const agora = Date.now();
    if (a.valido_ate && new Date(a.valido_ate) > agora) return `${NOMES_PLANO[a.plano] ?? 'Plano'} · ${a.status === 'cancelada' ? 'cancelado, vale' : a.status === 'atrasada' ? 'em atraso, vale' : 'até'} ${dataBr(a.valido_ate)}`;
    if (a.status === 'pendente') return `${NOMES_PLANO[a.plano] ?? ''} · aguardando pagamento`;
    if (new Date(a.teste_ate) > agora) return `Teste até ${dataBr(a.teste_ate)}`;
    return 'Sem plano';
  }
  async function carregarAssinaturas() {
    const [l, c] = await Promise.all([sb.rpc('admin_assinaturas'), sb.rpc('admin_cobranca')]);
    if (!l.error) assinaturas = new Map((l.data ?? []).map((x) => [x.usuario_id, x]));
    if (!c.error) $('cobranca-ativa').checked = !!c.data;
  }
  $('cobranca-ativa').addEventListener('change', async (e) => {
    const ligar = e.target.checked;
    msg($('msg-cobranca'), 'Salvando…');
    const { error } = await sb.rpc('admin_definir_cobranca', { p_ativa: ligar });
    if (error) { e.target.checked = !ligar; return msg($('msg-cobranca'), 'Não foi possível mudar a cobrança.', 'erro'); }
    msg($('msg-cobranca'), ligar ? 'Cobrança ligada: quem não tem plano nem teste válido não começa treinos novos.' : 'Cobrança desligada: ninguém é bloqueado.', 'ok');
    await carregarAssinaturas(); desenhar();
  });

  async function carregar(limpar = true) {
    if (limpar) msg($('msg-lista'), 'Carregando…');
    try { usuarios = (await chamar({ acao: 'listar' })).usuarios ?? []; await carregarAssinaturas().catch(() => null); if (limpar) msg($('msg-lista'), ''); desenhar(); }
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
  // Senha legível (sem 0/O, 1/l/I), gerada no navegador com crypto.getRandomValues.
  function gerarSenha() {
    const letras = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ', numeros = '23456789';
    const sorteio = (alf, n) => Array.from(crypto.getRandomValues(new Uint32Array(n)), (x) => alf[x % alf.length]).join('');
    return `Quaru-${sorteio(letras + numeros, 4)}${sorteio(numeros, 1)}-${sorteio(letras, 1)}${sorteio(letras + numeros, 4)}`;
  }
  const modo = () => document.querySelector('input[name=modo]:checked')?.value ?? 'senha';
  function atualizarModo() {
    const comSenha = modo() === 'senha';
    $('bloco-senha').hidden = !comSenha;
    $('c-enviar').textContent = comSenha ? 'Criar usuário' : 'Enviar convite';
    msg($('msg-convidar'), ''); $('dados-acesso').hidden = true;
  }
  for (const r of document.querySelectorAll('input[name=modo]')) r.addEventListener('change', atualizarModo);
  $('gerar-c-senha').addEventListener('click', () => { $('c-senha').value = gerarSenha(); $('c-senha').type = 'text'; $('ver-c-senha').textContent = 'Ocultar'; });
  $('ver-c-senha').addEventListener('click', () => { const v = $('c-senha').type === 'password'; $('c-senha').type = v ? 'text' : 'password'; $('ver-c-senha').textContent = v ? 'Ocultar' : 'Mostrar'; $('ver-c-senha').setAttribute('aria-label', v ? 'Ocultar senha' : 'Mostrar senha'); });
  $('copiar-dados').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText($('dados-texto').textContent); $('copiar-dados').textContent = 'Copiado ✓'; } catch { $('copiar-dados').textContent = 'Selecione e copie'; }
  });

  $('form-convidar').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('c-email').value.trim();
    const comSenha = modo() === 'senha';
    const senha = $('c-senha').value;
    $('dados-acesso').hidden = true;
    msg($('msg-convidar'), comSenha ? 'Criando usuário…' : 'Enviando convite…');
    try {
      if (comSenha) {
        await chamar({ acao: 'criar', email, nome: $('c-nome').value.trim(), papel: $('c-papel').value, senha, trocar: $('c-trocar').checked });
        msg($('msg-convidar'), `Usuário ${email} criado. Ele já pode entrar.`, 'ok');
        $('dados-texto').textContent = `Seu acesso ao Quaru\nEndereço: ${cfg.urlApp || location.origin + '/quaru/'}\nE-mail: ${email}\nSenha: ${senha}${$('c-trocar').checked ? '\nNo primeiro acesso, o app vai pedir para você criar a sua senha.' : ''}`;
        $('copiar-dados').textContent = 'Copiar';
        $('dados-acesso').hidden = false;
      } else {
        await chamar({ acao: 'convidar', email, nome: $('c-nome').value.trim(), papel: $('c-papel').value });
        msg($('msg-convidar'), `Convite enviado para ${email}.`, 'ok');
      }
      $('form-convidar').reset(); $('c-senha').type = 'password'; $('ver-c-senha').textContent = 'Mostrar';
      await carregar(false);
    } catch (er) { msg($('msg-convidar'), er.message, 'erro'); }
  });

  function definirSenha(u) {
    const d = $('dialogo-senha');
    $('ds-texto').textContent = `Conta: ${u.email}`;
    $('ds-campo').value = gerarSenha(); $('ds-trocar').checked = true; msg($('ds-msg'), '');
    $('ds-gerar').onclick = () => { $('ds-campo').value = gerarSenha(); };
    $('ds-ok').onclick = async (ev) => {
      ev.preventDefault();
      const senha = $('ds-campo').value;
      msg($('ds-msg'), 'Salvando…');
      try {
        await chamar({ acao: 'senha', usuario_id: u.id, senha, trocar: $('ds-trocar').checked });
        d.close();
        msg($('msg-convidar'), `Senha de ${u.email} trocada.`, 'ok');
        $('dados-texto').textContent = `Seu acesso ao Quaru\nEndereço: ${cfg.urlApp || location.origin + '/quaru/'}\nE-mail: ${u.email}\nSenha: ${senha}${$('ds-trocar').checked ? '\nNo próximo acesso, o app vai pedir para você criar a sua senha.' : ''}`;
        $('copiar-dados').textContent = 'Copiar'; $('dados-acesso').hidden = false;
        $('dados-acesso').scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (er) { msg($('ds-msg'), er.message, 'erro'); }
    };
    d.showModal();
  }

  $('busca').addEventListener('input', desenhar);
  $('sair').addEventListener('click', async () => { await sb.auth.signOut(); usuarios = []; $('linhas').replaceChildren(); mostrar('tela-entrar'); });

  atualizarModo();
  iniciar();
}
