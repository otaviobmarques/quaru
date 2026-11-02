#!/usr/bin/env python3
"""Quaru · proposta v3.2 = v3.1 aprovada + título do topo sem corte, fundo claro #F2A0B0 (decisão do Otávio; escuro-alt descartado), faixa EXEMPLO no QR, selo SIMULAÇÃO com contexto para leitor de tela.
Histórico: v3.1 (v3 rosa + ajustes do Otávio/Rodrigo: login local ADR-0009/0017, foco 3:1, escuro 3:1, coluna direita, OFL, tons -sobre-fundo, fotos aprovadas).
Baseada na v3 ("rosa marcante"). Fundo ROSA no app inteiro; só os blocos de conteúdo em branco (no tema escuro, em superfície escura).
Base: paleta v0.3 (lidas de app/mobile/src/tema/tokens.ts, sem alterar o arquivo) + overrides v3 listados em V3_TOKENS.
Ilustrações: v2.1 (ilustracoes.py) e ícones de equipamento da 0.4.3-r1. Sem fotos (nenhuma marcada como aprovada). Uso: python3 gerador/gerar_v3.2.py"""
import os, sys, json, shutil, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from telas import *
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont
OUT = RAIZ  # telas-v3/
R1 = "/home/box/redbox/clientes/domma-tecnologia/app-treinos/imagens-v0.4.3/ilustracoes-r1/equipamentos/svg"
FONTE_TIT = "/usr/share/fonts/truetype/sand-box/google/Bricolage Grotesque/BricolageGrotesque-VariableFont_opsz,wdth,wght.ttf"
H = f"{OUT}/html"; os.makedirs(f"{H}/recursos", exist_ok=True)
for d in ("celular", "computador", "validacao", "foco", "alternativa"): os.makedirs(f"{OUT}/png/{d}", exist_ok=True)
copiar_recursos(f"{H}/recursos"); shutil.copy(FONTE_TIT, f"{H}/recursos/BricolageGrotesque.ttf"); shutil.copy("/tmp/ofl/OFL.txt", f"{H}/recursos/BricolageGrotesque_OFL.txt")
FOTOS = "/home/box/redbox/clientes/domma-tecnologia/app-treinos/imagens-v0.4.3/fotos"; os.makedirs(f"{H}/recursos/fotos", exist_ok=True)
for f in ["GoogleSans-Medium.ttf", "GoogleSans_OFL.txt"]: shutil.copy(os.path.join("/home/box/redbox/clientes/domma-tecnologia/app-treinos/telas-v0.4.1/login/recursos", f), f"{H}/recursos/")

# ---------- tokens v3: o que muda em relação ao tokens.ts v0.3 ----------
SIM = '<span class="selo-sim"><span aria-hidden="true">SIMULAÇÃO</span><span class="sr">Simulação: dados de exemplo</span></span>'
ALT_ROSA = "#FF7A93"  # comparação: rosa da v3.1 (substituído pelo #F2A0B0)
V3_TOKENS = {  # token: {tema: (antigo tokens.ts, novo v3.1, motivo)}
 "fundo": {"claro": (TEMAS["claro"]["fundo"], "#F2A0B0", "rosa da marca no app inteiro; v3.2: #FF7A93 → #F2A0B0 (decisão do Otávio)"),
           "escuro": (TEMAS["escuro"]["fundo"], "#B03A56", "rosa escuro: v3 usava #5A1426, onde blocos e contorno davam 1,21 e 1,49; agora ≥ 3:1")},
 "borda": {"claro": (TEMAS["claro"]["borda"], "#14141A", "contorno de tinta dos blocos"),
           "escuro": (TEMAS["escuro"]["borda"], "#1A0E12", "contorno dos blocos (3,21:1 sobre o rosa escuro)")},
 "superficie": {"escuro": (TEMAS["escuro"]["superficie"], "#1A0E12", "bloco no escuro: #2A1C21 dava 2,79 sobre o rosa; #1A0E12 dá 3,21 (é o fundo escuro do tokens.ts, já testado com todos os textos)")},
 "foco": {"claro": (TEMAS["claro"]["foco"], "#0F2E4D", "#346EA1 dava 2,17 sobre o rosa; #0F2E4D dá 6.87 no rosa e 13.83 no bloco"),
          "escuro": (TEMAS["escuro"]["foco"], "#FFFFFF", "branco: 5.86 no rosa escuro e 18.83 no bloco")},
}
NOVOS = {  # tokens novos v3.1 (não existem no tokens.ts)
 "texto-sobre-fundo": {"claro": "#14141A", "escuro": "#FFFFFF"},
 "texto-suave-sobre-fundo": {"claro": "#3D1520", "escuro": "#FFF0F3"},
 "primaria-sobre-fundo": {"claro": "#8A1226", "escuro": "#FFD6DE"},
 "primaria-texto-sobre-fundo": {"claro": "#5C0A18", "escuro": "#FFE3E9"},
 "tinta": {"claro": "#14141A", "escuro": "#1A0E12"},
 "acao-sobre-fundo": {"claro": "#14141A", "escuro": "#1A0E12"},
 "sobre-acao-sobre-fundo": {"claro": "#FFFFFF", "escuro": "#FFFFFF"},
 "foco-sobre-fundo": {"claro": "#0F2E4D", "escuro": "#FFFFFF"},
}
USO = {"texto-sobre-fundo": ("fundo", 4.5, "texto"), "texto-suave-sobre-fundo": ("fundo", 4.5, "texto"), "primaria-sobre-fundo": ("fundo", 3.0, "componente (barra, ícone, contorno)"),
       "primaria-texto-sobre-fundo": ("fundo", 4.5, "texto/link de destaque"), "tinta": ("fundo", 3.0, "contorno dos blocos"), "acao-sobre-fundo": ("fundo", 3.0, "botão/chip ativo no rosa"),
       "sobre-acao-sobre-fundo": ("acao-sobre-fundo", 4.5, "texto do botão no rosa"), "foco-sobre-fundo": ("fundo", 3.0, "anel de foco")}
