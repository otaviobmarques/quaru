#!/usr/bin/env python3
"""Design System Quaru v1.0: gera tokens.json, SVGs, HTML/CSS e o PDF (weasyprint). Gratuito, sem IA.
Uso: python3 gerar_ds.py"""
import os, json, shutil, math, html
import weasyprint

AQUI = os.path.dirname(os.path.abspath(__file__))
LOGO = os.path.join(os.path.dirname(AQUI), "logo-oficial-quaru")
SV = os.path.join(AQUI, "svg"); os.makedirs(SV, exist_ok=True)
for f in os.listdir(LOGO):
    if f.endswith(".svg"): shutil.copy(os.path.join(LOGO, f), SV)

# ---------------- cores ----------------
def rgb(h): return tuple(int(h[i:i+2], 16) for i in (1, 3, 5))
def hx(t): return "#%02X%02X%02X" % tuple(max(0, min(255, round(v))) for v in t)
def mix(a, b, t): return hx(tuple(x + (y - x) * t for x, y in zip(rgb(a), rgb(b))))
def cmyk(h):
    r, g, b = [x/255 for x in rgb(h)]; k = 1 - max(r, g, b)
    if k >= 1: return (0, 0, 0, 100)
    return tuple(round(100*x) for x in ((1-r-k)/(1-k), (1-g-k)/(1-k), (1-b-k)/(1-k), k))
def lum(h):
    def c(v):
        v /= 255; return v/12.92 if v <= 0.03928 else ((v+0.055)/1.055)**2.4
    r, g, b = map(c, rgb(h)); return 0.2126*r + 0.7152*g + 0.0722*b
def contraste(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True); return (la + 0.05) / (lb + 0.05)

P = "#E0263F"
CARMIM = {"50": mix(P, "#FFFFFF", .92), "100": mix(P, "#FFFFFF", .82), "200": mix(P, "#FFFFFF", .62),
          "300": mix(P, "#FFFFFF", .40), "400": mix(P, "#FFFFFF", .18), "500": P,
          "600": mix(P, "#000000", .16), "700": mix(P, "#000000", .32), "800": mix(P, "#000000", .50), "900": mix(P, "#000000", .66)}
MARCA = [("Carmim Quaru", P, "aprox. Pantone 1788 C", "principal: símbolo, botão principal, destaques"),
         ("Vinho", "#1A0E12", "aprox. Pantone Black 5 C", "fundo do ícone e do tema escuro"),
         ("Grafite", "#14141A", "aprox. Pantone Black 6 C", "texto no tema claro, logo 1 cor"),
         ("Branco", "#FFFFFF", "—", "fundos claros, texto no escuro")]
NEUTRAS = {"fundo-claro": "#FAF7F5", "superficie-claro": "#FFFFFF", "borda-claro": "#E6E0DE", "texto-2-claro": "#5B5560",
           "fundo-escuro": "#1A0E12", "superficie-escuro": "#271A1F", "borda-escuro": "#3D2B32", "texto-2-escuro": "#BDB2B6"}
ESTADOS = {"sucesso": ("#1A7F47", "#5CCB8C"), "alerta": ("#9A5B00", "#F2B04A"),
           "erro": ("#A8201A", "#FF8F85"), "info": ("#2563C9", "#86AEF2")}  # (claro, escuro)

PARES = [("Branco sobre Carmim (botão)", "#FFFFFF", P), ("Carmim sobre Branco", P, "#FFFFFF"),
         ("Carmim sobre Vinho", P, "#1A0E12"), ("Carmim 300 sobre Vinho", CARMIM["300"], "#1A0E12"),
         ("Grafite sobre Fundo claro", "#14141A", "#FAF7F5"), ("Texto 2 sobre Fundo claro", "#5B5560", "#FAF7F5"),
         ("Branco sobre Vinho", "#FFFFFF", "#1A0E12"), ("Texto 2 escuro sobre Superfície escura", "#BDB2B6", "#271A1F"),
         ("Carmim 700 sobre Carmim 50", CARMIM["700"], CARMIM["50"])]
for k, (c, e) in ESTADOS.items():
    PARES += [(f"{k.capitalize()} sobre Fundo claro", c, "#FAF7F5"), (f"{k.capitalize()} (escuro) sobre Vinho", e, "#1A0E12")]
def veredito(r):
    if r >= 7: return "AAA"
    if r >= 4.5: return "AA"
    if r >= 3: return "AA texto grande / UI"
    return "reprovado"

# ---------------- tipografia e espaço ----------------
ESCALA = [("display", 48, 56, 700), ("titulo-1", 32, 40, 700), ("titulo-2", 24, 32, 600), ("titulo-3", 20, 28, 600),
          ("corpo-g", 17, 26, 400), ("corpo", 15, 22, 400), ("legenda", 13, 18, 500), ("numero-timer", 56, 60, 600)]
ESPACO = [0, 4, 8, 12, 16, 24, 32, 48, 64]
RAIOS = {"pequeno": 8, "medio": 12, "grande": 20, "pilula": 999}

