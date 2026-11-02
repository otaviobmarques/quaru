// ADR-0012: imagens dos exercícios (Free Exercise DB, Unlicense).
declare const __dirname: string;
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs') as { statSync(p: string): { size: number }; readFileSync(p: string, c: string): string; existsSync(p: string): boolean };
const path = require('path') as { join(...p: string[]): string };
/* eslint-enable @typescript-eslint/no-require-imports */
import { BIBLIOTECA } from '@/dominio/biblioteca';
import { FONTE_IMAGENS, TOTAL_IMAGENS, imagemDoExercicio } from '@/dominio/imagens-exercicios';
import { OUTRAS } from '@/dominio/licencas';

describe('imagens dos exercícios', () => {
  it('os 22 exercícios da biblioteca antiga têm a foto no pacote; exercício próprio não tem', () => {
    expect(BIBLIOTECA.length).toBeGreaterThan(800); // v0.4.4: catálogo completo; os 22 antigos vêm primeiro
    expect(BIBLIOTECA.slice(0, 22).every((e) => e.id.startsWith('00000000-0000-4000-a000-'))).toBe(true);
    expect(TOTAL_IMAGENS).toBe(22);
    for (const e of BIBLIOTECA.slice(0, 22)) expect(imagemDoExercicio(e.id)).not.toBeNull();
    expect(imagemDoExercicio('11111111-2222-4333-8444-555555555555')).toBeNull();
  });
  it('arquivos otimizados existem e têm no máximo 40 KB cada', () => {
    for (let i = 1; i <= 22; i++) {
      const f = path.join(__dirname, '..', 'assets', 'exercicios', `${String(i).padStart(2, '0')}.jpg`);
      expect(fs.statSync(f).size).toBeLessThanOrEqual(40 * 1024);
    }
  });
  it('fonte e licença registradas (ADR, THIRD_PARTY_NOTICES e tela Sobre)', () => {
    expect(FONTE_IMAGENS.licenca).toMatch(/Unlicense/);
    expect(OUTRAS.some((o) => /Free Exercise DB/.test(o.nome) && /Unlicense/.test(o.licenca))).toBe(true);
    const notices = fs.readFileSync(path.join(__dirname, '..', '..', 'THIRD_PARTY_NOTICES.md'), 'utf8');
    expect(notices).toContain('yuhonas/free-exercise-db');
    expect(fs.existsSync(path.join(__dirname, '..', '..', 'docs', 'adr', '0012-imagens-dos-exercicios.md'))).toBe(true);
  });
});
