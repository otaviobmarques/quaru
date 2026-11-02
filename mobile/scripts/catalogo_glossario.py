"""Glossário de nomes (inglês -> português de academia no Brasil) para o catálogo free-exercise-db.
Tradução própria da Domma, por regra + exceções. Todo texto sai como 'pendente de revisão CREF'."""
import re

# Nomes fixos (os mais comuns nas academias brasileiras). Chave: id da fonte.
MANUAL = {
  'Barbell_Bench_Press_-_Medium_Grip': 'Supino reto com barra', 'Incline_Dumbbell_Press': 'Supino inclinado com halteres',
  'Butterfly': 'Crucifixo na máquina', 'Pushups': 'Flexão de braço', 'Wide-Grip_Lat_Pulldown': 'Puxada frontal',
  'Bent_Over_Barbell_Row': 'Remada curvada com barra', 'Seated_Cable_Rows': 'Remada baixa', 'Pullups': 'Barra fixa',
  'Barbell_Squat': 'Agachamento livre', 'Leg_Press': 'Leg press 45°', 'Leg_Extensions': 'Cadeira extensora',
  'Lying_Leg_Curls': 'Mesa flexora', 'Barbell_Deadlift': 'Levantamento terra', 'Standing_Calf_Raises': 'Panturrilha em pé',
  'Dumbbell_Shoulder_Press': 'Desenvolvimento com halteres', 'Side_Lateral_Raise': 'Elevação lateral', 'Barbell_Curl': 'Rosca direta',
  'Dumbbell_Alternate_Bicep_Curl': 'Rosca alternada', 'Triceps_Pushdown': 'Tríceps na polia',
  'Standing_Dumbbell_Triceps_Extension': 'Tríceps francês', 'Plank': 'Prancha', 'Crunches': 'Abdominal supra',
  'Bodyweight_Squat': 'Agachamento com peso do corpo', 'Butt_Lift_Bridge': 'Ponte de glúteo', 'Single_Leg_Glute_Bridge': 'Ponte de glúteo unilateral',
  'Glute_Kickback': 'Coice de glúteo (quatro apoios)', 'Bench_Dips': 'Mergulho no banco', 'Dips_-_Triceps_Version': 'Paralelas para tríceps',
  'Push-Ups_-_Close_Triceps_Position': 'Flexão de braço fechada (tríceps)', 'Chin-Up': 'Barra fixa supinada', 'Inverted_Row': 'Remada invertida',
  'Hyperextensions_With_No_Hyperextension_Bench': 'Extensão lombar no solo (sem banco)', 'Handstand_Push-Ups': 'Flexão em parada de mãos',
  'Band_Pull_Apart': 'Abertura com elástico (pull apart)', 'Lateral_Raise_-_With_Bands': 'Elevação lateral com elástico',
  'Shoulder_Press_-_With_Bands': 'Desenvolvimento com elástico', 'Squats_-_With_Bands': 'Agachamento com elástico',
  'Calf_Raises_-_With_Bands': 'Panturrilha com elástico', 'Band_Skull_Crusher': 'Tríceps testa com elástico',
  'Goblet_Squat': 'Agachamento goblet', 'One-Arm_Kettlebell_Swings': 'Swing unilateral com kettlebell', 'Freehand_Jump_Squat': 'Agachamento com salto',
  'Split_Jump': 'Afundo com salto', 'Hammer_Curls': 'Rosca martelo', 'Preacher_Curl': 'Rosca Scott com barra',
  'Concentration_Curls': 'Rosca concentrada', 'Lying_Triceps_Press': 'Tríceps testa com barra', 'EZ-Bar_Skullcrusher': 'Tríceps testa com barra W',
  'Barbell_Hip_Thrust': 'Elevação pélvica com barra', 'Romanian_Deadlift': 'Levantamento terra romeno', 'Stiff-Legged_Barbell_Deadlift': 'Stiff com barra',
  'Stiff-Legged_Dumbbell_Deadlift': 'Stiff com halteres', 'Seated_Leg_Curl': 'Cadeira flexora', 'Smith_Machine_Squat': 'Agachamento no Smith',
  'Hack_Squat': 'Agachamento hack com barra', 'Barbell_Shrug': 'Encolhimento de ombros com barra', 'Dumbbell_Shrug': 'Encolhimento de ombros com halteres',
  'Upright_Barbell_Row': 'Remada alta com barra', 'Front_Dumbbell_Raise': 'Elevação frontal com halteres', 'Reverse_Flyes': 'Crucifixo invertido com halteres',
  'Reverse_Machine_Flyes': 'Crucifixo invertido na máquina', 'Face_Pull': 'Face pull na polia', 'Cable_Crossover': 'Crossover na polia',
  'Dumbbell_Flyes': 'Crucifixo reto com halteres', 'Incline_Dumbbell_Flyes': 'Crucifixo inclinado com halteres', 'Dumbbell_Bench_Press': 'Supino reto com halteres',
  'Barbell_Incline_Bench_Press_-_Medium_Grip': 'Supino inclinado com barra', 'Decline_Barbell_Bench_Press': 'Supino declinado com barra',
  'Close-Grip_Barbell_Bench_Press': 'Supino fechado com barra', 'Machine_Bench_Press': 'Supino na máquina', 'One-Arm_Dumbbell_Row': 'Remada unilateral com halter (serrote)',
  'T-Bar_Row_with_Handle': 'Remada cavalinho', 'Close-Grip_Front_Lat_Pulldown': 'Puxada frontal pegada fechada', 'Straight-Arm_Pulldown': 'Pulldown com braços estendidos',
  'Barbell_Lunge': 'Afundo com barra', 'Dumbbell_Lunges': 'Afundo com halteres', 'Bodyweight_Walking_Lunge': 'Afundo andando com peso do corpo',
  'Dumbbell_Step_Ups': 'Subida no banco com halteres', 'Seated_Calf_Raise': 'Panturrilha sentado', 'Thigh_Adductor': 'Cadeira adutora', 'Thigh_Abductor': 'Cadeira abdutora',
  'Hanging_Leg_Raise': 'Elevação de pernas suspenso', 'Russian_Twist': 'Rotação russa (russian twist)', 'Dead_Bug': 'Dead bug', 'Mountain_Climbers': 'Escalador (mountain climber)',
  'Arnold_Dumbbell_Press': 'Desenvolvimento Arnold', 'Standing_Military_Press': 'Desenvolvimento militar com barra em pé', 'Machine_Shoulder_Military_Press': 'Desenvolvimento na máquina',
  'Cable_Hammer_Curl_-_Rope_Attachment': 'Rosca martelo na polia com corda', 'Triceps_Pushdown_-_Rope_Attachment': 'Tríceps corda na polia',
  'Tricep_Dumbbell_Kickback': 'Tríceps coice com halter', 'Reverse_Crunch': 'Abdominal invertido', 'Oblique_Crunches': 'Abdominal oblíquo',
  'Superman': 'Super-homem (extensão lombar no solo)', 'Natural_Glute_Ham_Raise': 'Glute-ham raise no solo (natural)', 'Floor_Glute-Ham_Raise': 'Glute-ham raise no solo', 'Two-Arm_Kettlebell_Military_Press': 'Desenvolvimento com dois kettlebells', 'Kettlebell_Pistol_Squat': 'Agachamento pistola com kettlebell',
}