tokens = {"versao": "1.0", "marca": "Quaru (nome provisório até análise jurídica)",
  "cor": {"marca": {n: {"hex": h, "rgb": rgb(h), "cmyk_aprox": cmyk(h), "pantone_aprox": pt} for n, h, pt, _ in MARCA},
          "carmim": CARMIM, "neutras": NEUTRAS,
          "estado": {k: {"claro": c, "escuro": e} for k, (c, e) in ESTADOS.items()},
          "foco": {"claro": "#2563C9", "escuro": "#86AEF2"}},
  "tema": {"claro": {"fundo": "#FAF7F5", "superficie": "#FFFFFF", "texto": "#14141A", "texto-2": "#5B5560", "borda": "#E6E0DE", "primaria": P, "sobre-primaria": "#FFFFFF"},
           "escuro": {"fundo": "#1A0E12", "superficie": "#271A1F", "texto": "#FFFFFF", "texto-2": "#BDB2B6", "borda": "#3D2B32", "primaria": P, "primaria-texto": CARMIM["300"], "sobre-primaria": "#FFFFFF"}},
  "tipografia": {"familia": "Outfit", "licenca": "SIL Open Font License 1.1", "fallback": "system-ui, sans-serif",
                 "numeros": "font-variant-numeric: tabular-nums",
                 "escala": {n: {"tamanho_px": s, "altura_linha_px": l, "peso": w} for n, s, l, w in ESCALA}},
  "espaco_px": ESPACO, "raio_px": RAIOS, "toque_minimo_px": 44, "grade": {"celular": {"colunas": 4, "margem": 16, "calha": 16}, "tablet": {"colunas": 8, "margem": 24, "calha": 24}, "computador": {"colunas": 12, "margem": 32, "calha": 24, "largura_max": 1200}},
  "contraste_wcag": [{"par": n, "frente": a, "fundo": b, "razao": round(contraste(a, b), 2), "nivel": veredito(contraste(a, b))} for n, a, b in PARES]}
json.dump(tokens, open(os.path.join(AQUI, "tokens.json"), "w"), ensure_ascii=False, indent=2)

# ---------------- símbolo e ícones ----------------
def arco(cx, cy, r, a0, a1):
    p = lambda a: (cx + r*math.cos(math.radians(a)), cy + r*math.sin(math.radians(a)))
    (x0, y0), (x1, y1) = p(a0), p(a1)
    return f"M{x0:.2f} {y0:.2f}A{r} {r} 0 {1 if (a1-a0)%360>180 else 0} 1 {x1:.2f} {y1:.2f}"
def simb(c):
    return (f'<g fill="none" stroke="{c}" stroke-width="13"><path d="{arco(50,56,32,70,380)}" stroke-linecap="round"/>'
            f'<path d="M58 64L86 92" stroke-width="14"/></g><g fill="{c}"><rect x="44" y="12" width="12" height="9"/><rect x="38" y="4" width="24" height="9" rx="3"/></g>')
def S(nome, w, h, corpo):
    s = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">{corpo}</svg>'
    open(os.path.join(SV, nome + ".svg"), "w").write(s); return f"svg/{nome}.svg"
# Ícones próprios da Quaru: traço 2 px, grade 24, cantos arredondados, terminais retos no "ponteiro"
IC = {
 "inicio": '<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>',
 "rotinas": '<path d="M5 6h14M5 12h14M5 18h9"/><circle cx="19" cy="18" r="1.5"/>',
 "treinar": '<circle cx="12" cy="13" r="8"/><path d="M12 13l4 4" stroke-linecap="butt"/><path d="M10 3h4"/>',
 "historico": '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
 "perfil": '<circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
 "biblioteca": '<circle cx="11" cy="11" r="6"/><path d="M16 16l4 4" stroke-linecap="butt"/>',
 "peso": '<path d="M4 20l2-12h12l2 12z"/><circle cx="12" cy="5" r="2"/>',
 "alimentacao": '<path d="M7 3v8a2 2 0 002 2v8M7 3v5M10 3v5M4 3v5a3 3 0 003 3M17 3c-2 2-2 6 0 8v10"/>',
 "recorde": '<path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.3 6.8 19.1l1-5.8L3.5 9.2l5.9-.8z"/>',
 "offline": '<path d="M3 3l18 18M8.5 16.5a5 5 0 017 0M5 13a10 10 0 0114 0" />',
 "check": '<path d="M5 12l4 4 10-10"/>',
 "alerta": '<path d="M12 3l9 17H3z"/><path d="M12 10v4M12 17v.5"/>',
}
def icone(n, c="#14141A", tam=24):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="{tam}" height="{tam}" fill="none" stroke="{c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{IC[n]}</svg>'
for n in IC: open(os.path.join(SV, f"icone_{n}.svg"), "w").write(icone(n))

# Cronômetro de descanso (componente-assinatura)
def cronometro(fundo, txt, trilho, cor=P, frac=0.62, rotulo="Descanso", tempo="01:30"):
    r = 80; C = 2*math.pi*r
    return (f'<rect width="240" height="240" rx="24" fill="{fundo}"/>'
            f'<rect x="108" y="10" width="24" height="10" rx="3" fill="{cor}"/>'
            f'<circle cx="120" cy="125" r="{r}" fill="none" stroke="{trilho}" stroke-width="14"/>'
            f'<circle cx="120" cy="125" r="{r}" fill="none" stroke="{cor}" stroke-width="14" stroke-linecap="round" stroke-dasharray="{C*frac:.1f} {C:.1f}" transform="rotate(-90 120 125)"/>'
            f'<text x="120" y="122" text-anchor="middle" font-family="Outfit" font-weight="600" font-size="44" fill="{txt}">{tempo}</text>'
            f'<text x="120" y="152" text-anchor="middle" font-family="Outfit" font-size="15" fill="{txt}" opacity=".75">{rotulo}</text>')
S("cronometro_claro", 240, 240, cronometro("#FFFFFF", "#14141A", "#F3E3E5"))
S("cronometro_escuro", 240, 240, cronometro("#271A1F", "#FFFFFF", "#3D2B32"))
S("cronometro_fim", 240, 240, cronometro("#271A1F", "#FFFFFF", "#3D2B32", cor=ESTADOS["sucesso"][1], frac=1, rotulo="Descanso terminou", tempo="00:00"))

