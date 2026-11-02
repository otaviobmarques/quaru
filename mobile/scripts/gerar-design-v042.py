#!/usr/bin/env python3
"""Importa os arquivos do design v2.1 (RedBox, aprovado pelo Otávio) para o código do Quaru 0.4.2.

Uso: python3 scripts/gerar-design-v042.py <pasta telas-v0.4.1 do design>

Gera (sem redesenhar nada):
- src/config/design-v042-gerado.ts: 11 ilustrações do tour (SVG por tema, cores já resolvidas a partir das
  variáveis --q-*), as 2 pessoas do topo do login e o mapa muscular (silhuetas + músculos com data-musculo/data-lado).
- assets/animacoes/: 5 animações Lottie (claro/escuro) e o quadro final de cada uma (fallback estático da web).
- assets/images/android-icon-*.png: ícone adaptável em camadas (fundo + primeiro plano + monocromático), 1024 px.
As cores do tema vêm de src/tema/tokens.ts (paleta v0.3): o script falha se o SVG do design trouxer outro valor.
"""
import json, re, shutil, sys
from pathlib import Path

D = Path(sys.argv[1])
RAIZ = Path(__file__).resolve().parent.parent

def ler_tokens():
    s = (RAIZ / 'src/tema/tokens.ts').read_text()
    temas = {}
    for tema in ('claro', 'escuro'):
        bloco = re.search(r'"%s": \{(.*?)\}' % tema, s.split('export const temas')[1], re.S).group(1)
        temas[tema] = dict(re.findall(r'"([a-z0-9-]+)": "(#[0-9A-F]{6})"', bloco))
    return temas

TOK = ler_tokens()

def variaveis(svg):
    """Lê as duas listas --q-* (claro e escuro) do <style> do design."""
    estilos = re.findall(r'<style>(.*?)</style>', svg, re.S)
    css = estilos[0]
    claro = dict(re.findall(r'--q-([a-z0-9-]+):(#[0-9A-Fa-f]{6})', css.split('[data-tema=escuro]', 1)[0]))
    escuro = dict(re.findall(r'--q-([a-z0-9-]+):(#[0-9A-Fa-f]{6})', css.split('[data-tema=escuro]', 1)[1]))
    for tema, v in (('claro', claro), ('escuro', escuro)):
        for k, cor in v.items():
            if k in TOK[tema] and TOK[tema][k].upper() != cor.upper():
                raise SystemExit(f'cor divergente do tokens.ts: {tema} {k} {cor} != {TOK[tema][k]}')
    return claro, escuro

def resolver(svg, cores):
    corpo = re.sub(r'<style>.*?</style>', '', svg, flags=re.S)
    corpo = re.sub(r'<title[^>]*>.*?</title>', '', corpo, flags=re.S)
    corpo = re.sub(r'\s(role|aria-labelledby|aria-hidden|class|id|data-[a-z]+)="[^"]*"', '', corpo)
    def troca(m):
        k = m.group(1)
        if k not in cores: raise SystemExit(f'variável sem cor: {k}')
        return cores[k]
    corpo = re.sub(r'var\(--q-([a-z0-9-]+)\)', troca, corpo)
    assert 'var(' not in corpo
    return corpo.strip()

# 1) Ilustrações do tour
NOMES = {'objetivo': 'objetivo', 'nivel': 'nivel', 'dias': 'dias', 'tempo': 'tempo', 'onde-treina': 'onde-treina',
         'areas-do-corpo': 'areas-do-corpo', 'altura-e-peso': 'altura-e-peso', 'lesoes': 'lesoes',
         'preferencia-alimentar': 'preferencia-alimentar', 'lembretes': 'lembretes', 'cidade-e-bairro': 'cidade-e-bairro'}
ilus = {}
for nome in NOMES:
    s = (D / f'lote-1-ilustracoes-v2.1/svg/ilustracao-tour-{nome}.svg').read_text()
    titulo = re.search(r'<title[^>]*>(.*?)</title>', s).group(1)
    cl, es = variaveis(s)
    ilus[nome] = {'descricao': titulo, 'claro': resolver(s, cl), 'escuro': resolver(s, es)}
assert len(ilus) == 11

# 2) Pessoas do topo do login (decorativas)
h = (D / 'login-v2.1/html/tela-08-login_claro_normal.html').read_text()
gente = re.search(r'<div class="gente">(.*?)</div>', h, re.S).group(1)
pessoas = re.findall(r'<svg.*?</svg>', gente, re.S)
assert len(pessoas) == 2
pess = []
for p in pessoas:
    cl, es = variaveis(p)
    pess.append({'claro': resolver(p, cl), 'escuro': resolver(p, es)})

