"""Telas v2 (celular + web, claro/escuro, estados) e login v2. HTML/CSS reais para o Rodrigo: abas e botões são <button>.
Cores = tokens.ts (paleta v0.3) via variáveis CSS com os MESMOS nomes de token do código (--cor-<token>)."""
import shutil
from base import *
from ilustracoes import ilustracao
LO = "/home/box/redbox/clientes/domma-tecnologia/app-treinos/identidade/logo-oficial-quaru"
DOM = "/home/box/redbox/clientes/domma-tecnologia/logo/final-sinal"
GG = os.path.join(RAIZ, "login/recursos/google-g_oficial.svg")
def tok_css():
    def b(t): return ";".join(f"--cor-{k}:{v}" for k, v in TEMAS[t].items())
    ex = ";".join(f"--cor-{k}:{v}" for k, v in EXTRA.items())
    return f":root{{{b('claro')};{ex}}}[data-tema=escuro]{{{b('escuro')}}}"
CSS = """/* Quaru v0.4.1 · v2 · cores = app/mobile/src/tema/tokens.ts (paleta v0.3). Fonte Inter (OFL). */
*{box-sizing:border-box;margin:0}
html{font-size:16px}
body{font-family:Inter,system-ui,sans-serif;background:var(--cor-fundo);color:var(--cor-texto);font-size:1rem;line-height:1.5}
button{font:inherit;color:inherit;background:none;border:0;cursor:pointer}
button:focus-visible,a:focus-visible{outline:3px solid var(--cor-foco);outline-offset:2px}
.palco{min-height:100vh;background:radial-gradient(circle at 12% 18%,var(--cor-primaria-suave) 0 180px,transparent 181px),radial-gradient(circle at 88% 78%,var(--cor-secundaria-suave) 0 220px,transparent 221px),var(--cor-fundo)}
.col{max-width:480px;margin:0 auto;min-height:100vh;display:flex;flex-direction:column;background:var(--cor-fundo);position:relative}
.topo{display:flex;align-items:center;gap:12px;padding:12px 16px}
.topo .simb{width:36px;height:36px} .topo .ola{font-weight:800;font-size:1.25rem;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.selo-sim{font-size:.75rem;font-weight:800;letter-spacing:.06em;background:var(--cor-energia);color:var(--cor-sobre-energia);border:1.5px solid var(--cor-texto);padding:3px 8px;border-radius:999px;white-space:nowrap}
.icobtn{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;color:var(--cor-texto)}
main{flex:1;padding:4px 16px 104px;display:flex;flex-direction:column;gap:16px}
h1{font-size:1.75rem;line-height:1.2;font-weight:800;letter-spacing:-.01em} h2{font-size:1.25rem;line-height:1.3;font-weight:700} h3{font-size:1.0625rem;font-weight:700}
.t2{color:var(--cor-texto-suave)} .peq{font-size:.875rem;line-height:1.45}
.card{background:var(--cor-superficie);border:1px solid var(--cor-borda);border-radius:20px;padding:16px;display:flex;flex-direction:column;gap:10px;box-shadow:0 4px 12px rgba(20,20,26,.08)}
.hero{border-radius:24px;overflow:hidden;background:var(--cor-superficie);border:1px solid var(--cor-borda);box-shadow:0 12px 32px rgba(200,30,54,.18)}
.hero .faixa{background:linear-gradient(135deg,var(--cor-marca),var(--cor-marca-escuro));color:#fff;padding:16px 16px 20px;display:flex;flex-direction:column;gap:8px}
.hero .faixa h1,.hero .faixa h2{color:#fff} .hero .faixa p{color:#fff}
.hero .cena{background:var(--cor-primaria-suave);padding:8px 16px 0} .hero .cena svg{display:block;width:100%;height:auto;max-height:200px}
.hero .acao{padding:16px;display:flex;flex-direction:column;gap:8px}
.selo{align-self:flex-start;display:inline-flex;align-items:center;gap:6px;font-size:.75rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;background:var(--cor-energia);color:var(--cor-sobre-energia);border:1.5px solid var(--cor-texto);border-radius:999px;padding:4px 10px}
.hero .selo{border-color:#fff}
.selo-p{align-self:flex-start;font-size:.8125rem;font-weight:700;background:var(--cor-primaria-suave);color:var(--cor-primaria-texto);border-radius:999px;padding:4px 10px}
.selo-s{align-self:flex-start;font-size:.8125rem;font-weight:700;background:var(--cor-secundaria-suave);color:var(--cor-texto);border-radius:999px;padding:4px 10px}
.btn{min-height:52px;border-radius:14px;background:var(--cor-primaria);color:var(--cor-sobre-primaria);font-weight:700;font-size:1rem;display:flex;align-items:center;justify-content:center;gap:8px;padding:12px 20px;width:100%;box-shadow:0 6px 14px rgba(200,30,54,.25);transition:transform .12s}
.btn:active{transform:scale(.97)}
.btn-branco{background:#fff;color:#A3172C;box-shadow:none}
.btn2{min-height:52px;border-radius:14px;border:2px solid var(--cor-primaria);color:var(--cor-primaria-texto);font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px;padding:10px 20px;width:100%}
.btn-sec{min-height:52px;border-radius:14px;background:var(--cor-secundaria);color:var(--cor-sobre-secundaria);font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px;padding:10px 16px;flex:1}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chip{min-height:44px;display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:999px;border:1.5px solid var(--cor-texto-suave);color:var(--cor-texto);font-weight:600;background:var(--cor-superficie)}
.chip[aria-pressed=true]{background:var(--cor-primaria);border-color:var(--cor-primaria);color:var(--cor-sobre-primaria)}
.linha{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:56px;width:100%;text-align:left}
.aviso{display:flex;gap:12px;align-items:flex-start;background:var(--cor-superficie);border:1px solid var(--cor-borda);border-left:6px solid var(--cor-secundaria);border-radius:16px;padding:12px 16px;font-size:1rem;line-height:1.5;color:var(--cor-texto)}
.aviso svg{flex:none;color:var(--cor-secundaria);margin-top:2px} .aviso.erro{border-left-color:var(--cor-erro)} .aviso.erro svg{color:var(--cor-erro)}
.aviso.fixo{position:sticky;bottom:96px}
.abas{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;display:flex;background:var(--cor-superficie);border-top:1px solid var(--cor-borda);padding:6px 6px 10px;z-index:5}
.aba{flex:1;min-height:56px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;color:var(--cor-texto-suave);font-size:.75rem;font-weight:600;border-radius:14px}
.aba[aria-current=page]{color:var(--cor-primaria-texto);font-weight:800;background:var(--cor-primaria-suave)}
.num{font-size:2.5rem;font-weight:800;font-variant-numeric:tabular-nums;line-height:1.05;letter-spacing:-.02em}
.grade3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px} .tile{background:var(--cor-superficie-2);border-radius:16px;padding:12px;display:flex;flex-direction:column;gap:2px}
.tile b{font-size:1.25rem}
.trilho{height:16px;border-radius:999px;background:var(--cor-superficie-2);border:1.5px solid var(--cor-texto-suave);overflow:hidden} .trilho i{display:block;height:100%;background:var(--cor-secundaria);border-radius:999px}
.anel{position:relative;width:200px;height:200px;margin:0 auto} .anel .num{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:2.25rem}
.esq{background:var(--cor-superficie-2);border-radius:12px;height:16px} .esq.g{height:120px;border-radius:20px}
.seg{display:flex;background:var(--cor-superficie-2);border-radius:14px;padding:4px;gap:4px} .seg button{flex:1;min-height:44px;border-radius:10px;font-weight:700;color:var(--cor-texto-suave)} .seg button[aria-selected=true]{background:var(--cor-superficie);color:var(--cor-texto);box-shadow:0 1px 2px rgba(0,0,0,.12)}
.rolo{display:flex;gap:12px;overflow:hidden} .rolo>.card{flex:1;min-width:0}
.ilu svg{display:block;width:100%;height:auto}
.modal-fundo{position:fixed;inset:0;background:rgba(10,5,7,.62);display:flex;align-items:flex-end;justify-content:center;z-index:9}
.modal{width:100%;max-width:480px;background:var(--cor-superficie);border-radius:28px 28px 0 0;padding:16px 16px 28px;display:flex;flex-direction:column;gap:12px}
.domma{display:flex;align-items:center;justify-content:center;gap:10px;color:var(--cor-texto-suave);font-size:.875rem} .domma img{width:136px;height:auto}
.link{color:var(--cor-primaria-texto);font-weight:700;text-decoration:underline;text-underline-offset:3px;min-height:44px;display:inline-flex;align-items:center}
.avatar{width:96px;height:96px;border-radius:50%;background:var(--cor-primaria-suave);border:3px solid var(--cor-primaria);overflow:hidden;align-self:center}
.chave{width:52px;height:32px;border-radius:999px;background:var(--cor-primaria);position:relative;flex:none} .chave:after{content:"";position:absolute;right:4px;top:4px;width:24px;height:24px;border-radius:50%;background:var(--cor-sobre-primaria)}
.chave.off{background:var(--cor-superficie-2);border:1.5px solid var(--cor-texto-suave)} .chave.off:after{left:4px;right:auto;top:2.5px;background:var(--cor-texto-suave)}
"""
IC = {"inicio": '<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>', "treinos": '<path d="M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12"/>',
      "alimentacao": '<path d="M7 3v8a2 2 0 002 2v8M7 3v5M10 3v5M4 3v5a3 3 0 003 3M17 3c-2 2-2 6 0 8v10"/>', "agua": '<path d="M12 3c4 5 6 8 6 11a6 6 0 01-12 0c0-3 2-6 6-11z"/>',
      "perfil": '<circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6"/>', "seta": '<path d="M9 5l7 7-7 7"/>', "alerta": '<path d="M12 3l9 17H3z"/><path d="M12 10v4M12 17v.5"/>',
      "info": '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>', "mais": '<path d="M12 5v14M5 12h14"/>', "sino": '<path d="M6 17V11a6 6 0 0112 0v6l2 2H4z"/><path d="M10 21h4"/>',
      "fogo": '<path d="M12 3c1 4 5 5 5 10a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"/>', "raio": '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>', "relogio": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
      "check": '<path d="M5 12l5 5 9-10"/>', "trofeu": '<path d="M8 4h8v5a4 4 0 01-8 0zM8 6H4a3 3 0 003 4M16 6h4a3 3 0 01-3 4M12 13v4M8 21h8M9 17h6"/>', "olho": '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
      "atualizar": '<path d="M20 12a8 8 0 11-3-6.3M20 4v5h-5"/>', "camera": '<rect x="3" y="7" width="18" height="13" rx="3"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8.5 7l1.5-3h4l1.5 3"/>'}
