#!/usr/bin/env python3
"""Quaru 0.4.3 · r1 (revisão do Henriquiano): ícones de equipamento padronizados (só contorno, traço 4/6, raio 4) com nomes = ids de
mobile/src/dominio/equipamentos.ts; tela Sair com textos do app local e o fluxo "Sair e apagar meus dados deste aparelho" (EXCLUIR).
Cores = tokens.ts (paleta v0.3). Desenhado em código; sem banco de imagem, sem IA. Uso: python3 gerador/gerar_r1.py"""
import os, sys, json, re
import xml.etree.ElementTree as ET
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from telas import *
from ilustracoes import fundo, chao
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont
EQ = os.path.join(RAIZ, "equipamentos"); SA = os.path.join(RAIZ, "tela-sair")
for p in [f"{EQ}/svg", f"{EQ}/png", f"{EQ}/prova-24-48", f"{SA}/png", f"{SA}/validacao", f"{SA}/html/recursos"]: os.makedirs(p, exist_ok=True)
APP = "/home/box/domma/app-academia/app/mobile"
# ---------- ids e nomes direto do código ----------
src = open(f"{APP}/src/dominio/equipamentos.ts").read()
LISTA = re.findall(r"\{ id: '([^']+)', nome: '([^']+)' \}", src)
assert len(LISTA) == 10, LISTA
# ---------- ícones: só contorno, traço 6 (principal) e 4 (detalhe), raio 4, pontas redondas ----------
W1, W2, RAIO = 6, 4, 4
def L(d, w=W1, c="texto"): return f'<path d="{d}" fill="none" stroke="{V(c)}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
def R(x, y, w, h, sw=W1, c="texto"): return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{RAIO}" fill="none" stroke="{V(c)}" stroke-width="{sw}" stroke-linejoin="round"/>'
def O(cx, cy, r, sw=W1, c="texto"): return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{V(c)}" stroke-width="{sw}"/>'
DES = {
 "peso-corpo": O(48, 20, 9) + L("M48 30v28M48 58l-14 26M48 58l14 26") + L("M48 40l-18-16M48 40l18-16", c="primaria"),
 "halteres": L("M30 48h36", W2) + R(18, 30, 12, 36, c="primaria") + R(66, 30, 12, 36, c="primaria") + L("M10 40v16M86 40v16"),
 "barra-anilhas": L("M6 48h84", W2) + R(18, 22, 12, 52, c="primaria") + R(66, 22, 12, 52, c="primaria") + L("M36 36v24M60 36v24", W2),
 "banco": R(10, 30, 76, 16) + L("M24 46v32M72 46v32M14 78h20M62 78h20") + L("M48 46v14", W2),
 "polia": L("M22 86V12h40") + O(66, 22, 8, W2) + L("M72 26v34", W2, "primaria") + L("M60 64h24", c="primaria") + R(14, 52, 18, 26, W2) + L("M14 86h34"),
 "maquinas": L("M18 86V10M18 10h40M10 86h50") + R(28, 50, 14, 28, W2) + L("M28 59h14M28 68h14", W2) + R(54, 50, 26, 12, c="primaria") + L("M60 50V26", c="primaria") + L("M58 10v14", W2),
 "elastico": R(8, 38, 18, 20) + R(70, 38, 18, 20) + L("M26 48C38 24 58 72 70 48", c="primaria"),
 "kettlebell": L("M34 40V32a14 14 0 0 1 28 0v8") + O(48, 60, 22, c="primaria") + L("M38 56a10 10 0 0 1 8-8", W2, "primaria"),
 "barra-fixa": L("M18 86V18M78 86V18M10 86h16M70 86h16") + L("M12 26h72", c="primaria") + L("M38 28v12M58 28v12", W2),
 "esteira-bike": R(8, 64, 64, 14) + L("M18 71h44", W2) + L("M64 64L76 24", c="primaria") + L("M68 24h20", c="primaria") + L("M86 24v10", W2, "primaria"),
}
TIT = {i: n for i, n in LISTA}
def icone(k, idd=None): return svg_doc((96, 96), f"Equipamento: {TIT[k]}", DES[k], idd or f"eq-{k}")
def checa_icone(k, s):
    """Padrão: só contorno (fill=none), traço ∈ {4, 6} (≥ 4 em 96), no máximo 2 espessuras, raio 4 em todo retângulo."""
    corpo = s.split('<g aria-hidden="true">')[1].rsplit("</g>", 1)[0]
    root = ET.fromstring(f'<g xmlns="http://www.w3.org/2000/svg">{corpo}</g>')
    larg, prob = set(), []
    for el in root.iter():
        tag = el.tag.split("}")[1]
        if tag == "g": continue
        if el.get("fill") != "none": prob.append(f"{tag} preenchido")
        w = float(el.get("stroke-width", 0)); larg.add(w)
        if w < 4: prob.append(f"traço {w} < 4")
        if tag == "rect" and float(el.get("rx", 0)) != RAIO: prob.append(f"raio {el.get('rx')}")
    if len(larg) > 2: prob.append(f"espessuras {sorted(larg)}")
    for x in ("<text", "<image", "filter"): 
        if x in s: prob.append(x)
    return dict(icone=k, espessuras=sorted(larg), raio=RAIO, so_contorno=not any("preenchido" in p for p in prob), bytes=len(s), problemas=prob)