AVISO = '<g><rect x="{x}" y="{y}" width="150" height="34" rx="17" fill="#14141A" opacity=".85"/><text x="{tx}" y="{ty}" text-anchor="middle" font-family="Outfit" font-weight="700" font-size="16" fill="#FFFFFF" letter-spacing="2">ILUSTRATIVO</text></g>'
def aviso(x, y): return AVISO.format(x=x, y=y, tx=x+75, ty=y+23)

# Tela do app (Início), dados genéricos
def tela(tema):
    t = tokens["tema"][tema]; esc = tema == "escuro"; pt = t.get("primaria-texto", P)
    nav = "".join(f'<g transform="translate({22+i*68},700)">{icone(n, P if i==0 else t["texto-2"], 26).replace("<svg ", "<svg x=\'0\' y=\'0\' ")}</g>' for i, n in enumerate(["inicio","rotinas","treinar","historico","perfil"]))
    lab = "".join(f'<text x="{35+i*68}" y="742" text-anchor="middle" font-family="Outfit" font-size="11" fill="{P if i==0 else t["texto-2"]}">{l}</text>' for i, l in enumerate(["Início","Rotinas","Treinar","Histórico","Perfil"]))
    return (f'<rect width="360" height="780" rx="36" fill="{t["fundo"]}" stroke="{t["borda"]}" stroke-width="2"/>'
      f'<g transform="translate(20,36) scale(.3)">{simb(P)}</g><text x="56" y="60" font-family="Outfit" font-weight="600" font-size="22" fill="{t["texto"]}">Quaru</text>'
      f'<text x="20" y="112" font-family="Outfit" font-weight="700" font-size="26" fill="{t["texto"]}">Olá, Nome</text>'
      f'<rect x="20" y="136" width="320" height="170" rx="20" fill="{t["superficie"]}" stroke="{P}" stroke-width="2"/>'
      f'<text x="40" y="170" font-family="Outfit" font-size="13" font-weight="500" fill="{pt}">TREINO DE HOJE</text>'
      f'<text x="40" y="202" font-family="Outfit" font-weight="700" font-size="24" fill="{t["texto"]}">Treino A</text>'
      f'<text x="40" y="228" font-family="Outfit" font-size="15" fill="{t["texto-2"]}">6 exercícios · última vez: data</text>'
      f'<rect x="40" y="246" width="280" height="44" rx="22" fill="{P}"/><text x="180" y="274" text-anchor="middle" font-family="Outfit" font-weight="600" font-size="17" fill="#FFFFFF">Começar treino</text>'
      f'<rect x="20" y="322" width="152" height="120" rx="20" fill="{t["superficie"]}" stroke="{t["borda"]}"/>'
      f'<text x="36" y="354" font-family="Outfit" font-size="13" fill="{t["texto-2"]}">Peso corporal</text><text x="36" y="392" font-family="Outfit" font-weight="700" font-size="28" fill="{t["texto"]}">00,0 kg</text>'
      f'<rect x="188" y="322" width="152" height="120" rx="20" fill="{t["superficie"]}" stroke="{t["borda"]}"/>'
      f'<text x="204" y="354" font-family="Outfit" font-size="13" fill="{t["texto-2"]}">Calorias do dia</text><text x="204" y="392" font-family="Outfit" font-weight="700" font-size="28" fill="{t["texto"]}">0000</text>'
      f'<rect x="20" y="458" width="320" height="64" rx="16" fill="{t["superficie"]}" stroke="{t["borda"]}"/>'
      f'<text x="36" y="496" font-family="Outfit" font-size="16" fill="{t["texto"]}">Supino reto · 3 séries</text>'
      f'<rect x="20" y="532" width="320" height="64" rx="16" fill="{t["superficie"]}" stroke="{t["borda"]}"/>'
      f'<text x="36" y="570" font-family="Outfit" font-size="16" fill="{t["texto"]}">Agachamento · 4 séries</text>'
      f'<line x1="0" y1="680" x2="360" y2="680" stroke="{t["borda"]}"/>{nav}{lab}' + aviso(190, 610))
S("tela_claro", 360, 780, tela("claro")); S("tela_escuro", 360, 780, tela("escuro"))

loja = (f'<rect width="560" height="300" rx="20" fill="#FFFFFF" stroke="#E6E0DE"/>'
  f'<rect x="28" y="28" width="120" height="120" rx="27" fill="#1A0E12"/><g transform="translate(58,58) scale(.6)">{simb(P)}</g>'
  f'<text x="172" y="66" font-family="Outfit" font-weight="700" font-size="30" fill="#14141A">Quaru</text>'
  f'<text x="172" y="96" font-family="Outfit" font-size="16" fill="#5B5560">Domma Tecnologia</text>'
  f'<text x="172" y="122" font-family="Outfit" font-size="15" fill="#5B5560">Saúde e fitness</text>'
  f'<rect x="172" y="136" width="110" height="36" rx="18" fill="{P}"/><text x="227" y="160" text-anchor="middle" font-family="Outfit" font-weight="600" font-size="16" fill="#FFF">Obter</text>'
  f'<text x="28" y="200" font-family="Outfit" font-size="16" fill="#14141A">Registre séries, carga e descanso. Treino e alimentação no mesmo app.</text>'
  f'<text x="28" y="230" font-family="Outfit" font-size="13" fill="#5B5560">Avaliações e números da loja: não exibidos (app não publicado)</text>' + aviso(382, 246))
