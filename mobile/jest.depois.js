// v0.12.3: o descanso em andamento é um estado do módulo (fora das telas); zera entre os testes.
afterEach(() => { require('./src/estado/descanso-atual').definirDescanso(null); });
