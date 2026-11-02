#!/usr/bin/env python3
"""Gera a rodada 2 de logos do app de treinos da Domma (nomes PROVISÓRIOS).
Tudo em código/vetor: fontTools (texto em curvas), cairosvg (PNG/PDF), weasyprint (prancha PDF).
Uso: python3 gerar.py"""
import os, io
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import cairosvg

AQUI = os.path.dirname(os.path.abspath(__file__))
G = "/usr/share/fonts/truetype/sand-box/google/"
FONTES = {"sora": (G+"Sora/Sora-VariableFont_wght.ttf", 700),
          "outfit": (G+"Outfit/Outfit-VariableFont_wght.ttf", 600),
          "unbounded": (G+"Unbounded/Unbounded-VariableFont_wght.ttf", 700)}
_cache = {}
def fonte(k):
    if k not in _cache:
        p, w = FONTES[k]; f = TTFont(p)
        _cache[k] = instantiateVariableFont(f, {"wght": w})
    return _cache[k]

def texto(k, s, x, y, alt, track=0):
    """Retorna (path_d, largura) do texto s em curvas; alt = altura de versal em px."""
    f = fonte(k); gs = f.getGlyphSet(); cmap = f.getBestCmap()
    cap = getattr(f["OS/2"], "sCapHeight", 0) or f["head"].unitsPerEm*0.7
    e = alt/cap; pen = SVGPathPen(gs); cx = 0
    for ch in s:
        g = cmap[ord(ch)]
        gs[g].draw(TransformPen(pen, (e, 0, 0, -e, x+cx*e, y)))
        cx += gs[g].width + track
    return pen.getCommands(), (cx-track)*e

def licenca(k):
    n = fonte(k)["name"]
    return (n.getDebugName(1), n.getDebugName(13) or "", n.getDebugName(14) or "")

# ---------- símbolos (desenhados para caixa 0..100) ----------
def sim_tervo(c):
    # "T de pausa": barra superior em gota + haste separada por um vão = a pausa entre séries
    return (f'<g fill="{c}"><path d="M8 30A20 20 0 0 1 28 10H92V22A20 20 0 0 1 72 42H8z"/>'
            f'<path d="M36 54H64V78A14 14 0 0 1 50 92A14 14 0 0 1 36 78z"/></g>')
def sim_quaru(c):
    # "Q de descanso": anel de timer com um quarto aberto; a cauda é o ponteiro saindo do anel
    return (f'<g fill="none" stroke="{c}" stroke-width="16" stroke-linecap="round">'
            f'<path d="M50 12A38 38 0 1 0 88 50"/>'
            f'<path d="M66 66L90 90"/></g>')
def sim_zirvo(c):
    # "Z de ida e volta": duas lâminas paralelas deslocadas = a série (ida) e o descanso (volta)
    return (f'<g fill="{c}"><path d="M10 10H82L58 44H10z"/>'
            f'<path d="M90 90H18L42 56H90z"/></g>')

OPCOES = [
  dict(n=1, nome="Tervo", fonte="sora", sim=sim_tervo, cor="#2B4CFF", acento="#FF5C7A", fundo="#0D1330",
       conceito="T de pausa: a barra e a haste do T separadas por um vão, o descanso entre séries.",
       distintiva="Nome inventado + T geométrico com vão (pausa); azul-cobalto, fora do laranja/amarelo comum no setor."),
  dict(n=2, nome="Quaru", fonte="outfit", sim=sim_quaru, cor="#E0263F", acento="#FFD9DE", fundo="#1A0E12",
       conceito="Q de descanso: anel de cronômetro com um quarto aberto; a cauda do Q é o ponteiro.",
       distintiva="Nome arbitrário sem sentido no setor + Q-cronômetro (timer de descanso, função central); carmim sobre vinho."),
  dict(n=3, nome="Zirvo", fonte="unbounded", sim=sim_zirvo, cor="#FFB000", acento="#FFE7A8", fundo="#0E2A47",
       conceito="Z de ida e volta: duas lâminas deslocadas, a série e o descanso alternando.",
       distintiva="Nome inventado, Z inicial raro no setor + monograma de duas lâminas; âmbar sobre azul-petróleo."),
]

def svg(w, h, corpo, bg=None):
    b = f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ""
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">{b}{corpo}</svg>'

def logo(o, csim, ctxt, bg=None):
    d, lw = texto(o["fonte"], o["nome"], 0, 0, 64)
    W = 40+100+36+lw+40; H = 180
    corpo = (f'<g transform="translate(40,40)">{o["sim"](csim)}</g>'
             f'<path transform="translate(176,122)" d="{d}" fill="{ctxt}"/>')
    return svg(round(W), H, corpo, bg)

def simbolo(o, c, bg=None):
    return svg(120, 120, f'<g transform="translate(10,10)">{o["sim"](c)}</g>', bg)