S("loja", 560, 300, loja)

post = (f'<rect width="1080" height="1350" fill="#1A0E12"/>'
  f'<g transform="translate(340,240) scale(4)">{simb(P)}</g>'
  f'<text x="540" y="820" text-anchor="middle" font-family="Outfit" font-weight="700" font-size="78" fill="#FFFFFF">Descanso no tempo certo.</text>'
  f'<text x="540" y="910" text-anchor="middle" font-family="Outfit" font-size="44" fill="#BDB2B6">Série, carga e timer em um toque.</text>'
  f'<rect x="340" y="1010" width="400" height="96" rx="48" fill="{P}"/><text x="540" y="1072" text-anchor="middle" font-family="Outfit" font-weight="600" font-size="40" fill="#FFF">Baixe o Quaru</text>'
  + f'<g transform="translate(700,40) scale(2.4)">{aviso(0,0)}</g>')
S("post_4x5", 1080, 1350, post)
story = (f'<rect width="1080" height="1920" fill="{P}"/>'
  f'<rect x="65" y="269" width="950" height="979" fill="none" stroke="#FFFFFF" stroke-opacity=".35" stroke-dasharray="12 12" stroke-width="3"/>'
  f'<text x="75" y="300" font-family="Outfit" font-size="22" fill="#FFFFFF" opacity=".6">zona segura 950×979 (Meta)</text>'
  f'<g transform="translate(390,380) scale(3)">{simb("#FFFFFF")}</g>'
  f'<text x="540" y="850" text-anchor="middle" font-family="Outfit" font-weight="700" font-size="96" fill="#FFFFFF">Bateu o tempo?</text>'
  f'<text x="540" y="960" text-anchor="middle" font-family="Outfit" font-weight="700" font-size="96" fill="#FFFFFF">Próxima série.</text>'
  f'<text x="540" y="1080" text-anchor="middle" font-family="Outfit" font-size="44" fill="#FFFFFF">Quaru: seu treino com timer de descanso.</text>'
  + f'<g transform="translate(700,1400) scale(2.4)">{aviso(0,0)}</g>')
S("story_9x16", 1080, 1920, story)

# proteção e proibidos
prot = (f'<rect width="760" height="300" fill="#FFFFFF"/>'
  f'<rect x="40" y="30" width="680" height="240" fill="#F3E3E5" stroke="{P}" stroke-dasharray="6 6"/>'
  f'<rect x="100" y="90" width="560" height="120" fill="#FFFFFF"/>'
  f'<image href="quaru_colorida.svg" x="72" y="80" width="616" height="140"/>'
  f'<g font-family="Outfit" font-size="20" font-weight="600" fill="{P}"><text x="62" y="156">x</text><text x="682" y="156">x</text><text x="374" y="70">x</text><text x="374" y="252">x</text></g>')
S("protecao", 760, 300, prot)

def proib(nome, corpo):
    return S("proibido_" + nome, 260, 120, f'<rect width="260" height="120" fill="#FAF7F5"/>{corpo}<line x1="10" y1="110" x2="250" y2="10" stroke="#A8201A" stroke-width="4"/>')
PRO = [("distorcer", '<image href="quaru_colorida.svg" x="10" y="30" width="240" height="60" preserveAspectRatio="none"/>', "Esticar ou achatar"),
       ("girar", '<image href="quaru_colorida.svg" x="20" y="20" width="220" height="80" transform="rotate(-12 130 60)"/>', "Girar ou inclinar"),
       ("cor", '<g transform="translate(14,16) scale(.5)">' + simb("#2E8BFF") + '</g><text x="80" y="76" font-family="Outfit" font-weight="600" font-size="40" fill="#2E8BFF">Quaru</text>', "Trocar as cores"),
       ("contraste", '<rect width="260" height="120" fill="' + P + '"/><g transform="translate(14,16) scale(.5)">' + simb("#14141A") + '</g><text x="80" y="76" font-family="Outfit" font-weight="600" font-size="40" fill="#5B1020">Quaru</text>', "Pouco contraste"),
       ("sombra", '<image href="quaru_1cor.svg" x="18" y="28" width="240" height="80" opacity=".35"/><image href="quaru_colorida.svg" x="10" y="20" width="240" height="80"/>', "Sombra ou efeitos"),
       ("recompor", '<g transform="translate(180,20) scale(.6)">' + simb(P) + '</g><text x="16" y="76" font-family="Outfit" font-weight="600" font-size="40" fill="#14141A">Quaru</text>', "Mudar a ordem ou o espaço"),]
pro_html = "".join(f'<figure class="proib"><img src="{proib(n, c)}"/><figcaption>✕ {l}</figcaption></figure>' for n, c, l in PRO)

# ---------------- HTML ----------------
def sw(nome, h, extra=""):
    r = rgb(h); k = cmyk(h); txt = "#FFFFFF" if contraste("#FFFFFF", h) > contraste("#14141A", h) else "#14141A"
    return (f'<div class="sw"><div class="chip" style="background:{h};color:{txt}">{h}</div><b>{nome}</b>'
            f'<span>RGB {r[0]}, {r[1]}, {r[2]}</span><span>CMYK {k[0]}, {k[1]}, {k[2]}, {k[3]} <i>(aprox.)</i></span>{extra}</div>')