# 3) Mapa muscular: silhuetas e músculos (a cor é aplicada pelo código)
m = (D / 'lote-2-telas-v2.1/recursos/mapa-musculos.svg').read_text()
viewbox = re.search(r'viewBox="([^"]+)"', m).group(1)
silhuetas = re.findall(r'<path d="([^"]+)" fill="var\(--q-mapa-silhueta\)"', m)
musculos = [{'id': i, 'musculo': g, 'lado': l, 'd': d} for i, g, l, d in re.findall(
    r'<path id="mapa-([^"]+)" class="[^"]*" data-musculo="([^"]+)" data-lado="([^"]+)" d="([^"]+)"', m)]
assert len(silhuetas) == 2 and len(musculos) == 18, (len(silhuetas), len(musculos))

def svg_oficial(f):
    x = (D / 'login-v2.1/html/recursos' / f).read_text()
    x = re.sub(r'<\?xml[^>]*>\s*', '', x)
    # Mesma cor, só a notação (o react-native-svg não lê rgb com %).
    return re.sub(r'rgb\(([\d.]+)%,\s*([\d.]+)%,\s*([\d.]+)%\)', lambda m: '#' + ''.join('%02X' % round(float(v) / 100 * 255) for v in m.groups()), x).strip()
oficiais = {'DOMMA_ASSINATURA_CLARO': svg_oficial('domma_sinal_fundo-claro.svg'), 'DOMMA_ASSINATURA_ESCURO': svg_oficial('domma_sinal_fundo-escuro.svg'),
            'LOGO_BRANCO': svg_oficial('quaru_branca.svg')}

marca = json.loads((D / 'lote-2-telas-v2.1/html/marca.json').read_text())

saida = RAIZ / 'src/config/design-v042-gerado.ts'
saida.write_text(
    '// GERADO por scripts/gerar-design-v042.py a partir do design v2.1 (RedBox). Não edite à mão.\n'
    '// Cores conferidas contra src/tema/tokens.ts (paleta v0.3) durante a geração.\n'
    f'export const ILUSTRACOES_TOUR = {json.dumps(ilus, ensure_ascii=False, indent=1)} as const;\n'
    f'export const PESSOAS_LOGIN = {json.dumps(pess, ensure_ascii=False)} as const;\n'
    f'export const MAPA_VIEWBOX = {json.dumps(viewbox)};\n'
    f'export const MAPA_SILHUETAS = {json.dumps(silhuetas)} as const;\n'
    f'export const MAPA_MUSCULOS = {json.dumps(musculos, ensure_ascii=False, indent=1)} as const;\n'
    + ''.join(f'export const {k} = {json.dumps(v)};\n' for k, v in oficiais.items()) +
    f'/** Nome e empresa conferidos com o marca.json do design (o código usa src/config/marca.ts). */\n'
    f'export const MARCA_DESIGN = {json.dumps({"nome": marca["nome"], "empresa": marca["empresa"]}, ensure_ascii=False)} as const;\n')

# 4) Animações Lottie + quadro final (web)
A = RAIZ / 'assets/animacoes'; A.mkdir(parents=True, exist_ok=True)
for n in ('tour-progresso', 'carregando', 'meta-de-agua', 'treino-concluido', 'login-sucesso'):
    for t in ('claro', 'escuro'):
        j = json.loads((D / f'animacoes-v2.1/{n}_{t}.json').read_text())
        assert not j.get('assets'), f'{n}: Lottie com imagens'
        shutil.copyfile(D / f'animacoes-v2.1/{n}_{t}.json', A / f'{n}_{t}.json')
        shutil.copyfile(D / f'animacoes-v2.1/previas/{n}_{t}_quadro-final.png', A / f'{n}_{t}_quadro-final.png')
shutil.copyfile(D / 'animacoes-v2.1/manifesto.json', A / 'manifesto.json')

# 5) Ícone adaptável em camadas (1024 px)
import cairosvg
from PIL import Image
I = RAIZ / 'assets/images'
R = D / 'lote-2-telas-v2.1/recursos'
cairosvg.svg2png(url=str(R / 'icone-adaptavel_fundo.svg'), write_to=str(I / 'android-icon-background.png'), output_width=1024, output_height=1024)
cairosvg.svg2png(url=str(R / 'icone-adaptavel_primeiro-plano.svg'), write_to=str(I / 'android-icon-foreground.png'), output_width=1024, output_height=1024)
fg = Image.open(I / 'android-icon-foreground.png').convert('RGBA')
mono = Image.new('RGBA', fg.size, (255, 255, 255, 0)); mono.putalpha(fg.getchannel('A'))
mono.save(I / 'android-icon-monochrome.png')
print('ok: 11 ilustrações, 2 pessoas, mapa com', len(musculos), 'músculos, 10 animações, ícone em camadas')
