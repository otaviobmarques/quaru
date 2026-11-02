#!/usr/bin/env python3
"""Quaru 0.4.3 · ícones de equipamento + tela "Sair" do Perfil. Mesmo estilo/regras da v2.1/v2.2 (base.py, telas.py copiados do gerador-v2.2).
Cores = app/mobile/src/tema/tokens.ts (paleta v0.3) por variáveis. Desenhado em código; sem banco de imagem, sem IA. Uso: python3 gerador/gerar_v0.4.3.py"""
import os, sys, json, shutil
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from telas import *
from ilustracoes import fundo, chao
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont
EQ = os.path.join(RAIZ, "equipamentos"); SA = os.path.join(RAIZ, "tela-sair")
for p in [f"{EQ}/svg", f"{EQ}/png", f"{SA}/png", f"{SA}/validacao", f"{SA}/html/recursos"]: os.makedirs(p, exist_ok=True)
T, S, P_, PS, SE, SS, TS, EN = V("texto"), V("superficie"), V("primaria"), V("primaria-suave"), V("secundaria"), V("secundaria-suave"), V("texto-suave"), V("energia")
def disco(cx, cy, w, h, cor=None): return f'<rect x="{cx-w/2}" y="{cy-h/2}" width="{w}" height="{h}" rx="{min(w,h)/3:.1f}" fill="{cor or T}"/>'
def base_ic(): return f'<circle cx="48" cy="48" r="44" fill="{PS}"/>'
EQUIP = {
 "halteres": ("Halteres", lambda: base_ic() + f'<g transform="rotate(-20 48 48)"><rect x="24" y="44" width="48" height="8" rx="4" fill="{TS}"/>' + disco(26, 48, 10, 30) + disco(18, 48, 7, 22) + disco(70, 48, 10, 30) + disco(78, 48, 7, 22) + '</g>'),
 "barra": ("Barra com anilhas", lambda: base_ic() + f'<rect x="8" y="45" width="80" height="6" rx="3" fill="{TS}"/>' + disco(24, 48, 9, 40, P_) + disco(16, 48, 6, 30, P_) + disco(72, 48, 9, 40, P_) + disco(80, 48, 6, 30, P_) + f'<rect x="36" y="44" width="24" height="8" rx="2" fill="{T}"/>'),
 "banco": ("Banco de supino", lambda: base_ic() + f'<rect x="16" y="40" width="64" height="12" rx="6" fill="{P_}" stroke="{T}" stroke-width="3"/><path d="M28 52v22M68 52v22M20 74h16M60 74h16" stroke="{T}" stroke-width="5" stroke-linecap="round"/>'),
 "polia": ("Polia com cabo e pegador", lambda: base_ic() + f'<path d="M30 14v68M22 82h44" stroke="{T}" stroke-width="5" stroke-linecap="round"/><path d="M30 18h30" stroke="{T}" stroke-width="5" stroke-linecap="round"/><circle cx="60" cy="24" r="8" fill="{S}" stroke="{T}" stroke-width="4"/><path d="M66 26L66 60" stroke="{TS}" stroke-width="3"/><path d="M56 60h20" stroke="{P_}" stroke-width="7" stroke-linecap="round"/>' + disco(30, 68, 14, 18, SE)),
 "maquinas": ("Máquina de musculação", lambda: base_ic() + f'<rect x="20" y="16" width="10" height="64" rx="4" fill="{T}"/><rect x="18" y="78" width="60" height="6" rx="3" fill="{T}"/>' + "".join(disco(25, 46+i*7, 14, 5, SE) for i in range(4)) + f'<rect x="46" y="54" width="28" height="10" rx="5" fill="{P_}"/><rect x="46" y="28" width="10" height="28" rx="5" fill="{P_}"/><path d="M30 22h34v16" stroke="{TS}" stroke-width="4" fill="none" stroke-linecap="round"/>'),
 "elastico": ("Elástico de resistência", lambda: base_ic() + f'<path d="M22 30c10 30 42 30 52 0" stroke="{P_}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M22 66c10-30 42-30 52 0" stroke="{SE}" stroke-width="7" fill="none" stroke-linecap="round"/><rect x="12" y="22" width="20" height="10" rx="5" fill="{T}"/><rect x="64" y="22" width="20" height="10" rx="5" fill="{T}"/><rect x="12" y="64" width="20" height="10" rx="5" fill="{T}"/><rect x="64" y="64" width="20" height="10" rx="5" fill="{T}"/>'),
 "kettlebell": ("Kettlebell", lambda: base_ic() + f'<path d="M34 40V32a14 14 0 0 1 28 0v8" stroke="{T}" stroke-width="7" fill="none"/><circle cx="48" cy="58" r="24" fill="{P_}" stroke="{T}" stroke-width="3"/><rect x="34" y="78" width="28" height="6" rx="3" fill="{T}"/><path d="M38 52a12 12 0 0 1 8-8" stroke="{S}" stroke-width="4" fill="none" stroke-linecap="round"/>'),
 "barra-fixa": ("Barra fixa", lambda: base_ic() + f'<path d="M20 84V20M76 84V20M14 84h12M70 84h12" stroke="{T}" stroke-width="6" stroke-linecap="round"/><path d="M16 26h64" stroke="{P_}" stroke-width="7" stroke-linecap="round"/><path d="M38 28v10M58 28v10" stroke="{TS}" stroke-width="4" stroke-linecap="round"/>'),
 "esteira-ou-bike": ("Esteira e bicicleta ergométrica", lambda: base_ic() + f'<path d="M10 72l40-6" stroke="{T}" stroke-width="7" stroke-linecap="round"/><path d="M44 66l-6-34h-8" stroke="{T}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="74" r="4" fill="{TS}"/><circle cx="48" cy="68" r="4" fill="{TS}"/><circle cx="72" cy="68" r="12" fill="{S}" stroke="{SE}" stroke-width="5"/><path d="M72 68l-6-26h-6M66 42h10M72 68h14" stroke="{T}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="60" y="38" width="14" height="5" rx="2.5" fill="{P_}"/>'),
 "peso-do-corpo": ("Peso do corpo, sem equipamento", lambda: base_ic() + f'<g transform="translate(-12 -14) scale(1.3)">' + pessoa(46, 78, 0.52, "vitoria", 2, 0, "primaria") + '</g>'),
}
NOMES = {"halteres": "halteres", "barra": "barra", "banco": "banco", "polia": "polia", "maquinas": "maquinas", "elastico": "elastico", "kettlebell": "kettlebell", "barra-fixa": "barra-fixa", "esteira-ou-bike": "esteira-ou-bike", "peso-do-corpo": "peso-do-corpo"}
def icone(k, idd=None): d, f = EQUIP[k]; return svg_doc((96, 96), d, f(), idd or f"eq-{k}")
# ilustração própria da tela Sair: pessoa acenando saindo por uma porta, com ícone de saída
def ilu_sair(idd="ilu-sair"):
    c = (fundo() + chao() + f'<rect x="212" y="52" width="92" height="160" rx="10" fill="{S}" stroke="{T}" stroke-width="4"/><path d="M220 60h76v148h-76z" fill="{SS}"/>'
         f'<path d="M220 60l56 14v130l-56 4z" fill="{P_}" stroke="{T}" stroke-width="3" stroke-linejoin="round"/><circle cx="262" cy="140" r="4" fill="{EN}"/>'
         f'<path d="M150 70h30M168 58l12 12-12 12" stroke="{P_}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
         + pessoa(150, 212, 1.2, "acenar", 1, 0, "secundaria", coque=True))
    return svg_doc((360, 240), "Pessoa acenando ao lado de uma porta aberta, saindo da conta", c, idd)