marca_html = "".join(sw(n, h, f'<span>{pt} <i>(aprox.)</i></span><small>{u}</small>' if pt != "—" else f'<span>Pantone —</span><small>{u}</small>') for n, h, pt, u in MARCA)
escala_html = "".join(f'<div class="tom" style="background:{h};color:{"#fff" if lum(h)<.25 else "#14141A"}">{k}<br>{h}</div>' for k, h in CARMIM.items())
neu_html = "".join(f'<div class="tom" style="background:{h};color:{"#fff" if lum(h)<.25 else "#14141A"};border:1px solid #ddd">{k}<br>{h}</div>' for k, h in NEUTRAS.items())
est_html = "".join(f'<tr><td><b>{k.capitalize()}</b></td><td><span class="dot" style="background:{c}"></span>{c}</td><td><span class="dot" style="background:{e}"></span>{e}</td><td>{ {"sucesso":"série concluída, sincronizado","alerta":"enviando, sem internet","erro":"falha, item recusado (sempre com ícone + texto; não confundir com a cor da marca)","info":"atualizado em outro aparelho, dicas"}[k]}</td></tr>' for k, (c, e) in ESTADOS.items())
cont_html = "".join(f'<tr><td>{p["par"]}</td><td><span class="amostra" style="color:{p["frente"]};background:{p["fundo"]}">Aa 123</span></td><td>{p["razao"]:.2f}:1</td><td class="{"ok" if p["razao"]>=4.5 else "med" if p["razao"]>=3 else "ruim"}">{p["nivel"]}</td></tr>' for p in tokens["contraste_wcag"])
tipo_html = "".join(f'<tr><td>{n}</td><td>{s}/{l} px</td><td>{w}</td><td style="font-size:{min(s,28)*0.6}pt;font-weight:{w};line-height:1.1{";font-variant-numeric:tabular-nums" if "numero" in n else ""}">{"01:30" if "numero" in n else "Treino de hoje"}</td></tr>' for n, s, l, w in ESCALA)
esp_html = "".join(f'<div class="esp"><div style="width:{v*1.2}px;height:{v*1.2}px;background:{P}"></div><span>{v}</span></div>' for v in ESPACO[1:])
ic_html = "".join(f'<figure class="ic"><img src="svg/icone_{n}.svg"/><figcaption>{n}</figcaption></figure>' for n in IC)

V = [("quaru_colorida.svg", "Colorida", "fundos claros"), ("quaru_colorida_fundo_escuro.svg", "Colorida em fundo escuro", "vinho #1A0E12"),
     ("quaru_1cor.svg", "1 cor", "impressão em 1 cor, carimbo"), ("quaru_branca.svg", "Branca", "fotos e fundos escuros"),
     ("quaru_simbolo.svg", "Símbolo", "avatar, selo, marca-d'água"), ("quaru_icone_app.svg", "Ícone do app", "lojas e tela inicial"),
     ("quaru_icone_16px.svg", "Ícone 16 px", "favicon e tamanhos mínimos")]
ver_html = "".join(f'<figure class="ver{" escuro" if "branca" in f else ""}"><img src="svg/{f}"/><figcaption><b>{n}</b><br>{u}</figcaption></figure>' for f, n, u in V)

CSS = """
@page { size: 297mm 210mm; margin: 14mm 16mm 14mm 16mm;
  @bottom-left { content: "Quaru · Design System v1.0 · nome provisório, sujeito à análise jurídica"; font: 8pt Outfit; color: #8A8088 }
  @bottom-right { content: counter(page) " / " counter(pages); font: 8pt Outfit; color: #8A8088 } }
@page capa { margin: 0; @bottom-left { content: none } @bottom-right { content: none } }
* { box-sizing: border-box }
body { font-family: Outfit, sans-serif; color: #14141A; font-size: 10.5pt; line-height: 1.45; margin: 0 }
section { page-break-after: always } section:last-child { page-break-after: auto }
h1 { font-size: 26pt; margin: 0 0 4mm; font-weight: 700 } h2 { font-size: 14pt; margin: 5mm 0 2mm; font-weight: 600 }
.num { color: #E0263F; font-weight: 600; font-size: 10pt; letter-spacing: .1em }
.capa { page: capa; height: 210mm; background: #1A0E12; color: #fff; padding: 30mm 24mm; position: relative }
.capa img { width: 150mm } .capa h1 { font-size: 40pt; margin-top: 18mm } .capa p { color: #BDB2B6; font-size: 13pt }
.cols { display: flex; gap: 8mm } .cols > div { flex: 1 }
.ver { display: inline-block; width: 60mm; margin: 0 3mm 4mm 0; vertical-align: top; text-align: center }
.ver img { height: 26mm; max-width: 58mm; background: #FAF7F5; padding: 3mm; border-radius: 3mm }
.ver.escuro img { background: #1A0E12 } figcaption { font-size: 8.5pt; color: #5B5560 }
.proib { display: inline-block; width: 42mm; margin: 0 2mm 2mm 0; text-align: center } .proib img { width: 42mm }
.sw { display: inline-block; width: 60mm; vertical-align: top; margin-right: 3mm; font-size: 9pt }
.sw .chip { height: 26mm; border-radius: 3mm; padding: 3mm; font-weight: 600; margin-bottom: 2mm; border: 1px solid #E6E0DE }
.sw span, .sw small { display: block } .sw small { color: #5B5560 }
.tom { display: inline-block; width: 25mm; height: 16mm; font-size: 7.5pt; padding: 1.5mm; margin: 0 1mm 1mm 0; border-radius: 2mm }
table { border-collapse: collapse; width: 100%; font-size: 9pt } td, th { border-bottom: 1px solid #E6E0DE; padding: .9mm 2mm; text-align: left }
th { color: #5B5560; font-weight: 500 }
.dot { display: inline-block; width: 4mm; height: 4mm; border-radius: 2mm; vertical-align: middle; margin-right: 2mm }
.amostra { padding: .5mm 2mm; border-radius: 1mm; font-weight: 600 } .ok { color: #1A7F47; font-weight: 600 } .med { color: #9A5B00; font-weight: 600 } .ruim { color: #A8201A; font-weight: 600 }
.esp { display: inline-block; text-align: center; margin-right: 5mm; vertical-align: bottom; font-size: 8pt }
.ic { display: inline-block; width: 24mm; text-align: center; margin: 0 2mm 3mm 0 } .ic img { width: 10mm }
.btn { display: inline-block; padding: 2.5mm 6mm; border-radius: 20mm; font-weight: 600; margin: 0 2mm 2mm 0; font-size: 10pt }
.campo { border: 1px solid #C9C0C4; border-radius: 3mm; padding: 2.5mm 3mm; width: 70mm; margin-bottom: 1mm }
.card { border: 1px solid #E6E0DE; border-radius: 4mm; padding: 4mm; background: #fff; display: inline-block; width: 70mm; vertical-align: top; margin-right: 3mm }
.ilu { font-size: 8pt; color: #A8201A; font-weight: 600; letter-spacing: .08em }
.nota { font-size: 8.5pt; color: #5B5560 } .chk li { margin-bottom: 1mm }
"""
open(os.path.join(AQUI, "estilo.css"), "w").write(CSS)