EQUIP = [  # frase de equipamento (ordem importa)
  (r'smith machine', 'no Smith'), (r'e[- ]?z[- ]?(curl )?bar', 'com barra W'), (r'medicine ball', 'com bola medicinal'),
  (r'(exercise|stability|swiss) ball', 'na bola suíça'), (r'foam roll(er)?', 'com rolo de espuma'), (r'kettlebells?', 'com kettlebell'),
  (r'(with )?bands?', 'com elástico'), (r'dumbbells?', 'com halteres'), (r'barbell', 'com barra'), (r'cable', 'na polia'),
  (r'lever', 'na máquina'), (r'machine', 'na máquina'), (r'rope( attachment)?', 'com corda'), (r'trap bar', 'com barra hexagonal'),
]
CORE = [  # movimento principal
  (r'romanian deadlift', 'Levantamento terra romeno'), (r'stiff[- ]legged deadlift', 'Stiff'), (r'sumo deadlift', 'Levantamento terra sumô'),
  (r'deadlift', 'Levantamento terra'), (r'good ?mornings?', 'Bom-dia'), (r'hip thrusts?', 'Elevação pélvica'),
  (r'bench press', 'Supino'), (r'floor press', 'Supino no chão'), (r'chest press', 'Supino'),
  (r'(shoulder|military|overhead) press', 'Desenvolvimento'), (r'push press', 'Push press'),
  (r'lateral raises?', 'Elevação lateral'), (r'front raises?', 'Elevação frontal'), (r'rear delt (raise|fly)', 'Crucifixo invertido'),
  (r'calf raises?', 'Elevação de panturrilha'), (r'leg raises?', 'Elevação de pernas'), (r'hip raises?', 'Elevação de quadril'),
  (r'hammer curls?', 'Rosca martelo'), (r'preacher curls?', 'Rosca Scott'), (r'concentration curls?', 'Rosca concentrada'),
  (r'leg curls?', 'Flexão de pernas'), (r'wrist curls?', 'Rosca de punho'), (r'(bicep|biceps)? ?curls?', 'Rosca'),
  (r'skull ?crushers?', 'Tríceps testa'), (r'(triceps?|tricep) (extensions?|press)', 'Extensão de tríceps'), (r'pushdowns?', 'Tríceps na polia'),
  (r'kickbacks?', 'Coice'), (r'leg extensions?', 'Cadeira extensora'), (r'back extensions?|hyperextensions?', 'Extensão lombar'),
  (r'flyes|flys|fly', 'Crucifixo'), (r'crossovers?', 'Crossover'), (r'pullovers?', 'Pullover'),
  (r'upright rows?', 'Remada alta'), (r'rows?', 'Remada'), (r'pulldowns?', 'Puxada'), (r'chin[- ]?ups?', 'Barra fixa supinada'),
  (r'pull[- ]?ups?', 'Barra fixa'), (r'face pulls?', 'Face pull'), (r'shrugs?', 'Encolhimento de ombros'),
  (r'front squats?', 'Agachamento frontal'), (r'hack squats?', 'Agachamento hack'), (r'split squats?', 'Agachamento búlgaro'),
  (r'squats?', 'Agachamento'), (r'leg press', 'Leg press'), (r'lunges?', 'Afundo'), (r'step[- ]?ups?', 'Subida no banco'),
  (r'sit[- ]?ups?', 'Abdominal completo'), (r'crunch(es)?', 'Abdominal'), (r'planks?', 'Prancha'), (r'bridges?', 'Ponte'),
  (r'push[- ]?ups?', 'Flexão de braço'), (r'dips?', 'Mergulho'), (r'stretch(es)?', 'Alongamento'),
  (r'power clean', 'Power clean'), (r'hang clean', 'Hang clean'), (r'clean and jerk', 'Arremesso (clean and jerk)'), (r'clean', 'Clean'),
  (r'snatch', 'Arranco (snatch)'), (r'jerk', 'Jerk'), (r'swings?', 'Swing'), (r'thrusters?', 'Thruster'), (r'windmill', 'Moinho (windmill)'),
  (r'turkish get[- ]?up', 'Levantada turca (get-up)'), (r'woodchop(per)?', 'Lenhador'), (r'rollouts?', 'Rollout'), (r'twists?', 'Rotação de tronco'),
  (r'(walk|walking)', 'Caminhada'), (r'carry', 'Carregamento'), (r'jumps?', 'Salto'), (r'hops?', 'Saltito'), (r'bounds?', 'Saltos alternados'),
  (r'sprints?', 'Tiro de corrida'), (r'jogging|running|run', 'Corrida'), (r'cycling|bicycling|bike', 'Bicicleta'), (r'rowing', 'Remo'),
  (r'elliptical', 'Elíptico'), (r'stair', 'Escada'), (r'throws?|tosses?|slams?', 'Arremesso'), (r'circles?', 'Círculos'),
  (r'rotations?', 'Rotação'), (r'raises?', 'Elevação'), (r'press(es)?', 'Press'), (r'extensions?', 'Extensão'), (r'holds?', 'Isometria'),
  (r'drags?', 'Arrasto'), (r'flips?', 'Virada'), (r'pulls?', 'Puxada'), (r'push(es)?', 'Empurrada'), (r'rolls?|smr', 'Liberação miofascial'),
]
QUAL = [  # qualificadores
  (r'incline', 'inclinado'), (r'decline', 'declinado'), (r'flat', 'reto'), (r'seated', 'sentado'), (r'standing', 'em pé'),
  (r'lying|supine', 'deitado'), (r'prone', 'de bruços'), (r'kneeling', 'ajoelhado'), (r'hanging', 'suspenso'), (r'bent[- ]over', 'curvado'),
  (r'(one|single)[- ]arm', 'unilateral'), (r'(one|single)[- ]leg(ged)?', 'unipodal'), (r'alternat(e|ing)', 'alternado'), (r'reverse', 'invertido'),
  (r'close[- ]grip', 'pegada fechada'), (r'wide[- ]grip', 'pegada aberta'), (r'neutral[- ]grip', 'pegada neutra'), (r'underhand', 'pegada supinada'),
  (r'side|lateral', 'lateral'), (r'front', 'frontal'), (r'rear', 'posterior'), (r'overhead', 'acima da cabeça'), (r'weighted', 'com carga'),
  (r'isometric', 'isométrico'), (r'static', 'estático'), (r'dynamic', 'dinâmico'), (r'jump(ing)?', 'com salto'), (r'sumo', 'sumô'),
  (r'oblique', 'oblíquo'), (r'cross[- ]body', 'cruzado'), (r'twisting', 'com rotação'), (r'partner', 'com parceiro'), (r'box', 'no caixote'),
  (r'bench', 'no banco'), (r'floor', 'no chão'), (r'wall', 'na parede'), (r'band(ed)?', 'com elástico'),
]
MUSC = [  # alvo (alongamentos e liberação)
  (r'hamstrings?', 'de posterior de coxa'), (r'quad(riceps|s)?', 'de quadríceps'), (r'calf|calves', 'de panturrilha'), (r'chest|pec(toral)?s?', 'de peitoral'),
  (r'shoulders?|delts?', 'de ombro'), (r'triceps?', 'de tríceps'), (r'biceps?', 'de bíceps'), (r'lats?', 'de dorsal'), (r'hip flexors?', 'de flexor do quadril'),
  (r'glutes?|piriformis', 'de glúteo'), (r'groin|adductors?', 'de adutor'), (r'abductors?', 'de abdutor'), (r'neck', 'de pescoço'), (r'lower back', 'de lombar'),
  (r'upper back|middle back', 'de costas'), (r'it band|iliotibial', 'de trato iliotibial'), (r'abs?|abdominals?', 'de abdômen'),
  (r'forearms?|wrists?', 'de antebraço e punho'), (r'ankles?', 'de tornozelo'), (r'hips?', 'de quadril'), (r'spinal|spine', 'de coluna'),
  (r'arms?', 'de braço'), (r'legs?', 'de perna'), (r'traps?', 'de trapézio'),
]

