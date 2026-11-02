-- BUG-08 / REG-03 (QA v0.2): nome feito só de espaço Unicode (U+00A0, tabulação, U+2000–U+200B, U+3000, U+FEFF...)
-- passava pelo btrim(). Mesma lista de src/dominio/validacao.ts no aparelho.
create or replace function public.nome_valido(p text) returns boolean
language sql immutable strict parallel safe set search_path = '' as $$
  select regexp_replace(p, '[\s\u00a0\u1680\u180e\u2000-\u200b\u2028\u2029\u202f\u205f\u3000\ufeff]', '', 'g') <> '' $$;

alter table public.rotinas drop constraint if exists rotinas_nome_nao_vazio;
alter table public.exercicios drop constraint if exists exercicios_nome_nao_vazio;
alter table public.rotinas add constraint rotinas_nome_nao_vazio check (public.nome_valido(nome));
alter table public.exercicios add constraint exercicios_nome_nao_vazio check (public.nome_valido(nome));