# tela Sair
CSS_SAIR = """.btn-destr{min-height:52px;border-radius:14px;background:var(--cor-erro);color:var(--cor-sobre-erro);font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px;padding:12px 20px;width:100%}
.btn-destr:active{transform:scale(.97)}
button[disabled],button[aria-disabled=true]{opacity:.45;cursor:not-allowed;box-shadow:none}
.giro{width:20px;height:20px;border-radius:50%;border:3px solid currentColor;border-right-color:transparent}
.acoes{display:flex;flex-direction:column;gap:12px}
"""
SOBRE_ERRO = {"claro": "#FFFFFF", "escuro": "#1A0E12"}   # texto do botão destrutivo (branco no claro; fundo do tema no escuro)
def sair(tema, estado):
    car = estado == "saindo"; dis = " disabled" if car else ""
    erro = aviso("<b>Não foi possível sair.</b><br>Confira sua conexão e tente de novo. Você continua conectado e nada foi perdido.", "erro", "alerta") if estado == "erro" else ""
    b1 = (f'<button class="btn-destr" type="button" aria-busy="true" disabled><span class="giro" aria-hidden="true"></span>Saindo…</button>' if car
          else f'<button class="btn-destr" type="button">{ic("seta",20) if False else ""}{"Tentar sair de novo" if estado == "erro" else "Sair"}</button>')
    corpo = (f'<section class="hero" aria-labelledby="h-sair"><div class="cena">{ilu_sair()}</div><div class="acao"><h1 id="h-sair">Sair da conta?</h1>'
             f'<p class="t2">Você vai precisar entrar de novo com seu e-mail e senha. Seus treinos e registros continuam salvos na sua conta.</p></div></section>'
             f'{erro}<p class="t2 peq" role="status">{"Saindo da conta…" if car else ""}</p><div class="acoes">{b1}<button class="btn2" type="button"{dis}>Cancelar</button></div>')
    vars_extra = f'<style>:root{{--cor-sobre-erro:{SOBRE_ERRO["claro"]}}}[data-tema=escuro]{{--cor-sobre-erro:{SOBRE_ERRO["escuro"]}}}</style>'
    return pagina(corpo, tema, "Sair", "", "perfil").replace('<link rel="stylesheet" href="quaru-v2.css">', '<link rel="stylesheet" href="quaru-v2.css"><link rel="stylesheet" href="sair.css">' + vars_extra)

