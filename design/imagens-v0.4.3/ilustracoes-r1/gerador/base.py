"""Quaru v0.4.1 · v2 (direção "energia") · base comum.
CORES: lidas direto de app/mobile/src/tema/tokens.ts (paleta Quaru v0.3, nomes de token do código). Nada de DS v1.1, nada dos tokens v0.1.
Nome do app e empresa: variáveis (espelham src/config/marca.ts)."""
import os, re, json, math
AQUI = os.path.dirname(os.path.abspath(__file__)); RAIZ = os.path.dirname(AQUI)
APP = "/home/box/domma/app-academia/app/mobile"
MARCA = {"nome": "Quaru", "empresa": "Domma Tecnologia", "versao": "0.4.1", "slogan": "Seu treino, no seu ritmo."}  # slogan aprovado 01/11/2026

def _ler_temas():
    s = open(os.path.join(APP, "src/tema/tokens.ts")).read()
    bloco = s.split("export const temas =")[1].split("} as const;")[0] + "}"
    return json.loads(bloco)
TEMAS = _ler_temas()          # {'claro': {...}, 'escuro': {...}} com os nomes do código
EXTRA = {                      # cores fora do tokens.ts usadas na v2 (documentadas no LEIAME)
    "marca": "#E0263F",        # vermelho do logotipo (paleta v0.3, 'marca.vermelho')
    "marca-escuro": "#A3172C", # fim do degradê do destaque = primaria-texto claro
    "energia": "#FBBF24",      # amarelo dos selos = alerta (escuro) da v0.3
    "sobre-energia": "#14141A",# texto do selo = texto (claro)
    "folha": "#2F855A",        # verde de folha das dietas (componentes.md da Lorena)
}
PELE = ["#FFDBAC", "#E0AC69", "#C68642", "#8D5524", "#6B3E1E", "#F1C27D"]  # tons dos avatares do código
CABELO = ["#1F1412", "#2B1B12", "#5C3A1E", "#120C0A"]

def lum(h):
    f = lambda v: v/12.92 if v <= 0.03928 else ((v+0.055)/1.055)**2.4
    r, g, b = [f(int(h[i:i+2], 16)/255) for i in (1, 3, 5)]; return .2126*r+.7152*g+.0722*b
def cr(a, b): x, y = sorted((lum(a), lum(b)), reverse=True); return (x+.05)/(y+.05)

# Pares: os dos testes do código (contraste.test.ts + v041-contraste.test.ts) + os novos da v2.
P_TESTE_TEXTO = [("texto","fundo"),("texto","superficie"),("texto-suave","fundo"),("texto-suave","superficie"),("texto-suave","superficie-2"),
  ("sobre-primaria","primaria"),("primaria-texto","fundo"),("primaria-texto","superficie"),("primaria-texto","primaria-suave"),
  ("sobre-secundaria","secundaria"),("erro","superficie"),("sucesso","superficie"),("alerta","superficie")]
P_TESTE_COMP = [("primaria","fundo"),("primaria","superficie"),("foco","superficie"),("texto-suave","superficie"),
  ("primaria","superficie-2"),("secundaria","superficie-2"),("texto-suave","superficie-2"),("primaria","primaria-suave"),("primaria-texto","primaria-suave"),("texto-suave","fundo")]
