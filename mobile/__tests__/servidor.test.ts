// Configuração do Supabase (plano gratuito): sem chaves, o modo local é o padrão. Valores fictícios.
import { lerConfigServidor } from '@/config/servidor';

describe('configuração do servidor', () => {
  it('sem variáveis → modo local (padrão)', () => {
    expect(lerConfigServidor({})).toEqual({ modo: 'local' });
    expect(lerConfigServidor({ EXPO_PUBLIC_SUPABASE_URL: 'https://abcd.supabase.co', EXPO_PUBLIC_SUPABASE_ANON_KEY: '  ' })).toEqual({ modo: 'local' });
  });
  it('URL e chave anon válidas → modo supabase (sem barra final)', () => {
    expect(lerConfigServidor({ EXPO_PUBLIC_SUPABASE_URL: 'https://abcdexemplo.supabase.co/', EXPO_PUBLIC_SUPABASE_ANON_KEY: 'chave-ficticia' }))
      .toEqual({ modo: 'supabase', url: 'https://abcdexemplo.supabase.co', chaveAnon: 'chave-ficticia' });
  });
  it('URL fora do padrão (http, outro domínio) → continua local', () => {
    for (const url of ['http://abcd.supabase.co', 'https://exemplo.com', 'abcd']) {
      expect(lerConfigServidor({ EXPO_PUBLIC_SUPABASE_URL: url, EXPO_PUBLIC_SUPABASE_ANON_KEY: 'x' })).toEqual({ modo: 'local' });
    }
  });
  it('no ambiente de teste (sem .env) o app está no modo local', () => {
    expect(lerConfigServidor().modo).toBe('local');
  });
});