# ---------- contraste ----------
CON = contraste_v2()
for t in TEMAS:
    for a, b, x, y, m in [("sobre-erro (texto do botão Sair)", "erro", SOBRE_ERRO[t], TEMAS[t]["erro"], 4.5), ("botão Sair (erro)", "fundo", TEMAS[t]["erro"], TEMAS[t]["fundo"], 3.0),
                          ("texto-suave (contorno dos ícones)", "primaria-suave", TEMAS[t]["texto-suave"], TEMAS[t]["primaria-suave"], 3.0), ("texto (traço dos ícones)", "primaria-suave", TEMAS[t]["texto"], TEMAS[t]["primaria-suave"], 3.0),
                          ("primaria (peças dos ícones)", "primaria-suave", TEMAS[t]["primaria"], TEMAS[t]["primaria-suave"], 3.0), ("secundaria (peças dos ícones)", "primaria-suave", TEMAS[t]["secundaria"], TEMAS[t]["primaria-suave"], 3.0)]:
        r = cr(x, y); CON.append(dict(tema=t, grupo="0.4.3", frente=a, fundo=b, cor_frente=x, cor_fundo=y, razao=round(r, 2), minimo=m, ok=r >= m))
falhas = [r for r in CON if not r["ok"]]; assert not falhas, falhas

# ---------- saída ----------
for k in EQUIP:
    s = icone(k); assert "<text" not in s and "<image" not in s and "filter" not in s and 'role="img"' in s and "<title" in s and 'aria-hidden="true"' in s and len(s) < 30000, k
    open(f"{EQ}/svg/equipamento-{NOMES[k]}.svg", "w").write(s)
s = ilu_sair(); open(f"{SA}/ilustracao-sair.svg", "w").write(s); assert len(s) < 30000 and "<text" not in s
copiar_recursos(f"{SA}/html/recursos")
MICRO = open("/home/box/redbox/clientes/domma-tecnologia/app-treinos/telas-v0.4.1/animacoes-v2.1/microinteracoes.css").read()
open(f"{SA}/html/quaru-v2.css", "w").write(tok_css() + "\n" + CSS + MICRO); open(f"{SA}/html/sair.css", "w").write(CSS_SAIR)
REG = []
def shot(pg, hp, arq, w, h, fs="16px"):
    pg.set_viewport_size({"width": w, "height": h}); pg.goto("file://" + hp); pg.wait_for_load_state("networkidle")
    pg.add_style_tag(content="*{animation:none!important;transition:none!important}")
    if fs != "16px": pg.add_style_tag(content=f"html{{font-size:{fs}}}")
    pg.wait_for_timeout(80)
    r = pg.evaluate("""(()=>{const h=document.documentElement.outerHTML,c={};document.querySelectorAll('[id]').forEach(e=>c[e.id]=(c[e.id]||0)+1);
      const svgs=[...document.querySelectorAll('svg[role=img]')];
      return {sw:document.documentElement.scrollWidth, malhou:h.toLowerCase().includes('malhou'), dup:Object.keys(c).filter(k=>c[k]>1),
       peq:[...document.querySelectorAll('button,a,[role=switch],[role=tab]')].filter(e=>{const b=e.getBoundingClientRect();return b.width>0&&(b.height<44||b.width<44)}).map(e=>e.className),
       ilu_sem_titulo:svgs.filter(s=>!s.querySelector('title')).length, erro_com_icone_e_texto:[...document.querySelectorAll('.aviso.erro')].every(a=>a.querySelector('svg')&&a.textContent.trim().length>10),
       desativados:[...document.querySelectorAll('button[disabled]')].map(b=>b.textContent.trim())}})()""")
    pg.screenshot(path=arq)
    ok = r["sw"] <= w and not r["malhou"] and not r["dup"] and not r["peq"] and not r["ilu_sem_titulo"] and r["erro_com_icone_e_texto"]
    REG.append(dict(arquivo=os.path.relpath(arq, RAIZ), largura=w, fonte=fs, ok=ok, **r))