P_V2_TEXTO = [("texto","superficie-2"),("primaria-texto","superficie-2"),("erro","fundo"),("texto","primaria-suave"),("texto","secundaria-suave"),("secundaria-texto*","secundaria-suave")]
def contraste_v2():
    out = []
    for t, c in TEMAS.items():
        cc = dict(c); cc["secundaria-texto*"] = c["secundaria"]
        for a, b in P_TESTE_TEXTO: out.append((t, "teste-texto", a, b, cc[a], cc[b], 4.5))
        for a, b in P_TESTE_COMP: out.append((t, "teste-componente", a, b, cc[a], cc[b], 3.0))
        for a, b in P_V2_TEXTO: out.append((t, "v2-texto", a, b, cc[a], cc[b], 4.5))
        # novos da v2 com cores extras
        out += [(t, "v2-texto", "branco", "marca (destaque)", "#FFFFFF", EXTRA["marca"], 4.5),
                (t, "v2-texto", "primaria-texto claro", "branco (botão no destaque)", "#A3172C", "#FFFFFF", 4.5),
                (t, "v2-texto", "sobre-energia", "energia (selo)", EXTRA["sobre-energia"], EXTRA["energia"], 4.5),
                (t, "v2-componente", "borda do selo (texto)", "fundo", c["texto"], c["fundo"], 3.0),
                (t, "v2-componente", "borda do selo (texto)", "superficie", c["texto"], c["superficie"], 3.0),
                (t, "v2-componente", "músculo inativo: contorno texto-suave", "silhueta superficie-2", c["texto-suave"], c["superficie-2"], 3.0),
                (t, "v2-componente", "músculo inativo: contorno texto-suave", "músculo superficie", c["texto-suave"], c["superficie"], 3.0),
                (t, "v2-componente", "músculo ativo primaria", "silhueta superficie-2", c["primaria"], c["superficie-2"], 3.0),
                (t, "v2-componente", "borda de campo (texto-suave)", "superficie", c["texto-suave"], c["superficie"], 3.0),
                (t, "v2-componente", "branco (selo no destaque)", "marca-escuro", "#FFFFFF", EXTRA["marca-escuro"], 3.0),
                (t, "v2.1-componente", "borda do selo SIMULAÇÃO no modal (texto)", "superficie", c["texto"], c["superficie"], 3.0),
                (t, "v2.1-texto", "texto do selo SIMULAÇÃO", "energia", EXTRA["sobre-energia"], EXTRA["energia"], 4.5)]
        if t == "claro": out += [(t, "v2.1-componente", "borda do botão Google (Light) #747775", "superficie", "#747775", c["superficie"], 3.0),
                                 (t, "v2.1-texto", "texto do botão Google #1F1F1F", "#FFFFFF (Light)", "#1F1F1F", "#FFFFFF", 4.5)]
        else: out += [(t, "v2.1-componente", "botão Google Neutral #F2F2F2", "superficie", "#F2F2F2", c["superficie"], 3.0)]
    res = [dict(tema=t, grupo=g, frente=a, fundo=b, cor_frente=x, cor_fundo=y, razao=round(cr(x, y), 2), minimo=m, ok=cr(x, y) >= m) for t, g, a, b, x, y, m in out]
    assert all(r["ok"] for r in res), [r for r in res if not r["ok"]]
    return res

# ---------- SVG com variáveis de cor ----------
# Cada SVG traz <style> com as variáveis --q-*; o tema escuro entra por [data-tema=escuro] num ancestral ou na própria raiz.
VARS = ["fundo","superficie","superficie-2","borda","texto","texto-suave","primaria","primaria-texto","primaria-suave","secundaria","secundaria-suave","sucesso","alerta","erro"]
def estilo_vars():
    def bloco(t): return ";".join(f"--q-{k}:{TEMAS[t][k]}" for k in VARS) + f";--q-marca:{EXTRA['marca']};--q-energia:{EXTRA['energia']};--q-folha:{EXTRA['folha']}"
    return f"<style>svg{{{bloco('claro')}}}[data-tema=escuro] svg,svg[data-tema=escuro]{{{bloco('escuro')}}}</style>"
def V(n): return f"var(--q-{n})"

def svg_doc(vb, desc, corpo, idd):
    w, h = vb
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img" aria-labelledby="{idd}-t">'
            f'<title id="{idd}-t">{desc}</title>{estilo_vars()}<g aria-hidden="true">{corpo}</g></svg>')

# ---------- personagem (sem traços de rosto, como os avatares do código) ----------
def _pt(x, y, ang, L): a = math.radians(ang); return x + L*math.sin(a), y + L*math.cos(a)
def _seg(p, ang1, L1, ang2, L2):
    a = _pt(*p, ang1, L1); b = _pt(*a, ang2, L2); return a, b
