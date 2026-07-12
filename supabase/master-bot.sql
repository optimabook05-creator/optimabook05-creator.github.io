-- ============================================================
-- BOT-I MASTER (lidhja 1-klik e Telegram-it)
-- Të gjitha bizneset ndajnë NJË bot; klienti hap linkun
-- t.me/<BOT>?start=<business_id> → lidhja ruhet këtu → çdo mesazh
-- i mëpasshëm i atij klienti shkon te biznesi i duhur.
-- Pronari s'ka më nevojë për BotFather. Idempotent.
-- ============================================================
create table if not exists public.chat_links (
  channel      text not null,              -- 'telegram' (nesër: 'whatsapp' etj.)
  chat_id      text not null,              -- id-ja e klientit në atë kanal
  business_id  uuid not null references public.businesses(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (channel, chat_id)
);

-- Vetëm serveri (service-role) e lexon/shkruan — klientët s'kanë punë këtu.
alter table public.chat_links enable row level security;
-- (pa policies = mohohet çdo qasje nga klientët; service-role e anashkalon RLS-në)
