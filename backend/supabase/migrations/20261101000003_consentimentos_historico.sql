-- Consentimentos com histórico imutável (revisão jurídica de 01/11/2026, item 8; corrige BUG-05 da QA).
-- Cada concessão é UMA linha com versão e data/hora próprias (relógio do servidor). Revogar só preenche
-- revogado_em uma vez; a linha nunca é apagada pelo app nem "desrevogada". Uma linha ativa por finalidade.

alter table public.consentimentos
  add constraint consentimentos_revogado_depois check (revogado_em is null or revogado_em >= aceito_em);

create unique index consentimentos_um_ativo_idx
  on public.consentimentos (usuario_id, finalidade) where revogado_em is null;

create or replace function public.consentimento_imutavel() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    new.aceito_em := now();      -- data do aceite é sempre a do servidor
    new.revogado_em := null;     -- não se insere consentimento já revogado
    return new;
  end if;
  -- UPDATE: só a revogação (uma vez); demais colunas ficam como estavam.
  if old.revogado_em is not null then return old; end if;
  new.id := old.id; new.usuario_id := old.usuario_id; new.finalidade := old.finalidade;
  new.versao := old.versao; new.aceito_em := old.aceito_em;
  if new.revogado_em is not null then new.revogado_em := now(); end if;
  return new;
end $$;

create trigger consentimentos_imutavel before insert or update on public.consentimentos
  for each row execute function public.consentimento_imutavel();

-- RLS: o usuário só "altera" (revoga) linhas ainda ativas; revogadas ficam fora do alcance do UPDATE.
drop policy consentimentos_dono on public.consentimentos;
create policy consentimentos_ler on public.consentimentos for select to authenticated using (usuario_id = auth.uid());
create policy consentimentos_gravar on public.consentimentos for insert to authenticated with check (usuario_id = auth.uid());
create policy consentimentos_revogar on public.consentimentos for update to authenticated
  using (usuario_id = auth.uid() and revogado_em is null) with check (usuario_id = auth.uid());

-- UPDATE continua concedido, mas o gatilho preserva todas as colunas exceto revogado_em (preenchido uma única vez).

-- RPCs usadas pelo app (ver openapi.yaml).
create or replace function public.conceder_consentimento(p_finalidade text, p_versao text)
returns public.consentimentos language plpgsql security invoker set search_path = public as $$
declare r public.consentimentos;
begin
  select * into r from public.consentimentos
   where usuario_id = auth.uid() and finalidade = p_finalidade and revogado_em is null;
  if found and r.versao = p_versao then return r; end if;               -- idempotente
  if found then                                                           -- nova versão do texto encerra a anterior
    update public.consentimentos set revogado_em = now() where id = r.id;
  end if;
  insert into public.consentimentos (usuario_id, finalidade, versao) values (auth.uid(), p_finalidade, p_versao) returning * into r;
  return r;
end $$;

create or replace function public.revogar_consentimento(p_finalidade text) returns integer
language plpgsql security invoker set search_path = public as $$
declare n integer;
begin
  update public.consentimentos set revogado_em = now()
   where usuario_id = auth.uid() and finalidade = p_finalidade and revogado_em is null;
  get diagnostics n = row_count;
  return n;
end $$;

revoke all on function public.conceder_consentimento(text, text), public.revogar_consentimento(text) from public;
grant execute on function public.conceder_consentimento(text, text), public.revogar_consentimento(text) to authenticated;