T3 = {t: dict(TEMAS[t]) for t in TEMAS}
TEMAS_ORIG = {t: dict(TEMAS[t]) for t in TEMAS}
for k, v in V3_TOKENS.items():
    for t, (a, n, m) in v.items(): T3[t][k] = n
for k, v in NOVOS.items():
    for t, n in v.items(): T3[t][k] = n

def tok_css3():
    def b(t): return ";".join(f"--cor-{k}:{v}" for k, v in T3[t].items()) + f";--cor-texto-bloco:{T3[t]['texto']};--cor-texto-suave-bloco:{T3[t]['texto-suave']};--cor-primaria-texto-bloco:{T3[t]['primaria-texto']};--cor-primaria-bloco:{T3[t]['primaria']}"
    ex = ";".join(f"--cor-{k}:{v}" for k, v in EXTRA.items())
    return f":root{{{b('claro')};{ex}}}[data-tema=escuro]{{{b('escuro')}}}"

CSS3 = """/* ===== v3: fundo rosa, blocos brancos com contorno de tinta ===== */
@font-face{font-family:'Bricolage Grotesque';src:url(recursos/BricolageGrotesque.ttf);font-weight:200 800}
body{background:var(--cor-fundo)}
.palco{background:var(--cor-fundo)} .col{background:transparent}
/* fora dos blocos: texto sobre o rosa */
.col,.vitrine,.resumo{--cor-texto:var(--cor-texto-sobre-fundo);--cor-texto-suave:var(--cor-texto-suave-sobre-fundo);--cor-primaria:var(--cor-primaria-sobre-fundo);--cor-primaria-texto:var(--cor-primaria-texto-sobre-fundo);color:var(--cor-texto)}
/* dentro dos blocos: cores originais do tokens.ts */
.card,.hero,.aviso,.modal,.form,.abas,.chip,.bloco,.tile-b,.opcao{--cor-texto:var(--cor-texto-bloco);--cor-texto-suave:var(--cor-texto-suave-bloco);--cor-primaria:var(--cor-primaria-bloco);--cor-primaria-texto:var(--cor-primaria-texto-bloco);color:var(--cor-texto)}
:focus-visible{outline:3px solid var(--cor-foco)!important;outline-offset:3px!important}
.desligado,[aria-disabled=true]{cursor:not-allowed;box-shadow:none!important;opacity:1!important}
.btn2[aria-disabled=true]{border-style:dashed;border-color:var(--cor-texto-suave);color:var(--cor-texto-suave)}
.gbtn[aria-disabled=true]{opacity:1}
.link[aria-disabled=true]{color:var(--cor-texto-suave);text-decoration-style:dashed}
.inp[aria-disabled=true]{background:var(--cor-superficie-2);border-style:dashed}
.btn-grande{min-height:60px;font-size:1.125rem}
.foto{display:block;width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:14px;border:2px solid var(--cor-tinta)}
.foto-l{width:72px;height:72px;flex:none;border-radius:12px;object-fit:cover;border:2px solid var(--cor-tinta)}
.ilu-l{width:64px;height:64px;flex:none;border-radius:12px;border:2px solid var(--cor-tinta);background:var(--cor-primaria-suave);overflow:hidden;display:flex;align-items:center}
.ilu-l svg{width:100%;height:auto}
.resumo{display:none}
/* v3.2: título do topo sem corte: quebra linha (sem reticências) */
.topo{flex-wrap:wrap;row-gap:4px}
.topo .selo-sim{order:10;margin-left:auto}
.topo .icobtn{order:5}
.topo .ola{white-space:normal;overflow:visible;text-overflow:clip;flex:1 1 auto;min-width:min-content;line-height:1.15;overflow-wrap:normal;word-break:normal;hyphens:manual}
@media (max-width:400px){.topo .ola{font-size:1.25rem}.topo .selo-sim{font-size:.6875rem;padding:2px 6px}}
.rolo{flex-wrap:wrap} .rolo>.card{flex:1 1 9.5rem;min-width:min-content}
.sr{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
.qr{position:relative;overflow:hidden}
.qr .faixa-ex{position:absolute;left:-20px;right:-20px;top:50%;transform:translateY(-50%) rotate(-20deg);background:var(--cor-energia);color:var(--cor-sobre-energia);border-block:2px solid #14141A;font-weight:800;letter-spacing:.12em;text-align:center;font-size:.9375rem;padding:2px 0}
.qr{background:#fff;padding:8px;border:2px solid var(--cor-tinta);border-radius:12px;align-self:center}
.qr img{display:block;width:148px;height:148px;image-rendering:pixelated}
h1,h2,.num,.display{font-family:'Bricolage Grotesque',Inter,sans-serif;font-stretch:90%}
h1{font-size:2.25rem;line-height:1.05;font-weight:800;letter-spacing:-.02em}
.card,.hero,.aviso,.form,.bloco{border:2px solid var(--cor-tinta);box-shadow:5px 5px 0 var(--cor-tinta)}
.hero{box-shadow:6px 6px 0 var(--cor-tinta)}
.hero .faixa{background:var(--cor-superficie);color:var(--cor-texto);border-bottom:2px solid var(--cor-tinta)}
.hero .faixa h1,.hero .faixa h2,.hero .faixa p{color:var(--cor-texto)}
.hero .selo{border-color:var(--cor-texto)}
.aviso{border-left-width:8px}
.chip{border:2px solid var(--cor-tinta)}
.chips .chip[aria-pressed=true]{background:var(--cor-acao-sobre-fundo);border-color:var(--cor-acao-sobre-fundo);color:var(--cor-sobre-acao-sobre-fundo)}
.abas{border-top:2px solid var(--cor-tinta)}
.topo .marca-b{width:44px;height:44px;border-radius:14px;background:#fff;border:2px solid var(--cor-tinta);display:flex;align-items:center;justify-content:center;flex:none}
.topo .marca-b img{width:30px;height:30px}
.topo .ola{font-family:'Bricolage Grotesque',Inter,sans-serif;font-size:1.5rem}
.btn-tinta{min-height:52px;border-radius:14px;background:var(--cor-acao-sobre-fundo);color:var(--cor-sobre-acao-sobre-fundo);font-weight:800;display:flex;align-items:center;justify-content:center;gap:8px;padding:12px 20px;width:100%}
.adesivo{display:inline-block;transform:rotate(-3deg);background:var(--cor-energia);color:var(--cor-sobre-energia);border:2px solid var(--cor-tinta);box-shadow:3px 3px 0 var(--cor-tinta);border-radius:10px;padding:4px 12px;font-weight:800;font-size:.9375rem;align-self:flex-start}
.domma-b{display:inline-flex;align-items:center;gap:10px;background:var(--cor-superficie);border:2px solid var(--cor-tinta);border-radius:999px;padding:8px 16px;color:var(--cor-texto-suave-bloco);font-size:.875rem}
.domma-b img{width:120px;height:auto}
.vitrine{display:none}
.opcoes{display:flex;flex-direction:column;gap:10px}
.opcao{min-height:56px;display:flex;align-items:center;gap:12px;padding:10px 16px;border-radius:16px;background:var(--cor-superficie);border:2px solid var(--cor-tinta);font-weight:700;text-align:left;width:100%}
.opcao[aria-checked=true]{box-shadow:inset 0 0 0 3px var(--cor-primaria)} .opcao .marc{width:24px;height:24px;border-radius:50%;border:2px solid var(--cor-texto-suave);flex:none;display:flex;align-items:center;justify-content:center}
.opcao[aria-checked=true] .marc{background:var(--cor-primaria);border-color:var(--cor-primaria);color:var(--cor-sobre-primaria)}
.equip{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px} .equip .chip{min-width:0;overflow-wrap:anywhere}
.equip .chip{border-radius:14px;justify-content:flex-start;min-height:56px}
.equip .chip img{width:32px;height:32px;flex:none}
[data-tema=escuro] .equip .chip img{filter:none}
.prog{height:12px;border-radius:999px;background:var(--cor-superficie);border:2px solid var(--cor-tinta);overflow:hidden} .prog i{display:block;height:100%;background:var(--cor-primaria-bloco)}
.etapa{color:var(--cor-primaria-texto);font-weight:800}
[data-tema=escuro] .form .ou:before,[data-tema=escuro] .form .ou:after{background:#75716B}
.login-top{padding:16px;display:flex;flex-direction:column;gap:14px;align-items:flex-start}
.login-top .logo-b{background:#fff;border:2px solid var(--cor-tinta);box-shadow:5px 5px 0 var(--cor-tinta);border-radius:22px;padding:14px 18px;transform:rotate(-2deg)}
.login-top .logo-b img{width:168px;display:block}
.slogan{font-family:'Bricolage Grotesque',Inter,sans-serif;font-weight:800;font-size:2.5rem;line-height:1;letter-spacing:-.02em;color:var(--cor-texto)}
.form{margin:0 16px}
.rod{color:var(--cor-texto)}
.col .link{color:var(--cor-texto-sobre-fundo)} .form .link,.card .link,.hero .link,.modal .link{color:var(--cor-primaria-texto)}
@media (min-width:1024px){
 .palco{display:grid;grid-template-columns:1fr 480px 1fr;align-items:start;column-gap:32px}
 .resumo{display:flex;grid-column:3;grid-row:1;flex-direction:column;gap:16px;padding:64px 64px 0 0;position:sticky;top:0;max-width:400px}
 .col{grid-column:2}
 .vitrine{display:flex;grid-column:1;grid-row:1;flex-direction:column;gap:16px;padding:64px 32px 0 64px;position:sticky;top:0}
 .vitrine .display{font-weight:800;font-size:3.5rem;line-height:.95;letter-spacing:-.03em}
 .vitrine .ilu{max-width:360px}
 .abas{position:sticky;left:auto;transform:none;bottom:0;border:2px solid var(--cor-tinta);border-radius:20px 20px 0 0}
}
"""
VIT = lambda: f'<aside class="vitrine" aria-label="{MARCA["nome"]}"><p class="display">{MARCA["slogan"]}</p><span class="adesivo">Treino, água e comida num lugar só</span><div class="ilu bloco" style="background:var(--cor-superficie);border-radius:24px;overflow:hidden">{ilustracao("areas-do-corpo", "vit-ilu")}</div></aside>'

