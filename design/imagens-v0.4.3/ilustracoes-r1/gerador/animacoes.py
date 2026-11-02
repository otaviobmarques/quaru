#!/usr/bin/env python3
"""Animações v2 em Lottie JSON escrito por código (sem imagens, sem expressões, sem texto, sem efeitos) -> compatível com lottie-react-native no Expo.
Prévias GIF/MP4: renderizadas com lottie-web no Chromium (Playwright) + ffmpeg. Cores = tokens.ts (paleta v0.3), versão clara e escura."""
import os, sys, json, math, subprocess, shutil
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from base import TEMAS, EXTRA, RAIZ, MARCA
OUT = os.path.join(RAIZ, "animacoes-v2.1"); os.makedirs(OUT, exist_ok=True)
FR = 30
def rgb(h): return [int(h[i:i+2], 16)/255 for i in (1, 3, 5)] + [1]
E_OUT = {"o": {"x": [0.33], "y": [0]}, "i": {"x": [0.2], "y": [1]}}
def kf(*pts):
    """pts = (frame, valor) ... -> propriedade animada (ou estática se 1 ponto)."""
    if len(pts) == 1: v = pts[0][1]; return {"a": 0, "k": v}
    k = []
    for i, (t, v) in enumerate(pts):
        v = v if isinstance(v, list) else [v]
        d = {"t": t, "s": v}
        if i < len(pts)-1: d.update(E_OUT)
        k.append(d)
    return {"a": 1, "k": k}
def tr(p=None, s=None, r=None, o=None, a=None):
    return {"ty": "tr", "p": p or kf((0, [0, 0])), "a": a or kf((0, [0, 0])), "s": s or kf((0, [100, 100])), "r": r or kf((0, 0)), "o": o or kf((0, 100)), "sk": kf((0, 0)), "sa": kf((0, 0))}
def fill(c): return {"ty": "fl", "c": kf((0, rgb(c))), "o": kf((0, 100)), "r": 1}
def stroke(c, w, cap=2): return {"ty": "st", "c": kf((0, rgb(c))), "o": kf((0, 100)), "w": kf((0, w)), "lc": cap, "lj": 2}
def ell(w, h, p=(0, 0)): return {"ty": "el", "p": kf((0, list(p))), "s": kf((0, [w, h])) if not isinstance(w, dict) else w}
def rect(w, h, r=0, p=(0, 0), s=None): return {"ty": "rc", "p": kf((0, list(p))), "s": s or kf((0, [w, h])), "r": kf((0, r))}
def path(pts, closed=False):
    return {"ty": "sh", "ks": kf((0, {"i": [[0, 0]]*len(pts), "o": [[0, 0]]*len(pts), "v": [list(p) for p in pts], "c": closed}))}
def trim(e): return {"ty": "tm", "s": kf((0, 0)), "e": e, "o": kf((0, 0)), "m": 1}
def grupo(itens, t=None): return {"ty": "gr", "it": itens + [t or tr()]}
def camada(nome, shapes, p=(0, 0), s=None, r=None, o=None, a=(0, 0), ip=0, op=None, pa=None):
    return {"ddd": 0, "ty": 4, "nm": nome, "sr": 1, "ks": {"o": o or kf((0, 100)), "r": r or kf((0, 0)), "p": pa or kf((0, [p[0], p[1], 0])), "a": kf((0, [a[0], a[1], 0])), "s": s or kf((0, [100, 100, 100]))},
            "ao": 0, "shapes": shapes, "ip": ip, "op": op or 9999, "st": 0, "bm": 0}
def doc(nome, w, h, dur, camadas):
    for c in camadas: c["op"] = min(c["op"], dur)
    return {"v": "5.7.4", "fr": FR, "ip": 0, "op": dur, "w": w, "h": h, "nm": nome, "ddd": 0, "assets": [], "layers": camadas}

