-- =====================================================================
-- OptimaBook — Kohëzgjatja fleksibile e shërbimit: numër + njësi
-- Useri zgjedh njësinë: min / orë / ditë / javë / muaj / vit / — (pa kohë).
-- duration_min mbetet për motorin e kalendarit (takime); duration_value +
-- duration_unit janë ato që sheh/zgjedh useri dhe që i tregohen klientit.
-- Ekzekuto te SQL Editor (idempotent).
-- =====================================================================

alter table public.services add column if not exists duration_value int;
alter table public.services add column if not exists duration_unit  text default 'min';

-- Mbush vlerat për shërbimet ekzistuese (nga duration_min në minuta)
update public.services
  set duration_value = coalesce(duration_value, duration_min),
      duration_unit  = coalesce(duration_unit, 'min')
  where duration_value is null;

-- =====================================================================
-- Gati. Kohëzgjatje me njësi të zgjedhur nga useri.
-- =====================================================================
