-- =====================================================================
-- OptimaBook — Faza C: Kujtesat automatike
-- Shtojmë te takimet: kanalin + chat_id (që kujtesa të dijë ku të shkojë)
-- dhe flamurin "reminded" (që të mos dërgohet dy herë).
-- Idempotent.
-- =====================================================================

alter table public.appointments add column if not exists channel  text;
alter table public.appointments add column if not exists chat_id  text;
alter table public.appointments add column if not exists reminded boolean not null default false;

-- Indeks për gjetjen e shpejtë të takimeve që presin kujtesë
create index if not exists appts_reminder_idx
  on public.appointments(appt_date)
  where reminded = false and status <> 'cancelled';