def ic(n, t=24): return f'<svg viewBox="0 0 24 24" width="{t}" height="{t}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">{IC[n]}</svg>'
SIM = '<span class="selo-sim" title="Dados de exemplo">SIMULAÇÃO</span>'
ABAS = [("inicio", "Início"), ("treinos", "Treinos"), ("alimentacao", "Alimentação"), ("agua", "Água"), ("perfil", "Perfil")]
def abas(on): return '<nav class="abas" aria-label="Navegação principal">' + "".join(f'<button class="aba" type="button"{" aria-current=page" if k == on else ""}>{ic(k)}<span>{l}</span></button>' for k, l in ABAS) + "</nav>"
def aviso(txt, tipo="info", icone="info", fixo=False): return f'<div class="aviso {tipo}{" fixo" if fixo else ""}" role="{"alert" if tipo == "erro" else "note"}">{ic(icone)}<p>{txt}</p></div>'
AV_IMC = "O IMC é só uma referência geral: não considera massa muscular, idade nem sexo. Para avaliar sua saúde, converse com um profissional de saúde."
AV_AGUA = "Meta de exemplo. A quantidade de água ideal varia de pessoa para pessoa; siga a orientação de um profissional de saúde."
AV_NUTRI = "Ideias gerais, não são um plano alimentar. Para uma dieta adequada a você, procure um nutricionista."
AV_TREINO = "Sugestões gerais. Se sentir dor, pare e procure um profissional de educação física."
def avatar():
    return (f'<div class="avatar"><svg viewBox="0 0 96 96" role="img" aria-label="Avatar escolhido: busto sem rosto">{estilo_vars()}<g aria-hidden="true">'
            f'<path d="M14 96c4-22 18-32 34-32s30 10 34 32z" fill="{V("secundaria")}"/><circle cx="48" cy="40" r="20" fill="{PELE[2]}"/>'
            f'<path d="M27 40a21 21 0 0 1 42 0c-8-6-26-8-42 0z" fill="{CABELO[0]}"/></g></svg></div>')

