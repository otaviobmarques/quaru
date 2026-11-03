-- v0.10 (ADR-0024): ID do aluno, convite do treinador pelo ID, agenda com datas e evolução compartilhada.
-- 1) Toda conta tem um ID de aluno curto (perfis.codigo_aluno), que a pessoa mostra ao treinador.
-- 2) O treinador convida pelo ID; o aluno aceita ou recusa no app, e pode desvincular quando quiser.
-- 3) O aluno escolhe se compartilha a evolução (peso, treinos feitos e agenda). Só então o app publica um resumo
--    (evolucao_aluno, agenda_aluno) e só o treinador vinculado lê, pela função evolucao_do_aluno. Desligar apaga.
-- 4) O treinador agenda treinos em datas (treinos_atribuidos.datas), além dos dias da semana.

-- ---------- 1) ID do aluno ----------
-- 7 caracteres sem 0/O/1/I/L (fácil de ditar). 31^7 ≈ 27 bilhões de combinações.
create or replace function public.gerar_codigo_aluno() returns text
language plpgsql volatile set search_path = public as $$
declare a constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; c text; i int;
begin
  loop
    c := '';
    for i in 1..7 loop c := c || substr(a, 1 + floor(random() * 31)::int, 1); end loop;
    exit when not exists (select 1 from public.perfis where codigo_aluno = c);
  end loop;
  return c;
end $$;

alter table public.perfis add column codigo_aluno text unique check (codigo_aluno ~ '^[A-HJKMNP-Z2-9]{7}$');
update public.perfis set codigo_aluno = public.gerar_codigo_aluno() where codigo_aluno is null;
alter table public.perfis alter column codigo_aluno set default public.gerar_codigo_aluno();
alter table public.perfis alter column codigo_aluno set not null;

-- O próprio ID (para mostrar no Perfil do app).
create or replace function public.meu_codigo_aluno() returns text
language sql stable security definer set search_path = public as $$
  select codigo_aluno from public.perfis where usuario_id = auth.uid();
$$;

-- ---------- 2) Convite pelo ID ----------
alter table public.alunos_treinador
  add column convidado_id uuid references auth.users (id) on delete cascade, -- convite pelo ID, esperando o aluno
  add column convidado_em timestamptz,
  add column recusado_em timestamptz,
  add column compartilha_evolucao boolean not null default false;             -- só o aluno liga/desliga
create index alunos_treinador_convidado_idx on public.alunos_treinador (convidado_id) where convidado_id is not null;

-- O treinador não escolhe o convidado nem o compartilhamento pela API (só pelas funções abaixo).
create or replace function public.proteger_vinculo() returns trigger language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.aluno_id := old.aluno_id; new.vinculado_em := old.vinculado_em; new.codigo := old.codigo;
    new.treinador_id := old.treinador_id; new.criado_em := old.criado_em;
    new.convidado_id := old.convidado_id; new.convidado_em := old.convidado_em; new.recusado_em := old.recusado_em;
    new.compartilha_evolucao := old.compartilha_evolucao;
  end if;
  return new;
end $$;

drop policy alunos_treinador_criar on public.alunos_treinador;
create policy alunos_treinador_criar on public.alunos_treinador for insert to authenticated
  with check (treinador_id = auth.uid() and public.eh_treinador() and aluno_id is null and vinculado_em is null
    and convidado_id is null and not compartilha_evolucao);

-- Normaliza o que a pessoa digita: "k7m-2pq9" → "K7M2PQ9".
create or replace function public.normalizar_codigo_aluno(p text) returns text
language sql immutable set search_path = public as $$ select upper(regexp_replace(coalesce(p, ''), '[^A-Za-z0-9]', '', 'g')) $$;

