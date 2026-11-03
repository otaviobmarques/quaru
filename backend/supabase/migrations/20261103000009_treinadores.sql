-- v0.8 (ADR-0023): área de treinadores. O admin marca a conta como 'treinador'; o treinador cadastra alunos,
-- gera um link de vínculo e monta os treinos de cada aluno. O aluno abre o link no app, vincula a conta e recebe os
-- treinos (só leitura). RLS: o treinador só vê os próprios alunos e treinos; o aluno só vê o que é dele.

alter table public.perfis drop constraint if exists perfis_papel_check;
alter table public.perfis add constraint perfis_papel_check check (papel in ('admin', 'treinador', 'usuario'));

-- Treinador ativo (o admin também pode usar a área de treinador).
create or replace function public.eh_treinador() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfis where usuario_id = auth.uid() and papel in ('treinador', 'admin') and ativo);
$$;

create table public.alunos_treinador (
  id uuid primary key default gen_random_uuid(),
  treinador_id uuid not null references auth.users (id) on delete cascade,
  aluno_id uuid references auth.users (id) on delete set null,          -- preenchido quando o aluno aceita o link
  nome text not null check (char_length(btrim(nome)) between 1 and 80),  -- como o treinador chama o aluno
  codigo text not null unique default replace(gen_random_uuid()::text, '-', '') check (codigo ~ '^[0-9a-f]{32}$'),
  criado_em timestamptz not null default now(),
  vinculado_em timestamptz,
  excluido_em timestamptz,
  unique (treinador_id, aluno_id)
);
create index alunos_treinador_treinador_idx on public.alunos_treinador (treinador_id);
create index alunos_treinador_aluno_idx on public.alunos_treinador (aluno_id);
alter table public.alunos_treinador enable row level security;

create table public.treinos_atribuidos (
  id uuid primary key default gen_random_uuid(),
  aluno_ref uuid not null references public.alunos_treinador (id) on delete cascade,
  treinador_id uuid not null references auth.users (id) on delete cascade,
  nome text not null check (char_length(btrim(nome)) between 1 and 60),
  -- [{ "exercicioId": uuid, "series": 1..20, "reps": 1..100 | null, "descansoS": 0..900, "obs": texto curto }]
  itens jsonb not null default '[]'::jsonb check (jsonb_typeof(itens) = 'array' and jsonb_array_length(itens) <= 40),
  dias smallint[] not null default '{}' check (dias <@ array[0,1,2,3,4,5,6]::smallint[]), -- 0 = domingo
  observacoes text check (observacoes is null or char_length(observacoes) <= 1000),
  atualizado_em timestamptz not null default now(),
  excluido_em timestamptz
);
create index treinos_atribuidos_aluno_idx on public.treinos_atribuidos (aluno_ref);
create index treinos_atribuidos_treinador_idx on public.treinos_atribuidos (treinador_id);
alter table public.treinos_atribuidos enable row level security;

create or replace function public.antes_de_gravar_atribuido() returns trigger language plpgsql set search_path = public as $$
begin new.atualizado_em := now(); return new; end $$;
create trigger treinos_atribuidos_antes_de_gravar before insert or update on public.treinos_atribuidos
  for each row execute function public.antes_de_gravar_atribuido();

-- Pela API, o treinador só muda o nome e exclui o cadastro. Vínculo (aluno_id, vinculado_em), código e treinador_id
-- só mudam pelas funções aceitar_vinculo/desvincular_treinador (security definer: rodam como dono da tabela).
create or replace function public.proteger_vinculo() returns trigger language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.aluno_id := old.aluno_id; new.vinculado_em := old.vinculado_em; new.codigo := old.codigo;
    new.treinador_id := old.treinador_id; new.criado_em := old.criado_em;
  end if;
  return new;
end $$;
create trigger alunos_treinador_proteger before update on public.alunos_treinador
  for each row execute function public.proteger_vinculo();

-- O aluno é do treinador que pede?
create or replace function public.aluno_do_treinador(p_ref uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.alunos_treinador a where a.id = p_ref and a.treinador_id = auth.uid() and a.excluido_em is null);
$$;

-- Alunos: o treinador cria, vê e altera os seus (sem apagar fisicamente: excluido_em). O aluno vê os vínculos dele.
create policy alunos_treinador_ler on public.alunos_treinador for select to authenticated
  using ((treinador_id = auth.uid() and public.eh_treinador()) or aluno_id = auth.uid());
create policy alunos_treinador_criar on public.alunos_treinador for insert to authenticated
  with check (treinador_id = auth.uid() and public.eh_treinador() and aluno_id is null and vinculado_em is null);
create policy alunos_treinador_alterar on public.alunos_treinador for update to authenticated
  using (treinador_id = auth.uid() and public.eh_treinador()) with check (treinador_id = auth.uid());