import qrcode
qrcode.make("EXEMPLO - QR de demonstração do Quaru, sem link", border=2).save(f"{H}/recursos/qr-exemplo.png")
RES = lambda: (f'<aside class="resumo" aria-labelledby="res-t"><div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><h2 id="res-t">Resumo do dia</h2>{SIM}</div>'
  f'<div class="linha" style="min-height:44px"><span>Treino de hoje</span><b>Peito e tríceps</b></div><div class="linha" style="min-height:44px"><span>Água</span><b>1,25 L de 2 L</b></div>'
  f'<div class="trilho" role="progressbar" aria-valuenow="62" aria-valuemin="0" aria-valuemax="100" aria-label="Água do dia, exemplo"><i style="width:62.5%"></i></div>'
  f'<div class="linha" style="min-height:44px"><span>Sequência</span><b>3 dias</b></div><p class="t2 peq">Dados de exemplo.</p></div>'
  f'<div class="card" style="align-items:center;text-align:center"><h3>Quaru no celular</h3><span class="qr"><img src="recursos/qr-exemplo.png" alt="QR de exemplo, sem link"><span class="faixa-ex" aria-hidden="true">EXEMPLO</span></span>'
  f'<span class="selo-sim">QR DE EXEMPLO · SEM LINK</span><p class="t2 peq">O QR real entra quando o app estiver nas lojas.</p></div></aside>')
def pagina3(corpo_html, tema, titulo, aba):
    top = (f'<header class="topo"><span class="marca-b"><img src="recursos/quaru_simbolo.svg" alt="{MARCA["nome"]}"></span><span class="ola">{titulo}</span>{SIM}'
           f'<button class="icobtn" type="button" aria-label="Notificações">{ic("sino")}</button></header>')
    return (f'<!doctype html><html lang="pt-BR" data-tema="{tema}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            f'<title>{MARCA["nome"]} · {titulo}</title><link rel="stylesheet" href="quaru-v3.2.css"></head><body><div class="palco">{VIT()}{RES()}<div class="col">{top}<main>{corpo_html}</main>'
            f'{abas(aba) if aba else ""}</div></div></body></html>')

