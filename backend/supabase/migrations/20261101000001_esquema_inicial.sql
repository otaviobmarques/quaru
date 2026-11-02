-- app-academia – esquema inicial do MVP (Postgres/Supabase; testado localmente com PGlite).
-- Dados de saúde: RLS em TODAS as tabelas; cada usuário só enxerga as próprias linhas.
-- IDs uuid gerados no aparelho (offline-first, ADR-0003). atualizado_em é sempre o relógio do servidor.

create table public.consentimentos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  finalidade text not null check (finalidade in ('dados_saude', 'ia_visao_eua')),
  versao text not null check (length(versao) between 1 and 50),
  aceito_em timestamptz not null default now(),
  revogado_em timestamptz
);
create index consentimentos_usuario_idx on public.consentimentos (usuario_id, finalidade);

create table public.exercicios (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references auth.users (id) on delete cascade, -- null = biblioteca Domma
  nome text not null check (char_length(nome) between 1 and 80),
  grupo_muscular text not null check (char_length(grupo_muscular) <= 40),
  equipamento text not null check (char_length(equipamento) <= 40),
  tipo text not null default 'carga_reps' check (tipo in ('carga_reps', 'tempo', 'peso_corporal')),
  atualizado_em timestamptz not null default now(),
  excluido_em timestamptz
);
create index exercicios_usuario_idx on public.exercicios (usuario_id);

create table public.rotinas (
  id uuid primary key,
  usuario_id uuid not null references auth.users (id) on delete cascade,
  nome text not null check (char_length(nome) between 1 and 60),
  ordem integer not null default 0,
  atualizado_em timestamptz not null default now(),
  excluido_em timestamptz
);
create index rotinas_usuario_idx on public.rotinas (usuario_id, ordem);

create table public.rotina_exercicios (
  id uuid primary key,
  rotina_id uuid not null references public.rotinas (id) on delete cascade,
  usuario_id uuid not null references auth.users (id) on delete cascade,
  exercicio_id uuid not null references public.exercicios (id) on delete restrict,
  ordem integer not null default 0,
  series_alvo integer not null default 3 check (series_alvo between 1 and 20),
  reps_alvo integer check (reps_alvo between 1 and 100),
  descanso_s integer not null default 90 check (descanso_s between 0 and 900),
  atualizado_em timestamptz not null default now(),
  excluido_em timestamptz
);
create index rotina_exercicios_rotina_idx on public.rotina_exercicios (rotina_id);
create index rotina_exercicios_usuario_idx on public.rotina_exercicios (usuario_id);
create index rotina_exercicios_exercicio_idx on public.rotina_exercicios (exercicio_id);

create table public.sessoes_treino (
  id uuid primary key,
  usuario_id uuid not null references auth.users (id) on delete cascade,
  rotina_id uuid references public.rotinas (id) on delete set null,
  iniciada_em timestamptz not null,
  finalizada_em timestamptz check (finalizada_em is null or finalizada_em >= iniciada_em),
  notas text check (char_length(notas) <= 2000),
  atualizado_em timestamptz not null default now(),
  excluido_em timestamptz
);
create index sessoes_usuario_data_idx on public.sessoes_treino (usuario_id, iniciada_em);
create index sessoes_rotina_idx on public.sessoes_treino (rotina_id);

create table public.series (
  id uuid primary key,
  sessao_id uuid not null references public.sessoes_treino (id) on delete cascade,
  usuario_id uuid not null references auth.users (id) on delete cascade,
  exercicio_id uuid not null references public.exercicios (id) on delete restrict,
  ordem integer not null check (ordem >= 1),
  tipo text not null default 'normal' check (tipo in ('aquecimento', 'normal', 'falha', 'drop')),
  carga_kg numeric(6,2) check (carga_kg >= 0 and carga_kg <= 1000),
  reps integer check (reps between 0 and 1000),
  duracao_s integer check (duracao_s between 0 and 86400),
  rpe numeric(3,1) check (rpe between 1 and 10),
  concluida_em timestamptz,
  atualizado_em timestamptz not null default now(),
  excluido_em timestamptz
);
create index series_sessao_idx on public.series (sessao_id);
create index series_usuario_exercicio_idx on public.series (usuario_id, exercicio_id, concluida_em);
create index series_exercicio_idx on public.series (exercicio_id);

