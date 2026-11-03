-- v0.9: aniversário da pessoa no perfil, para o Quaru dar parabéns (no futuro, notificação no dia).
-- Dia e mês; o ano é opcional. Cada um grava só o próprio, pela função definir_aniversario (perfis segue
-- fechado para escrita pela API). O admin vê pelo painel (função admin-usuarios, com service_role).
alter table public.perfis
  add column aniversario_dia smallint,
  add column aniversario_mes smallint,
  add column aniversario_ano smallint,
  add constraint perfis_aniversario_ok check (
    (aniversario_dia is null and aniversario_mes is null and aniversario_ano is null)
    or (aniversario_mes between 1 and 12 and aniversario_dia between 1 and 31
        and (aniversario_ano is null or aniversario_ano between 1900 and 2200)
        and make_date(coalesce(aniversario_ano, 2000), aniversario_mes, aniversario_dia) is not null));

create index perfis_aniversario_idx on public.perfis (aniversario_mes, aniversario_dia) where aniversario_mes is not null;

-- null em tudo apaga. Data impossível (31/02, 29/02 de ano comum, futuro) é recusada.
create or replace function public.definir_aniversario(p_dia integer, p_mes integer, p_ano integer default null) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'sem_sessao' using errcode = '28000'; end if;
  if p_dia is null and p_mes is null then
    update public.perfis set aniversario_dia = null, aniversario_mes = null, aniversario_ano = null where usuario_id = auth.uid();
    return found;
  end if;
  if p_dia is null or p_mes is null or p_mes not between 1 and 12 or p_dia not between 1 and 31 then raise exception 'data_invalida' using errcode = '22008'; end if;
  begin
    perform make_date(coalesce(p_ano, 2000), p_mes, p_dia);
  exception when others then raise exception 'data_invalida' using errcode = '22008';
  end;
  if p_ano is not null and (p_ano < 1900 or make_date(p_ano, p_mes, p_dia) > current_date) then raise exception 'data_invalida' using errcode = '22008'; end if;
  update public.perfis set aniversario_dia = p_dia, aniversario_mes = p_mes, aniversario_ano = p_ano where usuario_id = auth.uid();
  return found;
end $$;

revoke execute on function public.definir_aniversario(integer, integer, integer) from public, anon;
grant execute on function public.definir_aniversario(integer, integer, integer) to authenticated;
