-- =====================================================================
-- OptimaBook — Lidhja e kanalit (token per-biznes për Telegram)
-- Çdo biznes lidh bot-in e VET Telegram (vetë-shërbim, multi-biznes).
-- Funksioni "telegram" përdor këtë token për të dërguar përgjigjet.
-- Ekzekuto te SQL Editor (idempotent).
-- =====================================================================

alter table public.businesses add column if not exists telegram_token text;

-- =====================================================================
-- Gati.
-- =====================================================================
