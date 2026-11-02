-- v0.6 (ADR-0022): contas só por convite do administrador. Cada usuário do Auth ganha um perfil com papel
-- ('admin' ou 'usuario') e situação (ativo/bloqueado). O app só deixa entrar perfis ativos; o painel de
-- administração (site separado) lista e altera perfis pela função de borda admin-usuarios (service_role).

create table public.perfis (
  usuario_id uuid primary key references auth.users (id) on delete cascade,
  papel text not null default 'usuario' check (papel in ('admin', 'usuario')),
  ativo boolean not null default true,
  nome text check (nome is null or char_length(nome) between 1 and 80),
  criado_em timestamptz not null default now(),
  convidado_por uuid references auth.users (id) on delete set null
);
alter table public.perfis enable row level security;
create index perfis_convidado_por_idx on public.perfis (convidado_por);

-- Todo usuário novo do Auth (convite) ganha perfil 'usuario' ativo.
create or replace function public.criar_perfil_do_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfis (usuario_id) values (new.id) on conflict (usuario_id) do nothing;
  return new;
end $$;
create trigger perfis_ao_criar_usuario after insert on auth.users
  for each row execute function public.criar_perfil_do_usuario();

-- Quem já existia antes desta migração também ganha perfil.
insert into public.perfis (usuario_id) select id from auth.users on conflict (usuario_id) do nothing;

-- O usuário logado é administrador ativo?
create or replace function public.eh_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfis where usuario_id = auth.uid() and papel = 'admin' and ativo);
$$;

-- O app chama ao entrar: papel e situação do próprio perfil (nulo se não houver perfil).
create or replace function public.meu_acesso() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('papel', papel, 'ativo', ativo) from public.perfis where usuario_id = auth.uid();
$$;

-- Leitura: cada um vê o próprio perfil; o admin vê todos. Ninguém altera pela API pública:
-- mudanças de papel e bloqueio passam pela função de borda (service_role), que confere se quem pede é admin.
create policy perfis_ler on public.perfis for select to authenticated
  using (usuario_id = auth.uid() or public.eh_admin());

-- Primeiro administrador: rodar UMA VEZ no SQL Editor do Supabase (como postgres), depois de convidar o e-mail:
--   select public.tornar_admin('seu-email@exemplo.com');
-- Não pode ser chamada pelo app nem pelo painel (sem permissão para anon/authenticated).
create or replace function public.tornar_admin(p_email text) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  select id into uid from auth.users where lower(email) = lower(trim(p_email));
  if uid is null then raise exception 'usuário não encontrado: convide o e-mail primeiro' using errcode = 'P0002'; end if;
  insert into public.perfis (usuario_id, papel) values (uid, 'admin')
    on conflict (usuario_id) do update set papel = 'admin', ativo = true;
end $$;

revoke all on function public.criar_perfil_do_usuario(), public.eh_admin(), public.meu_acesso(), public.tornar_admin(text) from public;
grant execute on function public.eh_admin(), public.meu_acesso() to authenticated;
grant execute on function public.tornar_admin(text) to service_role;
grant select on public.perfis to authenticated;
grant all on public.perfis to service_role;
