import os,subprocess,base64
from gerar import *
def shot(htmlf,png,w,h):
    subprocess.run(["google-chrome","--headless=new","--no-sandbox","--hide-scrollbars","--default-background-color=00000000",f"--window-size={w},{h}",f"--screenshot={png}","file://"+htmlf],capture_output=True)
def tela(cor):
    a=CORES[cor]["a"]; ink="#121214"
    ex=[("Supino reto","4 × 8",[("1","60 kg","8",1),("2","60 kg","8",1),("3","62,5 kg","7",0),("4","62,5 kg","—",0)]),
        ("Remada curvada","3 × 10",[("1","50 kg","10",1),("2","50 kg","10",0),("3","50 kg","—",0)]),
        ("Agachamento livre","4 × 6",[("1","80 kg","—",0),("2","80 kg","—",0)])]
    cards=""
    for n,sr,rows in ex:
        r="".join(f'<div class="row {"ok" if d else ""}"><span>Série {i}</span><span>{k}</span><span>{rep} reps</span><span class="ck">{"✓" if d else ""}</span></div>' for i,k,rep,d in rows)
        cards+=f'<div class="card"><div class="ch"><b>{n}</b><span>{sr}</span></div>{r}</div>'
    return f'''<html><head><meta charset="utf-8"><style>
body{{margin:0;width:1080px;height:2340px;background:#121214;color:#F4F2EE;font-family:"Inter Tight";overflow:hidden}}
.top{{padding:120px 64px 0;display:flex;align-items:center;gap:24px}}
.top svg{{width:84px;height:84px}} .top .w{{font:700 56px "Space Grotesk"}}
.ex{{margin:24px 64px 0;font-size:30px;color:#8A8A93;border:2px dashed #2E2E34;border-radius:16px;padding:14px 22px}}
h1{{font:700 88px "Space Grotesk";margin:48px 64px 8px}} .sub{{margin:0 64px;font-size:36px;color:#A0A0A8}}
.prog{{margin:36px 64px;height:18px;background:#2A2A30;border-radius:9px}} .prog i{{display:block;width:45%;height:100%;background:{a};border-radius:9px}}
.card{{background:#1C1C20;margin:28px 64px;border-radius:32px;padding:36px 40px}}
.ch{{display:flex;justify-content:space-between;font-size:42px;margin-bottom:18px}} .ch span{{color:#A0A0A8;font-size:36px}}
.row{{display:grid;grid-template-columns:2fr 2fr 2fr 70px;font-size:36px;padding:16px 0;border-top:1px solid #2A2A30;color:#C8C8CE;align-items:center}}
.row.ok{{color:#F4F2EE}} .ck{{width:56px;height:56px;border-radius:14px;border:3px solid #3A3A42;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:36px}}
.row.ok .ck{{background:{a};border-color:{a};color:{ink}}}
.btn{{position:absolute;left:64px;right:64px;bottom:120px;height:150px;background:{a};color:{ink};border-radius:40px;display:flex;align-items:center;justify-content:center;font:700 60px "Space Grotesk"}}
</style></head><body>
<div class="top"><svg viewBox="0 0 100 100">{sym("visto",a,"#121214")}</svg><span class="w">malhou</span></div>
<div class="ex">Dados de exemplo, apenas para ilustrar a interface</div>
<h1>Treino de hoje</h1><div class="sub">Treino A · Peito e costas · domingo, 1º de nov.</div>
<div class="prog"><i></i></div>{cards}
<div class="btn">Malhei!</div></body></html>'''
D=os.path.join(OUT,"tela-exemplo"); os.makedirs(D,exist_ok=True)
for cor in CORES:
    f=f"{D}/tela-treino-de-hoje-{cor}.html"; open(f,"w").write(tela(cor)); shot(f,f[:-5]+".png",1080,2340)
# paleta
PAL=[("Grafite (fundo)","#121214"),("Superfície","#1C1C20"),("Borda","#2A2A30"),("Texto secundário","#A0A0A8"),("Texto principal","#F4F2EE"),
     ("Laranja (principal)","#FF6A1A"),("Laranja em fundo claro","#E8580A"),("Limão (alternativa)","#D4FF3A"),("Limão em fundo claro","#6F8F00")]
