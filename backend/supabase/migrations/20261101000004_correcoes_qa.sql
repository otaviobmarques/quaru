-- Correções do relatório de qualidade v0.1 (Heloísa, 01/11/2026): BUG-02, 03, 04, 07, 08.

-- Exercício utilizável pelo usuário: biblioteca Domma (usuario_id null) ou próprio.
create or replace function public.exercicio_permitido(p_exercicio uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.exercicios e
                  where e.id = p_exercicio and (e.usuario_id is null or e.usuario_id = auth.uid())) $$;
create or replace function public.sessao_propria(p_sessao uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.sessoes_treino s where s.id = p_sessao and s.usuario_id = auth.uid()) $$;
revoke all on function public.exercicio_permitido(uuid), public.sessao_propria(uuid) from public;
grant execute on function public.exercicio_permitido(uuid), public.sessao_propria(uuid) to authenticated;

-- BUG-02: série e item de rotina só com exercício permitido. BUG-03: UPDATE também confere a sessão.
drop policy series_gravar on public.series;
drop policy series_alterar on public.series;
create policy series_gravar on public.series for insert to authenticated
  with check (usuario_id = auth.uid() and public.tem_consentimento_saude()
    and public.sessao_propria(sessao_id) and public.exercicio_permitido(exercicio_id));
create policy series_alterar on public.series for update to authenticated
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid() and public.tem_consentimento_saude()
    and public.sessao_propria(sessao_id) and public.exercicio_permitido(exercicio_id));

drop policy rotina_exercicios_dono on public.rotina_exercicios;
create policy rotina_exercicios_dono on public.rotina_exercicios for all to authenticated
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid()
    and exists (select 1 from public.rotinas r where r.id = rotina_id and r.usuario_id = auth.uid())
    and public.exercicio_permitido(exercicio_id));

-- BUG-02 (efeito LGPD): referências antigas/indevidas de OUTROS usuários aos exercícios da pessoa não podem
-- impedir a exclusão. Essas linhas apontam para dado alheio e são removidas junto.
create or replace function public.excluir_minha_conta() returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'não autenticado' using errcode = '28000'; end if;
  delete from public.series s using public.exercicios e
   where s.exercicio_id = e.id and e.usuario_id = uid and s.usuario_id <> uid;
  delete from public.rotina_exercicios ri using public.exercicios e
   where ri.exercicio_id = e.id and e.usuario_id = uid and ri.usuario_id <> uid;
  delete from public.series where usuario_id = uid;            -- antes dos exercícios (FK restrict)
  delete from public.rotina_exercicios where usuario_id = uid;
  delete from auth.users where id = uid;
end $$;

-- BUG-04: id de sessão já usado por outra pessoa não responde "iniciada".
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
  on conflict (id) do nothing;
  if not public.sessao_propria(p_id) then
    return jsonb_build_object('resultado', 'id_invalido', 'sessao_ativa', null);
  end if;
  return jsonb_build_object('resultado', 'iniciada', 'sessao_ativa', p_id);
end $$;

-- BUG-07: peso com data no futuro (tolerância de 5 min para relógio do aparelho).
drop policy pesos_gravar on public.pesos_corporais;
drop policy pesos_alterar on public.pesos_corporais;
create policy pesos_gravar on public.pesos_corporais for insert to authenticated
  with check (usuario_id = auth.uid() and public.tem_consentimento_saude() and medido_em <= now() + interval '5 minutes');
create policy pesos_alterar on public.pesos_corporais for update to authenticated
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid() and public.tem_consentimento_saude() and medido_em <= now() + interval '5 minutes');

-- BUG-08: nome só com espaços.
alter table public.rotinas add constraint rotinas_nome_nao_vazio check (btrim(nome) <> '');
alter table public.exercicios add constraint exercicios_nome_nao_vazio check (btrim(nome) <> '');
