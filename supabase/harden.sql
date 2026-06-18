-- =====================================================================
-- OptimaBook — Hardening (P0: korrektësi + siguri)
-- Ekzekuto te SQL Editor (idempotent).
-- =====================================================================

-- ---------- P0-1: Mbrojtje nga double-booking NË VETË DATABAZËN ----------
-- Dy takime jo-të-anuluara në të njëjtin (biznes, staf, datë, orë) bëhen
-- FIZIKISHT të pamundura. Për biznese me një person (staff_id NULL),
-- përdorim business_id si "burim" (coalesce) që të mos lejojë dy njëkohësisht.
-- Shënim: nëse ka tashmë dublime ekzistuese, fshiji para se ta krijosh.
create unique index if not exists appt_no_double_book
  on public.appointments (business_id, coalesce(staff_id, business_id), appt_date, appt_time)
  where status <> 'cancelled';
-- (Hapi tjetër P1: mbrojtje e plotë e mbivendosjes me EXCLUDE USING gist +
--  kolona starts_at/ends_at — për shërbime me kohëzgjatje që mbivendosen.)

-- ---------- P0-4: Idempotency — mos përpuno dy herë të njëjtin update ----------
create table if not exists public.processed_updates (
  id          text primary key,           -- p.sh. 'tg_<update_id>' ose 'wa_<message_id>'
  created_at  timestamptz not null default now()
);
-- RLS jo e nevojshme (përdoret vetëm nga funksionet me service_role).
alter table public.processed_updates enable row level security;

-- ---------- P0-2: Timezone i biznesit (që "sot/nesër" të jenë saktë) ----------
alter table public.businesses add column if not exists timezone text not null default 'Europe/Tirane';

-- =====================================================================
-- Gati. Anti-double-booking + idempotency + timezone.
-- =====================================================================