def img(p): return "data:image/png;base64,"+base64.b64encode(open(p,"rb").read()).decode()
def prancha():
    cols=""
    for c in ATIVOS:
        pasta,desc=CONC[c]
        d=os.path.join(OUT,pasta); bl=""
        for cor in ["laranja","limao"]:
            bl+=f'<div class="lg">{logo(c,cor,"escuro")}</div><div class="lg">{logo(c,cor,"claro")}</div>'
        ic="".join(f'<img src="{img(f"{d}/icone-{cor}-32.png")}" width="32" height="32"><img src="{img(f"{d}/icone-{cor}-512.png")}" width="80">' for cor in ["laranja","limao"])
        cols+=f'<div class="col"><h3>{pasta[:2]} · {pasta[3:].replace("evolucao","evolução").replace("balao","balão").replace("tipografico","tipográfico").capitalize()} <span style=\"font-size:20px;color:#FF6A1A\">({ROT[c]})</span></h3><p>{desc}</p><div class="tag">Laranja (preferida) ↓ · depois limão</div>{bl}<div class="ics">{ic}</div><small>ícones: 32 px reais + 80 px</small></div>'
    pal="".join(f'<div class="sw"><i style="background:{h}"></i>{n}<br><b>{h}</b></div>' for n,h in PAL)
    t="".join(f'<img class="tl" src="{img(f"{D}/tela-treino-de-hoje-{cor}.png")}">' for cor in ["laranja","limao"])
    return f'''<html><head><meta charset="utf-8"><style>@page{{size:2600px 1560px;margin:0}}
body{{margin:0;width:2600px;height:1560px;background:#0C0C0E;color:#F4F2EE;font-family:"Inter Tight";padding:60px;box-sizing:border-box}}
h1{{font:700 64px "Space Grotesk";margin:0}} .lead{{color:#A0A0A8;font-size:26px;margin:6px 0 30px}}
.wrap{{display:flex;gap:28px}} .cols{{display:flex;gap:22px;flex:1}} .col{{flex:1;background:#17171A;border-radius:20px;padding:22px}}
h3{{font:700 30px "Space Grotesk";margin:0 0 6px}} p{{font-size:19px;color:#C8C8CE;min-height:52px;margin:0 0 10px}}
.tag{{font-size:16px;color:#FF6A1A;margin-bottom:8px}}
.lg svg{{width:100%;height:auto;display:block;border-radius:10px;margin-bottom:10px}}
.ics{{display:flex;align-items:center;gap:14px;margin-top:10px}} small{{color:#8A8A93;font-size:15px}}
.side{{width:760px}} .tl{{width:360px;border-radius:30px;margin-right:12px;border:2px solid #2A2A30}}
.pal{{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:22px;font-size:17px}} .sw i{{display:block;height:46px;border-radius:8px;border:1px solid #333;margin-bottom:4px}}
.ty{{margin-top:20px;font-size:20px;color:#C8C8CE}} .ty b{{font-family:"Space Grotesk";font-size:30px;color:#fff}}
</style></head><body><h1>Malhou · identidade visual v1 (conceitos)</h1>
<div class="lead">Domma Tecnologia · 01/11/2026 · laranja como cor principal, amarelo-limão como alternativa · recomendação: 01 · Visto</div>
<div class="wrap"><div class="cols">{cols}</div><div class="side"><h3>Tela de exemplo (conceito 01): laranja | limão</h3><div>{t}</div>
<h3 style="margin-top:20px">Paleta</h3><div class="pal">{pal}</div>
<div class="ty"><b>Space Grotesk Bold</b> marca e títulos<br><span style="font-family:'Inter Tight';font-size:26px;color:#fff">Inter Tight</span> textos e números da interface<br><span style="font-family:Oswald;font-weight:700;font-size:26px;color:#fff">OSWALD</span> só no conceito 05 · todas OFL (Google Fonts)</div></div></div></body></html>'''
P=os.path.join(OUT,"prancha"); os.makedirs(P,exist_ok=True)
f=f"{P}/prancha-malhou.html"; open(f,"w").write(prancha()); shot(f,f"{P}/prancha-malhou.png",2600,1560)
subprocess.run(["google-chrome","--headless=new","--no-sandbox","--no-pdf-header-footer",f"--print-to-pdf={P}/prancha-malhou.pdf","file://"+f],capture_output=True)
