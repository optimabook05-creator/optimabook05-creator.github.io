-- =====================================================================
-- OptimaBook — Cron: thërret kujtesat automatike çdo ditë
-- Ekzekutohet një herë te SQL Editor (pasi të jetë vendosur funksioni "reminders").
-- Kërkon që funksioni "reminders" të ketë Verify JWT = OFF.
-- =====================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Hiq punën e vjetër nëse ekziston (që të rikrijohet pa gabim)
select cron.unschedule('optimabook-daily-reminders')
where exists (select 1 from cron.job where jobname = 'optimabook-daily-reminders');

-- Çdo ditë në 09:00 UTC dërgon kujtesat për takimet e nesërme
select cron.schedule(
  'optimabook-daily-reminders',
  '0 9 * * *',
  $$
  select net.http_post(
    url := 'https://mhbrhrsjlxluxvwjhcne.supabase.co/functions/v1/reminders',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
