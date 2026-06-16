-- =====================================================================
-- OptimaBook — Staf i shumtë + Lokacione (biznese të mëdha / zinxhirë)
-- (Faza 5)
--
-- Prapa-përputhshëm: bizneset me një person punojnë njësoj si më parë
-- (pa staf → kapaciteti 1, staff_id mbetet NULL). Kur shtohet staf,
-- secili person bëhet një "burim" i veçantë → dy klientë mund të
-- rezervohen në të njëjtën orë me persona të ndryshëm.
--
-- Orari i punës mbetet i përbashkët (i biznesit) në këtë version;
-- oraret e veçanta për çdo staf vijnë më vonë. Bllokimet mund të jenë
-- për gjithë biznesin (staff_id NULL) ose për një staf (pushim personal).
--
-- Ekzekuto te SQL Editor (idempotent).
-- =====================================================================

-- ---------- Lokacionet (një biznes mund të ketë disa degë) ----------
create table if not exists public.locations (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  name         text not null,
  address      text,
  sort_order   int  not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists locations_business_idx on public.locations(business_id);

-- ---------- Stafi (personat që presin klientë) ----------
create table if not exists public.staff (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  location_id  uuid references public.locations(id) on delete set null,
  name         text not null,
  role         text not null default 'staff',
  active       boolean not null default true,
  sort_order   int  not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists staff_business_idx on public.staff(business_id);

-- ---------- Lidhjet me takimet / bllokimet ----------
alter table public.appointments add column if not exists staff_id    uuid references public.staff(id)     on delete set null;
alter table public.appointments add column if not exists location_id uuid references public.locations(id) on delete set null;
alter table public.time_blocks  add column if not exists staff_id    uuid references public.staff(id)     on delete cascade;
create index if not exists appts_staff_idx on public.appointments(business_id, appt_date, staff_id);

-- =====================================================================
-- RLS — pronari prek vetëm stafin/lokacionet e bizneseve të veta
-- =====================================================================
alter table public.locations enable row level security;
alter table public.staff     enable row level security;

drop policy if exists "own_locations" on public.locations;
create policy "own_locations" on public.locations
  for all using (public.is_my_business(business_id)) with check (public.is_my_business(business_id));

drop policy if exists "own_staff" on public.staff;
create policy "own_staff" on public.staff
  for all using (public.is_my_business(business_id)) with check (public.is_my_business(business_id));

-- =====================================================================
-- Gati. Staf + lokacione, prapa-përputhshëm me bizneset me një person.
-- =====================================================================
