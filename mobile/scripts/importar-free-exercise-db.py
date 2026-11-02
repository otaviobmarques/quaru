#!/usr/bin/env python3
"""Importa yuhonas/free-exercise-db (Unlicense) para o catálogo do Quaru (v0.4.4). Reprodutível e idempotente.

Uso:  python3 scripts/importar-free-exercise-db.py [--fonte /tmp/fedb] [--sem-midia]
  --fonte: clone do repositório no commit fixado (COMMIT abaixo). Sem ele: git clone + checkout.
Saídas:
  src/dominio/catalogo-fedb.json      dados (nome PT-BR, grupo, equipamentos, área, nível, tipo, instruções)
  public/exercicios/<id>.webp         animação (início ↔ fim, ~0,8 s por quadro, transição suave)
  public/exercicios/<id>-p.webp       quadro parado (pôster, para "reduzir movimento")
  public/exercicios/<id>-m.webp       miniatura da lista
Uma mídia só é refeita se a origem mudou (hash das imagens no manifesto) ou se os parâmetros mudaram.
"""
import argparse, hashlib, io, json, os, re, subprocess, sys, uuid
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from catalogo_glossario import traduzir_nome  # noqa: E402
from catalogo_instrucoes_pt import I as INSTR_PT  # noqa: E402

REPO = 'https://github.com/yuhonas/free-exercise-db'
COMMIT = 'f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5'
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA_JSON = os.path.join(RAIZ, 'src/dominio/catalogo-fedb.json')
SAIDA_MIDIA = os.path.join(RAIZ, 'public/exercicios')
PARAM = {'w': 360, 'h': 240, 'q': 45, 'qmin': 25, 'alvoKB': 60, 'quadroMs': 800, 'transicao': [80, 80], 'mini': [96, 64], 'versao': 1}

# Os 22 da biblioteca anterior mantêm o id (estado salvo na 0.4.3 continua válido).
ANTIGOS = ['Barbell_Bench_Press_-_Medium_Grip', 'Incline_Dumbbell_Press', 'Butterfly', 'Pushups', 'Wide-Grip_Lat_Pulldown',
           'Bent_Over_Barbell_Row', 'Seated_Cable_Rows', 'Pullups', 'Barbell_Squat', 'Leg_Press', 'Leg_Extensions', 'Lying_Leg_Curls',
           'Barbell_Deadlift', 'Standing_Calf_Raises', 'Dumbbell_Shoulder_Press', 'Side_Lateral_Raise', 'Barbell_Curl',
           'Dumbbell_Alternate_Bicep_Curl', 'Triceps_Pushdown', 'Standing_Dumbbell_Triceps_Extension', 'Plank', 'Crunches']
ANTIGOS_DADOS = {  # grupo, rótulo do equipamento, tipo e equipamentos exatamente como na 0.4.3
  'Barbell_Bench_Press_-_Medium_Grip': ('Peito', 'Barra', 'carga_reps', ['barra-anilhas', 'banco']),
  'Incline_Dumbbell_Press': ('Peito', 'Halteres', 'carga_reps', ['halteres', 'banco']), 'Butterfly': ('Peito', 'Máquina', 'carga_reps', ['maquinas']),
  'Pushups': ('Peito', 'Peso corporal', 'peso_corporal', ['peso-corpo']), 'Wide-Grip_Lat_Pulldown': ('Costas', 'Polia', 'carga_reps', ['polia']),
  'Bent_Over_Barbell_Row': ('Costas', 'Barra', 'carga_reps', ['barra-anilhas']), 'Seated_Cable_Rows': ('Costas', 'Polia', 'carga_reps', ['polia']),
  'Pullups': ('Costas', 'Peso corporal', 'peso_corporal', ['barra-fixa']), 'Barbell_Squat': ('Pernas', 'Barra', 'carga_reps', ['barra-anilhas']),
  'Leg_Press': ('Pernas', 'Máquina', 'carga_reps', ['maquinas']), 'Leg_Extensions': ('Pernas', 'Máquina', 'carga_reps', ['maquinas']),
  'Lying_Leg_Curls': ('Pernas', 'Máquina', 'carga_reps', ['maquinas']), 'Barbell_Deadlift': ('Pernas', 'Barra', 'carga_reps', ['barra-anilhas']),
  'Standing_Calf_Raises': ('Pernas', 'Máquina', 'carga_reps', ['maquinas']), 'Dumbbell_Shoulder_Press': ('Ombros', 'Halteres', 'carga_reps', ['halteres']),
  'Side_Lateral_Raise': ('Ombros', 'Halteres', 'carga_reps', ['halteres']), 'Barbell_Curl': ('Bíceps', 'Barra', 'carga_reps', ['barra-anilhas']),
  'Dumbbell_Alternate_Bicep_Curl': ('Bíceps', 'Halteres', 'carga_reps', ['halteres']), 'Triceps_Pushdown': ('Tríceps', 'Polia', 'carga_reps', ['polia']),
  'Standing_Dumbbell_Triceps_Extension': ('Tríceps', 'Halteres', 'carga_reps', ['halteres']), 'Plank': ('Abdômen', 'Peso corporal', 'tempo', ['peso-corpo']),
  'Crunches': ('Abdômen', 'Peso corporal', 'peso_corporal', ['peso-corpo']),
}
NS = uuid.UUID('6f1c2a4e-7b0d-4c1a-9e55-0d0a00fedb01')  # espaço de nomes fixo: mesmo id da fonte → mesmo uuid

