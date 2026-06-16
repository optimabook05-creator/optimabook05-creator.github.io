-- =====================================================================
-- OptimaBook — Rikthimi i klientëve të humbur (win-back)
-- (pjesë e planit Pro: sjell para nga klientë që ndryshe humbeshin)
--
-- Tabela mban gjurmë se kë e kemi ftuar dhe kur, që të mos e bezdisim.
-- Cron-i thërret funksionin "winback" çdo ditë.
--
-- Ekzekuto te SQL Editor (idempotent). Kërkon funksionin "winback"
-- të vendosur me Verify JWT = OFF.
-- =====================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ---------- Gjurma e ftesave të rikthimit ----------
create table if not exists public.winback_log (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  chat_id      text not null,
  sent_at      timestamptz not null default now()
);
create index if not exists winback_log_idx on public.winback_log (business_id, chat_id, sent_at);

alter table public.winback_log enable row level security;
drop policy if exists "own_winback_log" on public.winback_log;
create policy "own_winback_log" on public.winback_log
  for select using (public.is_my_business(business_id));
-- (Funksioni përdor service_role që e anashkalon RLS — shkrimet punojnë.)

-- ---------- Cron: çdo ditë në 10:00 UTC ----------
select cron.unschedule('optimabook-winback')
where exists (select 1 from cron.job where jobname = 'optimabook-winback');

select cron.schedule(
  'optimabook-winback',
  '0 10 * * *',
  $$
  select net.http_post(
    url := 'https://mhbrhrsjlxluxvwjhcne.supabase.co/functions/v1/winback',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- =====================================================================
-- Gati. Rikthimi i klientëve aktiv (çdo ditë në 10:00 UTC).
-- =====================================================================