# ---------- tela Sair r1 ----------
TXT_SAIR = "Seus treinos e dados continuam salvos neste aparelho. Para voltar, toque em 'Continuar sem conta'. Não há cópia na nuvem; para guardar uma cópia, use Perfil › Exportar."
TXT_ERRO = "Não foi possível sair. Tente de novo; seus dados não foram alterados."
TXT_APAGAR = {"app": "Todos os seus treinos, rotinas, pesos, água, altura, foto de perfil e consentimentos serão apagados. Não dá para desfazer.",
              "web": "Todos os seus treinos, rotinas, pesos, água, altura, foto de perfil e consentimentos salvos NESTE navegador serão apagados. Os dados web ficam sem criptografia do aparelho; outros navegadores e o app no celular não são afetados. Não dá para desfazer."}
TXT_ERRO_APAGAR = "Não foi possível apagar e sair. Tente de novo; seus dados não foram alterados."
def ilu_sair(idd="ilu-sair"):
    T, S, P_, SS, EN = V("texto"), V("superficie"), V("primaria"), V("secundaria-suave"), V("energia")
    c = (fundo() + chao() + f'<rect x="212" y="52" width="92" height="160" rx="10" fill="{S}" stroke="{T}" stroke-width="4"/><path d="M220 60h76v148h-76z" fill="{SS}"/>'
         f'<path d="M220 60l56 14v130l-56 4z" fill="{P_}" stroke="{T}" stroke-width="3" stroke-linejoin="round"/><circle cx="262" cy="140" r="4" fill="{EN}"/>'
         f'<path d="M150 70h30M168 58l12 12-12 12" stroke="{P_}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' + pessoa(150, 212, 1.2, "acenar", 1, 0, "secundaria", coque=True))
    return svg_doc((360, 240), "Pessoa acenando ao lado de uma porta aberta", c, idd)