GRUPO = {'chest': 'Peito', 'lats': 'Costas', 'middle back': 'Costas', 'lower back': 'Costas', 'traps': 'Costas',
         'quadriceps': 'Pernas', 'hamstrings': 'Pernas', 'calves': 'Pernas', 'glutes': 'Pernas', 'adductors': 'Pernas', 'abductors': 'Pernas',
         'shoulders': 'Ombros', 'biceps': 'Bíceps', 'triceps': 'Tríceps', 'forearms': 'Antebraço', 'abdominals': 'Abdômen', 'neck': 'Pescoço'}
MUSCULO = {'chest': 'peitoral', 'lats': 'dorsais', 'middle back': 'meio das costas', 'lower back': 'lombar', 'traps': 'trapézio',
           'quadriceps': 'quadríceps', 'hamstrings': 'posterior de coxa', 'calves': 'panturrilhas', 'glutes': 'glúteos', 'adductors': 'adutores',
           'abductors': 'abdutores', 'shoulders': 'ombros', 'biceps': 'bíceps', 'triceps': 'tríceps', 'forearms': 'antebraços',
           'abdominals': 'abdômen', 'neck': 'pescoço'}
AREA = {'Peito': 'superiores', 'Costas': 'superiores', 'Ombros': 'superiores', 'Bíceps': 'superiores', 'Tríceps': 'superiores',
        'Antebraço': 'superiores', 'Pescoço': 'superiores', 'Pernas': 'inferiores', 'Abdômen': 'core'}
NIVEL = {'beginner': 'iniciante', 'intermediate': 'intermediario', 'expert': 'avancado'}
CATEGORIA = {'strength': 'força', 'stretching': 'alongamento', 'plyometrics': 'pliometria', 'powerlifting': 'powerlifting',
             'olympic weightlifting': 'levantamento olímpico', 'strongman': 'strongman', 'cardio': 'cardio'}
# equipamento da fonte → (rótulo, ids do app). Ids fora da lista do app (equipamentos.ts) são "extras".
EQUIP = {'body only': ('Peso corporal', ['peso-corpo']), 'dumbbell': ('Halteres', ['halteres']), 'barbell': ('Barra', ['barra-anilhas']),
         'e-z curl bar': ('Barra W', ['barra-anilhas']), 'cable': ('Polia', ['polia']), 'machine': ('Máquina', ['maquinas']),
         'bands': ('Elástico', ['elastico']), 'kettlebells': ('Kettlebell', ['kettlebell']), 'medicine ball': ('Bola medicinal', ['bola-medicinal']),
         'exercise ball': ('Bola suíça', ['bola-suica']), 'foam roll': ('Rolo de espuma', ['rolo-espuma']), 'other': ('Outro', ['outro']),
         None: ('Não informado', [])}