def membro(p, a, b, cor, w): return f'<path d="M{p[0]:.1f} {p[1]:.1f}L{a[0]:.1f} {a[1]:.1f}L{b[0]:.1f} {b[1]:.1f}" fill="none" stroke="{cor}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
POSES = {  # (inclinação tronco, ombroE, cotoveloE, ombroD, cotoveloD, quadrilE, joelhoE, quadrilD, joelhoD) graus; 0 = para baixo, + = para a direita
 "em-pe":     (0, -12, -6, 12, 6, -4, -4, 4, 4),
 "vitoria":   (0, -150, -175, 150, 175, -6, -6, 6, 6),
 "punho":     (0, -15, -5, 160, 200, -5, -5, 5, 5),
 "correr":    (12, 60, 150, -55, 10, 45, -20, -35, -95),
 "halter":    (0, -10, -170, 10, 170, -6, -6, 6, 6),
 "flexionar": (0, -95, -190, 95, 190, -8, -8, 8, 8),
 "apontar":   (0, -12, -4, 95, 95, -5, -5, 5, 5),
 "acenar":    (0, -12, -6, 140, 170, -5, -5, 5, 5),
 "beber":     (0, -10, -4, 40, 200, -5, -5, 5, 5),
 "alongar":   (-8, 160, 200, 140, 170, -10, -10, 12, 12),
 "pular":     (0, -140, -165, 140, 165, -30, 20, 30, -20),
}
def pessoa(x, y, s=1.0, pose="em-pe", pele=0, cabelo=0, roupa="primaria", calca="texto", mao_d=None, mao_e=None, coque=False):
    """x,y = ponto entre os pés. Retorna SVG (sem rosto). mao_d/mao_e: função(px,py) -> svg de objeto na mão."""
    tr, oe, ce, od, cd, qe, je, qd, jd = POSES[pose]
    P, C, R, L = PELE[pele], CABELO[cabelo], V(roupa), V(calca)
    k = s
    quadril = (x, y - 62*k)
    if pose == "pular": quadril = (x, y - 74*k)
    pesc = _pt(*quadril, 180 + tr, 40*k)
    om = _pt(*quadril, 180 + tr, 34*k)
    cab = _pt(*quadril, 180 + tr, 54*k)
    ombE, ombD = (om[0]-9*k, om[1]), (om[0]+9*k, om[1])
    qE, qD = (quadril[0]-6*k, quadril[1]), (quadril[0]+6*k, quadril[1])
    g = []
    a1, b1 = _seg(ombE, oe, 17*k, ce, 15*k); a2, b2 = _seg(ombD, od, 17*k, cd, 15*k)
    l1, f1 = _seg(qE, qe, 31*k, je, 30*k); l2, f2 = _seg(qD, qd, 31*k, jd, 30*k)
    # pernas
    g.append(membro(qE, l1, f1, L, 11*k)); g.append(membro(qD, l2, f2, L, 11*k))
    for f in (f1, f2): g.append(f'<ellipse cx="{f[0]+3*k:.1f}" cy="{f[1]+1*k:.1f}" rx="{8*k:.1f}" ry="{4.5*k:.1f}" fill="{V("secundaria")}"/>')
    # braço de trás
    g.append(membro(ombE, a1, b1, P, 8*k)); g.append(f'<path d="M{ombE[0]:.1f} {ombE[1]:.1f}L{a1[0]:.1f} {a1[1]:.1f}" stroke="{R}" stroke-width="{9.5*k:.1f}" stroke-linecap="round"/>')
    # tronco
    g.append(f'<path d="M{qE[0]-4*k:.1f} {quadril[1]+4*k:.1f}L{ombE[0]-2*k:.1f} {om[1]:.1f}L{ombD[0]+2*k:.1f} {om[1]:.1f}L{qD[0]+4*k:.1f} {quadril[1]+4*k:.1f}Z" fill="{R}" stroke="{R}" stroke-width="{8*k:.1f}" stroke-linejoin="round"/>')
    # pescoço e cabeça (sem rosto)
    g.append(f'<path d="M{om[0]:.1f} {om[1]:.1f}L{pesc[0]:.1f} {pesc[1]-2*k:.1f}" stroke="{P}" stroke-width="{7*k:.1f}" stroke-linecap="round"/>')
    g.append(f'<circle cx="{cab[0]:.1f}" cy="{cab[1]:.1f}" r="{10.5*k:.1f}" fill="{P}"/>')
    g.append(f'<path d="M{cab[0]-11*k:.1f} {cab[1]+1*k:.1f}a{11*k:.1f} {11*k:.1f} 0 0 1 {22*k:.1f} 0c-4 {-3*k:.1f} {-12*k:.1f} {-4*k:.1f} {-22*k:.1f} 0z" fill="{C}"/>')
    if coque: g.append(f'<circle cx="{cab[0]-9*k:.1f}" cy="{cab[1]-8*k:.1f}" r="{5*k:.1f}" fill="{C}"/>')
    # braço da frente
    g.append(membro(ombD, a2, b2, P, 8*k)); g.append(f'<path d="M{ombD[0]:.1f} {ombD[1]:.1f}L{a2[0]:.1f} {a2[1]:.1f}" stroke="{R}" stroke-width="{9.5*k:.1f}" stroke-linecap="round"/>')
    if mao_e: g.insert(4, mao_e(*b1))
    if mao_d: g.append(mao_d(*b2))
    return "".join(g)
