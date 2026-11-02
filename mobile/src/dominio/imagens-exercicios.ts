// Gerado a partir de yuhonas/free-exercise-db (Unlicense / domínio público), ADR-0012. Não editar à mão.
// Uma imagem por exercício da biblioteca (posição inicial, arquivo 0.jpg), reduzida para 480×320 JPEG q72.
import type { ImageSourcePropType } from 'react-native';

export interface ImagemExercicio { fonte: ImageSourcePropType; origemId: string; origemNome: string; origemArquivo: string }

/** Chave: número do exercício na BIBLIOTECA (1–22). */
const MAPA: Record<number, ImagemExercicio> = {
  1: { fonte: require('../../assets/exercicios/01.jpg'), origemId: 'Barbell_Bench_Press_-_Medium_Grip', origemNome: 'Barbell Bench Press - Medium Grip', origemArquivo: 'Barbell_Bench_Press_-_Medium_Grip/0.jpg' },
  2: { fonte: require('../../assets/exercicios/02.jpg'), origemId: 'Incline_Dumbbell_Press', origemNome: 'Incline Dumbbell Press', origemArquivo: 'Incline_Dumbbell_Press/0.jpg' },
  3: { fonte: require('../../assets/exercicios/03.jpg'), origemId: 'Butterfly', origemNome: 'Butterfly', origemArquivo: 'Butterfly/0.jpg' },
  4: { fonte: require('../../assets/exercicios/04.jpg'), origemId: 'Pushups', origemNome: 'Pushups', origemArquivo: 'Pushups/0.jpg' },
  5: { fonte: require('../../assets/exercicios/05.jpg'), origemId: 'Wide-Grip_Lat_Pulldown', origemNome: 'Wide-Grip Lat Pulldown', origemArquivo: 'Wide-Grip_Lat_Pulldown/0.jpg' },
  6: { fonte: require('../../assets/exercicios/06.jpg'), origemId: 'Bent_Over_Barbell_Row', origemNome: 'Bent Over Barbell Row', origemArquivo: 'Bent_Over_Barbell_Row/0.jpg' },
  7: { fonte: require('../../assets/exercicios/07.jpg'), origemId: 'Seated_Cable_Rows', origemNome: 'Seated Cable Rows', origemArquivo: 'Seated_Cable_Rows/0.jpg' },
  8: { fonte: require('../../assets/exercicios/08.jpg'), origemId: 'Pullups', origemNome: 'Pullups', origemArquivo: 'Pullups/0.jpg' },
  9: { fonte: require('../../assets/exercicios/09.jpg'), origemId: 'Barbell_Squat', origemNome: 'Barbell Squat', origemArquivo: 'Barbell_Squat/0.jpg' },
  10: { fonte: require('../../assets/exercicios/10.jpg'), origemId: 'Leg_Press', origemNome: 'Leg Press', origemArquivo: 'Leg_Press/0.jpg' },
  11: { fonte: require('../../assets/exercicios/11.jpg'), origemId: 'Leg_Extensions', origemNome: 'Leg Extensions', origemArquivo: 'Leg_Extensions/0.jpg' },
  12: { fonte: require('../../assets/exercicios/12.jpg'), origemId: 'Lying_Leg_Curls', origemNome: 'Lying Leg Curls', origemArquivo: 'Lying_Leg_Curls/0.jpg' },
  13: { fonte: require('../../assets/exercicios/13.jpg'), origemId: 'Barbell_Deadlift', origemNome: 'Barbell Deadlift', origemArquivo: 'Barbell_Deadlift/0.jpg' },
  14: { fonte: require('../../assets/exercicios/14.jpg'), origemId: 'Standing_Calf_Raises', origemNome: 'Standing Calf Raises', origemArquivo: 'Standing_Calf_Raises/0.jpg' },
  15: { fonte: require('../../assets/exercicios/15.jpg'), origemId: 'Dumbbell_Shoulder_Press', origemNome: 'Dumbbell Shoulder Press', origemArquivo: 'Dumbbell_Shoulder_Press/0.jpg' },
  16: { fonte: require('../../assets/exercicios/16.jpg'), origemId: 'Side_Lateral_Raise', origemNome: 'Side Lateral Raise', origemArquivo: 'Side_Lateral_Raise/0.jpg' },
  17: { fonte: require('../../assets/exercicios/17.jpg'), origemId: 'Barbell_Curl', origemNome: 'Barbell Curl', origemArquivo: 'Barbell_Curl/0.jpg' },
  18: { fonte: require('../../assets/exercicios/18.jpg'), origemId: 'Dumbbell_Alternate_Bicep_Curl', origemNome: 'Dumbbell Alternate Bicep Curl', origemArquivo: 'Dumbbell_Alternate_Bicep_Curl/0.jpg' },
  19: { fonte: require('../../assets/exercicios/19.jpg'), origemId: 'Triceps_Pushdown', origemNome: 'Triceps Pushdown', origemArquivo: 'Triceps_Pushdown/0.jpg' },
  20: { fonte: require('../../assets/exercicios/20.jpg'), origemId: 'Standing_Dumbbell_Triceps_Extension', origemNome: 'Standing Dumbbell Triceps Extension', origemArquivo: 'Standing_Dumbbell_Triceps_Extension/0.jpg' },
  21: { fonte: require('../../assets/exercicios/21.jpg'), origemId: 'Plank', origemNome: 'Plank', origemArquivo: 'Plank/0.jpg' },
  22: { fonte: require('../../assets/exercicios/22.jpg'), origemId: 'Crunches', origemNome: 'Crunches', origemArquivo: 'Crunches/0.jpg' },
};

export const FONTE_IMAGENS = { nome: 'Free Exercise DB (yuhonas/free-exercise-db)', url: 'https://github.com/yuhonas/free-exercise-db', licenca: 'Unlicense (domínio público)', consultadoEm: '2026-11-01' } as const;

/** Imagem de um exercício da biblioteca pelo id (…a000-0000000000NN); exercícios próprios não têm imagem. */
export function imagemDoExercicio(id: string): ImagemExercicio | null {
  const m = /^00000000-0000-4000-a000-(\d{12})$/.exec(id);
  return m ? MAPA[Number(m[1])] ?? null : null;
}
export const TOTAL_IMAGENS = Object.keys(MAPA).length;
