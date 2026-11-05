// v0.12.1 – mudança para app.quaru.com.br: levar os dados do aparelho do endereço antigo para o novo.
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { desempacotar, empacotar, resumoDados, TIPO_DADOS, TIPO_RECEBIDO } from '@/dominio/mudanca';
import { acoes, estadoInicial, ProvedorEstado, useEstado, type Estado } from '@/estado/armazem';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() }, useLocalSearchParams: () => ({}) }));
import ReceberDados from '@/app/receber-dados';

let ultimo: Estado;
function Espiao() { ultimo = useEstado().estado; return null; }
const comDados = () => {
  let e = acoes.consentir(acoes.entrar(estadoInicial()), { dadosSaude: true });
  e = acoes.salvarRotina(e, { id: 'r1', nome: 'Treino A', ordem: 1, atualizadoEm: '', itens: [] });
  return acoes.registrarPeso(e, { id: 'p1', pesoKg: 80, medidoEm: new Date().toISOString(), atualizadoEm: '' });
};

describe('pacote de dados', () => {
  it('ida e volta; recusa o que não é do Quaru', () => {
    const e = comDados();
    const volta = desempacotar(empacotar(e));
    expect(volta?.rotinas.map((r) => r.nome)).toEqual(['Treino A']);
    expect(resumoDados(volta!)).toEqual({ treinos: 1, sessoes: 0, pesos: 1 });
    expect(desempacotar('{"marca":"outro","estado":{}}')).toBeNull();
    expect(desempacotar('nao é json')).toBeNull();
    expect(desempacotar(42)).toBeNull();
  });
});

describe('tela Trazer meus dados', () => {
  it('só aceita a mensagem do endereço antigo; mostra o resumo e grava', async () => {
    // O ambiente de teste é o do celular: simula os eventos de janela do navegador.
    const alvo = new EventTarget();
    Object.assign(window, { addEventListener: alvo.addEventListener.bind(alvo), removeEventListener: alvo.removeEventListener.bind(alvo), dispatchEvent: alvo.dispatchEvent.bind(alvo) });
    const opener = { postMessage: jest.fn() };
    Object.defineProperty(window, 'opener', { value: opener, configurable: true });
    await render(<SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}><ProvedorEstado inicial={estadoInicial()}><ReceberDados /><Espiao /></ProvedorEstado></SafeAreaProvider>);
    expect(opener.postMessage).toHaveBeenCalledWith({ tipo: 'quaru-mudanca-pronto' }, 'https://otaviobmarques.github.io');
    const fonte = { postMessage: jest.fn() };
    await act(async () => { window.dispatchEvent(new MessageEvent('message', { origin: 'https://site-malicioso.com', data: { tipo: TIPO_DADOS, pacote: empacotar(comDados()) } })); });
    expect(screen.queryByTestId('confirmar-trazer')).toBeNull();
    const ev = new MessageEvent('message', { origin: 'https://otaviobmarques.github.io', data: { tipo: TIPO_DADOS, pacote: empacotar(comDados()) } });
    Object.defineProperty(ev, 'source', { value: fonte });
    await act(async () => { window.dispatchEvent(ev); });
    expect(screen.getByText('1 treinos montados · 0 treinos feitos · 1 registros de peso')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('confirmar-trazer'));
    expect(ultimo.rotinas.map((r) => r.nome)).toEqual(['Treino A']);
    expect(fonte.postMessage).toHaveBeenCalledWith({ tipo: TIPO_RECEBIDO }, 'https://otaviobmarques.github.io');
  });
});