CSS_SAIR = """/* Sair r1: texto dos botões destrutivos = --cor-sobre-primaria (mesmos valores; não existe token sobre-erro) */
.btn-destr{min-height:52px;border-radius:14px;background:var(--cor-erro);color:var(--cor-sobre-primaria);font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px;padding:12px 20px;width:100%}
.btn-perigo{min-height:52px;border-radius:14px;border:2px solid var(--cor-erro);color:var(--cor-erro);background:transparent;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px;padding:10px 16px;width:100%;text-align:center}
.btn-texto{min-height:48px;color:var(--cor-primaria-texto);font-weight:700;text-decoration:underline;text-underline-offset:3px;width:100%}
.btn-destr:active,.btn-perigo:active{transform:scale(.97)}
button[disabled]{opacity:.45;cursor:not-allowed;box-shadow:none}
.giro{width:20px;height:20px;border-radius:50%;border:3px solid currentColor;border-right-color:transparent}
.acoes{display:flex;flex-direction:column;gap:12px}
.perigo-sep{border-top:1px solid var(--cor-borda);padding-top:16px;display:flex;flex-direction:column;gap:8px}
.campo{display:flex;flex-direction:column;gap:4px} .campo label{font-weight:700}
.inp{min-height:52px;width:100%;border:1.5px solid var(--cor-texto-suave);border-radius:14px;background:var(--cor-superficie);padding:12px 16px;color:var(--cor-texto);font:inherit;font-size:1rem;letter-spacing:.08em}
.inp::placeholder{color:var(--cor-texto-suave);opacity:1;letter-spacing:0} .inp:focus{outline:3px solid var(--cor-foco);outline-offset:1px}
.ajuda{font-size:.875rem;color:var(--cor-texto-suave)}
.modal{max-height:100vh;overflow-y:auto}
"""
def sair(tema, estado):
    car = estado == "saindo"; dis = " disabled" if car else ""
    err = aviso(f"<b>Não foi possível sair.</b><br>{TXT_ERRO.replace('Não foi possível sair. ', '')}", "erro", "alerta") if estado == "erro" else ""
    b = ('<button class="btn" type="button" aria-busy="true" disabled><span class="giro" aria-hidden="true"></span>Saindo…</button>' if car
         else f'<button class="btn" type="button">{"Tentar de novo" if estado == "erro" else "Sair"}</button>')
    corpo = (f'<section class="hero" aria-labelledby="h-sair"><div class="cena">{ilu_sair()}</div><div class="acao"><h1 id="h-sair">Sair?</h1><p class="t2">{TXT_SAIR}</p></div></section>'
             f'{err}<p class="t2 peq" role="status">{"Saindo…" if car else ""}</p><div class="acoes">{b}<button class="btn2" type="button"{dis}>Cancelar</button>'
             f'<div class="perigo-sep"><button class="btn-perigo" type="button"{dis}>{ic("alerta",20)} Sair e apagar meus dados deste aparelho</button></div></div>')
    return pagina(corpo, tema, "Sair", "", "perfil", ).replace(SIM, "").replace('<link rel="stylesheet" href="quaru-v2.css">', '<link rel="stylesheet" href="quaru-v2.css"><link rel="stylesheet" href="sair.css">')
def apagar(tema, estado, plataforma):
    car = estado == "saindo"; dis = " disabled" if car else ""
    val = "" if estado == "normal" else ' value="EXCLUIR"'
    ok = estado in ("confirmado", "erro")
    err = aviso(f"<b>Não foi possível apagar e sair.</b><br>{TXT_ERRO_APAGAR.replace('Não foi possível apagar e sair. ', '')}", "erro", "alerta") if estado == "erro" else ""
    b = ('<button class="btn-destr" type="button" aria-busy="true" disabled><span class="giro" aria-hidden="true"></span>Apagando…</button>' if car
         else f'<button class="btn-destr" type="button"{"" if ok else " disabled"} aria-describedby="aj">{ic("alerta",20)} {"Tentar de novo" if estado == "erro" else "Apagar e sair"}</button>')
    folha = (f'<div class="modal-fundo"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="h-ap" style="position:relative">'
             f'<h2 id="h-ap">Sair e apagar os dados deste aparelho?</h2><p class="t2">{TXT_APAGAR[plataforma]}</p>{err}'
             f'<div class="campo"><label for="confirma">Digite EXCLUIR para confirmar</label><input class="inp" id="confirma" name="confirma" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="EXCLUIR"{val}{dis}>'
             f'<span class="ajuda" id="aj">{"O botão fica ativo quando você digitar EXCLUIR." if estado == "normal" else "Confirmação digitada."}</span></div>'
             f'<p class="t2 peq" role="status">{"Apagando os dados deste aparelho…" if car else ""}</p>{b}<button class="btn-texto" type="button"{dis}>Cancelar</button></div></div>')
    base = sair(tema, "normal")
    return base.replace("</body>", folha + "</body>")

# ---------- contraste ----------
CON = contraste_v2()
for t in TEMAS:
    c = TEMAS[t]
    for a, b, x, y, m in [("sobre-primaria (texto do botão destrutivo)", "erro", c["sobre-primaria"], c["erro"], 4.5), ("erro (texto/borda do botão de perigo)", "fundo", c["erro"], c["fundo"], 4.5),
                          ("erro (texto do botão de perigo)", "superficie", c["erro"], c["superficie"], 4.5), ("texto (traço dos ícones)", "fundo", c["texto"], c["fundo"], 3.0),
                          ("texto (traço dos ícones)", "superficie", c["texto"], c["superficie"], 3.0), ("primaria (traço dos ícones)", "fundo", c["primaria"], c["fundo"], 3.0),
                          ("primaria (traço dos ícones)", "superficie", c["primaria"], c["superficie"], 3.0)]:
        r = cr(x, y); CON.append(dict(tema=t, grupo="0.4.3-r1", frente=a, fundo=b, cor_frente=x, cor_fundo=y, razao=round(r, 2), minimo=m, ok=r >= m))
