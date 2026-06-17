-- =====================================================================
-- OptimaBook — State Machine (kujtesa e strukturuar e bisedës)
-- Upgrade-i #1 "enterprise": AI s'mendon më nga zero çdo herë.
--
-- Ruan gjendjen e qartë për çdo bisedë (biznes + kanal + klient):
-- intent, shërbimi, data, ora, hapi. Kështu kur klienti shkruan vetëm
-- "në 11", sistemi e di tashmë shërbimin dhe datën nga më parë —
-- pa u mbështetur te AI që ta gjejë nga historiku.
--
-- Prapa-përputhshëm: nëse tabela s'ekziston, truri kthehet te sjellja
-- e mëparshme (lexim historiku). Ekzekuto te SQL Editor (idempotent).
-- =====================================================================

create table if not exists public.conversation_state (
  business_id  uuid not null references public.businesses(id) on delete cascade,
  channel      text not null,
  chat_id      text not null,
  intent       text,                              -- 'booking' | 'cancel' | null
  service_id   uuid references public.services(id) on delete set null,
  appt_date    date,
  appt_time    time,
  persons      int  not null default 1,
  step         text not null default 'idle',      -- idle | awaiting_service | awaiting_date | awaiting_time | awaiting_confirm
  updated_at   timestamptz not null default now(),
  primary key (business_id, channel, chat_id)
);

alter table public.conversation_state enable row level security;
drop policy if exists "own_conversation_state" on public.conversation_state;
create policy "own_conversation_state" on public.conversation_state
  for select using (public.is_my_business(business_id));
-- (Funksioni "chat" përdor service_role që e anashkalon RLS — lexim/shkrim punon.)

-- =====================================================================
-- Gati. Kujtesa e strukturuar e bisedës aktive.
-- =====================================================================
