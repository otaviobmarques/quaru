"""Gera assets/sons/descanso.wav (CC0, obra própria): dois toques suaves para o fim do descanso. Uso: python3 scripts-gerar-som.py"""
import math, struct, wave
sr, dur = 44100, 0.7
notas = [(0.0, 880.0), (0.12, 1318.5)]  # Lá5 e Mi6
amostras = []
for n in range(int(sr * dur)):
    t = n / sr; v = 0.0
    for ini, f in notas:
        if t >= ini:
            u = t - ini; env = (1 - math.exp(-u * 200)) * math.exp(-u * 7)
            v += env * (math.sin(2 * math.pi * f * u) + 0.25 * math.sin(2 * math.pi * 2 * f * u))
    amostras.append(v)
g = 0.35 / max(abs(x) for x in amostras)  # pico ~ -9 dBFS
fade = int(sr * 0.05)
for i in range(fade): amostras[-1 - i] *= i / fade
with wave.open('assets/sons/descanso.wav', 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
    w.writeframes(b''.join(struct.pack('<h', int(x * g * 32767)) for x in amostras))
