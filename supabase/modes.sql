-- =====================================================================
-- OptimaBook — Mënyra e biznesit (universal: takime OSE porosi/kërkesa)
-- Që platforma të jetë e dobishme për ÇDO biznes në botë, jo vetëm ata
-- që bëjnë takime.
--   'appointments' = berber/dentist/sallon/klinikë/konsulent (kalendar)
--   'inquiry'      = web/dizajn/dyqan/produkte/porosi (PA kalendar):
--                    AI informon + merr kërkesën/porosinë + njofton pronarin
-- Ekzekuto te SQL Editor (idempotent).
-- =====================================================================

alter table public.businesses
  add column if not exists mode text not null default 'appointments'
  check (mode in ('appointments', 'inquiry'));

-- Kërkesat/porositë (leads) për bizneset 'inquiry'
create table if not exists public.leads (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  channel      text,
  chat_id      text,
  client_name  text,
  summary      text not null,          -- çfarë kërkon klienti (përmbledhje nga AI)
  status       text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at   timestamptz not null default now()
);
create index if not exists leads_business_idx on public.leads (business_id, created_at desc);

alter table public.leads enable row level security;
drop policy if exists "own_leads" on public.leads;
create policy "own_leads" on public.leads
  for all using (public.is_my_business(business_id)) with check (public.is_my_business(business_id));

-- =====================================================================
-- Gati. Mënyra 'inquiry' + tabela e kërkesave (leads).
-- =====================================================================