HTML = f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Quaru · Design System v1.0</title><link rel="stylesheet" href="estilo.css"></head><body>
<section class="capa"><img src="svg/quaru_branca.svg"><h1>Design System v1.0</h1>
<p>Identidade e interface do app de treinos da Domma Tecnologia · RedBox · 01/11/2026</p>
<p style="font-size:9pt;margin-top:30mm">Nome "Quaru" provisório, sujeito à análise da advogada e à busca no INPI (não consultado). Este documento é avaliação de design, não parecer jurídico.</p></section>

<section><div class="num">01 · CONCEITO</div><h1>Treino no tempo certo</h1>
<div class="cols"><div>
<p>O Quaru é um app em português para registrar treino de academia: rotinas (Treino A/B/C), séries com carga e repetições, timer de descanso automático, histórico com gráficos, peso corporal e diário alimentar compartilhado com o Pratolino. Funciona sem internet e sincroniza depois.</p>
<p>A marca nasce da função que acompanha cada série: o <b>descanso</b>. O símbolo é um <b>Q-cronômetro</b>: o anel é o mostrador, o botão no alto é o do cronômetro e a cauda do Q é um ponteiro curto e reto. Não usa halter, bíceps nem silhueta: fala de ritmo e constância.</p>
<h2>Atributos</h2><ul class="chk"><li><b>Direto:</b> registrar uma série em até 2 toques.</li><li><b>Constante:</b> o progresso vem da repetição, não do exagero.</li><li><b>Brasileiro:</b> linguagem de academia daqui, vírgula decimal, kg.</li><li><b>Respeitoso:</b> sem promessa de corpo, sem culpa, dados do aluno protegidos (LGPD).</li></ul>
</div><div style="text-align:center"><img src="svg/quaru_simbolo.svg" style="width:70mm"><p class="nota">Anel = mostrador · botão = cronômetro · cauda = ponteiro</p></div></div>
<h2>Tom de voz</h2>
<p>Fala como um parceiro de treino experiente: curto, no imperativo gentil, sem gritaria. <b>Sim:</b> "Descanso terminou. Próxima série: Supino reto." · "Treino salvo. Sincroniza quando a internet voltar." <b>Não:</b> "SEM DOR, SEM GANHO!!!", promessas de resultado ("perca 10 kg") ou comparação de corpos. Erros dizem o que aconteceu e o que fazer, e avisam quando nada foi perdido.</p></section>

<section><div class="num">02 · LOGO</div><h1>Versões</h1>{ver_html}
<p class="nota">Arquivos finais (SVG em curvas, PDF vetorial, PNG 4000 px) em <code>identidade/logo-oficial-quaru/</code>. Fonte do logotipo: Outfit SemiBold (OFL 1.1).</p></section>

<section><div class="num">02 · LOGO</div><h1>Proteção, tamanho mínimo e usos proibidos</h1>
<div class="cols"><div><h2>Área de proteção</h2><img src="svg/protecao.svg" style="width:120mm">
<p class="nota">Mantenha livre em volta do logo uma margem <b>x = metade da altura do símbolo</b> (faixa rosada). Nada de texto, foto movimentada ou borda dentro dela.</p></div>
<div><h2>Tamanho mínimo</h2><ul class="chk"><li><b>Logo completo:</b> 120 px de largura na tela (30 mm no impresso).</li><li><b>Abaixo de 120 px:</b> usar só o símbolo ou o ícone do app.</li><li><b>Símbolo normal:</b> a partir de 24 px.</li><li><b>Favicon e 16 px:</b> usar o <b>ícone de 16 px</b>, desenhado à parte (anel fechado e grosso).</li></ul>
<p><img src="svg/quaru_icone_16px.svg" style="width:4.2mm"> 16 px &nbsp; <img src="svg/quaru_icone_app.svg" style="width:8.5mm"> 32 px &nbsp; <img src="svg/quaru_simbolo.svg" style="width:12.7mm"> 48 px</p></div></div>
<h2>Usos proibidos</h2>{pro_html}</section>

