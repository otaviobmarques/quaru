#!/usr/bin/env python3
"""Arquivos finais da marca Quaru (a partir de logo-rodada-2/quaru_v2). Gratuito: fontTools + cairosvg.
Uso: python3 gerar_quaru.py  -> gera tudo nesta pasta e o zip ao lado."""
import os, math, shutil
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import cairosvg

AQUI = os.path.dirname(os.path.abspath(__file__))
FONTE = "/usr/share/fonts/truetype/sand-box/google/Outfit/Outfit-VariableFont_wght.ttf"
F = instantiateVariableFont(TTFont(FONTE), {"wght": 600})
COR, FUNDO, TEXTO, BRANCO = "#E0263F", "#1A0E12", "#14141A", "#FFFFFF"

def texto(s, x, y, alt, f=F):
    gs = f.getGlyphSet(); cmap = f.getBestCmap(); e = alt / f["OS/2"].sCapHeight
    pen = SVGPathPen(gs); cx = 0
    for ch in s:
        g = cmap[ord(ch)]; gs[g].draw(TransformPen(pen, (e, 0, 0, -e, x + cx*e, y))); cx += gs[g].width
    return pen.getCommands(), cx*e

def arco(cx, cy, r, a0, a1):
    p = lambda a: (cx + r*math.cos(math.radians(a)), cy + r*math.sin(math.radians(a)))
    (x0, y0), (x1, y1) = p(a0), p(a1)
    return f"M{x0:.2f} {y0:.2f}A{r} {r} 0 {1 if (a1-a0)%360>180 else 0} 1 {x1:.2f} {y1:.2f}"

def simb(c):  # caixa 0..100
    return (f'<g fill="none" stroke="{c}" stroke-width="13"><path d="{arco(50,56,32,70,380)}" stroke-linecap="round"/>'
            f'<path d="M58 64L86 92" stroke-width="14"/></g>'
            f'<g fill="{c}"><rect x="44" y="12" width="12" height="9"/><rect x="38" y="4" width="24" height="9" rx="3"/></g>')
def simb16(c):
    return (f'<g fill="none" stroke="{c}"><circle cx="48" cy="56" r="30" stroke-width="18"/>'
            f'<path d="M60 68L92 100" stroke-width="20"/></g><rect x="36" y="0" width="24" height="16" fill="{c}"/>')

def svg(w, h, corpo, bg=None):
    b = f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ""
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">{b}{corpo}</svg>'
def logo(cs, ct, bg=None):
    d, lw = texto("Quaru", 0, 0, 64)
    return svg(round(40+100+36+lw+40), 180, f'<g transform="translate(40,40)">{simb(cs)}</g><path transform="translate(176,122)" d="{d}" fill="{ct}"/>', bg)

VERSOES = {
  "colorida": logo(COR, TEXTO),
  "colorida_fundo_escuro": logo(COR, BRANCO, FUNDO),
  "1cor": logo(TEXTO, TEXTO),
  "branca": logo(BRANCO, BRANCO),
  "simbolo": svg(120, 120, f'<g transform="translate(10,10)">{simb(COR)}</g>'),
  "icone_app": svg(1024, 1024, f'<rect width="1024" height="1024" fill="{FUNDO}"/><g transform="translate(262,262) scale(5)">{simb(COR)}</g>'),
  "icone_16px": svg(16, 16, f'<rect width="16" height="16" fill="{FUNDO}"/><g transform="translate(1.6,1.6) scale(0.125)">{simb16(COR)}</g>'),
}
for v, s in VERSOES.items():
    p = os.path.join(AQUI, f"quaru_{v}")
    open(p + ".svg", "w").write(s)
    cairosvg.svg2pdf(bytestring=s.encode(), write_to=p + ".pdf")
    cairosvg.svg2png(bytestring=s.encode(), write_to=p + "_4000px.png", output_width=4000)  # lado maior = largura
cairosvg.svg2png(bytestring=VERSOES["icone_app"].encode(), write_to=os.path.join(AQUI, "quaru_icone_app_1024.png"), output_width=1024, output_height=1024)
cairosvg.svg2png(bytestring=VERSOES["icone_16px"].encode(), write_to=os.path.join(AQUI, "quaru_icone_16px_16.png"), output_width=16, output_height=16)
from PIL import Image
Image.open(os.path.join(AQUI, "quaru_icone_16px_16.png")).resize((512, 512), Image.NEAREST).save(os.path.join(AQUI, "quaru_icone_16px_ampliado_512.png"))