def equip_ico(i):
    s = open(f"{R1}/equipamento-{i}.svg").read()
    return s
def t_tour(tema):
    locais = [("Academia", True), ("Em casa", False), ("Ao ar livre", False)]
    eq = [("halteres", "Halteres", True), ("banco", "Banco", True), ("barra-fixa", "Barra fixa", False), ("esteira-bike", "Esteira/bike", True)]
    corpo = (f'<div style="display:flex;align-items:center;gap:12px"><span class="etapa peq">Etapa 5 de 11</span><div class="prog" style="flex:1" role="progressbar" aria-valuenow="5" aria-valuemin="1" aria-valuemax="11" aria-label="Progresso do tour"><i style="width:45%"></i></div></div>'
             f'<span class="adesivo">Leva 2 minutos</span><h1>Onde você treina?</h1>'
             f'<div class="hero"><div class="cena">{ilustracao("onde-treina", "tour-ilu")}</div></div>'
             f'<div class="opcoes" role="radiogroup" aria-label="Lugar de treino">' + "".join(f'<button class="opcao" type="button" role="radio" aria-checked="{"true" if a else "false"}"><span class="marc" aria-hidden="true">{ic("check",16) if a else ""}</span>{n}</button>' for n, a in locais) + '</div>'
             f'<h2>O que tem lá?</h2><div class="equip chips" role="group" aria-label="Equipamentos disponíveis">'
             + "".join(f'<button class="chip" type="button" aria-pressed="{"true" if a else "false"}"><span class="bloco" style="background:#fff;border-radius:8px;border-width:2px;box-shadow:none;display:flex;padding:2px"><img src="recursos/equipamento-{i}.svg" alt=""></span>{n}</button>' for i, n, a in eq)
             + f'</div><button class="btn-tinta" type="button">Continuar {ic("seta",20)}</button><button class="link" type="button" style="align-self:center">Pular</button>')
    return ("Tour", None, corpo)
def wrap(f):
    def g(t):
        tit, aba, corpo = f(t) if f.__code__.co_argcount else f()
        corpo = corpo.replace('class="btn" type="button">Começar o tour', 'class="btn" type="button">Começar o tour')
        return tit, aba, corpo
    return g
def t_inicio3():
    tit, aba, c = t_inicio()
    return tit, aba, '<span class="adesivo">Bora treinar hoje?</span>' + c
FOTOS_USADAS = {  # só aprovadas (fora de descartadas/); crédito = LEIAME.md das fotos; alt = imagens-redbox-gerado.ts quando existe
 "dieta-vegetariana_1x1.webp": ("Foto de feijão vermelho, arroz e vinagrete em prato branco", "https://www.pexels.com/photo/8992843/", "I Own My Food Art", "Pexels License"),
 "dieta-mediterranea_1x1.webp": ("Foto de peixe assado com tomates, azeitonas, limão e manjericão", "https://www.pexels.com/photo/27294733/", "Valeria Boltneva", "Pexels License"),
 "refeicao-ovos-abacate_1x1.webp": ("Foto de ovos mexidos com abacate, folhas e pão", "https://www.pexels.com/photo/19745150/", "Sai Kuen Leung", "Pexels License"),
 "refeicao-iogurte-fruta_1x1.webp": ("Foto de iogurte natural com fruta e aveia", "https://www.pexels.com/photo/17834128/", "Sofía Nuñez", "Pexels License"),
}
def foto_aprovada(f):
    p = os.path.realpath(f"{FOTOS}/{f}")
    assert "descartadas" not in p.split(os.sep), f"foto descartada barrada: {p}"
    assert os.path.dirname(p) == os.path.realpath(FOTOS) and os.path.isfile(p), f"foto fora da pasta aprovada: {p}"
    return p
for f in FOTOS_USADAS: shutil.copy(foto_aprovada(f), f"{H}/recursos/fotos/{f}")
# visual de reserva = componentes/reserva-refeicao.tsx (CORES_RESERVA + Icone 24x24, traço 1.8; raio.medio 12; ícone = 50% da largura; oculto ao leitor de tela)
RES_CORES = {"cafe": ("var(--cor-primaria-suave)", "var(--cor-primaria-texto-bloco)"), "almoco": ("var(--cor-secundaria-suave)", "var(--cor-secundaria)"),
             "lanche": ("var(--cor-energia)", "var(--cor-sobre-energia)"), "jantar": ("var(--cor-superficie-2)", "var(--cor-texto-suave-bloco)")}
RES_ICO = {"cafe": '<path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9z"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M8 3c-.6.8-.6 1.7 0 2.5M12 3c-.6.8-.6 1.7 0 2.5"/>',
           "almoco": '<circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="3"/><path d="M3 4v5a1.5 1.5 0 0 0 1.5 1.5V20M4.5 4v4M21 4c-1.5 1-2 2.5-2 5h2v11"/>',
           "lanche": '<path d="M12 8c-2-1.5-6-1-6 3.5 0 4 2.5 8.5 4.5 8.5.8 0 1-.4 1.5-.4s.7.4 1.5.4c2 0 4.5-4.5 4.5-8.5C18 7 14 6.5 12 8z"/><path d="M12 8c0-2 .8-3.5 2.5-4.5"/>',
           "jantar": '<path d="M3 13h18a9 9 0 0 1-18 0z"/><path d="M15 3.5a3.5 3.5 0 1 0 4 4 3 3 0 0 1-4-4z"/>'}
def reserva(momento, larg=72):
    f, c = RES_CORES[momento]; t = round(larg * 0.5)
    return (f'<span class="reserva" data-momento="{momento}" aria-hidden="true" style="width:{larg}px;height:{larg}px;border-radius:12px;background:{f};display:flex;align-items:center;justify-content:center;flex:none">'
            f'<svg width="{t}" height="{t}" viewBox="0 0 24 24" fill="none" stroke="{c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" focusable="false">{RES_ICO[momento]}</svg></span>')