<section><div class="num">03 · CORES</div><h1>Paleta da marca</h1>{marca_html}
<p class="nota"><b>CMYK e Pantone são APROXIMADOS:</b> conversão simples sem perfil ICC e Pantone escolhido pela cor mais próxima. Peça prova de cor na gráfica antes de imprimir.</p>
<h2>Carmim: tons de apoio (derivados)</h2>{escala_html}<h2>Neutras dos temas</h2>{neu_html}</section>

<section><div class="num">03 · CORES</div><h1>Estados e contraste (WCAG 2.x)</h1>
<div class="cols"><div><table><tr><th>Estado</th><th>Tema claro</th><th>Tema escuro</th><th>Uso</th></tr>{est_html}</table>
<h2>Pares conferidos</h2><p class="nota">Texto normal exige 4,5:1 (AA); texto grande (≥ 24 px, ou ≥ 18,66 px em negrito) e elementos de interface exigem 3:1. Valores calculados pela fórmula de luminância relativa da WCAG 2.x.</p>
<p class="nota">Regra: <b>Carmim sobre Vinho</b> só para símbolo, ícones e textos grandes. Para texto pequeno no escuro, use Carmim 300. Erro e marca são vermelhos parecidos, então o erro sempre leva ícone e texto.</p></div><div><table><tr><th>Par</th><th>Amostra</th><th>Razão</th><th>Nível</th></tr>{cont_html}</table></div></div></section>

<section><div class="num">04 · TIPOGRAFIA</div><h1>Outfit</h1>
<div class="cols"><div><p style="font-size:30pt;font-weight:700;line-height:1.1;margin:0">Aa Bb Cc 0123456789</p><p style="font-size:14pt">Regular 400 · Medium 500 · <b style="font-weight:600">SemiBold 600</b> · <b>Bold 700</b></p>
<p class="nota">Outfit, de Rodrigo Fuenzalida (Google Fonts), licença <b>SIL Open Font License 1.1</b>: uso comercial e embutir no app são permitidos; manter a licença junto (tela "Sobre e licenças"). Números do treino com <code>tabular-nums</code> para não "pularem" no timer. Alternativa: system-ui.</p></div>
<div><table><tr><th>Estilo</th><th>Tamanho/linha</th><th>Peso</th><th>Amostra</th></tr>{tipo_html}</table>
<p class="nota">Peças de 1080 px: título ≥ 64 px, texto ≥ 36 px, aviso legal ≥ 24 px.</p></div></div></section>

<section><div class="num">05 · GRADE E ESPAÇO</div><h1>Grade e espaçamentos</h1>
<table><tr><th>Tela</th><th>Colunas</th><th>Margem</th><th>Calha</th></tr><tr><td>Celular</td><td>4</td><td>16 px</td><td>16 px</td></tr><tr><td>Tablet</td><td>8</td><td>24 px</td><td>24 px</td></tr><tr><td>Computador</td><td>12 (máx. 1200 px)</td><td>32 px</td><td>24 px</td></tr></table>
<h2>Escala de espaço (base 4)</h2>{esp_html}
<h2>Raios e toque</h2><p>Raios: 8 (fichas, campos) · 12 (itens de lista) · 20 (cartões) · pílula (botões). Área de toque mínima: <b>44 × 44 px</b>; itens de lista com 64 px. Espaço entre cartões: 16 px; dentro do cartão: 16–24 px.</p></section>

<section><div class="num">06 · ÍCONES E COMPONENTES</div><h1>Ícones</h1>{ic_html}
<p class="nota">Desenho próprio: grade de 24 px, traço de 2 px, cantos arredondados e, quando há ponteiro, terminal reto, como no símbolo. Sempre com rótulo de acessibilidade.</p>
<h1>Componentes</h1><div class="cols"><div><h2>Botões</h2>
<span class="btn" style="background:#E0263F;color:#fff">Começar treino</span><span class="btn" style="border:2px solid #E0263F;color:#B11F33">Secundário</span><span class="btn" style="color:#B11F33">Texto</span><br>
<span class="btn" style="background:#B11F33;color:#fff">Pressionado</span><span class="btn" style="background:#E0263F;color:#fff;outline:3px solid #2563C9;outline-offset:2px">Foco</span><span class="btn" style="background:#E6E0DE;color:#8A8088">Desabilitado</span><span class="btn" style="border:2px solid #A8201A;color:#A8201A">Excluir</span>
<h2>Campos</h2><div class="nota">Carga (kg)</div><div class="campo">52,5</div><div class="nota">E-mail</div><div class="campo" style="border:2px solid #A8201A">nome@</div><div class="nota" style="color:#A8201A">⚠ Digite um e-mail válido.</div></div>
<div><h2>Cartões e navegação</h2><div class="card" style="border:2px solid #E0263F"><div class="nota" style="color:#B11F33">TREINO DE HOJE</div><b style="font-size:14pt">Treino A</b><div class="nota">6 exercícios</div></div>
<p class="nota" style="margin-top:3mm">Abas inferiores (5): Início · Rotinas · Treinar · Histórico · Perfil. A ativa fica em Carmim; as abas somem durante o treino.</p>
<p><img src="svg/icone_inicio.svg" style="width:7mm"> <img src="svg/icone_rotinas.svg" style="width:7mm"> <img src="svg/icone_treinar.svg" style="width:7mm"> <img src="svg/icone_historico.svg" style="width:7mm"> <img src="svg/icone_perfil.svg" style="width:7mm"></p></div></div></section>

