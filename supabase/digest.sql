-- ============================================================
-- "DITA IME" — cron i përmbledhjes së mëngjesit (funksioni 'digest')
-- Çdo ditë në 06:00 UTC (= 08:00 verë / 07:00 dimër në Tiranë).
-- Kërkon: funksionin 'digest' të vendosur (Verify JWT OFF) + push.sql.
-- Idempotent: mund ta ekzekutosh sa herë të duash.
-- ============================================================
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('optimabook-daily-digest')
where exists (select 1 from cron.job where jobname = 'optimabook-daily-digest');

select cron.schedule(
  'optimabook-daily-digest',
  '0 6 * * *',
  $$
  select net.http_post(
    url := 'https://mhbrhrsjlxluxvwjhcne.supabase.co/functions/v1/digest',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