-- Treinos: o treinador cria e altera os dos próprios alunos; o aluno vinculado só lê.
create policy treinos_atribuidos_ler on public.treinos_atribuidos for select to authenticated
  using ((treinador_id = auth.uid() and public.eh_treinador())
    or exists (select 1 from public.alunos_treinador a where a.id = aluno_ref and a.aluno_id = auth.uid() and a.excluido_em is null));
create policy treinos_atribuidos_criar on public.treinos_atribuidos for insert to authenticated
  with check (treinador_id = auth.uid() and public.eh_treinador() and public.aluno_do_treinador(aluno_ref));
create policy treinos_atribuidos_alterar on public.treinos_atribuidos for update to authenticated
  using (treinador_id = auth.uid() and public.eh_treinador())
  with check (treinador_id = auth.uid() and public.aluno_do_treinador(aluno_ref));

-- O aluno aceita o link: o código vira o vínculo com a conta dele (uma vez; não vale para o próprio treinador).
create or replace function public.aceitar_vinculo(p_codigo text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v public.alunos_treinador; nome_treinador text;
begin
  if auth.uid() is null then raise exception 'não autenticado' using errcode = '28000'; end if;
  select * into v from public.alunos_treinador where codigo = lower(btrim(p_codigo)) and excluido_em is null;
  if not found then return jsonb_build_object('resultado', 'codigo_invalido'); end if;
  if v.treinador_id = auth.uid() then return jsonb_build_object('resultado', 'proprio_treinador'); end if;
  if v.aluno_id is not null and v.aluno_id <> auth.uid() then return jsonb_build_object('resultado', 'ja_usado'); end if;
  if v.aluno_id is null then
    if exists (select 1 from public.alunos_treinador where treinador_id = v.treinador_id and aluno_id = auth.uid() and excluido_em is null) then
      return jsonb_build_object('resultado', 'ja_vinculado');
    end if;
    update public.alunos_treinador set aluno_id = auth.uid(), vinculado_em = now() where id = v.id;
  end if;
  select coalesce(nome, 'Seu treinador') into nome_treinador from public.perfis where usuario_id = v.treinador_id;
  return jsonb_build_object('resultado', 'vinculado', 'treinador', nome_treinador);
end $$;

-- O aluno sai do treinador (o treinador continua com o cadastro, sem o vínculo).
create or replace function public.desvincular_treinador(p_ref uuid) returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  update public.alunos_treinador set aluno_id = null, vinculado_em = null, codigo = replace(gen_random_uuid()::text, '-', '')
   where id = p_ref and aluno_id = auth.uid();
  get diagnostics n = row_count;
  return n;
end $$;

-- Para o app do aluno: os treinadores dele, com o nome (perfis é privado; aqui só sai o nome).
create or replace function public.meus_treinadores() returns table (aluno_ref uuid, treinador text, vinculado_em timestamptz)
language sql stable security definer set search_path = public as $$
  select a.id, coalesce(p.nome, 'Seu treinador'), a.vinculado_em from public.alunos_treinador a
    left join public.perfis p on p.usuario_id = a.treinador_id
   where a.aluno_id = auth.uid() and a.excluido_em is null;
$$;

-- Para o portal do treinador: e-mail dos alunos já vinculados (só dos dele).
create or replace function public.meus_alunos() returns table (id uuid, nome text, codigo text, vinculado_em timestamptz, email text, criado_em timestamptz)
language sql stable security definer set search_path = public as $$
  select a.id, a.nome, a.codigo, a.vinculado_em, u.email::text, a.criado_em from public.alunos_treinador a
    left join auth.users u on u.id = a.aluno_id
   where a.treinador_id = auth.uid() and a.excluido_em is null and public.eh_treinador()
   order by a.nome;
$$;

-- Permissões (o Supabase dá tudo por padrão; a 0007 já revogou o padrão para objetos novos, mas fica explícito).
revoke all on public.alunos_treinador, public.treinos_atribuidos from anon, authenticated;
grant select, insert, update on public.alunos_treinador, public.treinos_atribuidos to authenticated;
grant all on public.alunos_treinador, public.treinos_atribuidos to service_role;
revoke execute on function public.eh_treinador(), public.aluno_do_treinador(uuid), public.aceitar_vinculo(text),
  public.desvincular_treinador(uuid), public.meus_treinadores(), public.meus_alunos(), public.antes_de_gravar_atribuido(), public.proteger_vinculo() from anon, authenticated, public;
grant execute on function public.eh_treinador(), public.aluno_do_treinador(uuid), public.aceitar_vinculo(text),
  public.desvincular_treinador(uuid), public.meus_treinadores(), public.meus_alunos() to authenticated;