def carregando(c):
    cores = [c["primaria"], c["secundaria"], EXTRA["energia"]]
    L = [camada(f"ponto{i}", [grupo([ell(28, 28), fill(cores[i])])], pa=kf((0+i*5, [70+i*50, 120, 0]), (10+i*5, [70+i*50, 84, 0]), (20+i*5, [70+i*50, 120, 0]), (45, [70+i*50, 120, 0])),
                 s=kf((0+i*5, [100, 100, 100]), (10+i*5, [90, 115, 100]), (20+i*5, [115, 85, 100]), (26+i*5, [100, 100, 100]))) for i in range(3)]
    return doc("carregando", 240, 160, 45, L)
def agua(c):
    a, sec, txt = c["superficie-2"], c["secundaria"], c["texto-suave"]
    copo = camada("copo", [grupo([rect(96, 140, 18), stroke(txt, 5)])], p=(120, 120))
    nivel = camada("agua", [grupo([rect(86, 130, 14, p=(0, -65)), fill(sec)])], pa=kf((0, [120, 185, 0])), a=(0, 0),
                   s=kf((0, [100, 8, 100]), (20, [100, 8, 100]), (60, [100, 100, 100]), (150, [100, 100, 100])))
    fundo = camada("trilho", [grupo([rect(86, 130, 14), fill(a)])], p=(120, 120))
    gota = camada("gota", [grupo([ell(22, 28), fill(sec)])], pa=kf((0, [120, -20, 0]), (20, [120, 80, 0])), o=kf((0, 100), (19, 100), (21, 0)))
    selo = camada("check", [grupo([path([(-14, 0), (-4, 10), (16, -12)]), stroke(c["superficie"], 8)]), grupo([ell(64, 64), fill(c["sucesso"])])], p=(190, 50),
                  s=kf((0, [0, 0, 100]), (64, [0, 0, 100]), (76, [120, 120, 100]), (84, [100, 100, 100])))
    brilhos = [camada(f"b{i}", [grupo([rect(6, 18, 3), fill(EXTRA["energia"])])], p=(190+32*math.cos(i*1.05), 50+32*math.sin(i*1.05)), r=kf((0, i*60+90)),
                      s=kf((0, [0, 0, 100]), (76, [0, 0, 100]), (84, [100, 100, 100]), (98, [0, 0, 100]))) for i in range(6)]
    return doc("meta-de-agua", 240, 220, 150, [selo] + brilhos + [gota, copo, nivel, fundo])
def concluido(c):
    cores = [c["primaria"], c["secundaria"], EXTRA["energia"], c["sucesso"]]
    medalha = camada("medalha", [grupo([path([(-20, 0), (-6, 14), (22, -16)]), stroke("#14141A", 9)]), grupo([ell(90, 90), stroke(c["texto"], 5), fill(EXTRA["energia"])])], p=(120, 110),
                     s=kf((0, [0, 0, 100]), (12, [125, 125, 100]), (20, [92, 92, 100]), (26, [100, 100, 100])), r=kf((0, -30), (20, 8), (26, 0)))
    fita = camada("fitas", [grupo([path([(-30, 30), (-44, 80), (-26, 70), (-16, 86), (-6, 40)], True), fill(c["primaria"])]), grupo([path([(30, 30), (44, 80), (26, 70), (16, 86), (6, 40)], True), fill(c["secundaria"])])], p=(120, 110),
                   s=kf((0, [0, 0, 100]), (10, [0, 0, 100]), (20, [100, 100, 100])))
    conf = []
    for i in range(14):
        ang = i*2*math.pi/14; d = 90 + (i % 3)*14
        conf.append(camada(f"c{i}", [grupo([rect(8, 14, 2), fill(cores[i % 4])])], pa=kf((6, [120, 110, 0]), (36, [120+d*math.cos(ang), 110+d*math.sin(ang)+20, 0]), (60, [120+d*math.cos(ang), 110+d*math.sin(ang)+50, 0])),
                           r=kf((6, 0), (60, 360*(1 if i % 2 else -1))), o=kf((6, 0), (8, 100), (44, 100), (60, 0))))
    anel = camada("onda", [grupo([ell(100, 100), stroke(c["primaria"], 4)])], p=(120, 110), s=kf((0, [80, 80, 100]), (24, [200, 200, 100])), o=kf((0, 90), (24, 0)))
    return doc("treino-concluido", 240, 220, 75, [medalha, fita] + conf + [anel])