create table public.pesos_corporais (
  id uuid primary key,
  usuario_id uuid not null references auth.users (id) on delete cascade,
  peso_kg numeric(5,2) not null check (peso_kg between 20 and 400),
  medido_em timestamptz not null,
  atualizado_em timestamptz not null default now(),
  excluido_em timestamptz
);
create index pesos_usuario_data_idx on public.pesos_corporais (usuario_id, medido_em);

-- Consentimento de saúde ativo (RF11). Sem ele, o banco não grava treino nem peso.
create or replace function public.tem_consentimento_saude() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.consentimentos
                  where usuario_id = auth.uid() and finalidade = 'dados_saude' and revogado_em is null) $$;

-- Regras L2: relógio do servidor; exclusão vence edição.
create or replace function public.antes_de_gravar() returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' and old.excluido_em is not null then
    return old; -- registro excluído não volta por edição atrasada (L2.4)
  end if;
  new.atualizado_em := now();
  return new;
end $$;

do $$ declare t text; begin
  foreach t in array array['exercicios','rotinas','rotina_exercicios','sessoes_treino','series','pesos_corporais'] loop
    execute format('create trigger %I_antes_de_gravar before insert or update on public.%I for each row execute function public.antes_de_gravar()', t, t);
  end loop;
end $$;

-- RLS
alter table public.consentimentos enable row level security;
alter table public.exercicios enable row level security;
alter table public.rotinas enable row level security;
alter table public.rotina_exercicios enable row level security;
alter table public.sessoes_treino enable row level security;
alter table public.series enable row level security;
alter table public.pesos_corporais enable row level security;

create policy consentimentos_dono on public.consentimentos for all to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

create policy exercicios_ler on public.exercicios for select to authenticated
  using (usuario_id is null or usuario_id = auth.uid());
create policy exercicios_gravar on public.exercicios for insert to authenticated with check (usuario_id = auth.uid());
create policy exercicios_alterar on public.exercicios for update to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

create policy rotinas_dono on public.rotinas for all to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
create policy rotina_exercicios_dono on public.rotina_exercicios for all to authenticated
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid()
    and exists (select 1 from public.rotinas r where r.id = rotina_id and r.usuario_id = auth.uid()));

create policy sessoes_ler on public.sessoes_treino for select to authenticated using (usuario_id = auth.uid());
create policy sessoes_gravar on public.sessoes_treino for insert to authenticated
  with check (usuario_id = auth.uid() and public.tem_consentimento_saude());
create policy sessoes_alterar on public.sessoes_treino for update to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid() and public.tem_consentimento_saude());

create policy series_ler on public.series for select to authenticated using (usuario_id = auth.uid());
create policy series_gravar on public.series for insert to authenticated
  with check (usuario_id = auth.uid() and public.tem_consentimento_saude()
    and exists (select 1 from public.sessoes_treino s where s.id = sessao_id and s.usuario_id = auth.uid()));
create policy series_alterar on public.series for update to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid() and public.tem_consentimento_saude());

create policy pesos_ler on public.pesos_corporais for select to authenticated using (usuario_id = auth.uid());
create policy pesos_gravar on public.pesos_corporais for insert to authenticated
  with check (usuario_id = auth.uid() and public.tem_consentimento_saude());
create policy pesos_alterar on public.pesos_corporais for update to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid() and public.tem_consentimento_saude());

-- Sem DELETE físico pelo app: exclusão é lógica (excluido_em) para sincronizar entre aparelhos.
grant select, insert, update on public.consentimentos, public.exercicios, public.rotinas, public.rotina_exercicios,
  public.sessoes_treino, public.series, public.pesos_corporais to authenticated;