def _tira(txt, pads):
    for rx, pt in pads:
        m = re.search(r'\b(' + rx + r')\b', txt)
        if m:
            return pt, (txt[:m.start()] + ' ' + txt[m.end():])
    return None, txt

def traduzir_nome(fid, original):
    """Retorna (nome_pt, metodo). metodo: 'manual' | 'glossario' | 'parcial' (sobrou termo sem tradução; original entre parênteses)."""
    if fid in MANUAL:
        return MANUAL[fid], 'manual'
    t = ' ' + re.sub(r'[_()/,]', ' ', original.lower()).replace(' - ', ' ').replace(' -', ' ').replace('- ', ' ') + ' '
    eq, t = _tira(t, EQUIP)
    core, t = _tira(t, CORE)
    quals = []
    core_l = (core or '').lower()
    while True:
        q, t2 = _tira(t, QUAL)
        if not q: break
        if q not in quals and q != eq and q.lower() not in core_l: quals.append(q)
        t = t2
    mus = None
    if core in ('Alongamento', 'Liberação miofascial', 'Círculos', 'Rotação', 'Isometria', 'Extensão', 'Elevação', 'Press', 'Puxada', 'Empurrada', None):
        mus, t = _tira(t, MUSC)
    sobra = [w for w in re.findall(r'[a-z0-9]+', t) if w not in {'with', 'on', 'the', 'a', 'to', 'and', 'of', 'in', 'for', 'grip', 'medium', 'version', 'position', 'exercise', 'attachment', 'from', 'up', 'down', 'at', 'off', 'into', 'over', 'behind', 'head', 'neck', 'body', 'only', 'bodyweight', 'freehand', 'arm', 'arms', 'leg', 'legs', 'dumbbell', 'barbell'}]
    if not core:
        return original, 'original'
    partes = [core] + ([mus] if mus else []) + quals + ([eq] if eq else [])
    nome = ' '.join(partes)
    nome = nome[0].upper() + nome[1:]
    if sobra:
        return nome, 'parcial'
    return nome, 'glossario'