-- Treinador convida pelo ID. Resultados: convidado, nao_encontrado, proprio, ja_vinculado, ja_convidado.
create or replace function public.convidar_aluno(p_codigo text, p_nome text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare alvo uuid; nome_ok text := btrim(coalesce(p_nome, '')); r public.alunos_treinador;
begin
  if not public.eh_treinador() then raise exception 'so_treinador' using errcode = '42501'; end if;
  select usuario_id into alvo from public.perfis where codigo_aluno = public.normalizar_codigo_aluno(p_codigo) and ativo;
  if alvo is null then return jsonb_build_object('resultado', 'nao_encontrado'); end if;
  if alvo = auth.uid() then return jsonb_build_object('resultado', 'proprio'); end if;
  if exists (select 1 from public.alunos_treinador where treinador_id = auth.uid() and aluno_id = alvo and excluido_em is null) then
    return jsonb_build_object('resultado', 'ja_vinculado');
  end if;
  select * into r from public.alunos_treinador where treinador_id = auth.uid() and convidado_id = alvo and excluido_em is null;
  if found then return jsonb_build_object('resultado', 'ja_convidado', 'aluno_ref', r.id); end if;
  if char_length(nome_ok) not between 1 and 80 then nome_ok := 'Aluno'; end if;
  insert into public.alunos_treinador (treinador_id, nome, convidado_id, convidado_em)
    values (auth.uid(), nome_ok, alvo, now()) returning * into r;
  return jsonb_build_object('resultado', 'convidado', 'aluno_ref', r.id);
end $$;

-- Para o app: convites esperando resposta.
create or replace function public.meus_convites() returns table (aluno_ref uuid, treinador text, convidado_em timestamptz)
language sql stable security definer set search_path = public as $$
  select a.id, coalesce(p.nome, 'Um treinador'), a.convidado_em from public.alunos_treinador a
    left join public.perfis p on p.usuario_id = a.treinador_id
   where a.convidado_id = auth.uid() and a.aluno_id is null and a.excluido_em is null;
$$;

-- O aluno responde: aceitar (com ou sem compartilhar a evolução) ou recusar.
create or replace function public.responder_convite(p_ref uuid, p_aceitar boolean, p_compartilhar boolean default false) returns text
language plpgsql security definer set search_path = public as $$
declare r public.alunos_treinador;
begin
  if auth.uid() is null then raise exception 'sem_sessao' using errcode = '28000'; end if;
  select * into r from public.alunos_treinador where id = p_ref and convidado_id = auth.uid() and aluno_id is null and excluido_em is null;
  if not found then return 'nao_encontrado'; end if;
  if not p_aceitar then
    update public.alunos_treinador set convidado_id = null, recusado_em = now() where id = p_ref;
    return 'recusado';
  end if;
  if exists (select 1 from public.alunos_treinador where treinador_id = r.treinador_id and aluno_id = auth.uid() and excluido_em is null) then
    update public.alunos_treinador set convidado_id = null where id = p_ref;
    return 'ja_vinculado';
  end if;
  update public.alunos_treinador set aluno_id = auth.uid(), vinculado_em = now(), convidado_id = null, recusado_em = null,
    compartilha_evolucao = coalesce(p_compartilhar, false) where id = p_ref;
  return 'vinculado';
end $$;

-- ---------- 3) Evolução compartilhada ----------
create table public.evolucao_aluno (
  usuario_id uuid not null references auth.users (id) on delete cascade,
  origem_id text not null check (char_length(origem_id) between 1 and 64),  -- id do registro no aparelho
  tipo text not null check (tipo in ('peso', 'treino')),
  quando timestamptz not null,
  dados jsonb not null check (jsonb_typeof(dados) = 'object' and octet_length(dados::text) <= 2000),
  primary key (usuario_id, origem_id)
);
create index evolucao_aluno_quando_idx on public.evolucao_aluno (usuario_id, quando desc);
alter table public.evolucao_aluno enable row level security;

create table public.agenda_aluno (
  usuario_id uuid primary key references auth.users (id) on delete cascade,
  dias jsonb not null default '{}'::jsonb check (jsonb_typeof(dias) = 'object' and octet_length(dias::text) <= 20000),
  atualizado_em timestamptz not null default now()
);
alter table public.agenda_aluno enable row level security;
-- Sem políticas: ninguém lê nem escreve direto. Só pelas funções publicar_evolucao (aluno) e evolucao_do_aluno (treinador).