# --------- conteúdo das telas ---------
def t_inicio():
    return ("Olá!", "inicio", f'''<section class="hero" aria-labelledby="h-ca"><div class="faixa"><span class="selo">{ic("raio",14)} Comece aqui</span>
<h1 id="h-ca">Seu treino sob medida em 2 minutos</h1><p>Responda 11 perguntas rápidas sobre objetivo, rotina e preferências.</p></div>
<div class="cena">{ilustracao("objetivo", "h-ilu")}</div><div class="acao"><button class="btn" type="button">Começar o tour {ic("seta",20)}</button></div></section>
<div class="card" style="flex-direction:row;align-items:center;gap:12px"><span style="color:var(--cor-primaria-texto)">{ic("fogo",32)}</span><div style="flex:1"><h3>Sequência de 3 dias</h3><p class="t2 peq">Dado de exemplo. Treine hoje para chegar a 4.</p></div><span class="selo-p">+1 hoje</span></div>
<h2>Hoje</h2><div class="card"><span class="selo-s">Treino A · exemplo</span><h3>Peito e tríceps</h3><p class="t2">6 exercícios · 45 min</p><button class="btn" type="button">Iniciar treino</button></div>''')
def t_treinos():
    ch = [("Todos", 0), ("Peito", 1), ("Costas", 0), ("Ombros", 0), ("Braços", 0), ("Abdômen", 0), ("Pernas", 0), ("Glúteos", 0)]
    return ("Treinos", "treinos", f'''<h1>Escolha o foco de hoje</h1><div class="chips" role="group" aria-label="Filtrar por área do corpo">{"".join(f'<button class="chip" type="button" aria-pressed="{"true" if a else "false"}">{n}</button>' for n, a in ch)}</div>
<div class="card"><p class="t2 peq">Frente e costas · área trabalhada em destaque</p><div class="ilu">{mapa(("peito","triceps","ombros"), idd="mapa-t")}</div></div>
<div class="card"><div style="display:flex;gap:8px"><span class="selo">{ic("raio",14)} Popular</span><span class="selo-s">Iniciante</span></div><h2>Peito e tríceps</h2><p class="t2">6 exercícios · 45 min · halteres e banco (exemplo)</p><button class="btn" type="button">Adicionar ao meu plano</button></div>
{aviso(AV_TREINO)}''')
def t_alim():
    dietas = [("Equilibrada", "preferencia-alimentar"), ("Vegetariana", "preferencia-alimentar")]
    return ("Alimentação", "alimentacao", f'''<h1>Comer bem, sem complicar</h1><div class="seg" role="tablist"><button role="tab" aria-selected="true" type="button">Dietas</button><button role="tab" aria-selected="false" type="button">Ideias de refeição</button></div>
<div class="rolo">{"".join(f'<div class="card"><div class="ilu" style="background:var(--cor-primaria-suave);border-radius:14px">{ilustracao(i, "d"+str(n))}</div><h3>{t}</h3><p class="t2 peq">Ideias gerais (exemplo)</p></div>' for n, (t, i) in enumerate(dietas))}</div>
<h2>Ideias de refeição</h2>{"".join(f'<button class="card linha" type="button"><div><h3>{a}</h3><p class="t2 peq">{b}</p></div>{ic("seta")}</button>' for a, b in [("Café da manhã", "Ovos mexidos, pão integral e uma fruta"), ("Almoço", "Arroz, feijão, frango grelhado e salada"), ("Lanche", "Iogurte natural com aveia")])}
{aviso(AV_NUTRI, fixo=True)}''')
def t_agua():
    import math as m
    r, p = 84, 0.625; L = 2*m.pi*r
    anel = f'<svg viewBox="0 0 200 200" width="200" height="200" aria-hidden="true"><circle cx="100" cy="100" r="{r}" fill="none" stroke="var(--cor-superficie-2)" stroke-width="18"/><circle cx="100" cy="100" r="{r}" fill="none" stroke="var(--cor-texto-suave)" stroke-width="1.5" stroke-dasharray="none" opacity="0"/><circle cx="100" cy="100" r="{r}" fill="none" stroke="var(--cor-secundaria)" stroke-width="18" stroke-linecap="round" stroke-dasharray="{L*p:.1f} {L:.1f}" transform="rotate(-90 100 100)"/></svg>'
    return ("Água", "agua", f'''<section class="hero"><div class="faixa" style="flex-direction:row;align-items:center"><div style="flex:1"><span class="selo">{ic("agua",14)} Faltam 750 ml</span><h2 style="margin-top:8px">Bora bater a meta!</h2></div></div>
<div class="acao"><div class="anel" role="img" aria-label="1,25 litro de 2 litros, meta de exemplo">{anel}<div class="num">1,25 L<span class="t2 peq" style="font-weight:600">de 2 L (exemplo)</span></div></div>
<div class="trilho" role="progressbar" aria-valuenow="62" aria-valuemin="0" aria-valuemax="100" aria-label="Progresso da meta"><i style="width:62.5%"></i></div>
<div style="display:flex;gap:8px"><button class="btn-sec" type="button">{ic("mais",20)} 250 ml</button><button class="btn-sec" type="button">{ic("mais",20)} 500 ml</button></div></div></section>
{aviso(AV_AGUA)}<h2>Hoje</h2><div class="card">{"".join(f'<div class="linha" style="min-height:44px"><span>{h}</span><span class="t2">{q}</span></div>' for h, q in [("08:10", "250 ml"), ("10:30", "500 ml"), ("13:00", "250 ml"), ("15:40", "250 ml")])}</div>''')
def t_perfil():
    return ("Perfil", "perfil", f'''<div class="card" style="align-items:center;text-align:center">{avatar()}<h2>Nome Sobrenome</h2><span class="selo-p">Exemplo</span><button class="btn2" type="button" style="width:auto">{ic("camera",20)} Trocar avatar</button></div>
<div class="grade3"><div class="tile"><span class="t2 peq">Altura</span><b>1,70 m</b></div><div class="tile"><span class="t2 peq">Peso</span><b>70,0 kg</b></div><div class="tile"><span class="t2 peq">IMC</span><b>24,2</b></div></div>
<p class="t2 peq">Valores de exemplo.</p>{aviso(AV_IMC)}
<div class="card"><button class="linha" type="button" role="switch" aria-checked="true"><span>Lembrete de treino</span><span class="chave" aria-hidden="true"></span></button><button class="linha" type="button" role="switch" aria-checked="false"><span>Lembrete de água</span><span class="chave off" aria-hidden="true"></span></button>
<button class="linha" type="button"><span>Sobre o app</span>{ic("seta")}</button></div>''')
def t_sobre(tema):
    logo = "quaru_colorida_fundo_escuro.svg" if tema == "escuro" else "quaru_colorida.svg"
    dom = "domma_sinal_fundo-escuro.svg" if tema == "escuro" else "domma_sinal_fundo-claro.svg"
    return ("Sobre o app", "perfil", f'''<div class="hero"><div class="cena" style="padding:24px 16px;display:flex;justify-content:center"><img src="recursos/{logo}" alt="{MARCA["nome"]}" style="width:240px"></div>
<div class="acao" style="align-items:center;text-align:center"><span class="selo-s">Versão {MARCA["versao"]}</span><p class="t2">Treinos, água e alimentação no mesmo lugar.</p></div></div>
<div class="card" style="align-items:center;text-align:center;gap:12px"><p class="t2 peq">Desenvolvido por</p><img src="recursos/{dom}" alt="{MARCA["empresa"]}" style="width:180px"></div>
<div class="card" style="gap:0">{"".join(f'<button class="linha" type="button"><span>{x}</span>{ic("seta")}</button>' for x in ["Termos de uso", "Política de Privacidade", "Licenças de terceiros"])}</div>''')
TELAS = {"01-inicio": lambda t: t_inicio(), "02-treinos": lambda t: t_treinos(), "03-alimentacao": lambda t: t_alim(), "04-agua": lambda t: t_agua(),
         "05-perfil": lambda t: t_perfil(), "06-sobre": t_sobre, "07-nova-versao": lambda t: t_inicio()}
