-- =====================================================================
-- OptimaBook — Vlerësime Google automatike pas takimit
-- (pjesë e planit Pro: rrit reputacionin → më shumë klientë të rinj)
--
-- Një ditë pas takimit, AI i shkruan klientit dhe i kërkon me edukatë
-- një vlerësim, me linkun e Google të biznesit. Dërgohet vetëm nëse
-- pronari ka vendosur linkun e vlerësimeve.
--
-- Ekzekuto te SQL Editor (idempotent). Kërkon funksionin "reviews"
-- të vendosur me Verify JWT = OFF.
-- =====================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Linku i vlerësimeve Google i biznesit (vendoset nga pronari te paneli)
alter table public.businesses   add column if not exists review_url text;
-- A i është kërkuar vlerësim këtij takimi (që të mos pyesim dy herë)
alter table public.appointments add column if not exists review_requested boolean not null default false;

-- ---------- Cron: çdo ditë në 11:00 UTC (kërkon vlerësim për takimet e djeshme) ----------
select cron.unschedule('optimabook-reviews')
where exists (select 1 from cron.job where jobname = 'optimabook-reviews');

select cron.schedule(
  'optimabook-reviews',
  '0 11 * * *',
  $$
  select net.http_post(
    url := 'https://mhbrhrsjlxluxvwjhcne.supabase.co/functions/v1/reviews',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- =====================================================================
-- Gati. Kërkesa për vlerësime aktive (çdo ditë në 11:00 UTC).
-- =====================================================================
