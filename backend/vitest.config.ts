import { defineConfig } from 'vitest/config';
// PGlite usa bastante memória: um arquivo de teste por vez evita o processo ser morto (SIGKILL).
export default defineConfig({ test: { fileParallelism: false, testTimeout: 30000, hookTimeout: 30000 } });