MODAL = lambda: f'''<div class="modal-fundo"><div class="modal" style="position:relative" role="dialog" aria-modal="true" aria-labelledby="nv"><div class="ilu" style="background:var(--cor-primaria-suave);border-radius:20px">{ilustracao("lembretes", "nv-ilu")}</div>
<div style="display:flex;justify-content:space-between;align-items:center"><span class="selo">{ic("raio",14)} Novo</span>{SIM}</div><h2 id="nv">Nova versão disponível</h2><p class="t2">Há uma nova versão do {MARCA["nome"]}. Atualize para receber as últimas melhorias e correções.</p>
<button class="btn" type="button">{ic("atualizar",20)} Atualizar agora</button><button class="btn2" type="button">Depois</button></div></div>'''
VAZIO = {"01-inicio": ("objetivo", "Seu plano começa aqui", "Faça o tour para receber treinos sob medida.", "Começar o tour", ""),
 "02-treinos": ("areas-do-corpo", "Nenhum treino nesta área", "Escolha outra área ou faça o tour para receber sugestões.", "Ver todas as áreas", AV_TREINO),
 "03-alimentacao": ("preferencia-alimentar", "Sem ideias de refeição ainda", "Conte sua preferência alimentar no tour.", "Informar preferência", AV_NUTRI),
 "04-agua": ("lembretes", "Nenhum copo registrado hoje", "Toque em + 250 ml sempre que beber água.", "+ 250 ml", AV_AGUA),
 "05-perfil": ("altura-e-peso", "Complete seu perfil", "Informe altura e peso para ver o IMC.", "Informar altura e peso", AV_IMC),
 "06-sobre": ("objetivo", "Informações indisponíveis", "Tente abrir esta tela de novo.", "Tentar de novo", ""),
 "07-nova-versao": ("lembretes", "Você está na versão mais recente", "Avisaremos quando houver atualização.", "Voltar ao início", "")}