def t_alim3():
    dietas = [("Vegetariana", "dieta-vegetariana_1x1.webp"), ("Mediterrânea", "dieta-mediterranea_1x1.webp")]
    # (momento, rótulo, nome = refeicoes.ts, foto aprovada ou None -> reserva)
    ref = [("cafe", "Café da manhã", "Ovos mexidos com abacate", "refeicao-ovos-abacate_1x1.webp"), ("cafe", "Café da manhã", "Tapioca com ovo e tomate", None),
           ("almoco", "Almoço", "Arroz, feijão, frango grelhado e salada", None), ("lanche", "Lanche", "Iogurte natural com fruta e aveia", "refeicao-iogurte-fruta_1x1.webp")]
    def mini(f, mo): return f'<img class="foto-l" src="recursos/fotos/{f}" alt="{FOTOS_USADAS[f][0]}">' if f else reserva(mo)
    return ("Alimentação", "alimentacao", f"""<h1>Comer bem, sem complicar</h1><div class="seg" role="tablist"><button role="tab" aria-selected="true" type="button">Dietas</button><button role="tab" aria-selected="false" type="button">Ideias de refeição</button></div>
<div class="rolo">{"".join(f'<div class="card"><img class="foto" src="recursos/fotos/{f}" alt="{FOTOS_USADAS[f][0]}"><h3>{t}</h3><p class="t2 peq">Ideias gerais</p></div>' for t, f in dietas)}</div>
<h2>Ideias de refeição</h2>{"".join(f'<button class="card linha" type="button" style="flex-direction:row;justify-content:flex-start">{mini(f, mo)}<div style="flex:1"><p class="t2 peq">{m}</p><h3>{a}</h3></div>{ic("seta")}</button>' for mo, m, a, f in ref)}
{aviso(AV_NUTRI)}""")
TELAS3 = {"01-inicio": lambda t: t_inicio3(), "02-treinos": lambda t: t_treinos(), "03-alimentacao": lambda t: t_alim3(), "04-agua": lambda t: t_agua(), "05-perfil": lambda t: (lambda r: (r[0], r[1], r[2].replace('role="img" aria-label="Avatar escolhido: busto sem rosto">', 'role="img" aria-labelledby="av-t"><title id="av-t">Avatar escolhido: busto sem rosto</title>')))(t_perfil()), "06-tour": t_tour}

AV_CONTA = "Entrar, criar conta e Google ainda não funcionam nesta versão. Use “Continuar sem conta”: seus dados ficam só neste aparelho."  # = entrar.tsx:58
def login3(tema, estado="normal"):
    """ADR-0009/0017: modo local. "Continuar sem conta" é o principal; conta e Google desativados com "(em breve)" e aria-disabled; campos não editáveis."""
    gg = open(GG).read().replace("<svg ", '<svg aria-hidden="true" focusable="false" ', 1)
    AD = ' aria-disabled="true"'
    dom = "domma_sinal_fundo-escuro.svg" if tema == "escuro" else "domma_sinal_fundo-claro.svg"
    corpo = (f'<div class="login-top"><div style="display:flex;justify-content:space-between;align-self:stretch;align-items:center"><span class="logo-b"><img src="recursos/quaru_colorida.svg" alt="{MARCA["nome"]}"></span></div>'
             f'<p class="slogan">{MARCA["slogan"]}</p></div>'
             f'<div class="form" role="group" aria-labelledby="h-ent"><h2 id="h-ent" style="font-size:1.25rem">Comece agora</h2>'
             f'<button class="btn btn-grande" type="button" id="continuar">Continuar sem conta {ic("seta",20)}</button>'
             f'<p class="t2 peq">Sem cadastro: seus dados ficam só neste aparelho.</p>'
             f'<div class="ou">conta com login</div>'
             + aviso(f"<b>Conta com login: em breve</b><br>{AV_CONTA}", "info", "info") +
             f'<div class="campo"><label for="email">E-mail</label><input class="inp" id="email" type="email" placeholder="voce@exemplo.com" readonly{AD} tabindex="-1"></div>'
             f'<div class="campo"><label for="senha">Senha</label><input class="inp" id="senha" type="password" placeholder="Sua senha" readonly{AD} tabindex="-1"></div>'
             f'<div class="dir"><button class="link" type="button"{AD}>Esqueci minha senha (em breve)</button></div>'
             f'<button class="btn2 conta" type="button"{AD}>Entrar (em breve)</button><button class="btn2 conta" type="button"{AD}>Criar conta (em breve)</button>'
             f'<div class="galvo"><button class="gbtn conta" type="button"{AD} aria-label="Continuar com o Google (em breve)" aria-describedby="g-breve">{gg}<span>Continuar com o Google</span></button></div>'
             f'<p class="t2 peq" id="g-breve" style="text-align:center">Login com Google: em breve.</p></div>'
             f'<div class="rod"><p class="peq">Ao continuar, você concorda com os termos abaixo.</p><div class="legais"><a class="link" href="#">Termos de uso</a><a class="link" href="#">Política de Privacidade</a></div>'
             f'<span class="domma-b"><span>Desenvolvido por</span><img src="recursos/{dom}" alt="{MARCA["empresa"]}"></span></div>')
    return (f'<!doctype html><html lang="pt-BR" data-tema="{tema}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{MARCA["nome"]} · Entrar</title>'
            f'<link rel="stylesheet" href="quaru-v3.2.css"></head><body><div class="palco">{VIT().replace(f'<p class="display">{MARCA["slogan"]}</p>', "")}{RES()}<div class="col">{corpo}</div></div></body></html>')

for i in ["halteres", "banco", "barra-fixa", "esteira-bike"]: shutil.copy(f"{R1}/equipamento-{i}.svg", f"{H}/recursos/")
MICRO = open("/home/box/redbox/clientes/domma-tecnologia/app-treinos/telas-v0.4.1/animacoes-v2.1/microinteracoes.css").read()
open(f"{H}/quaru-v3.2.css", "w").write("/* Quaru · proposta v3.2 · cores: tokens.ts v0.3 + overrides v3 (ver LEIAME). Fontes OFL: Inter, Bricolage Grotesque; Google Sans só no botão Google. */\n"
                                      + tok_css3() + "\n" + CSS + MICRO + CSS_LOGIN + CSS3)

