# Gera assets/sons/concluido.wav: arpejo curto de comemoração (Dó5–Mi5–Sol5–Dó6), senoides com envelope
# exponencial, 1,1 s, mono, 44,1 kHz, 16 bits. Obra própria (Domma), CC0 1.0. Rode: python3 scripts/gerar-som-concluido.py
import math, struct, wave
TAXA = 44100
NOTAS = [(523.25, 0.00), (659.25, 0.12), (783.99, 0.24), (1046.50, 0.36)]
DUR = 1.1
amostras = []
for n in range(int(TAXA * DUR)):
    t = n / TAXA
    v = 0.0
    for f, ini in NOTAS:
        if t >= ini:
            d = t - ini
            env = math.exp(-d * (3.2 if f < 1000 else 2.4)) * min(1.0, d / 0.008)
            v += env * (math.sin(2 * math.pi * f * d) + 0.25 * math.sin(4 * math.pi * f * d))
    amostras.append(v)
pico = max(abs(x) for x in amostras)
ganho = (10 ** (-8 / 20)) / pico
with wave.open('assets/sons/concluido.wav', 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(TAXA)
    w.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, x * ganho)) * 32767)) for x in amostras))
print('ok')