def equipamentos(x):
    rot, ids = EQUIP[x.get('equipment')]
    ids = list(ids)
    n = x['name'].lower()
    if x.get('equipment') in ('body only', 'other', None) and re.search(r'pull[- ]?ups?|chin[- ]?ups?|hanging', n):
        ids = ['barra-fixa'] + [i for i in ids if i not in ('peso-corpo', 'outro')]
    if re.search(r'\bbench\b', n) and not re.search(r'\bno\b[^,]*bench|without', n) and 'machine' not in n and 'smith' not in n and 'banco' not in ids and x.get('equipment') != 'machine':
        ids.append('banco')
    elif re.search(r'\b(incline|decline)\b', n) and x.get('equipment') in ('dumbbell', 'barbell', 'e-z curl bar') and 'banco' not in ids:
        ids.append('banco')
    if x.get('category') == 'cardio' and re.search(r'treadmill|bike|bicycl|elliptical|stair|recumbent|rowing', n):
        ids = ['esteira-bike']
    if rot == 'Não informado' and ids:  # a fonte não diz, mas o nome deixa claro (barra fixa, banco, esteira/bike)
        rot = {'barra-fixa': 'Barra fixa', 'banco': 'Banco', 'esteira-bike': 'Esteira/bike'}[ids[0]]
    return rot, ids

def tipo(x):
    n = x['name'].lower()
    if x['category'] in ('stretching', 'cardio') or re.search(r'\bplank|\bhold\b|isometric|wall sit', n):
        return 'tempo'
    if x.get('equipment') == 'body only':
        return 'peso_corporal'
    return 'carga_reps'

def slug(fid):
    return re.sub(r'[^A-Za-z0-9_-]', '_', fid)

def webp_anim(a, b, q):
    quadros, dur = [a], [PARAM['quadroMs']]
    t = PARAM['transicao']
    for k, ms in enumerate(t, 1):
        quadros.append(Image.blend(a, b, k / (len(t) + 1))); dur.append(ms)
    quadros.append(b); dur.append(PARAM['quadroMs'])
    for k, ms in enumerate(t, 1):
        quadros.append(Image.blend(b, a, k / (len(t) + 1))); dur.append(ms)
    buf = io.BytesIO()
    quadros[0].save(buf, 'WEBP', save_all=True, append_images=quadros[1:], duration=dur, loop=0, quality=q, method=6, minimize_size=True)
    return buf.getvalue()