with sync_playwright() as pw:
    br = pw.chromium.launch(); pg = br.new_page(device_scale_factor=2)
    for k in EQUIP:
        for t in TEMAS:
            hp = f"{EQ}/_t.html"; open(hp, "w").write(f'<html data-tema="{t}"><body style="margin:0;background:{TEMAS[t]["fundo"]}"><div style="width:192px;height:192px">{icone(k)}</div></body></html>')
            pg.set_viewport_size({"width": 192, "height": 192}); pg.goto("file://" + hp); pg.screenshot(path=f"{EQ}/png/equipamento-{NOMES[k]}_{t}.png")
    os.remove(f"{EQ}/_t.html")
    for t in TEMAS:
        for e in ("normal", "saindo", "erro"):
            hp = f"{SA}/html/tela-05b-sair_{t}_{e}.html"; open(hp, "w").write(sair(t, e))
            shot(pg, hp, f"{SA}/png/tela-05b-sair_celular_{t}_{e}.png", 390, 844); shot(pg, hp, f"{SA}/png/tela-05b-sair_computador_{t}_{e}.png", 1440, 900)
            if e == "saindo": assert set(REG[-1]["desativados"]) >= {"Saindo…", "Cancelar"}, REG[-1]["desativados"]
        for e in ("normal", "erro"):
            hp = f"{SA}/html/tela-05b-sair_{t}_{e}.html"
            shot(pg, hp, f"{SA}/validacao/tela-05b-sair_360x800_{t}_{e}.png", 360, 800); shot(pg, hp, f"{SA}/validacao/tela-05b-sair_fonte-130_{t}_{e}.png", 390, 844, "20.8px")
    br.close()
ruins = [r for r in REG if not r["ok"]]
json.dump(dict(contraste=CON, render=REG, problemas=ruins, tamanhos_svg={f: os.path.getsize(f"{EQ}/svg/{f}") for f in sorted(os.listdir(f"{EQ}/svg"))}), open(f"{RAIZ}/verificacao-v0.4.3.json", "w"), ensure_ascii=False, indent=1)
print(len(REG), "renders; problemas:", ruins, "; contraste:", len(CON), "pares ok")
FN = "/usr/share/fonts/truetype/sand-box/google/Inter/Inter-VariableFont_opsz,wght.ttf"
def prancha(lista, cols, tw, th, titulo, dest):
    rows = -(-len(lista)//cols); P = Image.new("RGB", (cols*(tw+24)+40, rows*(th+56)+110), "#F5F4F1"); d = ImageDraw.Draw(P)
    d.text((40, 28), titulo, fill="#14141A", font=ImageFont.truetype(FN, 30)); f = ImageFont.truetype(FN, 16)
    for i, (a, r) in enumerate(lista):
        x, y = 40+(i % cols)*(tw+24), 96+(i//cols)*(th+56); P.paste(Image.open(a).convert("RGB").resize((tw, th)), (x, y)); d.text((x, y+th+8), r, fill="#14141A", font=f)
    P.save(dest)
prancha([(f"{EQ}/png/equipamento-{NOMES[k]}_{t}.png", f"{NOMES[k]} · {t}") for k in EQUIP for t in TEMAS], 8, 160, 160, f"{MARCA['nome']} 0.4.3 · ícones de equipamento (claro e escuro)", f"{RAIZ}/prancha-equipamentos.png")
E = ("normal", "saindo", "erro")
prancha([(f"{SA}/png/tela-05b-sair_celular_{t}_{e}.png", f"celular · {t} · {e}") for t in TEMAS for e in E] + [(f"{SA}/validacao/{f}", f.replace("tela-05b-sair_", "").replace(".png", "")) for f in sorted(os.listdir(f"{SA}/validacao"))], 6, 234, 506, f"{MARCA['nome']} 0.4.3 · Perfil › Sair · celular 390×844 @2x + validação 360×800 e fonte 130%", f"{RAIZ}/_a.png")
prancha([(f"{SA}/png/tela-05b-sair_computador_{t}_{e}.png", f"web · {t} · {e}") for t in TEMAS for e in E], 3, 480, 300, "web 1440×900 @2x (coluna de 480 px)", f"{RAIZ}/_b.png")
A, B = Image.open(f"{RAIZ}/_a.png"), Image.open(f"{RAIZ}/_b.png"); P = Image.new("RGB", (max(A.width, B.width), A.height+B.height), "#F5F4F1"); P.paste(A, (0, 0)); P.paste(B, (0, A.height)); P.save(f"{RAIZ}/prancha-tela-sair.png")
os.remove(f"{RAIZ}/_a.png"); os.remove(f"{RAIZ}/_b.png"); print("ok")
