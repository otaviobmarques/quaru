-- v0.11 (ADR-0025): aviso do fim do descanso com a tela bloqueada, na versão web (PWA).
-- O navegador não agenda notificação sozinho; então o app avisa o servidor quando o descanso começa e a função
-- aviso-descanso manda um push (Web Push, sem conteúdo) na hora certa. O service worker mostra a notificação.
-- Tudo aqui só é acessado pela função (service_role): nenhuma permissão para anon/authenticated.

-- Par de chaves VAPID do servidor. Gerado pela própria função na primeira vez; a chave privada nunca sai do banco.
create table public.push_chaves (
  id smallint primary key default 1 check (id = 1),
  publica text not null,           -- base64url, 65 bytes (P-256, formato "raw")
  privada jsonb not null,          -- JWK
  criado_em timestamptz not null default now()
);
alter table public.push_chaves enable row level security;

-- Inscrições de push de cada aparelho (endpoint do serviço do navegador: Apple, Google, Mozilla, Microsoft).
create table public.push_inscricoes (
  endpoint text primary key check (char_length(endpoint) between 20 and 1000 and endpoint like 'https://%'),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  criado_em timestamptz not null default now()
);
create index push_inscricoes_usuario_idx on public.push_inscricoes (usuario_id);
alter table public.push_inscricoes enable row level security;

-- O descanso que está correndo (um por pessoa). token muda a cada novo descanso/ajuste: o aviso antigo desiste.
create table public.avisos_descanso (
  usuario_id uuid primary key references auth.users (id) on delete cascade,
  token uuid not null,
  fim_em timestamptz not null,
  atualizado_em timestamptz not null default now()
);
alter table public.avisos_descanso enable row level security;

revoke all on public.push_chaves, public.push_inscricoes, public.avisos_descanso from anon, authenticated;
grant all on public.push_chaves, public.push_inscricoes, public.avisos_descanso to service_role;