SPIN = '<svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="16" fill="none" stroke="var(--cor-superficie-2)" stroke-width="5"/><path d="M20 4a16 16 0 0 1 16 16" fill="none" stroke="var(--cor-primaria)" stroke-width="5" stroke-linecap="round"/></svg>'
def pagina(corpo_html, tema, titulo, extra="", com_abas=None, topo=True):
    simb = "recursos/quaru_simbolo.svg"
    top = f'<header class="topo"><img class="simb" src="{simb}" alt="{MARCA["nome"]}"><span class="ola">{titulo}</span>{SIM}<button class="icobtn" type="button" aria-label="Notificações">{ic("sino")}</button></header>' if topo else ""
    return (f'<!doctype html><html lang="pt-BR" data-tema="{tema}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            f'<title>{MARCA["nome"]} · {titulo}</title><link rel="stylesheet" href="quaru-v2.css"></head><body><div class="palco"><div class="col">{top}<main>{corpo_html}</main>'
            f'{abas(com_abas) if com_abas else ""}</div></div>{extra}</body></html>')
def tela(id_, tema, estado="preenchido"):
    tit, aba, corpo = TELAS[id_](tema)
    if estado != "preenchido":
        v = VAZIO[id_]; av = aviso(v[4]) if v[4] else ""
        if estado == "vazio":
            corpo = f'<div class="hero"><div class="cena">{ilustracao(v[0], "vz")}</div><div class="acao" style="text-align:center;align-items:center"><h2>{v[1]}</h2><p class="t2">{v[2]}</p><button class="btn" type="button">{v[3]}</button></div></div>' + av
        elif estado == "carregando":
            corpo = f'<div style="display:flex;align-items:center;gap:12px" role="status">{SPIN}<p class="t2">Carregando…</p></div><div class="esq g"></div><div class="esq" style="width:70%"></div><div class="esq"></div><div class="esq g"></div>' + av
        else:
            corpo = aviso("<b>Não foi possível carregar.</b><br>Confira sua conexão e tente de novo. Seus dados salvos no aparelho não foram perdidos.", "erro", "alerta") + '<button class="btn" type="button">Tentar de novo</button>' + av
    return pagina(corpo, tema, tit, MODAL() if id_ == "07-nova-versao" and estado == "preenchido" else "", aba)