def halter(px, py, k=1.0, cor="texto"):
    c = V(cor); return (f'<rect x="{px-11*k:.1f}" y="{py-2*k:.1f}" width="{22*k:.1f}" height="{4*k:.1f}" rx="2" fill="{c}"/>'
                        f'<rect x="{px-14*k:.1f}" y="{py-7*k:.1f}" width="{6*k:.1f}" height="{14*k:.1f}" rx="2" fill="{c}"/><rect x="{px+8*k:.1f}" y="{py-7*k:.1f}" width="{6*k:.1f}" height="{14*k:.1f}" rx="2" fill="{c}"/>')
def garrafa(px, py, k=1.0):
    return (f'<rect x="{px-6*k:.1f}" y="{py-20*k:.1f}" width="{12*k:.1f}" height="{26*k:.1f}" rx="{4*k:.1f}" fill="{V("secundaria")}"/>'
            f'<rect x="{px-3.5*k:.1f}" y="{py-25*k:.1f}" width="{7*k:.1f}" height="{6*k:.1f}" rx="2" fill="{V("texto-suave")}"/>')
def brilho(x, y, r, cor="energia"):
    return f'<path d="M{x} {y-r}Q{x} {y} {x+r} {y}Q{x} {y} {x} {y+r}Q{x} {y} {x-r} {y}Q{x} {y} {x} {y-r}Z" fill="{V(cor)}"/>'
def mancha(cx, cy, rx, ry, cor):
    return f'<path d="M{cx-rx} {cy}C{cx-rx} {cy-ry*1.1} {cx-rx*.2} {cy-ry} {cx+rx*.3} {cy-ry*.95}S{cx+rx} {cy-ry*.4} {cx+rx} {cy+ry*.1}S{cx+rx*.5} {cy+ry} {cx} {cy+ry}S{cx-rx} {cy+ry*.8} {cx-rx} {cy}Z" fill="{V(cor)}"/>'

# ---------- mapa dos músculos v2 (formas simples e arredondadas, frente e costas com silhuetas próprias) ----------
def _e(cx, cy, rx, ry): return f"M{cx-rx:.1f},{cy:.1f}a{rx},{ry} 0 1,0 {2*rx},0a{rx},{ry} 0 1,0 {-2*rx},0Z"
def _r(x, y, w, h, r): return f"M{x+r},{y}h{w-2*r}a{r},{r} 0 0 1 {r},{r}v{h-2*r}a{r},{r} 0 0 1 {-r},{r}h{-(w-2*r)}a{r},{r} 0 0 1 {-r},{-r}v{-(h-2*r)}a{r},{r} 0 0 1 {r},{-r}Z"
def _sil(cx, costas):
    cab = _e(cx, 40, 17, 20)
    tronco = _r(cx-38, 74, 76, 112, 26) if costas else _r(cx-34, 74, 68, 112, 22)   # costas mais largas
    s = cab + _r(cx-9, 58, 18, 18, 6) + tronco + _r(cx-56, 82, 20, 104, 10) + _r(cx+36, 82, 20, 104, 10) + _r(cx-31, 176, 62, 36, 14) + _r(cx-30, 200, 28, 152, 13) + _r(cx+2, 200, 28, 152, 13)
    s += _e(cx, 16, 10, 8)   # coque igual na frente e nas costas
    return s