# ---------- contraste dos tokens ----------
CON = []
def par(t, g, a, b, x, y, m): CON.append(dict(tema=t, grupo=g, frente=a, fundo=b, cor_frente=x, cor_fundo=y, razao=round(cr(x, y), 2), minimo=m, ok=cr(x, y) >= m))
for t in TEMAS:
    c = T3[t]; o = TEMAS_ORIG[t]
    for k, (sob, m, _) in USO.items(): par(t, "v3.1 sobre o rosa", k, sob, c[k], c[sob], m)
    par(t, "v3.1 escuro/claro: bloco", "superficie (bloco)", "fundo", c["superficie"], c["fundo"], 3.0 if t == "escuro" else 1.0)
    par(t, "v3.1 escuro/claro: contorno", "borda/tinta", "fundo", c["borda"], c["fundo"], 3.0)
    par(t, "v3.1 foco", "foco", "superficie (bloco)", c["foco"], c["superficie"], 3.0)
    par(t, "v3.1 foco", "foco", "fundo", c["foco"], c["fundo"], 3.0)
    par(t, "v3.1 adesivo", "sobre-energia", "energia", EXTRA["sobre-energia"], EXTRA["energia"], 4.5)
    # dentro dos blocos (superficie v3.1): pares dos testes do app
    blk = dict(o); blk["superficie"] = c["superficie"]; blk["foco"] = c["foco"]
    for a_, b_ in P_TESTE_TEXTO + P_V2_TEXTO:
        if b_ == "fundo" or a_.endswith("*"): continue
        par(t, "bloco-texto", a_, b_, blk[a_], blk[b_], 4.5)
    for a_, b_ in P_TESTE_COMP:
        if b_ == "fundo": continue
        par(t, "bloco-componente", a_, b_, blk[a_], blk[b_], 3.0)
    # alternativa (opcional)
    if t == "claro":
        for k, (sob, m, _) in USO.items():
            if sob == "fundo": par(t, "comparação: rosa v3.1", k, "fundo v3.1 " + ALT_ROSA, c[k], ALT_ROSA, m)
    # proibidos: originais direto no rosa (documentados, devem FALHAR)
PROIBIDOS = [dict(tema=t, token=k, sobre="fundo " + T3[t]["fundo"], razao=round(cr(TEMAS_ORIG[t][k], T3[t]["fundo"]), 2)) for t in TEMAS for k in ("texto-suave", "primaria", "primaria-texto")]
assert all(r["ok"] for r in CON), [r for r in CON if not r["ok"]]
assert all(p["razao"] < (4.5 if p["token"] != "primaria" else 3.0) for p in PROIBIDOS), PROIBIDOS  # continuam proibidos no rosa

REG = []
CHK = """(()=>{const h=document.documentElement.outerHTML,c={};document.querySelectorAll('[id]').forEach(e=>c[e.id]=(c[e.id]||0)+1);
 const vis=e=>{const b=e.getBoundingClientRect();return b.width>0&&b.height>0&&getComputedStyle(e).visibility!='hidden'};
 const peq=[...document.querySelectorAll('button,a,input,[role=switch],[role=tab],[role=radio]')].filter(e=>vis(e)&&!e.closest('.vitrine')).filter(e=>{const b=e.getBoundingClientRect();return b.height<44||b.width<44}).map(e=>e.className+':'+e.textContent.slice(0,20));
 const avisos=[...document.querySelectorAll('.aviso p')].map(p=>parseFloat(getComputedStyle(p).fontSize)).filter(x=>x<16);
 const svgs=[...document.querySelectorAll('svg[role=img]')].filter(s=>!s.querySelector('title')).length;
 const rgb=s=>s.match(/[\\d.]+/g).map(Number);
 const L=([r,g,b])=>{const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};return .2126*f(r)+.7152*f(g)+.0722*f(b)};
 const R=(x,y)=>{const a=L(x),z=L(y);return (Math.max(a,z)+.05)/(Math.min(a,z)+.05)};
 const bgOf=e=>{for(let x=e;x;x=x.parentElement){const s=getComputedStyle(x).backgroundColor;const v=rgb(s);if(v.length<4||v[3]>0.9)return v.slice(0,3)}return [255,255,255]};
 const baixos=[];document.querySelectorAll('h1,h2,h3,p,span,b,label,button,a,li').forEach(e=>{if(!vis(e)||![...e.childNodes].some(n=>n.nodeType==3&&n.textContent.trim()))return;
   if(e.closest('[disabled]'))return;let op=1;for(let x=e;x;x=x.parentElement)op*=parseFloat(getComputedStyle(x).opacity);if(op<1){baixos.push('opacidade '+op.toFixed(2)+' '+e.textContent.trim().slice(0,20));return}const cs=getComputedStyle(e);const r=R(rgb(cs.color).slice(0,3),bgOf(e));
   const big=parseFloat(cs.fontSize)>=24||(parseFloat(cs.fontSize)>=18.66&&parseInt(cs.fontWeight)>=700);if(r<(big?3:4.5))baixos.push(e.textContent.trim().slice(0,30)+' '+r.toFixed(2))});
 // blocos e contorno 3:1 contra o fundo da página
 const pg=bgOf(document.querySelector('.palco'));const blocos=[];
 document.querySelectorAll('.card,.hero,.form,.aviso,.bloco,.opcao,.chip').forEach(e=>{if(!vis(e)||e.closest('.vitrine'))return;const cs=getComputedStyle(e);
   const bc=rgb(cs.borderTopColor).slice(0,3),bw=parseFloat(cs.borderTopWidth),fill=rgb(cs.backgroundColor);
   const rb=R(bc,pg), rf=fill.length>3&&fill[3]<0.9?99:R(fill.slice(0,3),pg); if(Math.max(bw>=1.5?rb:0,rf)<3)blocos.push(e.className+' borda '+rb.toFixed(2)+' bloco '+rf.toFixed(2))});
 // botões de conta (login)
 const conta=[...document.querySelectorAll('.conta,.link[aria-disabled]')].map(b=>({t:(b.getAttribute('aria-label')||b.textContent).trim(),ad:b.getAttribute('aria-disabled'),dis:b.hasAttribute('disabled')}));
 const conta_ruim=conta.filter(x=>x.ad!=='true'||x.dis||!x.t.includes('(em breve)')).map(x=>x.t);
 const trunc=[];document.querySelectorAll('body *').forEach(e=>{if(!vis(e)||e.closest('.sr,svg,.vitrine .ilu'))return;const cs=getComputedStyle(e);
   const txt=[...e.childNodes].some(n=>n.nodeType==3&&n.textContent.trim());if(!txt)return;
   if(cs.textOverflow==='ellipsis'&&e.scrollWidth>e.clientWidth+1)trunc.push('reticências: '+e.textContent.trim().slice(0,24));
   else if(cs.overflowX!=='visible'&&e.scrollWidth>e.clientWidth+1)trunc.push('scroll: '+e.textContent.trim().slice(0,24));
   if(cs.webkitLineClamp&&cs.webkitLineClamp!=='none')trunc.push('line-clamp: '+e.textContent.trim().slice(0,24));
   const r=document.createRange();r.selectNodeContents(e);const rb=r.getBoundingClientRect(),eb=e.getBoundingClientRect();if(rb.right>eb.right+2||rb.left<eb.left-2)trunc.push('cortado/vazando: '+e.textContent.trim().slice(0,24))});
 document.querySelectorAll('.topo .ola').forEach(o=>{const r=document.createRange();r.selectNodeContents(o);const a=r.getBoundingClientRect();
   [...o.parentElement.children].filter(x=>x!==o).forEach(x=>{const b=x.getBoundingClientRect();if(a.right>b.left+1&&a.left<b.right-1&&a.bottom>b.top+1&&a.top<b.bottom-1)trunc.push('título sobreposto: '+o.textContent)})});
 const cont=document.querySelector('#continuar');
 return {truncados:trunc,sw:document.documentElement.scrollWidth,malhou:h.toLowerCase().includes('malhou'),dup:Object.keys(c).filter(k=>c[k]>1),peq,avisos_peq:avisos,svg_sem_titulo:svgs,contraste_baixo:baixos,blocos_baixos:blocos,
   conta_n:conta.length,conta_ruim,continuar_ok:cont?(cont.textContent.includes('Continuar sem conta')&&!cont.hasAttribute('aria-disabled')&&cont.classList.contains('btn')):null,
   n_slogan:(document.body.innerText.match(/Seu treino, no seu ritmo\./g)||[]).length,slogan:document.querySelector('.slogan')?document.querySelector('.slogan').textContent:null,
   entrar_google_antigo:/Entrar com Google/.test(document.body.innerText),domma:!!document.querySelector('img[src*=domma_sinal]')||null}})()"""
