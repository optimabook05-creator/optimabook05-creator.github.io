-- =====================================================================
-- OptimaBook — EKIPI (llogari të shumta për një biznes, me role)
-- Pronari fton punonjës me email; kur ai hyn me atë email, merr qasje
-- (pa dërgim email-i — mjafton të regjistrohet me atë adresë).
-- Siguria: RLS — anëtarët shohin/prekin vetëm bizneset ku janë shtuar.
-- Ekzekuto te SQL Editor (idempotent).
-- =====================================================================

create table if not exists public.team_members (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  email       text not null,
  role        text not null default 'staff' check (role in ('manager','staff')),
  created_at  timestamptz not null default now()
);
-- Unik per (biznes, email pa-rast): index unik i vecante (Postgres s'lejon shprehje ne unique() te CREATE TABLE)
create unique index if not exists team_members_biz_email_uniq on public.team_members (business_id, lower(email));
create index if not exists team_business_idx on public.team_members(business_id);
create index if not exists team_email_idx on public.team_members(lower(email));

-- A jam anëtar (me email-in e JWT-së) i këtij biznesi?
create or replace function public.is_member(bid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.team_members tm
    where tm.business_id = bid
      and lower(tm.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- Përditëso is_my_business: PRONAR ose ANËTAR (vlen për të gjitha tabelat fëmijë)
create or replace function public.is_my_business(bid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.businesses where id = bid and owner_id = auth.uid())
      or public.is_member(bid);
$$;

-- RLS: pronari menaxhon ekipin; anëtari sheh rreshtat e vet
alter table public.team_members enable row level security;
drop policy if exists "team_owner_all" on public.team_members;
create policy "team_owner_all" on public.team_members for all
  using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()));
drop policy if exists "team_member_read" on public.team_members;
create policy "team_member_read" on public.team_members for select
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- Anëtarët mund ta LEXOJNË biznesin (jo ta ndryshojnë/fshijnë)
drop policy if exists "members_read_business" on public.businesses;
create policy "members_read_business" on public.businesses for select
  using (owner_id = auth.uid() or public.is_member(id));

-- =====================================================================
-- Gati. Një biznes = shumë llogari (pronar + manaxher + staf), të sigurta.
-- =====================================================================