def tour(c):
    n = 11; L = []
    for i in range(n):
        x = 20 + i*20
        L.append(camada(f"passo{i}", [grupo([rect(10, 10, 5), fill(c["texto-suave"])])], p=(x, 60)))
    ativo = camada("ativo", [grupo([rect(22, 10, 5), fill(c["primaria"])])], pa=kf(*[(i*8, [20+i*20, 60, 0]) for i in range(n)] + [(n*8+10, [20+(n-1)*20, 60, 0])]),
                   s=kf(*sum([[(i*8, [100, 100, 100]), (i*8+4, [140, 100, 100])] for i in range(n)], [])))
    estrela = camada("estrela", [grupo([path([(0, -16), (5, -5), (16, 0), (5, 5), (0, 16), (-5, 5), (-16, 0), (-5, -5)], True), fill(EXTRA["energia"]), stroke(c["texto"], 2)])],
                     pa=kf(*[(i*8, [20+i*20, 30 if i % 2 else 36, 0]) for i in range(n)] + [(n*8+10, [20+(n-1)*20, 30, 0])]), r=kf((0, 0), (n*8+10, 360)))
    return doc("tour-progresso", 240, 90, n*8+20, [estrela, ativo] + L)
def login_ok(c):
    circ = camada("circulo", [grupo([ell(120, 120), stroke(c["primaria"], 10), trim(kf((0, 0), (24, 100)))])], p=(120, 110), r=kf((0, -90)))
    chk = camada("check", [grupo([path([(-28, 2), (-8, 22), (30, -20)]), stroke(c["primaria"], 12), trim(kf((22, 0), (36, 100)))])], p=(120, 110),
                 s=kf((34, [100, 100, 100]), (40, [115, 115, 100]), (46, [100, 100, 100])))
    ondas = [camada(f"onda{i}", [grupo([ell(120, 120), stroke([c["secundaria"], EXTRA["energia"]][i], 4)])], p=(120, 110), s=kf((36+i*6, [100, 100, 100]), (60+i*6, [170, 170, 100])), o=kf((36+i*6, 0), (38+i*6, 100), (60+i*6, 0))) for i in range(2)]
    return doc("login-sucesso", 240, 220, 72, [chk, circ] + ondas)
ANIMS = {"tour-progresso": tour, "carregando": carregando, "meta-de-agua": agua, "treino-concluido": concluido, "login-sucesso": login_ok}

LOTTIE_JS = "/tmp/lw/lottie.min.js"
def previas():
    from playwright.sync_api import sync_playwright
    os.makedirs(f"{OUT}/previas", exist_ok=True); info = {}
    with sync_playwright() as pw:
        br = pw.chromium.launch(); pg = br.new_page(device_scale_factor=2)
        for nome in ANIMS:
            for t in TEMAS:
                j = json.load(open(f"{OUT}/{nome}_{t}.json")); w, h = j["w"], j["h"]
                hp = f"{OUT}/_p.html"; open(hp, "w").write(f'<html><body style="margin:0;background:{TEMAS[t]["fundo"]}"><div id="a" style="width:{w}px;height:{h}px"></div><script src="file://{LOTTIE_JS}"></script>'
                    f'<script>window.an=lottie.loadAnimation({{container:document.getElementById("a"),renderer:"svg",loop:false,autoplay:false,animationData:{json.dumps(j)}}});</script></body></html>')
                pg.set_viewport_size({"width": w, "height": h}); pg.goto("file://" + hp); pg.wait_for_timeout(200)
                fd = f"/tmp/fr_{nome}_{t}"; shutil.rmtree(fd, ignore_errors=True); os.makedirs(fd)
                for f in range(j["op"]):
                    pg.evaluate(f"an.goToAndStop({f},true)"); pg.screenshot(path=f"{fd}/{f:04d}.png")
                base = f"{OUT}/previas/{nome}_{t}"
                subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FR), "-i", f"{fd}/%04d.png", "-vf", "split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse", "-loop", "0", base + ".gif"], check=True)
                subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FR), "-i", f"{fd}/%04d.png", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-vf", "pad=ceil(iw/2)*2:ceil(ih/2)*2", base + ".mp4"], check=True)
                shutil.copy(f"{fd}/{j['op']-1:04d}.png", base + "_quadro-final.png")
                info[f"{nome}_{t}"] = dict(json_kb=round(os.path.getsize(f"{OUT}/{nome}_{t}.json")/1024, 1), gif_kb=round(os.path.getsize(base + ".gif")/1024), mp4_kb=round(os.path.getsize(base + ".mp4")/1024), quadros=j["op"], fps=FR)
        os.remove(hp); br.close()
    return info
