-- =====================================================================
-- OptimaBook — Skema e databazës · Faza A (v1)
-- Postgres / Supabase
--
-- Parimi: multi-tenant me Row Level Security (RLS).
-- Çdo pronar sheh dhe prek VETËM të dhënat e bizneseve të veta —
-- e garantuar nga vetë databaza, jo nga kodi. Edhe nëse frontend-i
-- ka gabim, një biznes nuk mund t'i lexojë kurrë të dhënat e një tjetri.
--
-- Ekzekutohet i sigurt disa herë (idempotent).
-- =====================================================================

-- ---------- 1. BIZNESET ----------
create table if not exists public.businesses (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  type        text not null default 'other',
  address     text,
  lang        text not null default 'sq',
  created_at  timestamptz not null default now()
);
create index if not exists businesses_owner_idx on public.businesses(owner_id);

-- ---------- 2. SHËRBIMET ----------
create table if not exists public.services (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  name          text not null,
  duration_min  int  not null default 30 check (duration_min between 5 and 600),
  price         numeric(10,2) not null default 0,
  sort_order    int  not null default 0,
  active        boolean not null default true
);
create index if not exists services_business_idx on public.services(business_id);

-- ---------- 3. ORARI I PUNËS (një rresht për ditë, 0=E diel .. 6=E shtunë) ----------
create table if not exists public.working_hours (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  weekday      int  not null check (weekday between 0 and 6),
  open_time    time,
  close_time   time,
  is_closed    boolean not null default false,
  unique (business_id, weekday)
);

-- ---------- 4. BLLOKIMET (orare kur s'punohet) ----------
create table if not exists public.time_blocks (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  block_date   date not null,
  from_time    time not null,
  to_time      time not null,
  reason       text,
  created_at   timestamptz not null default now()
);
create index if not exists blocks_business_date_idx on public.time_blocks(business_id, block_date);

-- ---------- 5. TAKIMET ----------
create table if not exists public.appointments (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  service_id    uuid references public.services(id) on delete set null,
  client_name   text not null,
  client_phone  text,
  appt_date     date not null,
  appt_time     time not null,
  status        text not null default 'pending' check (status in ('pending','confirmed','cancelled')),
  source        text not null default 'ai'      check (source in ('ai','manual')),
  created_at    timestamptz not null default now()
);
create index if not exists appts_business_date_idx on public.appointments(business_id, appt_date);

-- ---------- 6. NJOFTIMET ----------
create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  text         text not null,
  read         boolean not null default false,
  created_at   timestamptz not null default now()
);
create index if not exists notifs_business_idx on public.notifications(business_id);

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================

-- Funksion ndihmës: a i përket biznesi përdoruesit aktual?
create or replace function public.is_my_business(bid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.businesses
    where id = bid and owner_id = auth.uid()
  );
$$;

alter table public.businesses    enable row level security;
alter table public.services      enable row level security;
alter table public.working_hours enable row level security;
alter table public.time_blocks   enable row level security;
alter table public.appointments  enable row level security;
alter table public.notifications enable row level security;

-- Bizneset: pronari prek vetëm të vetat
drop policy if exists "own_businesses" on public.businesses;
create policy "own_businesses" on public.businesses
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Tabelat fëmijë: rreshti i përket një biznesi të pronarit aktual
drop policy if exists "own_services" on public.services;
create policy "own_services" on public.services
  for all using (public.is_my_business(business_id)) with check (public.is_my_business(business_id));

drop policy if exists "own_working_hours" on public.working_hours;
create policy "own_working_hours" on public.working_hours
  for all using (public.is_my_business(business_id)) with check (public.is_my_business(business_id));

drop policy if exists "own_time_blocks" on public.time_blocks;
create policy "own_time_blocks" on public.time_blocks
  for all using (public.is_my_business(business_id)) with check (public.is_my_business(business_id));

drop policy if exists "own_appointments" on public.appointments;
create policy "own_appointments" on public.appointments
  for all using (public.is_my_business(business_id)) with check (public.is_my_business(business_id));

drop policy if exists "own_notifications" on public.notifications;
create policy "own_notifications" on public.notifications
  for all using (public.is_my_business(business_id)) with check (public.is_my_business(business_id));

-- =====================================================================
-- Gati. Tabela të krijuara, RLS aktive, çdo pronar i izoluar.
-- =====================================================================
