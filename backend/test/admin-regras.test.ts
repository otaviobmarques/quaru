import { describe, expect, it } from 'vitest';
import { lerPedido, recusar, type PerfilResumo } from '../supabase/functions/admin-usuarios/regras';

const EU = '00000000-0000-4000-8000-0000000000ad';
const OUTRO = '00000000-0000-4000-8000-00000000000a';
const ADM2 = '00000000-0000-4000-8000-00000000000b';
const perfis: PerfilResumo[] = [{ usuario_id: EU, papel: 'admin', ativo: true }, { usuario_id: OUTRO, papel: 'usuario', ativo: true }];

describe('painel: leitura do pedido', () => {
  it('convidar normaliza o e-mail, corta o nome e assume papel usuario', () => {
    expect(lerPedido({ acao: 'convidar', email: '  Ana@Exemplo.COM ', nome: ' Ana ' })).toEqual({ acao: 'convidar', email: 'ana@exemplo.com', nome: 'Ana', papel: 'usuario' });
    expect(lerPedido({ acao: 'convidar', email: 'x@y.com', papel: 'admin' })).toMatchObject({ papel: 'admin' });
  });
  it('recusa e-mail, usuário, papel e ação inválidos', () => {
    expect(lerPedido({ acao: 'convidar', email: 'sem-arroba' })).toEqual({ erro: 'Digite um e-mail válido.' });
    expect(lerPedido({ acao: 'bloquear', usuario_id: "1; drop table" })).toEqual({ erro: 'Usuário inválido.' });
    expect(lerPedido({ acao: 'papel', usuario_id: OUTRO, papel: 'dono' })).toEqual({ erro: 'Papel inválido.' });
    expect(lerPedido({ acao: 'apagar-tudo' })).toEqual({ erro: 'Ação desconhecida.' });
    expect(lerPedido(null)).toEqual({ erro: 'Pedido inválido.' });
  });
});

describe('painel: proteções', () => {
  it('não deixa bloquear, remover nem rebaixar a si mesmo', () => {
    for (const acao of ['bloquear', 'remover'] as const) expect(recusar({ acao, usuario_id: EU }, EU, perfis)).toMatch(/próprio/);
    expect(recusar({ acao: 'papel', usuario_id: EU, papel: 'usuario' }, EU, perfis)).toMatch(/próprio/);
  });
  it('nunca deixa o sistema sem administrador ativo', () => {
    const doisAdmins = [...perfis, { usuario_id: ADM2, papel: 'admin' as const, ativo: true }];
    expect(recusar({ acao: 'remover', usuario_id: ADM2 }, EU, doisAdmins)).toBeNull();
    const soOutro = [{ usuario_id: EU, papel: 'admin' as const, ativo: false }, { usuario_id: ADM2, papel: 'admin' as const, ativo: true }];
    expect(recusar({ acao: 'bloquear', usuario_id: ADM2 }, EU, soOutro)).toMatch(/pelo menos um administrador/);
  });
  it('ações comuns sobre outro usuário seguem', () => {
    expect(recusar({ acao: 'bloquear', usuario_id: OUTRO }, EU, perfis)).toBeNull();
    expect(recusar({ acao: 'papel', usuario_id: OUTRO, papel: 'admin' }, EU, perfis)).toBeNull();
    expect(recusar({ acao: 'remover', usuario_id: '00000000-0000-4000-8000-0000000000ff' }, EU, perfis)).toBe('Usuário não encontrado.');
  });
});
