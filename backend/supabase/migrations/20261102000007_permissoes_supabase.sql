-- v0.6.1 (correção de segurança achada ao aplicar no projeto real): o Supabase concede por padrão a anon e
-- authenticated TODOS os privilégios nas tabelas novas (inclusive TRUNCATE, que ignora a RLS) e EXECUTE em toda
-- função nova. "revoke ... from public" não tira essas concessões explícitas. Aqui fica só o necessário.

-- Tabelas: ninguém sem login acessa nada; logado lê e grava pela RLS, sem DELETE físico nem TRUNCATE.
revoke all on public.consentimentos, public.exercicios, public.rotinas, public.rotina_exercicios,
  public.sessoes_treino, public.series, public.pesos_corporais, public.perfis from anon, authenticated;
grant select, insert, update on public.consentimentos, public.exercicios, public.rotinas, public.rotina_exercicios,
  public.sessoes_treino, public.series, public.pesos_corporais to authenticated;
grant select on public.perfis to authenticated;

-- Funções: tudo fechado, e só reabre o que o app chama logado.
revoke execute on all functions in schema public from anon, authenticated, public;
grant execute on function public.iniciar_sessao(uuid, uuid, timestamptz), public.excluir_minha_conta(),
  public.tem_consentimento_saude(), public.conceder_consentimento(text, text), public.revogar_consentimento(text),
  public.exercicio_permitido(uuid), public.sessao_propria(uuid), public.nome_valido(text),
  public.eh_admin(), public.meu_acesso() to authenticated;
-- tornar_admin: só pelo SQL Editor (postgres) ou pela service_role.
grant execute on function public.tornar_admin(text) to service_role;

-- Daqui em diante, tabelas e funções novas não ganham nada automaticamente.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke execute on functions from anon, authenticated, public;

-- Defesa extra: conta criada fora do convite do painel (ex.: cadastro público esquecido ligado) nasce BLOQUEADA.
-- O convite (função admin-usuarios) e tornar_admin ativam o perfil.
alter table public.perfis alter column ativo set default false;
create or replace function public.criar_perfil_do_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfis (usuario_id, ativo) values (new.id, false) on conflict (usuario_id) do nothing;
  return new;
end $$;