FOCO = """(()=>{const e=document.activeElement;const cs=getComputedStyle(e);const rgb=s=>s.match(/[\\d.]+/g).map(Number);
 const L=([r,g,b])=>{const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};return .2126*f(r)+.7152*f(g)+.0722*f(b)};
 const bgOf=e=>{for(let x=e;x;x=x.parentElement){const v=rgb(getComputedStyle(x).backgroundColor);if(v.length<4||v[3]>0.9)return v.slice(0,3)}return [255,255,255]};
 const o=rgb(cs.outlineColor).slice(0,3),b=bgOf(e.parentElement),a=L(o),z=L(b);
 return {alvo:e.textContent.trim().slice(0,30),largura:parseFloat(cs.outlineWidth),estilo:cs.outlineStyle,razao:+((Math.max(a,z)+.05)/(Math.min(a,z)+.05)).toFixed(2)}})()"""
def shot(pg, hp, arq, w, h, fs=None, login=False, focar=None):
    pg.set_viewport_size({"width": w, "height": h}); pg.goto("file://" + hp); pg.wait_for_load_state("networkidle")
    pg.add_style_tag(content="*{animation:none!important;transition:none!important}")
    if fs: pg.add_style_tag(content=f"html{{font-size:{fs}}}")
    pg.wait_for_timeout(120); r = pg.evaluate(CHK); foco = None
    if focar:
        pg.focus(focar); pg.keyboard.press("Shift+Tab"); pg.keyboard.press("Tab"); pg.wait_for_timeout(60); foco = pg.evaluate(FOCO)
    pg.screenshot(path=arq)
    ok = r["sw"] <= w and not r["malhou"] and not r["dup"] and not r["peq"] and not r["avisos_peq"] and not r["svg_sem_titulo"] and not r["contraste_baixo"] and not r["blocos_baixos"] and not r["truncados"]
    if login: ok = ok and r["conta_n"] == 4 and not r["conta_ruim"] and r["continuar_ok"] and r["slogan"] == MARCA["slogan"] and r["n_slogan"] == 1 and not r["entrar_google_antigo"] and r["domma"]
    if foco: ok = ok and foco["razao"] >= 3 and foco["largura"] >= 2 and foco["estilo"] != "none"
    REG.append(dict(arquivo=os.path.relpath(arq, OUT), largura=w, fonte=fs or "16px", ok=ok, foco=foco, **r))