<section><div class="num">06 · COMPONENTES</div><h1>Cronômetro de descanso e estados</h1>
<div class="cols"><div style="text-align:center"><img src="svg/cronometro_claro.svg" style="width:55mm"><p class="nota">Contando (claro)</p></div><div style="text-align:center"><img src="svg/cronometro_escuro.svg" style="width:55mm"><p class="nota">Contando (escuro)</p></div><div style="text-align:center"><img src="svg/cronometro_fim.svg" style="width:55mm"><p class="nota">Terminado: verde e vibração</p></div></div>
<p>O cronômetro repete o símbolo: anel, botão no alto e progresso no sentido horário. Fica fixo no rodapé da tela de treino, com −15 s e +15 s. Ao terminar, a notificação diz "Descanso terminou. Próxima série: &lt;exercício&gt;", nunca carga nem peso.</p>
<table><tr><th>Estado</th><th>Visual</th></tr>
<tr><td>Série concluída</td><td><span class="dot" style="background:#1A7F47"></span>linha em verde de sucesso + ✓</td></tr>
<tr><td>Recorde pessoal</td><td>selo Carmim com ícone de estrela + "Recorde"</td></tr>
<tr><td>Sem internet</td><td>selo neutro com ícone offline + "Salvo no aparelho"</td></tr>
<tr><td>Carregando</td><td>esqueleto cinza (acima de 300 ms)</td></tr><tr><td>Vazio</td><td>ícone + título + explicação + ação principal</td></tr>
<tr><td>Erro</td><td>ícone de alerta + o que houve + o que fazer, em vermelho de erro</td></tr></table></section>

<section><div class="num">07 · TEMAS</div><h1>Tema claro e tema escuro</h1>
<div class="cols"><div style="text-align:center"><img src="svg/tela_claro.svg" style="height:140mm"><p class="ilu">ILUSTRATIVO · tema claro</p></div>
<div style="text-align:center"><img src="svg/tela_escuro.svg" style="height:140mm"><p class="ilu">ILUSTRATIVO · tema escuro</p></div>
<div><table><tr><th>Token</th><th>Claro</th><th>Escuro</th></tr>{"".join(f'<tr><td>{k}</td><td>{tokens["tema"]["claro"].get(k,"—")}</td><td>{tokens["tema"]["escuro"].get(k,"—")}</td></tr>' for k in ["fundo","superficie","texto","texto-2","borda","primaria","primaria-texto","sobre-primaria"])}</table>
<p class="nota">O escuro é o tema padrão na academia (menos brilho entre séries); o claro segue a preferência do sistema. Nomes e números das telas são genéricos.</p></div></div></section>

<section><div class="num">08 · APLICAÇÕES</div><h1>Tela do app e loja</h1>
<div class="cols"><div style="text-align:center;flex:.6"><img src="svg/tela_escuro.svg" style="height:135mm"><p class="ilu">ILUSTRATIVO</p></div>
<div><img src="svg/loja.svg" style="width:150mm"><p class="ilu">ILUSTRATIVO · página da loja simulada; sem avaliações nem números</p>
<p class="nota">Ícone do app: símbolo Carmim sobre Vinho, cantos retos no arquivo (a loja aplica a máscara). Nome curto na tela inicial: "Quaru".</p></div></div></section>

<section><div class="num">08 · APLICAÇÕES</div><h1>Post e story</h1>
<div class="cols"><div style="text-align:center"><img src="svg/post_4x5.svg" style="height:130mm"><p class="ilu">ILUSTRATIVO · feed 4:5 (1080×1350)</p></div>
<div style="text-align:center"><img src="svg/story_9x16.svg" style="height:140mm"><p class="ilu">ILUSTRATIVO · story 9:16 (1080×1920), texto dentro da zona segura</p></div>
<div><p class="nota">Peças de marca e lançamento. Para anúncios de performance, a RedBox usa <b>foto e vídeo reais</b> (pessoas treinando, tela do app em uso), com o logo e as cores deste sistema. Fotos de banco ou geradas vão marcadas como PROVISÓRIO. Nada de antes e depois, depoimento inventado ou número sem fonte.</p></div></div></section>

<section><div class="num">09 · FAÇA E NÃO FAÇA</div><h1>Resumo de uso</h1>
<table><tr><th>Faça</th><th>Não faça</th></tr>
<tr><td>Carmim só no que é ação ou destaque (1 por tela)</td><td>Pintar telas inteiras de Carmim no app</td></tr>
<tr><td>Erro com ícone + texto</td><td>Usar só a cor para indicar erro</td></tr>
<tr><td>Números com tabular-nums e vírgula decimal (52,5 kg)</td><td>Ponto decimal ou números que "pulam" no timer</td></tr>
<tr><td>Ícone de 16 px em favicon</td><td>Reduzir o logo completo abaixo de 120 px</td></tr>
<tr><td>Tom de parceiro de treino</td><td>Promessa de resultado, culpa, comparação de corpos</td></tr></table>
<h2>Licenças e origem</h2><p class="nota">Fonte Outfit (SIL OFL 1.1). Símbolo, ícones e ilustrações de interface: desenho próprio da RedBox em código (SVG), sem ativos de terceiros. Sem geração paga nem IA. Arquivos-fonte: <code>identidade/design-system/</code> (HTML, CSS, SVGs, tokens.json, gerar_ds.py).</p>
<p class="nota"><b>Aviso:</b> avaliação de design, não parecer jurídico. O nome Quaru é provisório até a análise da advogada e a busca no INPI.</p></section>
</body></html>"""
open(os.path.join(AQUI, "quaru_design-system_v1.0.html"), "w").write(HTML)
pdf = os.path.join(AQUI, "quaru_design-system_v1.0.pdf")
weasyprint.HTML(os.path.join(AQUI, "quaru_design-system_v1.0.html")).write_pdf(pdf)
print("pdf ok")
