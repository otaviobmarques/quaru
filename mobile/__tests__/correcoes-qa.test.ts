// Correções 0.2.0 dos bugs baixos do relatório de QA v0.1 (dados fictícios).
import { treinosCsv } from '@/dominio/exportacao';
import { acoes, estadoInicial } from '@/estado/armazem';
import * as N from 'expo-notifications';
import { agendarFimDescanso, cancelarDescanso } from '@/servicos/notificacao';

const base = () => acoes.definirConsentimento(acoes.entrar(estadoInicial()), 'dados_saude', true);

it('BUG-07: peso com data no futuro é recusado no aparelho', () => {
  const futuro = new Date(Date.now() + 86_400_000).toISOString();
  expect(() => acoes.registrarPeso(base(), { id: 'p', pesoKg: 80, medidoEm: futuro, atualizadoEm: '' })).toThrow('valor_invalido');
});
it('BUG-11: número negativo não ganha apóstrofo; texto com "-" no início ganha', () => {
  const csv = treinosCsv({ rotinas: [{ id: 'r', nome: '-cmd', ordem: 1, itens: [], atualizadoEm: '' }], sessoes: [{ id: 's1', rotinaId: 'r', iniciadaEm: '2026-10-01T10:00:00Z', finalizadaEm: '2026-10-01T11:00:00Z', notas: null, atualizadoEm: '' }], series: [{ id: 'x', sessaoId: 's1', exercicioId: 'e1', ordem: 1, tipo: 'normal', cargaKg: 50, reps: 8, duracaoS: null, rpe: null, concluidaEm: '2026-10-01T10:00:00Z', atualizadoEm: '' }], pesos: [], exercicios: [] });
  expect(csv).toContain("'-cmd");
});
it('BUG-18: depois de cancelar (excluir tudo), nada fica agendado', async () => {
  await agendarFimDescanso(60, 'A');
  await cancelarDescanso();
  expect(N.cancelScheduledNotificationAsync).toHaveBeenCalled();
});