# v0.4.4 (2ª rodada): os 136 nomes que ficavam no original. Tradução própria, pendente de revisão CREF.
MANUAL.update({
 '90_90_Hamstring': 'Alongamento 90/90 de posterior de coxa', 'Ab_Roller': 'Rodinha abdominal', 'Adductor': 'Alongamento de adutor',
 'Adductor_Groin': 'Alongamento de adutor e virilha', 'Alternate_Heel_Touchers': 'Abdominal toque alternado no calcanhar', 'Ankle_On_The_Knee': 'Alongamento tornozelo sobre o joelho',
 'Around_The_Worlds': 'Volta ao mundo com halteres', 'Atlas_Stone_Trainer': 'Pedra atlas (treinador)', 'Atlas_Stones': 'Pedras atlas',
 'Balance_Board': 'Prancha de equilíbrio', 'Band_Hip_Adductions': 'Adução de quadril com elástico', 'Barbell_Side_Bend': 'Flexão lateral de tronco com barra',
 'Battling_Ropes': 'Corda naval', 'Bent_Over_Low-Pulley_Side_Lateral': 'Elevação lateral curvado na polia baixa', 'Body-Up': 'Body-up (da prancha à extensão de braços)',
 'Bottoms_Up': 'Elevação de quadril deitado (bottoms up)', 'Box_Skip': 'Skipping no caixote', 'Butt-Ups': 'Elevação de quadril em prancha (butt-ups)',
 'Cable_Deadlifts': 'Levantamento terra na polia', 'Cable_Hip_Adduction': 'Adução de quadril na polia', 'Cable_Iron_Cross': 'Crucifixo em pé na polia (iron cross)',
 'Car_Drivers': 'Volante com anilha (car drivers)', 'Carioca_Quick_Step': 'Passo carioca rápido', 'Childs_Pose': 'Postura da criança',
 'Circus_Bell': 'Circus bell (strongman)', 'Cocoons': 'Abdominal casulo', 'Conans_Wheel': 'Roda de Conan (strongman)',
 'Cross_Over_-_With_Bands': 'Crossover com elástico', 'Crucifix': 'Crucifixo isométrico (strongman)', 'Double_Leg_Butt_Kick': 'Salto com calcanhares no glúteo',
 'Downward_Facing_Balance': 'Equilíbrio de bruços na bola', 'Dumbbell_Lying_Pronation': 'Pronação de punho deitado com halter', 'Dumbbell_Lying_Supination': 'Supinação de punho deitado com halter',
 'Dumbbell_Scaption': 'Elevação em Y com halteres (scaption)', 'Dumbbell_Side_Bend': 'Flexão lateral de tronco com halter', 'Elbow_to_Knee': 'Abdominal cotovelo no joelho',
 'Elbows_Back': 'Alongamento cotovelos para trás', 'Fast_Skipping': 'Skipping rápido', 'Flutter_Kicks': 'Abdominal tesoura alternada (flutter kicks)',
 'Gironda_Sternum_Chins': 'Barra fixa Gironda até o esterno', 'Groiners': 'Groiners (prancha com perna ao lado da mão)', 'Hanging_Pike': 'Elevação de pernas suspenso em pike',
 'Heavy_Bag_Thrust': 'Empurrão no saco de pancada', 'Hip_Flexion_with_Band': 'Flexão de quadril com elástico', 'Hip_Lift_with_Band': 'Elevação de quadril com elástico',
 'Hug_A_Ball': 'Alongamento abraçando a bola', 'Hug_Knees_To_Chest': 'Alongamento joelhos no peito', 'Inchworm': 'Lagarta (inchworm)',
 'Incline_Cable_Flye': 'Crucifixo inclinado na polia', 'Incline_Dumbbell_Bench_With_Palms_Facing_In': 'Supino inclinado com halteres pegada neutra', 'Iron_Cross': 'Iron cross com halteres',
 'Isometric_Chest_Squeezes': 'Contração isométrica de peitoral', 'Isometric_Neck_Exercise_-_Front_And_Back': 'Isometria de pescoço frente e trás', 'Isometric_Neck_Exercise_-_Sides': 'Isometria de pescoço lateral',
 'Isometric_Wipers': 'Limpador isométrico (isometric wipers)', 'Keg_Load': 'Carregamento de barril', 'Kettlebell_Figure_8': 'Oito com kettlebell',
 'Kettlebell_Halo': 'Halo com kettlebell', 'Kettlebell_Pass_Between_The_Legs': 'Passagem de kettlebell entre as pernas', 'Kettlebell_Pirate_Ships': 'Navio pirata com kettlebell',
 'Kipping_Muscle_Up': 'Muscle-up com kipping', 'Knee_Across_The_Body': 'Alongamento joelho cruzando o corpo', 'Kneeling_Arm_Drill': 'Educativo de braços ajoelhado',
 'Kneeling_Hip_Flexor': 'Alongamento de flexor do quadril ajoelhado', 'Landmine_180s': 'Landmine 180°', 'Landmine_Linear_Jammer': 'Landmine linear jammer',
 'Leg_Lift': 'Elevação de perna', 'Linear_3-Part_Start_Technique': 'Técnica de saída em 3 partes', 'Linear_Acceleration_Wall_Drill': 'Educativo de aceleração na parede',
 'Log_Lift': 'Levantamento de tora (log lift)', 'Looking_At_Ceiling': 'Alongamento olhando para o teto', 'Lying_Bent_Leg_Groin': 'Alongamento de virilha deitado com pernas flexionadas',
 'Lying_Face_Down_Plate_Neck_Resistance': 'Pescoço com anilha deitado de bruços', 'Lying_Face_Up_Plate_Neck_Resistance': 'Pescoço com anilha deitado de costas', 'Lying_Glute': 'Alongamento de glúteo deitado',
 'Lying_Hamstring': 'Alongamento de posterior de coxa deitado', 'Lying_Prone_Quadriceps': 'Alongamento de quadríceps de bruços', 'Medicine_Ball_Chest_Pass': 'Passe de peito com bola medicinal',
 'Mixed_Grip_Chin': 'Barra fixa pegada mista', 'Moving_Claw_Series': 'Série de garra em movimento (educativo)', 'Muscle_Up': 'Muscle-up',
 'One_Arm_Against_Wall': 'Alongamento de um braço na parede', 'One_Half_Locust': 'Meio gafanhoto', 'One_Handed_Hang': 'Suspensão com uma mão',
 'One_Knee_To_Chest': 'Alongamento um joelho no peito', 'One-Arm_Flat_Bench_Dumbbell_Flye': 'Crucifixo reto unilateral com halter', 'One-Arm_High-Pulley_Cable_Side_Bends': 'Flexão lateral unilateral na polia alta',
 'One-Arm_Side_Laterals': 'Elevação lateral unilateral', 'Otis-Up': 'Abdominal com anilha (Otis-up)', 'Overhead_Lat': 'Alongamento de dorsal acima da cabeça',
 'Overhead_Triceps': 'Alongamento de tríceps acima da cabeça', 'Plate_Pinch': 'Pinça de anilhas', 'Platform_Hamstring_Slides': 'Deslize de posterior de coxa na plataforma',
 'Power_Partials': 'Parciais de elevação lateral (power partials)', 'Power_Stairs': 'Escada de força (strongman)', 'Prone_Manual_Hamstring': 'Flexão de perna de bruços com resistência manual',
 'Pyramid': 'Pirâmide (alongamento)', 'Quick_Leap': 'Salto rápido', 'Rack_Delivery': 'Entrega no rack (rack delivery)',
 'Rope_Climb': 'Subida na corda', 'Rope_Jumping': 'Pular corda', 'Sandbag_Load': 'Carregamento de saco de areia',
 'Scissor_Kick': 'Abdominal tesoura', 'Seated_Biceps': 'Alongamento de bíceps sentado', 'Seated_Front_Deltoid': 'Alongamento de deltoide anterior sentado',
 'Seated_Glute': 'Alongamento de glúteo sentado', 'Seated_Hamstring': 'Alongamento de posterior de coxa sentado', 'Seated_Head_Harness_Neck_Resistance': 'Pescoço com capacete de carga sentado',
 'Seated_Leg_Tucks': 'Abdominal grupado sentado', 'Side_Jackknife': 'Canivete lateral', 'Side_to_Side_Box_Shuffle': 'Deslocamento lateral sobre o caixote',
 'Side_To_Side_Chins': 'Barra fixa de um lado para o outro', 'Single_Leg_Butt_Kick': 'Calcanhar no glúteo unilateral', 'Single-Arm_Linear_Jammer': 'Linear jammer unilateral',
 'Skating': 'Patinação (skating)', 'Sled_Reverse_Flye': 'Crucifixo invertido no trenó', 'Speed_Band_Overhead_Triceps': 'Tríceps acima da cabeça com elástico (velocidade)',
 'Spell_Caster': 'Spell caster com halteres', 'Spider_Crawl': 'Rastejo do homem-aranha', 'Stairmaster': 'Simulador de escada (Stairmaster)',
 'Standing_Cable_Lift': 'Elevação diagonal em pé na polia', 'Standing_Cable_Wood_Chop': 'Lenhador em pé na polia', 'Standing_Hip_Flexors': 'Alongamento de flexor do quadril em pé',
 'Standing_Olympic_Plate_Hand_Squeeze': 'Pinça de anilha olímpica em pé', 'Standing_Pelvic_Tilt': 'Báscula pélvica em pé', 'Standing_Toe_Touches': 'Alongamento tocando os pés em pé',
 'Step_Mill': 'Escada rolante ergométrica (step mill)', 'Stomach_Vacuum': 'Vácuo abdominal', 'Suspended_Fallout': 'Queda à frente suspenso (fallout)',
 'The_Straddle': 'Alongamento em afastamento (straddle)', 'Toe_Touchers': 'Abdominal tocando os pés', 'Upper_Back-Leg_Grab': 'Alongamento de costas segurando as pernas',
 'Weighted_Ball_Side_Bend': 'Flexão lateral com bola medicinal', 'Wide_Stance_Stiff_Legs': 'Stiff com base aberta', 'Windmills': 'Moinho de vento (alongamento)',
 'Wrist_Roller': 'Rolo de punho',
})