assert not [r for r in CON if not r["ok"]], [r for r in CON if not r["ok"]]

# ---------- saída ----------
PADRAO = []
for k, _ in LISTA:
    s = icone(k); ch = checa_icone(k, s); PADRAO.append(ch); assert not ch["problemas"], ch
    open(f"{EQ}/svg/equipamento-{k}.svg", "w").write(s)
open(f"{SA}/ilustracao-sair.svg", "w").write(ilu_sair())
copiar_recursos(f"{SA}/html/recursos")
MICRO = open("/home/box/redbox/clientes/domma-tecnologia/app-treinos/telas-v0.4.1/animacoes-v2.1/microinteracoes.css").read()
open(f"{SA}/html/quaru-v2.css", "w").write(tok_css() + "\n" + CSS + MICRO); open(f"{SA}/html/sair.css", "w").write(CSS_SAIR)
REG = []
def shot(pg, hp, arq, w, h, fs="16px", esperado=None):
    pg.set_viewport_size({"width": w, "height": h}); pg.goto("file://" + hp); pg.wait_for_load_state("networkidle")
    pg.add_style_tag(content="*{animation:none!important;transition:none!important}")
    if fs != "16px": pg.add_style_tag(content=f"html{{font-size:{fs}}}")
    pg.wait_for_timeout(80)
    r = pg.evaluate("""(()=>{const h=document.documentElement.outerHTML,c={};document.querySelectorAll('[id]').forEach(e=>c[e.id]=(c[e.id]||0)+1);
      return {sw:document.documentElement.scrollWidth, texto:document.body.innerText, malhou:h.toLowerCase().includes('malhou'), dup:Object.keys(c).filter(k=>c[k]>1),
       peq:[...document.querySelectorAll('button,a,input,[role=switch],[role=tab]')].filter(e=>{const b=e.getBoundingClientRect();return b.width>0&&(b.height<44||b.width<44)}).map(e=>e.className),
       ilu_sem_titulo:[...document.querySelectorAll('svg[role=img]')].filter(s=>!s.querySelector('title')).length,
       erro_ok:[...document.querySelectorAll('.aviso.erro')].every(a=>a.querySelector('svg')&&a.textContent.trim().length>10),
       inline_sobre_erro:h.includes('--cor-sobre-erro'), selo:h.includes('SIMULAÇÃO'), modal_cabe:(()=>{const m=document.querySelector('.modal');return !m||m.getBoundingClientRect().top>=0})(), conta:/e-mail e senha|na sua conta|conexão/.test(document.body.innerText),
       desativados:[...document.querySelectorAll('button[disabled],input[disabled]')].map(b=>b.textContent.trim()||b.id)}})()""")
    pg.screenshot(path=arq)
    falta = [t for t in (esperado or []) if t not in r["texto"].replace("\n", " ")]
    r.pop("texto"); r["textos_faltando"] = falta
    ok = r["sw"] <= w and not r["malhou"] and not r["dup"] and not r["peq"] and not r["ilu_sem_titulo"] and r["erro_ok"] and not r["inline_sobre_erro"] and not r["conta"] and not falta and not r["selo"] and r["modal_cabe"]
    REG.append(dict(arquivo=os.path.relpath(arq, RAIZ), largura=w, fonte=fs, ok=ok, **r))
