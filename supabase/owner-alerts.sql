-- ============================================================
-- NJOFTIMET E PRONARIT NË TELEGRAM (reliability backbone)
-- Push-i në Android ekonomik vonon (Samsung/Xiaomi vrasin sfondin).
-- Telegram-i s'vonon KURRË. Pronari lidh Telegram-in e vet një herë
-- (link me token sekret) → çdo rezervim/porosi i vjen aty në çast.
-- Idempotent.
-- ============================================================
alter table public.businesses
  add column if not exists owner_tg_chat text,                              -- chat_id i pronarit (ku shkojnë njoftimet)
  add column if not exists owner_alert_token uuid default gen_random_uuid(); -- token sekret në linkun e lidhjes

-- Bizneseve ekzistuese pa token → jepu një (një herë)
update public.businesses set owner_alert_token = gen_random_uuid()
  where owner_alert_token is null;
