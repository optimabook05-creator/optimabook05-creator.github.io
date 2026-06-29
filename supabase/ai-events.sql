-- =====================================================================
-- OptimaBook — AI Observability (log i ndërveprimeve)
-- Funksioni "chat" shkruan një rresht për çdo bisedë (jashtë preview).
-- Mundëson metrika: booking rate, escalation rate, low-confidence rate,
-- fallback rate. Të dhënat mblidhen që nga dita 1 (s'logohet dot prapaveprueshëm).
-- Ekzekuto te SQL Editor (idempotent).
-- =====================================================================

create table if not exists public.ai_events (
  id          bigint generated always as identity primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  channel     text,
  chat_id     text,
  via         text,          -- rule | ai | fallback
  intent      text,          -- booking | cancel | reschedule | human | info
  confidence  numeric,       -- konfidenca e përgjithshme (min e dimensioneve)
  booked      boolean default false,
  proposed    boolean default false,
  cancelled   boolean default false,
  escalated   boolean default false,
  created_at  timestamptz not null default now()
);

create index if not exists ai_events_idx on public.ai_events (business_id, created_at);

alter table public.ai_events enable row level security;
-- Shkrimi bëhet nga funksioni (service role, anashkalon RLS). Pronari vetëm lexon të vetat.
drop policy if exists "own_ai_events" on public.ai_events;
create policy "own_ai_events" on public.ai_events for select using (public.is_my_business(business_id));

-- =====================================================================
-- Gati. Shembull metrike (pas grumbullimit të të dhënave):
--   select
--     count(*)                                   as total,
--     round(100.0*count(*) filter (where booked)   / nullif(count(*),0),1) as booking_rate,
--     round(100.0*count(*) filter (where escalated)/ nullif(count(*),0),1) as escalation_rate,
--     round(100.0*count(*) filter (where via='fallback')/ nullif(count(*),0),1) as fallback_rate,
--     round(100.0*count(*) filter (where confidence < 0.7)/ nullif(count(*),0),1) as low_conf_rate
--   from public.ai_events where business_id = '<ID>' and created_at > now() - interval '30 days';
-- =====================================================================