with sync_playwright() as pw:
    br = pw.chromium.launch(); pg = br.new_page(device_scale_factor=2)
    for k, _ in LISTA:
        for t in TEMAS:
            hp = f"{EQ}/_t.html"
            for px, arq in ((192, f"{EQ}/png/equipamento-{k}_{t}.png"),):
                open(hp, "w").write(f'<html data-tema="{t}"><body style="margin:0;background:{TEMAS[t]["fundo"]}"><div style="width:{px}px;height:{px}px">{icone(k)}</div></body></html>')
                pg.set_viewport_size({"width": px, "height": px}); pg.goto("file://" + hp); pg.screenshot(path=arq)
    # prova 24 e 48 px (1x, sem escala do dispositivo)
    p1 = br.new_page(device_scale_factor=1)
    for k, _ in LISTA:
        for t in TEMAS:
            for px in (24, 48):
                open(hp, "w").write(f'<html data-tema="{t}"><body style="margin:0;background:{TEMAS[t]["fundo"]}"><div style="width:{px}px;height:{px}px">{icone(k)}</div></body></html>')
                p1.set_viewport_size({"width": px, "height": px}); p1.goto("file://" + hp); p1.screenshot(path=f"{EQ}/prova-24-48/equipamento-{k}_{px}px_{t}.png")
    os.remove(hp)
    for t in TEMAS:
        for e in ("normal", "saindo", "erro"):
            hp = f"{SA}/html/tela-05b-sair_{t}_{e}.html"; open(hp, "w").write(sair(t, e))
            esp = [TXT_SAIR] + ([TXT_ERRO.split(". ")[1]] if e == "erro" else [])
            shot(pg, hp, f"{SA}/png/tela-05b-sair_celular_{t}_{e}.png", 390, 844, esperado=esp); shot(pg, hp, f"{SA}/png/tela-05b-sair_computador_{t}_{e}.png", 1440, 900, esperado=esp)
        for e in ("normal", "confirmado", "saindo", "erro"):
            for plat, disp, (w, h) in (("app", "celular", (390, 844)), ("web", "computador", (1440, 900))):
                hp = f"{SA}/html/tela-05c-sair-apagar_{plat}_{t}_{e}.html"; open(hp, "w").write(apagar(t, e, plat))
                shot(pg, hp, f"{SA}/png/tela-05c-sair-apagar_{disp}_{t}_{e}.png", w, h, esperado=[TXT_APAGAR[plat], "Digite EXCLUIR para confirmar"])
        for nome in ("tela-05b-sair_{t}_normal", "tela-05b-sair_{t}_erro", "tela-05c-sair-apagar_app_{t}_normal", "tela-05c-sair-apagar_app_{t}_erro"):
            hp = f"{SA}/html/{nome.format(t=t)}.html"; b = nome.format(t=t)
            shot(pg, hp, f"{SA}/validacao/{b}_360x800.png", 360, 800); shot(pg, hp, f"{SA}/validacao/{b}_fonte-130.png", 390, 844, "20.8px")
    br.close()
# conferência textual exata nos HTML
for f in os.listdir(f"{SA}/html"):
    if f.startswith("tela-05b"): s = open(f"{SA}/html/{f}").read(); assert TXT_SAIR.replace("'", "'") in s or TXT_SAIR.replace("'", "&#x27;") in s, f
    if "erro" in f and f.startswith("tela-05b"): assert "Tente de novo; seus dados não foram alterados." in open(f"{SA}/html/{f}").read()