# --------- login v2 ---------
CSS_LOGIN = """@font-face{font-family:'Google Sans';font-weight:500;src:url(recursos/GoogleSans-Medium.ttf)}
.login-hero{background:linear-gradient(160deg,var(--cor-marca),var(--cor-marca-escuro));color:#fff;border-radius:0 0 32px 32px;padding:8px 16px 36px;display:flex;flex-direction:column;align-items:center;gap:4px;position:relative;overflow:hidden}
.login-hero .top{align-self:stretch;display:flex;justify-content:flex-end}
.login-hero img.logo{width:176px}
.login-hero .slogan{color:#fff;font-size:1.125rem;line-height:1.35;font-weight:600;letter-spacing:.005em;text-align:center;max-width:15em;margin-top:0}
.login-hero .gente{position:absolute;top:40px;width:100%;left:0;display:flex;justify-content:space-between;pointer-events:none}
.login-hero .gente svg{width:76px;height:96px}
.form{margin:-24px 16px 0;position:relative;background:var(--cor-superficie);border:1px solid var(--cor-borda);border-radius:24px;padding:16px;display:flex;flex-direction:column;gap:10px;box-shadow:0 12px 32px rgba(20,20,26,.14)}
.campo{display:flex;flex-direction:column;gap:4px} .campo label{font-weight:700}
.inp{min-height:48px;width:100%;border:1.5px solid var(--cor-texto-suave);border-radius:14px;background:var(--cor-superficie);padding:12px 16px;color:var(--cor-texto);font:inherit;font-size:1rem}
.inp::placeholder{color:var(--cor-texto-suave);opacity:1} .inp:focus{outline:3px solid var(--cor-foco);outline-offset:1px}
.senha{position:relative} .senha .inp{padding-right:52px} .senha .icobtn{position:absolute;right:2px;top:50%;transform:translateY(-50%)}
button[disabled],button[aria-disabled=true]{opacity:.45;cursor:not-allowed;box-shadow:none}
.inp .ph{color:var(--cor-texto-suave)} .inp.err{border:2px solid var(--cor-erro)}
.ajuda-err{color:var(--cor-erro);font-size:.875rem;font-weight:600;display:flex;gap:6px;align-items:center}
.dir{display:flex;justify-content:flex-end;margin:-8px 0 -4px}
.ou{display:flex;align-items:center;gap:12px;color:var(--cor-texto-suave);font-size:.875rem} .ou:before,.ou:after{content:"";flex:1;height:1px;background:var(--cor-borda)}
.galvo{min-height:44px;display:flex;align-items:center}
[data-tema=claro] .gbtn{background:#FFFFFF;border:1px solid #747775;color:#1F1F1F}  /* estilo Light oficial do Google no tema claro; Neutral no escuro */
.gbtn{min-height:44px;border-radius:4px;background:#F2F2F2;border:0;display:flex;align-items:center;padding:0 12px;gap:10px;font:500 14px/20px 'Google Sans',sans-serif;color:#1F1F1F;width:100%;justify-content:center}
.gbtn svg{width:20px;height:20px;flex:none}
.rod{padding:12px 16px 16px;display:flex;flex-direction:column;gap:4px;align-items:center;text-align:center}
.legais{display:flex;gap:20px;justify-content:center}
.giro{width:20px;height:20px;border-radius:50%;border:3px solid currentColor;border-right-color:transparent;opacity:.9}
"""
def login(tema, estado):
    gg = open(GG).read().replace("<svg ", '<svg aria-hidden="true" focusable="false" ', 1)
    car = estado == "carregando"; em = estado != "normal"
    vv = ' value="voce@exemplo.com"' if em else ""; vs = ' value="senhaexemplo"' if em else ""
    dis = " disabled" if car else ""
    email = f'<input class="inp" id="email" name="email" type="email" autocomplete="email" inputmode="email" placeholder="voce@exemplo.com" required{vv}{dis}>'
    senha = (f'<div class="senha"><input class="inp" id="senha" name="senha" type="password" autocomplete="current-password" placeholder="Sua senha" required{vs}{dis}>'
             f'<button class="icobtn" type="button" aria-label="Mostrar senha" aria-controls="senha"{dis}>{ic("olho",22)}</button></div>')
    err = aviso("<b>E-mail ou senha incorretos.</b><br>Confira os dados e tente de novo.", "erro", "alerta") if estado == "erro" else ""
    entrar = ('<button class="btn" type="submit" aria-busy="true" disabled><span class="giro" aria-hidden="true"></span>Entrando…</button>' if car else '<button class="btn" type="submit">Entrar</button>')
    dom = "domma_sinal_fundo-escuro.svg" if tema == "escuro" else "domma_sinal_fundo-claro.svg"
    def fig(n, pose, pele, cab, roupa, coque=False):
        return svg_doc((120, 150), "", pessoa(60, 146, 0.9, pose, pele, cab, roupa, calca="texto", coque=coque), n).replace(f'role="img" aria-labelledby="{n}-t"', 'aria-hidden="true"').replace(f'<title id="{n}-t"></title>', "")
    corpo = (f'<div class="login-hero"><div class="top">{SIM}</div><img class="logo" src="recursos/quaru_branca.svg" alt="{MARCA["nome"]}"><p class="slogan">{MARCA["slogan"]}</p>'
             f'<div class="gente">{fig("p1", "vitoria", 2, 0, "secundaria")}{fig("p2", "pular", 4, 3, "energia", True)}</div><div style="height:40px"></div></div>'
             f'<form class="form" aria-label="Entrar no {MARCA["nome"]}" novalidate onsubmit="return false">{err}'
             f'<div class="campo"><label for="email">E-mail</label>{email}</div><div class="campo"><label for="senha">Senha</label>{senha}</div>'
             f'<div class="dir"><a class="link" href="#">Esqueci minha senha</a></div>{entrar}<button class="btn2" type="button"{dis}>Criar conta</button>'
             f'<div class="ou">ou</div><div class="galvo"><button class="gbtn" type="button"{dis}>{gg}<span>Entrar com Google</span></button></div></form>'
             f'<div class="rod"><p class="t2 peq">Ao continuar, você concorda com os termos abaixo.</p><div class="legais"><a class="link" href="#">Termos de uso</a><a class="link" href="#">Política de Privacidade</a></div>'
             f'<div class="domma"><span>Desenvolvido por</span><img src="recursos/{dom}" alt="{MARCA["empresa"]}"></div></div>')
    return (f'<!doctype html><html lang="pt-BR" data-tema="{tema}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{MARCA["nome"]} · Entrar</title>'
            f'<link rel="stylesheet" href="quaru-v2.css"><link rel="stylesheet" href="login-v2.css"></head><body><div class="palco"><div class="col">{corpo}</div></div></body></html>')

def copiar_recursos(dest):
    os.makedirs(dest, exist_ok=True)
    for f in ["quaru_colorida.svg", "quaru_colorida_fundo_escuro.svg", "quaru_branca.svg", "quaru_simbolo.svg"]: shutil.copy(os.path.join(LO, f), dest)
    for f in ["domma_sinal_fundo-claro.svg", "domma_sinal_fundo-escuro.svg"]: shutil.copy(os.path.join(DOM, f), dest)