MANIFESTO = {
 "tour-progresso": dict(tipo="decorativa", repetir=False, descricao=None, uso="Pontos de passo do tour; o progresso real é anunciado em texto (\"Pergunta 3 de 11\")."),
 "carregando": dict(tipo="decorativa", repetir=True, repeticoes_max=10, descricao=None, uso="Até 10 voltas (15 s); depois fica parado no último quadro e o texto \"Carregando…\" continua visível (role=status)."),
 "meta-de-agua": dict(tipo="sucesso", repetir=False, descricao="Meta de água do dia concluída", uso="Toca uma vez ao bater a meta."),
 "treino-concluido": dict(tipo="sucesso", repetir=False, descricao="Treino concluído. Parabéns!", uso="Toca uma vez no resumo do treino."),
 "login-sucesso": dict(tipo="sucesso", repetir=False, descricao="Login feito com sucesso", uso="Toca uma vez antes de ir para o Início."),
}
if __name__ == "__main__":
    json.dump(dict(regras=dict(reduzir_movimento="mostrar o quadro final parado (progress=1)", decorativa="importantForAccessibility=no-hide-descendants / aria-hidden", sucesso="accessible + accessibilityLabel = descricao; anunciar com AccessibilityInfo.announceForAccessibility"), animacoes=MANIFESTO), open(f"{OUT}/manifesto.json", "w"), ensure_ascii=False, indent=1)
    for nome, f in ANIMS.items():
        for t in TEMAS:
            j = f(TEMAS[t]); s = json.dumps(j, separators=(",", ":"))
            assert '"ty":5' not in s and '"assets":[]' in s and '"x":"' not in s   # sem texto, sem imagens, sem expressões
            open(f"{OUT}/{nome}_{t}.json", "w").write(s)
    info = previas(); json.dump(info, open(f"{OUT}/animacoes.json", "w"), indent=1); print(json.dumps(info))

def prancha_anim():
    from PIL import Image, ImageDraw, ImageFont
    FN = "/usr/share/fonts/truetype/sand-box/google/Inter/Inter-VariableFont_opsz,wght.ttf"
    linhas = [(n, t) for n in ANIMS for t in TEMAS]; Q = 6; cw = 240
    alturas = [json.load(open(f"{OUT}/{n}_{t}.json"))["h"] for n, t in linhas]
    H = 100 + sum(h + 44 for h in alturas); P = Image.new("RGB", (40 + Q*(cw+16) + 40, H), "#F5F4F1"); d = ImageDraw.Draw(P)
    d.text((40, 28), f"{MARCA['nome']} v0.4.1 · animações v2.1 (Lottie) · 6 quadros por animação", fill="#14141A", font=ImageFont.truetype(FN, 30)); y = 96
    for (n, t), h in zip(linhas, alturas):
        j = json.load(open(f"{OUT}/{n}_{t}.json")); d.text((40, y), f"{n} · {t} · {j['op']} quadros a {FR} fps", fill="#14141A", font=ImageFont.truetype(FN, 18))
        for i in range(Q):
            f = round(i*(j["op"]-1)/(Q-1)); im = Image.open(f"/tmp/fr_{n}_{t}/{f:04d}.png").convert("RGB").resize((cw, h)); P.paste(im, (40+i*(cw+16), y+28))
        y += h + 44
    P.save(f"{OUT}/prancha-animacoes-v2.1.png")
if __name__ == "__main__": prancha_anim()