ruins = [r for r in REG if not r["ok"]]
json.dump(dict(ids_do_codigo=LISTA, padrao_icones=PADRAO, contraste=CON, render=REG, problemas=ruins), open(f"{RAIZ}/verificacao-r1.json", "w"), ensure_ascii=False, indent=1)
print(len(REG), "renders; problemas:", json.dumps(ruins, ensure_ascii=False)[:1500], "; contraste:", len(CON), "ok; ícones:", [(p["icone"], p["espessuras"]) for p in PADRAO])
# ---------- pranchas ----------
FN = "/usr/share/fonts/truetype/sand-box/google/Inter/Inter-VariableFont_opsz,wght.ttf"
def prancha(lista, cols, tw, th, titulo, dest, fs=16):
    rows = -(-len(lista)//cols); P = Image.new("RGB", (cols*(tw+24)+40, rows*(th+56)+110), "#F5F4F1"); d = ImageDraw.Draw(P)
    d.text((40, 28), titulo, fill="#14141A", font=ImageFont.truetype(FN, 30)); f = ImageFont.truetype(FN, fs)
    for i, (a, r) in enumerate(lista):
        x, y = 40+(i % cols)*(tw+24), 96+(i//cols)*(th+56); P.paste(Image.open(a).convert("RGB").resize((tw, th)), (x, y)); d.text((x, y+th+8), r, fill="#14141A", font=f)
    return P
prancha([(f"{EQ}/png/equipamento-{k}_{t}.png", f"{k} · {t}") for k, _ in LISTA for t in TEMAS], 8, 160, 160, f"{MARCA['nome']} 0.4.3 r1 · ícones de equipamento (só contorno, traço 4/6, raio 4)", f"{RAIZ}/_x.png").save(f"{RAIZ}/prancha-equipamentos-r1.png")
# prova: 24 e 48 px reais (1:1) + ampliado 4x sem suavizar
FW = ImageFont.truetype(FN, 16); cw = 24 + 8 + 48 + 8 + 96 + 8 + 192
P = Image.new("RGB", (40 + 2*(cw+32), 110 + len(LISTA)*(200+16)), "#F5F4F1"); d = ImageDraw.Draw(P)
d.text((40, 28), f"{MARCA['nome']} 0.4.3 r1 · prova de leitura: 24 e 48 px reais (1:1) e ampliados 4× sem suavizar", fill="#14141A", font=ImageFont.truetype(FN, 26))
d.text((40, 70), "colunas por tema: 24 px · 48 px · 24 px ×4 · 48 px ×4", fill="#5C5257", font=FW)
for i, (k, n) in enumerate(LISTA):
    y = 110 + i*216
    for j, t in enumerate(TEMAS):
        x0 = 40 + j*(cw+32); d.rectangle((x0-8, y-8, x0+cw+8, y+200), fill=TEMAS[t]["fundo"])
        a, b = Image.open(f"{EQ}/prova-24-48/equipamento-{k}_24px_{t}.png").convert("RGB"), Image.open(f"{EQ}/prova-24-48/equipamento-{k}_48px_{t}.png").convert("RGB")
        P.paste(a, (x0, y+12)); P.paste(b, (x0+32, y+12)); P.paste(a.resize((96, 96), Image.NEAREST), (x0+88, y+12)); P.paste(b.resize((192, 192), Image.NEAREST), (x0+192, y))
        d.text((x0, y+120), f"{k}", fill=TEMAS[t]["texto"], font=FW); d.text((x0, y+142), n, fill=TEMAS[t]["texto-suave"], font=FW)
P.save(f"{RAIZ}/prancha-prova-24-48px-r1.png")
E = ("normal", "saindo", "erro"); E2 = ("normal", "confirmado", "saindo", "erro")
A = prancha([(f"{SA}/png/tela-05b-sair_celular_{t}_{e}.png", f"Sair · {t} · {e}") for t in TEMAS for e in E] + [(f"{SA}/png/tela-05c-sair-apagar_celular_{t}_{e}.png", f"Apagar · {t} · {e}") for t in TEMAS for e in E2], 7, 234, 506, f"{MARCA['nome']} 0.4.3 r1 · Perfil › Sair e Sair e apagar · celular 390×844 @2x", f"{RAIZ}/_a.png", 14)
B = prancha([(f"{SA}/png/tela-05b-sair_computador_{t}_{e}.png", f"Sair · web · {t} · {e}") for t in TEMAS for e in E] + [(f"{SA}/png/tela-05c-sair-apagar_computador_{t}_{e}.png", f"Apagar · web · {t} · {e}") for t in TEMAS for e in E2], 4, 480, 300, "web 1440×900 @2x (coluna de 480 px; texto de apagar na versão web)", f"{RAIZ}/_b.png")
Cc = prancha([(f"{SA}/validacao/{f}", f.replace("tela-05", "").replace(".png", "")) for f in sorted(os.listdir(f"{SA}/validacao"))], 8, 195, 422, "validação: 360×800 e fonte 130%", f"{RAIZ}/_c.png", 11)
P = Image.new("RGB", (max(A.width, B.width, Cc.width), A.height+B.height+Cc.height), "#F5F4F1"); P.paste(A, (0, 0)); P.paste(B, (0, A.height)); P.paste(Cc, (0, A.height+B.height)); P.save(f"{RAIZ}/prancha-tela-sair-r1.png")
print("ok")
