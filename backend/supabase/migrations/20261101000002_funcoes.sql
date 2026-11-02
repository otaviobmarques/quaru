-- Funções chamadas pelo app (PostgREST /rpc). Ver openapi.yaml.

-- L2.5: uma sessão ativa por usuário. Retorna 'iniciada' ou 'conflito' com o id da sessão ativa.
create or replace function public.iniciar_sessao(p_id uuid, p_rotina uuid, p_iniciada_em timestamptz)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare ativa uuid;
begin
  select id into ativa from public.sessoes_treino
   where usuario_id = auth.uid() and finalizada_em is null and excluido_em is null and id <> p_id
   order by iniciada_em desc limit 1;
  if ativa is not null then
    return jsonb_build_object('resultado', 'conflito', 'sessao_ativa', ativa);
  end if;
  insert into public.sessoes_treino (id, usuario_id, rotina_id, iniciada_em)
  values (p_id, auth.uid(), p_rotina, p_iniciada_em)
  on conflict (id) do nothing; -- idempotente
  return jsonb_build_object('resultado', 'iniciada', 'sessao_ativa', p_id);
end $$;

-- RF10: excluir a conta apaga tudo (cascata a partir de auth.users).
create or replace function public.excluir_minha_conta() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'não autenticado' using errcode = '28000'; end if;
  delete from auth.users where id = auth.uid();
end $$;

revoke all on function public.iniciar_sessao(uuid, uuid, timestamptz), public.excluir_minha_conta(),
  public.tem_consentimento_saude() from public;
grant execute on function public.iniciar_sessao(uuid, uuid, timestamptz), public.excluir_minha_conta(),
  public.tem_consentimento_saude() to authenticated;
