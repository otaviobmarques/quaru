import os, subprocess, html
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from PIL import Image
OUT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
G="/usr/share/fonts/truetype/sand-box/google/"
FONTS={"sg":(G+"Space Grotesk/SpaceGrotesk-VariableFont_wght.ttf",700),
       "osw":(G+"Oswald/Oswald-VariableFont_wght.ttf",700)}
_c={}
def font(k):
    if k not in _c:
        p,w=FONTS[k]; f=TTFont(p); _c[k]=instancer.instantiateVariableFont(f,{"wght":w})
    return _c[k]
def text_path(t,k,x,y,size,track=0):
    f=font(k); gs=f.getGlyphSet(); cmap=f.getBestCmap(); upm=f["head"].unitsPerEm; s=size/upm
    pen=SVGPathPen(gs); cx=0
    for ch in t:
        g=cmap[ord(ch)]
        tp=TransformPen(pen,(s,0,0,-s,x+cx,y)); gs[g].draw(tp); cx+=gs[g].width*s+track
    return pen.getCommands(), cx-track
CORES={"laranja":{"a":"#FF6A1A","a_claro":"#E8580A"},"limao":{"a":"#D4FF3A","a_claro":"#6F8F00"}}
BG={"escuro":"#121214","claro":"#F4F2EE"}; TXT={"escuro":"#F4F2EE","claro":"#121214"}
# símbolos em caixa 100x100; fg = cor de destaque, bg = cor do fundo (para recortes)
def sym(c,a,bg,icon=False):
    st=f'fill="none" stroke="{a}" stroke-linecap="round" stroke-linejoin="round"'
    if c=="visto":
        return f'<polyline points="14,90 14,10 46,58 90,12" {st} stroke-width="16"/>'
    if c=="anilha":
        return (f'<circle cx="50" cy="50" r="40" {st} stroke-width="14"/>'
                f'<polyline points="31,52 45,66 70,36" {st} stroke-width="12"/>')
    if c=="evolucao":
        d=f'<polyline points="10,84 10,34 36,62 62,30 88,14" {st} stroke-width="{14 if icon else 11}"/>'
        if not icon:
            d+="".join(f'<circle cx="{x}" cy="{y}" r="9" fill="{a}"/>' for x,y in [(10,34),(36,62),(62,30)])
            d+=f'<circle cx="88" cy="14" r="11" fill="{bg}" stroke="{a}" stroke-width="7"/>'
        return d
    if c=="balao":
        b=f'<path d="M18 14 H82 Q94 14 94 26 V62 Q94 74 82 74 H44 L24 92 L28 74 H18 Q6 74 6 62 V26 Q6 14 18 14 Z" fill="{a}"/>'
        if icon:
            return b+f'<polyline points="30,44 44,58 70,30" fill="none" stroke="{bg}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>'
        p,w=text_path("malhou?","sg",0,0,17,track=-0.3)
        return b+f'<path d="{p}" fill="{bg}" transform="translate({50-w/2},50)"/>'
    if c=="tipografico":
        p,w=text_path("M","osw",0,0,96)
        x0=(100-(w+20))/2
        return f'<path d="{p}" fill="{a}" transform="translate({x0},84)"/><rect x="{x0+w+6}" y="70" width="14" height="14" rx="2" fill="{a}"/>'
CONC={"visto":("01-visto","M que termina num visto: o treino de hoje está feito."),
      "anilha":("02-anilha","Anilha (disco de peso) com visto no centro."),
      "evolucao":("03-evolucao","M desenhado como gráfico de evolução de carga, com ponto final de meta."),
      "balao":("04-balao","Balão de conversa 'malhou?': a pergunta do dia, em tom de amigo."),
      "tipografico":("05-tipografico","Tipográfico forte em caixa alta (Oswald) com ponto final: 'MALHOU.'")}
ATIVOS=["visto","anilha","tipografico"]
ROT={"visto":"recomendado","anilha":"segunda opção","tipografico":"terceira opção"}
def logo(c,cor,fundo):
    a=CORES[cor]["a"] if fundo=="escuro" else CORES[cor]["a_claro"]; bg=BG[fundo]; t=TXT[fundo]
    if c=="tipografico":
        p,w=text_path("MALHOU","osw",0,0,250,track=6)
        x=(1200-w-60)/2
        body=f'<path d="{p}" fill="{t}" transform="translate({x},290)"/><rect x="{x+w+14}" y="242" width="48" height="48" rx="4" fill="{a}"/>'
    else:
        p,w=text_path("malhou","sg",0,0,190,track=-4)
        tot=230+40+w; x=(1200-tot)/2
        body=f'<g transform="translate({x},85) scale(2.3)">{sym(c,a,bg)}</g><path d="{p}" fill="{t}" transform="translate({x+270},270)"/>'
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 400" width="1200" height="400"><rect width="1200" height="400" fill="{bg}"/>{body}</svg>'
def icone(c,cor):
    a=CORES[cor]["a"]; bg="#1A1A1E"
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">'
            f'<rect width="1024" height="1024" rx="230" fill="{bg}"/><g transform="translate(212,212) scale(6)">{sym(c,a,bg,icon=True)}</g></svg>')
def render(svgfile,png,w,h):
    htmlf=svgfile+".html"
    open(htmlf,"w").write(f'<html><body style="margin:0"><img src="{os.path.basename(svgfile)}" style="width:{w}px;height:{h}px;display:block"></body></html>')
    subprocess.run(["google-chrome","--headless=new","--no-sandbox","--hide-scrollbars","--default-background-color=00000000",
        f"--window-size={w},{h}",f"--screenshot={png}","file://"+htmlf],capture_output=True); os.remove(htmlf)
if __name__=="__main__":
    for c,(pasta,desc) in CONC.items():
        if c not in ATIVOS: continue
        d=os.path.join(OUT,pasta); os.makedirs(d,exist_ok=True)
        for cor in CORES:
            for fundo in BG:
                f=f"{d}/logo-{cor}-{fundo}.svg"; open(f,"w").write(logo(c,cor,fundo)); render(f,f[:-4]+".png",3600,1200)
            f=f"{d}/icone-{cor}.svg"; open(f,"w").write(icone(c,cor)); render(f,f"{d}/icone-{cor}-1024.png",1024,1024)
            im=Image.open(f"{d}/icone-{cor}-1024.png").convert("RGBA")
            for s in (512,64,32,16): im.resize((s,s),Image.LANCZOS).save(f"{d}/icone-{cor}-{s}.png")
            os.remove(f"{d}/icone-{cor}-1024.png")
        print("ok",pasta)
