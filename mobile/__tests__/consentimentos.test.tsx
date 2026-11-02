import { render, screen, fireEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Consentimentos from '@/app/consentimentos';
import Entrar from '@/app/entrar';
import Juridico from '@/app/juridico';
import { ativo, conceder, historico, revogar, VERSOES } from '@/dominio/consentimento';
import { POLITICA, TERMOS } from '@/dominio/juridico-gerado';
import { IA_EUA, SAUDE } from '@/dominio/textos-consentimento';
import { acoes, estadoInicial, migrarEstado, temIa, temSaude } from '@/estado/armazem';
import { proximoPassoFoto } from '@/servicos/foto-refeicao';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), setParams: jest.fn() }, useLocalSearchParams: () => ({}) }));

describe('consentimento por finalidade (domínio)', () => {
  it('conceder cria registro com versão e data próprias; repetir não duplica', () => {
    let l = conceder([], 'dados_saude', '2026-11-01T10:00:00Z', 'a');
    l = conceder(l, 'dados_saude', '2026-11-01T10:05:00Z', 'b');
    expect(l).toEqual([{ id: 'a', finalidade: 'dados_saude', versao: VERSOES.dados_saude, aceitoEm: '2026-11-01T10:00:00Z', revogadoEm: null }]);
  });
  it('revogar fecha só a finalidade pedida e mantém o histórico', () => {
    let l = conceder(conceder([], 'dados_saude', 't1', 'a'), 'ia_visao_eua', 't1', 'b');
    l = revogar(l, 'ia_visao_eua', 't2');
    l = conceder(l, 'ia_visao_eua', 't3', 'c');
    expect(historico(l, 'ia_visao_eua').map((r) => [r.id, r.revogadoEm])).toEqual([['b', 't2'], ['c', null]]);
    expect(ativo(l, 'dados_saude')?.id).toBe('a');
  });
  it('aceite de versão antiga do texto não vale (pede de novo) e é encerrado ao aceitar a nova', () => {
    const antigo = [{ id: 'x', finalidade: 'dados_saude' as const, versao: 'v1-rascunho', aceitoEm: 't0', revogadoEm: null }];
    expect(ativo(antigo, 'dados_saude')).toBeNull();
    const l = conceder(antigo, 'dados_saude', 't1', 'y');
    expect(l.find((r) => r.id === 'x')?.revogadoEm).toBe('t1');
    expect(ativo(l, 'dados_saude')?.id).toBe('y');
  });
});

describe('estado local', () => {
  it('modo local não guarda e-mail (minimização)', () => {
    const e = acoes.entrar(estadoInicial(), 'alguem@exemplo.test');
    expect(JSON.stringify(e)).not.toContain('@');
    expect(e.usuario).toEqual({ modo: 'local', criadoEm: expect.any(String) });
  });
  it('migra o formato 1 (v0.1.0): descarta e-mail e transforma o aceite antigo em histórico encerrado', () => {
    const v1 = { versao: 1, usuario: { email: 'a@exemplo.test', modo: 'local' }, consentimentos: { dadosSaude: true, iaVisaoEua: false, versao: 'v1-rascunho', aceitoEm: '2026-11-01T12:00:00Z' }, exercicios: [], rotinas: [], sessoes: [], series: [], pesos: [], fila: [], permissaoNotificacao: 'nao_pedida' };
    const e = migrarEstado(v1)!;
    expect(e.versao).toBe(2);
    expect(JSON.stringify(e)).not.toContain('a@exemplo.test');
    expect(e.consentimentos).toEqual([expect.objectContaining({ finalidade: 'dados_saude', versao: 'v1-rascunho', aceitoEm: '2026-11-01T12:00:00Z', revogadoEm: '2026-11-01T12:00:00Z' })]);
    expect(temSaude(e)).toBe(false); // revê os textos novos
    expect(e.consentimentosVistosEm).toBeNull();
  });
  it('formato desconhecido não é carregado', () => {
    expect(migrarEstado({ versao: 99 })).toBeNull();
  });
  it('foto de refeição: sem IA autorizada, pede consentimento; com ela, analisa', () => {
    const e = acoes.entrar(estadoInicial());
    expect(proximoPassoFoto(e)).toBe('pedir_consentimento');
    const e2 = acoes.definirConsentimento(e, 'ia_visao_eua', true);
    expect(temIa(e2)).toBe(true);
    expect(proximoPassoFoto(e2)).toBe('analisar_foto');
  });
});

const montar = (ui: React.ReactElement, e = acoes.entrar(estadoInicial())) => {
  const { ProvedorEstado } = jest.requireActual('@/estado/armazem');
  return render(<SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}><ProvedorEstado inicial={e}>{ui}</ProvedorEstado></SafeAreaProvider>);
};

describe('telas jurídicas', () => {
  it('tela inicial de consentimentos mostra só o de saúde (texto novo), desligado, e não a IA', async () => {
    await montar(<Consentimentos />);
    expect(await screen.findByText(SAUDE.titulo)).toBeTruthy();
    expect(screen.queryByText(IA_EUA.titulo)).toBeNull();
    expect(screen.getByRole('switch', { name: SAUDE.chave }).props.accessibilityState.checked).toBe(false);
    expect(screen.getByText('Continuar sem autorizar')).toBeTruthy();
  });
  it('ligar a chave de saúde troca o botão para Continuar', async () => {
    await montar(<Consentimentos />);
    await fireEvent.press(await screen.findByRole('switch', { name: SAUDE.chave }));
    expect(await screen.findByText('Continuar')).toBeTruthy();
  });
  it('login (v0.4.2) não coleta e-mail: campo desativado e "Continuar sem conta" é o caminho que funciona', async () => {
    await montar(<Entrar />, estadoInicial());
    expect(await screen.findByText('Continuar sem conta')).toBeTruthy();
    expect(screen.getByTestId('campo-email').props.editable).toBe(false);
  });
  it('termos e política aparecem marcados como RASCUNHO, sem o nome antigo', async () => {
    await montar(<Juridico />);
    expect(await screen.findByText('RASCUNHO')).toBeTruthy();
    expect(TERMOS + POLITICA).not.toMatch(/Malhou/);
    expect(TERMOS).toContain('{NOME_DO_APP}');
  });
});
