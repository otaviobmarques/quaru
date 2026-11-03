// v0.8.1 – depois de adicionar um treino sugerido: começar agora ou agendar numa data.
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DepoisDeAdicionar, proximasDatas, rotuloData } from '@/componentes/treinos/depois-de-adicionar';
import { diaDaSemana, hoje, planejadoPara } from '@/dominio/agenda';
import { acoes, estadoInicial, ProvedorEstado, useEstado, type Estado } from '@/estado/armazem';

jest.mock('expo-router', () => ({ router: { navigate: jest.fn(), push: jest.fn(), replace: jest.fn(), back: jest.fn() }, useLocalSearchParams: () => ({}) }));
const router = jest.requireMock('expo-router').router as Record<string, jest.Mock>;
let ultimo: Estado;
function Espiao() { ultimo = useEstado().estado; return null; }
const montar = (ui: React.ReactElement, e: Estado) => render(
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}><ProvedorEstado inicial={e}>{ui}<Espiao /></ProvedorEstado></SafeAreaProvider>);
beforeEach(() => jest.clearAllMocks());

describe('datas para agendar', () => {
  it('14 dias a partir de hoje, com Hoje e Amanhã', () => {
    const d = proximasDatas('2026-11-30');
    expect(d).toHaveLength(14);
    expect(d.slice(0, 3)).toEqual(['2026-11-30', '2026-12-01', '2026-12-02']);
    expect(rotuloData('2026-11-30', '2026-11-30')).toBe('Hoje');
    expect(rotuloData('2026-12-01', '2026-11-30')).toBe('Amanhã');
    expect(rotuloData('2026-12-02', '2026-11-30')).toBe('Qua 02/12');
  });
});

describe('depois de adicionar', () => {
  const base = () => {
    const e = acoes.carregarExemplo(acoes.entrar(estadoInicial()));
    return { e, r: e.rotinas.filter((x) => !x.excluidoEm)[0] };
  };
  it('agendar com "repetir" grava o padrão da semana', async () => {
    const { e, r } = base();
    await montar(<DepoisDeAdicionar rotinaId={r.id} nome={r.nome} />, e);
    await fireEvent.press(screen.getByTestId(`agendar-botao-${r.id}`));
    const dia = proximasDatas(hoje())[3];
    await fireEvent.press(screen.getByText(rotuloData(dia, hoje())));
    await fireEvent.press(screen.getByTestId(`repetir-${r.id}`));
    await fireEvent.press(screen.getByTestId(`confirmar-agenda-${r.id}`));
    expect(ultimo.agenda?.semana[diaDaSemana(dia)]).toBe(r.id);
    expect(planejadoPara(ultimo.agenda, proximasDatas(dia, 8)[7], () => true).valor).toBe(r.id); // semana seguinte
    expect(screen.getByText(/agendado: toda /)).toBeTruthy();
  });
  it('avisa quando o dia já tinha outro treino', async () => {
    const { e, r } = base();
    const outro = e.rotinas.filter((x) => !x.excluidoEm)[1];
    const e2 = acoes.planejarDia(e, hoje(), outro.id);
    await montar(<DepoisDeAdicionar rotinaId={r.id} nome={r.nome} />, e2);
    await fireEvent.press(screen.getByTestId(`agendar-botao-${r.id}`));
    expect(screen.getByText(`Nesse dia estava marcado: ${outro.nome}. Vai trocar por ${r.nome}.`)).toBeTruthy();
    await fireEvent.press(screen.getByTestId(`confirmar-agenda-${r.id}`));
    expect(ultimo.agenda?.dias[hoje()]).toBe(r.id);
  });
  it('começar agora abre o treino', async () => {
    const { e, r } = base();
    await montar(<DepoisDeAdicionar rotinaId={r.id} nome={r.nome} />, e);
    await fireEvent.press(screen.getByTestId(`comecar-agora-${r.id}`));
    expect(router.push).toHaveBeenCalled();
    const destino = router.push.mock.calls[0][0];
    expect(['/treino', '/consentimentos']).toContain(destino);
    if (destino === '/treino') expect(ultimo.sessoes.some((s) => s.rotinaId === r.id && !s.finalizadaEm)).toBe(true);
  });
});