def icone(o):
    corpo = (f'<rect width="1024" height="1024" rx="0" fill="{o["fundo"]}"/>'
             f'<g transform="translate(262,262) scale(5)">{o["sim"](o["cor"])}</g>')
    return svg(1024, 1024, corpo)

def salvar(pasta, nome, s, png_w=None):
    p = os.path.join(pasta, nome)
    open(p+".svg", "w").write(s)
    cairosvg.svg2pdf(bytestring=s.encode(), write_to=p+".pdf")
    cairosvg.svg2png(bytestring=s.encode(), write_to=p+".png", output_width=png_w)

for o in OPCOES:
    pasta = os.path.join(AQUI, f'opcao-{o["n"]}'); os.makedirs(pasta, exist_ok=True)
    base = o["nome"].lower()
    salvar(pasta, f"{base}-colorido", logo(o, o["cor"], "#14141A"), 2400)
    salvar(pasta, f"{base}-colorido-fundo-escuro", logo(o, o["cor"], "#FFFFFF", o["fundo"]), 2400)
    salvar(pasta, f"{base}-1cor", logo(o, "#14141A", "#14141A"), 2400)
    salvar(pasta, f"{base}-branco", logo(o, "#FFFFFF", "#FFFFFF"), 2400)  # fundo transparente
    salvar(pasta, f"{base}-simbolo", simbolo(o, o["cor"]), 1024)
    salvar(pasta, f"{base}-icone-app-1024", icone(o), 1024)
    fam, lic, url = licenca(o["fonte"])
    open(os.path.join(pasta, "ficha.md"), "w").write(
f"""# Opção {o['n']} · {o['nome']} (nome PROVISÓRIO, sujeito à análise da advogada)

**Conceito:** {o['conceito']}

**Por que é distintiva:** {o['distintiva']}

**Cores:** principal {o['cor']} · acento {o['acento']} · fundo do ícone {o['fundo']} · texto #14141A

**Fonte:** {fam} (arquivo {os.path.basename(FONTES[o['fonte']][0])}, peso {FONTES[o['fonte']][1]}); texto convertido em curvas.
Licença registrada no arquivo da fonte: {lic.strip()[:300]} {url}

**Arquivos (SVG, PDF, PNG):** {base}-colorido, {base}-colorido-fundo-escuro, {base}-1cor, {base}-branco (fundo transparente), {base}-simbolo, {base}-icone-app-1024 (1024×1024, cantos retos: a loja aplica a máscara).
""")

# ---------- prancha ----------
PW, linha = 2400, 520
partes = [f'<rect width="{PW}" height="{280+linha*3+200}" fill="#F5F4F1"/>']
d, _ = texto("sora", "App de treinos Domma · logos rodada 2 · nomes PROVISÓRIOS", 80, 140, 44)
partes.append(f'<path d="{d}" fill="#14141A"/>')
for i, o in enumerate(OPCOES):
    y = 260 + i*linha
    partes.append(f'<rect x="60" y="{y}" width="{PW-120}" height="{linha-40}" rx="24" fill="#FFFFFF"/>')
    l = logo(o, o["cor"], "#14141A").split(">", 1)[1].rsplit("</svg>", 1)[0]
    partes.append(f'<g transform="translate(100,{y+60}) scale(1.6)">{l}</g>')
    ic = icone(o).split(">", 1)[1].rsplit("</svg>", 1)[0]
    partes.append(f'<g transform="translate({PW-760},{y+50})"><clipPath id="c{i}"><rect width="300" height="300" rx="66"/></clipPath><g clip-path="url(#c{i})"><g transform="scale({300/1024})">{ic}</g></g></g>')
    l1 = logo(o, "#FFFFFF", "#FFFFFF").split(">", 1)[1].rsplit("</svg>", 1)[0]
    partes.append(f'<rect x="{PW-420}" y="{y+50}" width="300" height="140" rx="16" fill="{o["fundo"]}"/><g transform="translate({PW-410},{y+75}) scale(0.5)">{l1}</g>')
    l2 = logo(o, "#14141A", "#14141A").split(">", 1)[1].rsplit("</svg>", 1)[0]
    partes.append(f'<g transform="translate({PW-410},{y+215}) scale(0.5)">{l2}</g>')
    d, _ = texto("outfit", f'Opção {o["n"]} · {o["nome"]} (provisório): {o["distintiva"]}', 100, y+430, 24)
    partes.append(f'<path d="{d}" fill="#3A3A44"/>')
