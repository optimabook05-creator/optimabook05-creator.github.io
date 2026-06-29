-- =====================================================================
-- OptimaBook — Lidhja e kanalit (token per-biznes për Telegram)
-- Çdo biznes lidh bot-in e VET Telegram (vetë-shërbim, multi-biznes).
-- Funksioni "telegram" përdor këtë token për të dërguar përgjigjet.
-- Ekzekuto te SQL Editor (idempotent).
-- =====================================================================

alter table public.businesses add column if not exists telegram_token text;

-- WhatsApp: phone_number_id i biznesit (kapet automatikisht nga webhook-u i parë
-- hyrës) — që kujtuesit/winback të dinë nga ku të nisin mesazhin në WhatsApp.
alter table public.businesses add column if not exists wa_phone_id text;

-- =====================================================================
-- Gati.
-- =====================================================================
