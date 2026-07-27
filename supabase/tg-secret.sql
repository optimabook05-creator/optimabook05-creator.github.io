-- ============================================================
-- OptimaBook — SEKRET WEBHOOK-U PËR ÇDO BIZNES ME BOT TË VETIN
-- Bizneset që krijojnë bot-in e tyre (me emrin e vet) regjistrojnë
-- webhook-un vetë. Ato NUK e dinë sekretin global — ndaj secili merr
-- sekretin e vet, që funksioni telegram e verifikon veç e veç.
-- I sigurt të ekzekutohet sa herë të duash.
-- ============================================================
alter table public.businesses
  add column if not exists tg_webhook_secret uuid default gen_random_uuid();

update public.businesses set tg_webhook_secret = gen_random_uuid()
  where tg_webhook_secret is null;