aviso = "Aviso: avaliação de design, não parecer jurídico. Nomes provisórios, sujeitos à análise da advogada e à busca no INPI (não consultado)."
d, _ = texto("outfit", aviso, 80, 260+linha*3+60, 24)
partes.append(f'<path d="{d}" fill="#B0002A"/>')
prancha = svg(PW, 280+linha*3+200, "".join(partes))
open(os.path.join(AQUI, "prancha.svg"), "w").write(prancha)
cairosvg.svg2png(bytestring=prancha.encode(), write_to=os.path.join(AQUI, "prancha.png"))
cairosvg.svg2pdf(bytestring=prancha.encode(), write_to=os.path.join(AQUI, "prancha.pdf"))
print("ok")

# ================= RODADA 2b: Quaru v2 + prancha atualizada =================
import math
def _arco(cx, cy, r, a0, a1):
    p = lambda a: (cx + r*math.cos(math.radians(a)), cy + r*math.sin(math.radians(a)))
    (x0, y0), (x1, y1) = p(a0), p(a1)
    grande = 1 if (a1 - a0) % 360 > 180 else 0
    return f"M{x0:.2f} {y0:.2f}A{r} {r} 0 {grande} 1 {x1:.2f} {y1:.2f}"

def sim_quaru_v2(c):
    # Anel quase fechado (abre só onde entra o ponteiro) + botão de cronômetro no alto + ponteiro curto e reto
    return (f'<g fill="none" stroke="{c}" stroke-width="13">'
            f'<path d="{_arco(50,56,32,70,380)}" stroke-linecap="round"/>'
            f'<path d="M58 64L86 92" stroke-linecap="butt" stroke-width="14"/></g>'
            f'<g fill="{c}"><rect x="44" y="12" width="12" height="9"/><rect x="38" y="4" width="24" height="9" rx="3"/></g>')

def sim_quaru_16(c):
    # Versão para 16 px: anel fechado e grosso, botão em bloco, ponteiro grosso cruzando o anel (lê como Q, nunca C/G)
    return (f'<g fill="none" stroke="{c}"><circle cx="48" cy="56" r="30" stroke-width="18"/>'
            f'<path d="M60 68L92 100" stroke-width="20"/></g>'
            f'<rect x="36" y="0" width="24" height="16" fill="{c}"/>')

V2 = dict(OPCOES[1]); V2.update(sim=sim_quaru_v2,
    conceito="Q-cronômetro v2: anel com botão de cronômetro no alto e ponteiro curto e reto como cauda.",
    distintiva="Q-cronômetro com botão e ponteiro reto: lê como Q e como timer de descanso; carmim sobre vinho.")
pv = os.path.join(AQUI, "quaru_v2"); os.makedirs(pv, exist_ok=True)
salvar(pv, "quaru-v2-colorido", logo(V2, V2["cor"], "#14141A"), 2400)
salvar(pv, "quaru-v2-colorido-fundo-escuro", logo(V2, V2["cor"], "#FFFFFF", V2["fundo"]), 2400)
salvar(pv, "quaru-v2-1cor", logo(V2, "#14141A", "#14141A"), 2400)
salvar(pv, "quaru-v2-branco", logo(V2, "#FFFFFF", "#FFFFFF"), 2400)
salvar(pv, "quaru-v2-simbolo", simbolo(V2, V2["cor"]), 1024)
salvar(pv, "quaru-v2-icone-app-1024", icone(V2), 1024)
# ícone 16 px: grade de 16 unidades, símbolo ocupa quase tudo
ic16 = svg(16, 16, f'<rect width="16" height="16" fill="{V2["fundo"]}"/>'
                   f'<g transform="translate(1.6,1.6) scale(0.125)">{sim_quaru_16(V2["cor"])}</g>')
salvar(pv, "quaru-v2-icone-16", ic16, 16)
for px in (16, 32, 48):  # prévias
    src = ic16 if px == 16 else icone(V2)
    cairosvg.svg2png(bytestring=src.encode(), write_to=os.path.join(pv, f"previa-{px}px.png"), output_width=px)
open(os.path.join(pv, "ficha.md"), "w").write(f"""# Quaru v2 (nome PROVISÓRIO, sujeito à análise da advogada)

**Ajustes sobre a opção 2:** (1) botão de cronômetro no alto do anel; (2) perna mais curta e reta, como ponteiro, cruzando o anel (não lê como G ou C); (3) versão própria para 16 px: anel fechado e mais grosso, botão em bloco, ponteiro grosso, sem detalhes finos.

**Cores:** {V2['cor']} · fundo do ícone {V2['fundo']} · texto #14141A. **Fonte:** Outfit 600 (OFL 1.1), texto em curvas.

**Arquivos (SVG, PDF, PNG):** quaru-v2-colorido, -colorido-fundo-escuro, -1cor, -branco, -simbolo, -icone-app-1024, -icone-16; prévias previa-16px/32px/48px.png.
A opção 2 original continua em ../opcao-2/.
""")

