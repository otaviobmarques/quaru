# Fonte: free-exercise-db (catálogo de exercícios, v0.4.4)

- Repositório: https://github.com/yuhonas/free-exercise-db
- Commit usado: `f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5` (2026-09-27)
- Licença: **Unlicense** (domínio público), conferida em `LICENSE.md` do repositório no commit acima.
- Consultado em: 2026-11-01
- Conteúdo: `dist/exercises.json` com **876 exercícios** (873 com 2 fotos 750×500 JPEG, 3 sem fotos; 5 sem instruções).
- Contagens da fonte: equipamento — barbell 170, dumbbell 123, other 122, body only 111, cable 81, sem informação 77,
  machine 67, kettlebells 56, bands 20, medicine ball 17, exercise ball 12, foam roll 11, e-z curl bar 9.
  Categoria — strength 584, stretching 123, plyometrics 61, powerlifting 38, olympic weightlifting 35, strongman 21, cardio 14.
  Nível — beginner 525, intermediate 294, expert 57. Instruções: 3.738 passos (~575 mil caracteres).

## Como reproduzir
```
git clone https://github.com/yuhonas/free-exercise-db /tmp/fedb && git -C /tmp/fedb checkout f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5
cd app/mobile && python3 scripts/importar-free-exercise-db.py --fonte /tmp/fedb   # precisa de Pillow
```
Rodar de novo sem mudança na fonte não altera nenhum arquivo (manifesto `public/exercicios/manifesto.json`).

## O que entrou no app
- `src/dominio/catalogo-fedb.json`: 876 exercícios com nome em PT-BR, nome original, grupo, equipamentos, área, nível,
  tipo, músculos, instruções traduzidas (41) e originais (todas). Status de todo texto traduzido: pendente de revisão CREF.
- `public/exercicios/`: 873 animações WebP + pôster + miniatura (ADR-0020).
- Tradução: `scripts/catalogo_glossario.py` (nomes) e `scripts/catalogo_instrucoes_pt.py` (instruções), feitas pela Domma.

## Fica de fora / limitações
- 3 exercícios sem fotos na fonte (Kettlebell_Halo, Kettlebell_Halo_With_Overhead_Extension,
  Kettlebell_Overhead_Triceps_Extension): sem demonstração.
- 5 sem instruções na fonte (Iron_Cross, Side_Bridge, Push_Press, Side_Jackknife, One-Arm_Kettlebell_Swings).
- 835 exercícios com instrução só em inglês (sinalizada); 136 nomes no original.