# ---------- folha de cores ----------
def rgb(h): return tuple(int(h[i:i+2], 16) for i in (1, 3, 5))
def cmyk(h):
    r, g, b = [x/255 for x in rgb(h)]; k = 1 - max(r, g, b)
    if k == 1: return (0, 0, 0, 100)
    return tuple(round(100*x) for x in ((1-r-k)/(1-k), (1-g-k)/(1-k), (1-b-k)/(1-k), k))
CORES = [("Carmim Quaru (principal)", COR, "aprox. Pantone 1788 C"),
         ("Vinho (fundo do ícone)", FUNDO, "aprox. Pantone Black 5 C"),
         ("Grafite (texto)", TEXTO, "aprox. Pantone Black 6 C"),
         ("Branco", BRANCO, "—")]
n = F["name"]; FAM = "Outfit"; LIC = n.getDebugName(13); URL = n.getDebugName(14)
W, H = 2400, 1700; P = [f'<rect width="{W}" height="{H}" fill="#F5F4F1"/>']
def T(s, x, y, a, c=TEXTO):
    d, _ = texto(s, x, y, a); P.append(f'<path d="{d}" fill="{c}"/>')
T("Quaru · folha de cores e tipografia", 100, 150, 56)
for i, (nm, hx, pt) in enumerate(CORES):
    x = 100 + i*560
    P.append(f'<rect x="{x}" y="240" width="500" height="500" rx="24" fill="{hx}" stroke="#D0CEC8" stroke-width="3"/>')
    T(nm, x, 810, 28); T(f"HEX {hx}", x, 870, 26, "#3A3A44"); T("RGB %d, %d, %d" % rgb(hx), x, 920, 26, "#3A3A44")
    T("CMYK %d, %d, %d, %d (aprox.)" % cmyk(hx), x, 970, 26, "#3A3A44"); T(pt, x, 1020, 26, "#3A3A44")
T("Valores de CMYK e Pantone são APROXIMADOS (conversão simples, sem perfil ICC): validar com prova de cor na gráfica.", 100, 1130, 26, "#B0002A")
T(f"Fonte da marca: {FAM} SemiBold (600), Google Fonts. Texto do logo convertido em curvas.", 100, 1260, 30)
T("Licença: SIL Open Font License 1.1 (OFL), registrada no próprio arquivo da fonte: scripts.sil.org/OFL", 100, 1320, 26, "#3A3A44")
P.append(f'<g transform="translate(100,1400) scale(1.2)">{VERSOES["colorida"].split(">",1)[1].rsplit("</svg>",1)[0]}</g>')
folha = svg(W, H, "".join(P))
cairosvg.svg2pdf(bytestring=folha.encode(), write_to=os.path.join(AQUI, "quaru_cores.pdf"))
cairosvg.svg2png(bytestring=folha.encode(), write_to=os.path.join(AQUI, "quaru_cores.png"))
open(os.path.join(AQUI, "LICENCA_FONTE_Outfit.txt"), "w").write(f"{FAM}\n{LIC}\n{URL}\nArquivo: {os.path.basename(FONTE)} (Google Fonts)\n")

# ---------- conferência ----------
erros = []
for f in os.listdir(AQUI):
    if f.endswith(".svg") and "<text" in open(os.path.join(AQUI, f)).read(): erros.append(f + " tem <text>")
    if f.endswith(".png"):
        w, h = Image.open(os.path.join(AQUI, f)).size
        esp = (1024, 1024) if f.endswith("_1024.png") else (16, 16) if f.endswith("_16.png") else (512, 512) if "ampliado" in f else None
        if f.endswith("_4000px.png") and max(w, h) != 4000: erros.append(f"{f}: {w}x{h}")
        if esp and (w, h) != esp: erros.append(f"{f}: {w}x{h}")
        print(f"{f}: {w}x{h} {Image.open(os.path.join(AQUI, f)).mode}")
print("ERROS:", erros or "nenhum")
z = shutil.make_archive(AQUI, "zip", os.path.dirname(AQUI), os.path.basename(AQUI)); print("zip:", z)