F, C = 100, 300
MUSC = [  # (id, grupo, lado, caminho)
 ("peito", "peito", "frente", _e(F-14, 100, 15, 11) + _e(F+14, 100, 15, 11)),
 ("ombros-frente", "ombros", "frente", _e(F-38, 90, 11, 10) + _e(F+38, 90, 11, 10)),
 ("biceps", "biceps", "frente", _e(F-46, 122, 7, 15) + _e(F+46, 122, 7, 15)),
 ("antebraco-frente", "antebraco", "frente", _e(F-46, 160, 6, 15) + _e(F+46, 160, 6, 15)),
 ("abdomen", "abdomen", "frente", _r(F-12, 116, 24, 52, 9)),
 ("obliquos", "obliquos", "frente", _e(F-24, 146, 6, 18) + _e(F+24, 146, 6, 18)),
 ("quadriceps", "quadriceps", "frente", _e(F-16, 240, 11, 32) + _e(F+16, 240, 11, 32)),
 ("adutores", "adutores", "frente", _e(F-5, 214, 4, 14) + _e(F+5, 214, 4, 14)),
 ("panturrilhas-frente", "panturrilhas", "frente", _e(F-16, 312, 7, 19) + _e(F+16, 312, 7, 19)),
 ("trapezio", "trapezio", "costas", f"M{C-26},84Q{C},60 {C+26},84Q{C+10},98 {C},104Q{C-10},98 {C-26},84Z"),
 ("ombros-costas", "ombros", "costas", _e(C-41, 92, 11, 10) + _e(C+41, 92, 11, 10)),
 ("costas", "costas", "costas", _e(C-16, 126, 14, 26) + _e(C+16, 126, 14, 26)),
 ("triceps", "triceps", "costas", _e(C-46, 124, 7, 15) + _e(C+46, 124, 7, 15)),
 ("antebraco-costas", "antebraco", "costas", _e(C-46, 160, 6, 15) + _e(C+46, 160, 6, 15)),
 ("lombar", "lombar", "costas", _r(C-14, 156, 28, 20, 8)),
 ("gluteos", "gluteos", "costas", _e(C-14, 194, 14, 13) + _e(C+14, 194, 14, 13)),
 ("posteriores", "posteriores", "costas", _e(C-16, 248, 10, 30) + _e(C+16, 248, 10, 30)),
 ("panturrilhas-costas", "panturrilhas", "costas", _e(C-16, 312, 8, 20) + _e(C+16, 312, 8, 20)),
]
NOME_PT = {"peito": "peito", "costas": "costas", "ombros": "ombros", "biceps": "bíceps", "triceps": "tríceps", "abdomen": "abdômen", "quadriceps": "quadríceps", "posteriores": "posteriores da coxa", "gluteos": "glúteos", "panturrilhas": "panturrilhas", "trapezio": "trapézio", "lombar": "lombar", "antebraco": "antebraço", "obliquos": "oblíquos", "adutores": "adutores"}
GRUPOS = ["peito","costas","ombros","biceps","triceps","abdomen","quadriceps","posteriores","gluteos","panturrilhas","trapezio","lombar","antebraco","obliquos","adutores"]
def mapa(ativos=(), desc=None, idd="mapa"):
    """Cores por variável: --q-mapa-silhueta (superficie-2), --q-mapa-inativo (superficie) com contorno --q-mapa-contorno (texto-suave), --q-mapa-ativo (primaria).
    v2.1: ids únicos (<prefixo>-<músculo>[-frente|-costas]); grupo em data-musculo e class m-<grupo>, também nos lados repetidos."""
    nomes = ", ".join(NOME_PT[g] for g in GRUPOS if g in ativos)
    desc = desc or (f"Mapa muscular, frente e costas: trabalha {nomes}" if nomes else "Mapa muscular, frente e costas, sem área destacada")
    css = "<style>svg{--q-mapa-silhueta:var(--q-superficie-2);--q-mapa-inativo:var(--q-superficie);--q-mapa-contorno:var(--q-texto-suave);--q-mapa-ativo:var(--q-primaria)}.m{fill:var(--q-mapa-inativo);stroke:var(--q-mapa-contorno);stroke-width:1.5}.m.on{fill:var(--q-mapa-ativo);stroke:var(--q-mapa-ativo)}</style>"
    por = {}
    for i, g, lado, d in MUSC: por.setdefault(g, []).append(f'<path id="{idd}-{i}" class="m m-{g}{" on" if g in ativos else ""}" data-musculo="{g}" data-lado="{lado}" d="{d}"/>')
    corpo = (f'<path d="{_sil(F, False)}" fill="var(--q-mapa-silhueta)"/><path d="{_sil(C, True)}" fill="var(--q-mapa-silhueta)"/>'
             + "".join(f'<g data-musculo="{g}">{"".join(p)}</g>' for g, p in por.items()))
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 362" role="img" aria-labelledby="{idd}-t"><title id="{idd}-t">{desc}</title>'
            f'{estilo_vars()}{css}<g aria-hidden="true">{corpo}</g></svg>')
