/** Relógio isolado (facilita testes e evita chamadas impuras no render). */
export const agoraMs = () => Date.now();
export const agoraIso = () => new Date().toISOString();
