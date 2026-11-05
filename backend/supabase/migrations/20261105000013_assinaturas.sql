-- v0.12 (ADR-0026): planos de assinatura do Quaru, cobrados pelo Asaas.
-- - Teste grátis de 7 dias, sem cartão, a partir da criação da conta (autocadastro com e-mail confirmado).
-- - Planos Mensal, Trimestral e Anual. Pagamento na página de cobrança do Asaas (Pix, boleto ou cartão).
-- - Sem plano (teste acabou e nada pago): o app não começa treinos novos; histórico e exportação continuam.
-- - Chave geral: enquanto config_assinatura.cobranca_ativa = false, todo mundo tem acesso (nada é bloqueado).
-- - Admin e treinador não pagam; o admin pode dar cortesia a qualquer conta.
-- Escrita só pela service_role (funções assinatura e asaas-webhook) ou por funções do admin; leitura por meu_plano().

create table public.config_assinatura (
  id smallint primary key default 1 check (id = 1),
  cobranca_ativa boolean not null default false,
  atualizado_em timestamptz not null default now()
);
insert into public.config_assinatura (id, cobranca_ativa) values (1, false);
alter table public.config_assinatura enable row level security;

create table public.planos (
  id text primary key check (id in ('mensal', 'trimestral', 'anual')),
  nome text not null,
  valor numeric(10, 2) not null check (valor > 0),
  meses smallint not null check (meses in (1, 3, 12)),
  ciclo_asaas text not null check (ciclo_asaas in ('MONTHLY', 'QUARTERLY', 'YEARLY')),
  ordem smallint not null
);
insert into public.planos (id, nome, valor, meses, ciclo_asaas, ordem) values
  ('mensal', 'Mensal', 19.90, 1, 'MONTHLY', 1),
  ('trimestral', 'Trimestral', 49.90, 3, 'QUARTERLY', 2),
  ('anual', 'Anual', 179.90, 12, 'YEARLY', 3);
alter table public.planos enable row level security;
create policy planos_ler on public.planos for select to anon, authenticated using (true);

create table public.assinaturas (
  usuario_id uuid primary key references auth.users (id) on delete cascade,
  teste_ate timestamptz not null default (now() + interval '7 days'),
  plano text references public.planos (id),
  status text not null default 'teste' check (status in ('teste', 'pendente', 'ativa', 'atrasada', 'cancelada')),
  valido_ate timestamptz,                -- pago até aqui (o acesso vale até esta data, mesmo cancelando)
  cortesia boolean not null default false,
  asaas_cliente_id text,
  asaas_assinatura_id text unique,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index assinaturas_plano_idx on public.assinaturas (plano);
alter table public.assinaturas enable row level security;

-- Eventos do Asaas já processados (o Asaas pode reenviar o mesmo evento).
create table public.eventos_asaas (
  id text primary key,
  evento text not null,
  recebido_em timestamptz not null default now()
);
alter table public.eventos_asaas enable row level security;

-- Toda conta nova ganha o teste de 7 dias. Quem já existia também (contado a partir de agora).
create or replace function public.criar_assinatura_do_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.assinaturas (usuario_id) values (new.usuario_id) on conflict (usuario_id) do nothing;
  return new;
end $$;
create trigger perfis_criar_assinatura after insert on public.perfis
  for each row execute function public.criar_assinatura_do_perfil();
insert into public.assinaturas (usuario_id) select usuario_id from public.perfis on conflict (usuario_id) do nothing;

-- Autocadastro (v0.12): a conta criada pela própria pessoa já nasce ativa (o e-mail é confirmado pelo Auth).
-- Antes (0007) nascia bloqueada, porque só o admin cadastrava.
alter table public.perfis alter column ativo set default true;
create or replace function public.criar_perfil_do_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfis (usuario_id, ativo) values (new.id, true) on conflict (usuario_id) do nothing;
  return new;
end $$;

-- O plano de quem pergunta. acesso = pode começar treinos.
create or replace function public.meu_plano() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare a public.assinaturas; p public.perfis; ligada boolean; isento boolean; motivo text;
begin
  if auth.uid() is null then return null; end if;
  select * into p from public.perfis where usuario_id = auth.uid();
  select * into a from public.assinaturas where usuario_id = auth.uid();
  select cobranca_ativa into ligada from public.config_assinatura where id = 1;
  isento := coalesce(p.papel in ('admin', 'treinador'), false) or coalesce(a.cortesia, false);
  motivo := case
    when not coalesce(ligada, false) then 'livre'
    when isento then 'isento'
    when a.valido_ate is not null and a.valido_ate > now() then 'assinante'
    when a.teste_ate is not null and a.teste_ate > now() then 'teste'
    else 'sem_plano' end;
  return jsonb_build_object(
    'acesso', motivo <> 'sem_plano', 'motivo', motivo, 'cobranca_ativa', coalesce(ligada, false),
    'status', coalesce(a.status, 'teste'), 'plano', a.plano, 'teste_ate', a.teste_ate, 'valido_ate', a.valido_ate,
    'cortesia', coalesce(a.cortesia, false));
end $$;

-- ---------- Admin ----------
create or replace function public.admin_assinaturas() returns table (usuario_id uuid, status text, plano text, teste_ate timestamptz, valido_ate timestamptz, cortesia boolean)
language sql stable security definer set search_path = public as $$
  select a.usuario_id, a.status, a.plano, a.teste_ate, a.valido_ate, a.cortesia from public.assinaturas a where public.eh_admin();
$$;

create or replace function public.admin_cobranca() returns boolean
language sql stable security definer set search_path = public as $$
  select cobranca_ativa from public.config_assinatura where id = 1 and public.eh_admin();
$$;

-- Ligar a cobrança dá a quem ainda está no teste (sem plano pago) pelo menos 7 dias a partir de agora.
create or replace function public.admin_definir_cobranca(p_ativa boolean) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not public.eh_admin() then raise exception 'so_admin' using errcode = '42501'; end if;
  update public.config_assinatura set cobranca_ativa = coalesce(p_ativa, false), atualizado_em = now() where id = 1;
  if p_ativa then
    update public.assinaturas set teste_ate = greatest(teste_ate, now() + interval '7 days'), atualizado_em = now()
     where status = 'teste' and valido_ate is null;
  end if;
  return coalesce(p_ativa, false);
end $$;

create or replace function public.admin_definir_cortesia(p_usuario uuid, p_cortesia boolean) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not public.eh_admin() then raise exception 'so_admin' using errcode = '42501'; end if;
  update public.assinaturas set cortesia = coalesce(p_cortesia, false), atualizado_em = now() where usuario_id = p_usuario;
  return found;
end $$;

-- ---------- Permissões ----------
revoke all on public.config_assinatura, public.assinaturas, public.eventos_asaas from anon, authenticated;
revoke all on public.planos from anon, authenticated;
grant select on public.planos to anon, authenticated;
grant all on public.config_assinatura, public.planos, public.assinaturas, public.eventos_asaas to service_role;
revoke execute on function public.criar_assinatura_do_perfil(), public.meu_plano(), public.admin_assinaturas(), public.admin_cobranca(),
  public.admin_definir_cobranca(boolean), public.admin_definir_cortesia(uuid, boolean) from anon, authenticated, public;
grant execute on function public.meu_plano(), public.admin_assinaturas(), public.admin_cobranca(),
  public.admin_definir_cobranca(boolean), public.admin_definir_cortesia(uuid, boolean) to authenticated;