create or replace function public.compartilha_com_alguem(p_usuario uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.alunos_treinador where aluno_id = p_usuario and compartilha_evolucao and excluido_em is null);
$$;

create or replace function public.apagar_evolucao_se_ninguem(p_usuario uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.compartilha_com_alguem(p_usuario) then
    delete from public.evolucao_aluno where usuario_id = p_usuario;
    delete from public.agenda_aluno where usuario_id = p_usuario;
  end if;
end $$;

-- O aluno liga ou desliga o compartilhamento com um treinador. Desligado com todos, o resumo é apagado.
create or replace function public.definir_compartilhamento(p_ref uuid, p_ligado boolean) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update public.alunos_treinador set compartilha_evolucao = coalesce(p_ligado, false)
   where id = p_ref and aluno_id = auth.uid() and excluido_em is null;
  if not found then return false; end if;
  perform public.apagar_evolucao_se_ninguem(auth.uid());
  return true;
end $$;

-- O app publica o resumo inteiro de uma vez (troca o anterior). Itens: [{origem_id, tipo, quando, dados}], até 1000.
-- Sem compartilhamento ligado, não grava nada (e apaga o que houver).
create or replace function public.publicar_evolucao(p_itens jsonb, p_agenda jsonb) returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if auth.uid() is null then raise exception 'sem_sessao' using errcode = '28000'; end if;
  if not public.compartilha_com_alguem(auth.uid()) then perform public.apagar_evolucao_se_ninguem(auth.uid()); return 0; end if;
  if jsonb_typeof(coalesce(p_itens, '[]')) <> 'array' or jsonb_array_length(coalesce(p_itens, '[]')) > 1000 then
    raise exception 'itens_invalidos' using errcode = '22023';
  end if;
  delete from public.evolucao_aluno where usuario_id = auth.uid();
  insert into public.evolucao_aluno (usuario_id, origem_id, tipo, quando, dados)
    select distinct on (x.origem_id) auth.uid(), x.origem_id, x.tipo, x.quando, coalesce(x.dados, '{}'::jsonb)
      from jsonb_to_recordset(coalesce(p_itens, '[]')) as x(origem_id text, tipo text, quando timestamptz, dados jsonb);
  get diagnostics n = row_count;
  insert into public.agenda_aluno (usuario_id, dias, atualizado_em) values (auth.uid(), coalesce(p_agenda, '{}'), now())
    on conflict (usuario_id) do update set dias = excluded.dias, atualizado_em = now();
  return n;
end $$;

-- O treinador lê a evolução de um aluno dele que compartilha. null = não compartilha (ou não é aluno dele).
create or replace function public.evolucao_do_aluno(p_ref uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare alvo uuid;
begin
  if not public.eh_treinador() then return null; end if;
  select aluno_id into alvo from public.alunos_treinador
   where id = p_ref and treinador_id = auth.uid() and excluido_em is null and aluno_id is not null and compartilha_evolucao;
  if alvo is null then return null; end if;
  return jsonb_build_object(
    'itens', coalesce((select jsonb_agg(jsonb_build_object('tipo', tipo, 'quando', quando, 'dados', dados) order by quando)
                         from public.evolucao_aluno where usuario_id = alvo), '[]'::jsonb),
    'agenda', coalesce((select dias from public.agenda_aluno where usuario_id = alvo), '{}'::jsonb),
    'atualizado_em', (select atualizado_em from public.agenda_aluno where usuario_id = alvo));
end $$;

-- Desvincular também desliga o compartilhamento (e apaga o resumo se não sobrar ninguém).
create or replace function public.desvincular_treinador(p_ref uuid) returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  update public.alunos_treinador set aluno_id = null, vinculado_em = null, compartilha_evolucao = false,
    codigo = replace(gen_random_uuid()::text, '-', '')
   where id = p_ref and aluno_id = auth.uid();
  get diagnostics n = row_count;
  perform public.apagar_evolucao_se_ninguem(auth.uid());
  return n;
end $$;

-- O treinador que exclui o cadastro do aluno deixa de ver a evolução; se ninguém mais vê, apaga.
create or replace function public.ao_excluir_aluno() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.excluido_em is not null and old.excluido_em is null then
    new.compartilha_evolucao := false;
  end if;
  return new;
end $$;
-- (nome com zz: roda depois de alunos_treinador_proteger, que restaura o compartilhamento vindo da API)
create trigger alunos_treinador_zz_ao_excluir before update of excluido_em on public.alunos_treinador
  for each row execute function public.ao_excluir_aluno();

-- Agora com o compartilhamento e o convite.
drop function public.meus_treinadores();
create function public.meus_treinadores() returns table (aluno_ref uuid, treinador text, vinculado_em timestamptz, compartilha boolean)
language sql stable security definer set search_path = public as $$
  select a.id, coalesce(p.nome, 'Seu treinador'), a.vinculado_em, a.compartilha_evolucao from public.alunos_treinador a
    left join public.perfis p on p.usuario_id = a.treinador_id
   where a.aluno_id = auth.uid() and a.excluido_em is null;
$$;
drop function public.meus_alunos();
create function public.meus_alunos() returns table (id uuid, nome text, codigo text, vinculado_em timestamptz, email text, criado_em timestamptz,
  convidado_em timestamptz, recusado_em timestamptz, pendente boolean, compartilha boolean)
language sql stable security definer set search_path = public as $$
  select a.id, a.nome, a.codigo, a.vinculado_em, u.email::text, a.criado_em, a.convidado_em, a.recusado_em,
         a.convidado_id is not null and a.aluno_id is null, a.compartilha_evolucao
    from public.alunos_treinador a left join auth.users u on u.id = a.aluno_id
   where a.treinador_id = auth.uid() and a.excluido_em is null and public.eh_treinador()
   order by a.nome;
$$;

-- ---------- 4) Datas na agenda ----------
alter table public.treinos_atribuidos add column datas date[] not null default '{}' check (cardinality(datas) <= 120);

-- O link de vínculo agora devolve também o aluno_ref (para o app ligar o compartilhamento logo em seguida).
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
    update public.alunos_treinador set aluno_id = auth.uid(), vinculado_em = now(), convidado_id = null where id = v.id;
  end if;
  select coalesce(nome, 'Seu treinador') into nome_treinador from public.perfis where usuario_id = v.treinador_id;
  return jsonb_build_object('resultado', 'vinculado', 'treinador', nome_treinador, 'aluno_ref', v.id);
end $$;

-- ---------- Permissões ----------
revoke all on public.evolucao_aluno, public.agenda_aluno from anon, authenticated;
grant all on public.evolucao_aluno, public.agenda_aluno to service_role;
-- O padrão de perfis.codigo_aluno roda com o papel de quem insere (a função admin-usuarios usa service_role).
grant execute on function public.gerar_codigo_aluno() to service_role;
revoke execute on function public.gerar_codigo_aluno(), public.meu_codigo_aluno(), public.normalizar_codigo_aluno(text),
  public.convidar_aluno(text, text), public.meus_convites(), public.responder_convite(uuid, boolean, boolean),
  public.compartilha_com_alguem(uuid), public.apagar_evolucao_se_ninguem(uuid), public.definir_compartilhamento(uuid, boolean),
  public.publicar_evolucao(jsonb, jsonb), public.evolucao_do_aluno(uuid), public.desvincular_treinador(uuid),
  public.meus_treinadores(), public.meus_alunos(), public.ao_excluir_aluno() from anon, authenticated, public;
grant execute on function public.meu_codigo_aluno(), public.convidar_aluno(text, text), public.meus_convites(),
  public.responder_convite(uuid, boolean, boolean), public.definir_compartilhamento(uuid, boolean), public.publicar_evolucao(jsonb, jsonb),
  public.evolucao_do_aluno(uuid), public.desvincular_treinador(uuid), public.meus_treinadores(), public.meus_alunos() to authenticated;