def _in(s): return s.split(">", 1)[1].rsplit("</svg>", 1)[0]
PH = 2000
P = [f'<rect width="{PW}" height="{PH}" fill="#F5F4F1"/>']
def T(k, s, x, y, a, c="#14141A"):
    d, w = texto(k, s, x, y, a); P.append(f'<path d="{d}" fill="{c}"/>'); return w
T("sora", "App de treinos Domma · logos rodada 2 (atualizada) · nomes PROVISÓRIOS", 80, 130, 40)
# destaque Quaru v2
P.append(f'<rect x="60" y="200" width="{PW-120}" height="900" rx="24" fill="#FFFFFF"/>')
T("outfit", "RECOMENDADA · Quaru v2 (provisório)", 100, 270, 34, V2["cor"])
P.append(f'<g transform="translate(100,320) scale(2.2)">{_in(logo(V2, V2["cor"], "#14141A"))}</g>')
P.append(f'<g transform="translate({PW-800},300)"><clipPath id="v2c"><rect width="360" height="360" rx="80"/></clipPath><g clip-path="url(#v2c)"><g transform="scale({360/1024})">{_in(icone(V2))}</g></g></g>')
P.append(f'<rect x="{PW-400}" y="300" width="300" height="140" rx="16" fill="{V2["fundo"]}"/><g transform="translate({PW-390},325) scale(0.5)">{_in(logo(V2,"#FFFFFF","#FFFFFF"))}</g>')
P.append(f'<g transform="translate({PW-390},470) scale(0.5)">{_in(logo(V2,"#14141A","#14141A"))}</g>')
# antes e depois + 16/32/48
T("outfit", "Antes", 100, 780, 26, "#6A6A74"); T("outfit", "Depois", 400, 780, 26, "#6A6A74")
P.append(f'<g transform="translate(100,800) scale(2)">{_in(simbolo(OPCOES[1], OPCOES[1]["cor"]))}</g>')
P.append(f'<g transform="translate(400,800) scale(2)">{_in(simbolo(V2, V2["cor"]))}</g>')
x = 800
T("outfit", "Ícone em tamanho real: 16, 32 e 48 px (16 px usa a versão simplificada)", 800, 780, 26, "#6A6A74")
for px in (16, 32, 48):
    src = ic16 if px == 16 else icone(V2); base = 16 if px == 16 else 1024
    P.append(f'<g transform="translate({x},{900-px/2}) scale({px/base})">{_in(src)}</g>'); x += px + 60
P.append(f'<g transform="translate({x+40},820) scale(10)">{_in(ic16)}</g>')
T("outfit", "16 px ampliado", x+40, 1010, 22, "#6A6A74")
T("outfit", "Por que é distintiva: " + V2["distintiva"], 100, 1070, 24, "#3A3A44")
# Zirvo segunda
Z = OPCOES[2]
P.append(f'<rect x="60" y="1140" width="{PW-120}" height="420" rx="24" fill="#FFFFFF"/>')
T("outfit", "2ª opção · Zirvo (provisório)", 100, 1200, 30, "#14141A")
P.append(f'<g transform="translate(100,1230) scale(1.5)">{_in(logo(Z, Z["cor"], "#14141A"))}</g>')
P.append(f'<g transform="translate({PW-760},1190)"><clipPath id="zc"><rect width="260" height="260" rx="58"/></clipPath><g clip-path="url(#zc)"><g transform="scale({260/1024})">{_in(icone(Z))}</g></g></g>')
P.append(f'<rect x="{PW-420}" y="1190" width="300" height="140" rx="16" fill="{Z["fundo"]}"/><g transform="translate({PW-410},1215) scale(0.5)">{_in(logo(Z,"#FFFFFF","#FFFFFF"))}</g>')
T("outfit", "Por que é distintiva: " + Z["distintiva"], 100, 1520, 24, "#3A3A44")
# Tervo descartada
Tv = OPCOES[0]
P.append(f'<rect x="60" y="1600" width="{PW-120}" height="200" rx="24" fill="#ECEBE8"/>')
P.append(f'<g transform="translate(100,1620) scale(0.9)" opacity="0.35">{_in(logo(Tv, "#14141A", "#14141A"))}</g>')
T("outfit", "DESCARTADA · Tervo: retirada desta rodada (existe app homônimo, um tradutor na App Store).", 620, 1720, 26, "#8A8A92")
T("outfit", "Aviso: avaliação de design, não parecer jurídico. Nomes provisórios, sujeitos à análise da advogada e à busca no INPI (não consultado).", 80, 1900, 24, "#B0002A")
prancha = svg(PW, PH, "".join(P))
open(os.path.join(AQUI, "prancha.svg"), "w").write(prancha)
cairosvg.svg2png(bytestring=prancha.encode(), write_to=os.path.join(AQUI, "prancha.png"))
cairosvg.svg2pdf(bytestring=prancha.encode(), write_to=os.path.join(AQUI, "prancha.pdf"))
print("v2 ok")