def gerar_midia(fonte, x, manifesto):
    imgs = [os.path.join(fonte, 'exercises', p) for p in x.get('images', [])]
    if len(imgs) < 2:
        return None
    h = hashlib.sha256(json.dumps(PARAM, sort_keys=True).encode())
    for p in imgs[:2]:
        h.update(open(p, 'rb').read())
    h = h.hexdigest()
    s = slug(x['id'])
    arqs = {k: os.path.join(SAIDA_MIDIA, s + suf) for k, suf in (('anim', '.webp'), ('poster', '-p.webp'), ('mini', '-m.webp'))}
    ant = manifesto.get(x['id'])
    if ant and ant['hash'] == h and all(os.path.exists(p) for p in arqs.values()):
        return ant
    W, H = PARAM['w'], PARAM['h']
    a, b = (Image.open(p).convert('RGB').resize((W, H), Image.LANCZOS) for p in imgs[:2])
    q = PARAM['q']
    dados = webp_anim(a, b, q)
    while len(dados) > PARAM['alvoKB'] * 1024 and q > PARAM['qmin']:
        q -= 5; dados = webp_anim(a, b, q)
    open(arqs['anim'], 'wb').write(dados)
    a.save(arqs['poster'], 'WEBP', quality=60, method=6)
    a.resize(tuple(PARAM['mini']), Image.LANCZOS).save(arqs['mini'], 'WEBP', quality=60, method=6)
    reg = {'hash': h, 'q': q, 'bytes': {k: os.path.getsize(p) for k, p in arqs.items()}}
    return reg

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--fonte'); ap.add_argument('--sem-midia', action='store_true')
    arg = ap.parse_args()
    fonte = arg.fonte
    if not fonte:
        fonte = '/tmp/fedb'
        if not os.path.isdir(fonte):
            subprocess.check_call(['git', 'clone', '--quiet', REPO, fonte])
    rev = subprocess.check_output(['git', '-C', fonte, 'rev-parse', 'HEAD'], text=True).strip()
    if rev != COMMIT:
        sys.exit(f'fonte em {rev}, esperado {COMMIT} (git -C {fonte} checkout {COMMIT})')
    dados = json.load(open(os.path.join(fonte, 'dist/exercises.json')))
    os.makedirs(SAIDA_MIDIA, exist_ok=True)
    pman = os.path.join(SAIDA_MIDIA, 'manifesto.json')
    manifesto = json.load(open(pman)) if os.path.exists(pman) else {}
    novo_man, saida, nomes = {}, [], {}
    midias = {}
    if not arg.sem_midia:
        from concurrent.futures import ProcessPoolExecutor
        with ProcessPoolExecutor() as ex:
            for x, m in zip(dados, ex.map(gerar_midia, [fonte] * len(dados), dados, [manifesto] * len(dados), chunksize=8)):
                midias[x['id']] = m
    for x in sorted(dados, key=lambda e: e['id']):
        fid = x['id']
        nome, metodo = traduzir_nome(fid, x['name'])
        if fid in ANTIGOS_DADOS:
            grupo, rot, tp, eqs = ANTIGOS_DADOS[fid]
            ident = f'00000000-0000-4000-a000-{ANTIGOS.index(fid) + 1:012d}'
        else:
            grupo = GRUPO[x['primaryMuscles'][0]]
            rot, eqs = equipamentos(x)
            tp = tipo(x)
            ident = str(uuid.uuid5(NS, fid))
        midia = midias.get(fid)
        if midia: novo_man[fid] = midia
        elif fid in manifesto: novo_man[fid] = manifesto[fid]
        pt = INSTR_PT.get(fid)
        saida.append({
            'id': ident, 'fonteId': fid, 'nome': nome, 'nomeOriginal': x['name'], 'traducaoNome': metodo,
            'grupoMuscular': grupo, 'equipamento': rot, 'equipamentos': eqs, 'area': AREA[grupo],
            'nivel': NIVEL[x['level']], 'tipo': tp, 'categoria': CATEGORIA[x['category']],
            'musculos': [MUSCULO[m] for m in x['primaryMuscles']], 'musculosSecundarios': [MUSCULO[m] for m in x['secondaryMuscles']],
            'instrucoes': pt, 'instrucoesOriginais': x['instructions'], 'revisao': 'pendente de revisão CREF',
            'midia': slug(fid) if (midia or fid in novo_man) and len(x.get('images', [])) >= 2 else None,
        })
        nomes.setdefault(nome.lower(), []).append(len(saida) - 1)
    # nomes repetidos: os que vieram por regra recebem o nome original entre parênteses (os fixos não mudam)
    for idx in nomes.values():
        if len(idx) > 1:
            for i in idx:
                if saida[i]['traducaoNome'] != 'manual':
                    saida[i]['nome'] = f"{saida[i]['nome']} ({saida[i]['nomeOriginal']})"
    assert len({e['nome'].lower() for e in saida}) == len(saida), 'nomes repetidos'
    assert len({e['id'] for e in saida}) == len(saida)
    # ordem estável: os 22 antigos primeiro (mesma ordem da 0.4.3), depois por nome
    saida.sort(key=lambda e: (0, ANTIGOS.index(e['fonteId'])) if e['fonteId'] in ANTIGOS_DADOS else (1, e['nome'].lower()))
    meta = {'fonte': REPO, 'commit': COMMIT, 'licenca': 'Unlicense (domínio público)', 'total': len(saida), 'parametrosMidia': PARAM}
    txt = json.dumps({'meta': meta, 'exercicios': saida}, ensure_ascii=False, separators=(',', ':'))
    if not os.path.exists(SAIDA_JSON) or open(SAIDA_JSON, encoding='utf-8').read() != txt:
        open(SAIDA_JSON, 'w', encoding='utf-8').write(txt)
    json.dump(novo_man, open(pman, 'w'), sort_keys=True, indent=0)
    tot = sum(sum(m['bytes'].values()) for m in novo_man.values())
    an = [m['bytes']['anim'] for m in novo_man.values()]
    print(json.dumps({'exercicios': len(saida), 'comMidia': len(novo_man), 'animMaxKB': round(max(an) / 1024, 1) if an else 0,
                      'animMediaKB': round(sum(an) / len(an) / 1024, 1) if an else 0, 'animTotalMB': round(sum(an) / 1048576, 1),
                      'midiaTotalMB': round(tot / 1048576, 1), 'jsonKB': round(len(txt.encode()) / 1024),
                      'nomes': {k: sum(1 for e in saida if e['traducaoNome'] == k) for k in ('manual', 'glossario', 'parcial', 'original')},
                      'instrucoesPT': sum(1 for e in saida if e['instrucoes'])}, ensure_ascii=False))

if __name__ == '__main__':
    main()