LISTA = []
with sync_playwright() as pw:
    br = pw.chromium.launch(); pg = br.new_page(device_scale_factor=2)
    for t in TEMAS:
        n = f"00-login_{t}"; hp = f"{H}/tela-{n}.html"; open(hp, "w").write(login3(t))
        shot(pg, hp, f"{OUT}/png/celular/tela-{n}.png", 390, 844, login=True); shot(pg, hp, f"{OUT}/png/computador/tela-{n}.png", 1440, 900, login=True); LISTA.append(n)
        shot(pg, hp, f"{OUT}/png/validacao/tela-{n}_360x800.png", 360, 800, login=True); shot(pg, hp, f"{OUT}/png/validacao/tela-{n}_fonte-130.png", 390, 844, "20.8px", login=True)
        shot(pg, hp, f"{OUT}/png/foco/tela-{n}_foco-continuar.png", 390, 844, login=True, focar="#continuar")
        for k, f in TELAS3.items():
            tit, aba, corpo = f(t); n = f"{k}_{t}"; hp = f"{H}/tela-{n}.html"; open(hp, "w").write(pagina3(corpo, t, tit, aba))
            shot(pg, hp, f"{OUT}/png/celular/tela-{n}.png", 390, 844); shot(pg, hp, f"{OUT}/png/computador/tela-{n}.png", 1440, 900); LISTA.append(n)
            shot(pg, hp, f"{OUT}/png/validacao/tela-{n}_360x800.png", 360, 800); shot(pg, hp, f"{OUT}/png/validacao/tela-{n}_fonte-130.png", 390, 844, "20.8px")
            if k == "02-treinos": shot(pg, hp, f"{OUT}/png/foco/tela-{n}_foco-chip.png", 390, 844, focar=".chips .chip:nth-child(3)")
            if k == "06-tour": shot(pg, hp, f"{OUT}/png/foco/tela-{n}_foco-opcao.png", 390, 844, focar=".opcao:nth-child(2)")
    # alternativa (opcional): rosa menos saturado, claro
    for n in ("01-inicio_claro", "03-alimentacao_claro", "04-agua_claro"):
        src = open(f"{H}/tela-{n}.html").read().replace("</head>", f"<style>:root{{--cor-fundo:{ALT_ROSA}}}</style></head>")
        hp = f"{H}/alternativa_tela-{n}_rosa-v3.1.html"; open(hp, "w").write(src)
        shot(pg, hp, f"{OUT}/png/alternativa/tela-{n}_rosa-v3.1.png", 390, 844)
    br.close()
for f in os.listdir(H):
    if f.endswith(".html"):
        h_ = open(f"{H}/{f}").read(); assert "descartadas" not in h_, f"caminho com descartadas/ em {f}"
        for src in re.findall(r'src="(recursos/fotos/[^"]+)"', h_): assert os.path.basename(src) in FOTOS_USADAS and os.path.isfile(f"{H}/{src}"), (f, src)
ruins = [r for r in REG if not r["ok"]]
J = json.dumps(dict(v32_tokens={k: {t: dict(novo=n, motivo=m) if k == "foco" else dict(antigo=a, novo=n, motivo=m) for t, (a, n, m) in v.items()} for k, v in V3_TOKENS.items()},
     novos=NOVOS, proibidos_no_rosa=PROIBIDOS, contraste=CON, render=REG, problemas=ruins), ensure_ascii=False, indent=1)
J = J.replace("#346EA1 dava 2,17 sobre o rosa; ", "")
assert "346EA1" not in J.upper(), "foco antigo claro no JSON"
assert not [r for r in CON if "foco" in r["frente"] and r["cor_frente"].upper() in ("#346EA1", "#84AED3")], "foco antigo no JSON"  # #84AED3 continua só como 'secundaria' do escuro (token legítimo)
open(f"{OUT}/verificacao-v3.2.json", "w").write(J)
print(len(REG), "renders;", len(CON), "pares ok; focos:", [r["foco"] for r in REG if r["foco"]], "; problemas:", json.dumps(ruins, ensure_ascii=False)[:3000])
FN = "/usr/share/fonts/truetype/sand-box/google/Inter/Inter-VariableFont_opsz,wght.ttf"
def prancha(lista, cols, tw, th, titulo, arq):
    rows = -(-len(lista)//cols); P = Image.new("RGB", (cols*(tw+24)+40, rows*(th+56)+110), "#F5F4F1"); d = ImageDraw.Draw(P)
    d.text((40, 28), titulo, fill="#14141A", font=ImageFont.truetype(FN, 32)); f = ImageFont.truetype(FN, 18)
    for i, (a, r) in enumerate(lista):
        x, y = 40+(i % cols)*(tw+24), 96+(i//cols)*(th+56); P.paste(Image.open(a).convert("RGB").resize((tw, th)), (x, y)); d.text((x, y+th+8), r, fill="#14141A", font=f)
    P.save(arq)
for t in TEMAS:
    L = [n for n in LISTA if n.endswith(f"_{t}")]
    prancha([(f"{OUT}/png/celular/tela-{n}.png", n.replace(f"_{t}", "")) for n in L], len(L), 234, 506, f"{MARCA['nome']} · proposta v3.2 · celular 390×844 @2x · tema {t}", f"{OUT}/prancha-v3.2-celular-{t}.png")
    prancha([(f"{OUT}/png/computador/tela-{n}.png", n.replace(f"_{t}", "")) for n in L], 4, 480, 300, f"{MARCA['nome']} · proposta v3.2 · computador 1440×900 @2x · tema {t}", f"{OUT}/prancha-v3.2-computador-{t}.png")
V = sorted(os.listdir(f"{OUT}/png/validacao"))
prancha([(f"{OUT}/png/validacao/{v}", v.replace("tela-", "").replace(".png", "")[:34]) for v in V], 8, 195, 422, "validação: 360×800 e fonte 130%", f"{OUT}/prancha-v3.2-validacao.png")
FO = sorted(os.listdir(f"{OUT}/png/foco"))
prancha([(f"{OUT}/png/foco/{v}", v.replace("tela-", "").replace(".png", "")) for v in FO], 6, 234, 506, "anel de foco (teclado): foco 3:1 sobre o rosa e sobre o bloco", f"{OUT}/prancha-v3.2-foco.png")
cmp_ = []
for n in ("01-inicio_claro", "03-alimentacao_claro", "04-agua_claro"):
    cmp_ += [(f"{OUT}/png/alternativa/tela-{n}_rosa-v3.1.png", f"{n.split('_')[0]} · v3.1 {ALT_ROSA}"), (f"{OUT}/png/celular/tela-{n}.png", f"{n.split('_')[0]} · v3.2 #F2A0B0")]
prancha(cmp_, 6, 234, 506, f"Rosa do tema claro: v3.1 {ALT_ROSA} × v3.2 #F2A0B0 (decisão do Otávio)", f"{OUT}/prancha-v3.2-comparativa-rosa.png")
print("ok")
