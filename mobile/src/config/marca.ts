/**
 * ÚNICO ponto de configuração da marca (ADR-0007).
 * Nome: Quaru (aprovado pelo Otávio em 01/11/2026; registro no INPI ainda pendente).
 * Para trocar, edite este arquivo e "name" em app.json. Identificador br.com.domma.academia e slug app-academia
 * continuam neutros, aguardando decisão.
 */
import dados from './marca.json';
import { configServidor } from './servidor';

/** Valores em src/config/marca.json (nome, empresa, versão e slogan). Slogan escolhido pelo Otávio em 01/11/2026. */
export const marca = dados as { nome: string; empresa: string; versao: string; slogan: string };

/**
 * Links jurídicos da tela de login. Por padrão apontam para a tela jurídica que já existe no app (rascunho).
 * Quando houver páginas públicas, troque por `{ tipo: 'externo', url: 'https://...' }`.
 */
export type LinkJuridico = { tipo: 'interno'; rota: string } | { tipo: 'externo'; url: string };
export const linksJuridicos: { termos: LinkJuridico; privacidade: LinkJuridico } = {
  termos: { tipo: 'interno', rota: '/juridico?doc=termos' },
  privacidade: { tipo: 'interno', rota: '/juridico?doc=politica' },
};

/**
 * Autenticação com conta (v0.6, ADR-0022): liga sozinha quando o Supabase está configurado (variáveis
 * EXPO_PUBLIC_SUPABASE_*). Com ela ligada, só entra quem foi convidado pelo administrador: não há
 * "Continuar sem conta", "Criar conta" nem Google. Sem as variáveis (desenvolvimento e testes), segue o modo local.
 */
export const autenticacaoDisponivel = configServidor.modo === 'supabase';
