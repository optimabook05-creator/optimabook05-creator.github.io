-- =====================================================================
-- OptimaBook — SETUP-ALL: një skedar i vetëm që vendos GJITHÇKA
-- Ekzekutoje te SQL Editor PASI të kesh ekzekutuar schema.sql (bazën).
-- I sigurt të ekzekutohet sa herë të duash (idempotent) — s'prish të dhëna.
-- Përmbledh: messages, waitlist, winback, reviews, enterprise (staf/lokacione),
-- state machine, hardening (anti-double-booking + idempotency + timezone),
-- ai_notes, mode (porosi), leads, kohëzgjatje me njësi, token Telegram.
-- =====================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ---------- KOLONA TE TABELAT EKZISTUESE ----------
alter table public.appointments add column if not exists channel          text;
alter table public.appointments add column if not exists chat_id          text;
alter table public.appointments add column if not exists reminded         boolean not null default false;
alter table public.appointments add column if not exists review_requested boolean not null default false;
alter table public.appointments add column if not exists staff_id         uuid;
alter table public.appointments add column if not exists location_id      uuid;

alter table public.businesses   add column if not exists review_url         text;
alter table public.businesses   add column if not exists timezone          text not null default 'Europe/Tirane';
alter table public.businesses   add column if not exists ai_notes          text;
alter table public.businesses   add column if not exists linguistic_profile jsonb;
alter table public.businesses   add column if not exists mode              text not null default 'appointments';
alter table public.businesses   add column if not exists telegram_token    text;

alter table public.services     add column if not exists delivery          text;
alter table public.services     add column if not exists duration_value    int;
alter table public.services     add column if not exists duration_unit     text default 'min';
update public.services set duration_value = coalesce(duration_value, duration_min), duration_unit = coalesce(duration_unit, 'min') where duration_value is null;

-- ---------- TABELA TE REJA ----------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  channel text, chat_id text, role text, content text,
  created_at timestamptz not null default now()
);
create index if not exists messages_lookup_idx on public.messages(business_id, channel, chat_id, created_at);

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  client_name text, channel text, chat_id text,
  desired_date date not null, period text,
  status text not null default 'waiting',
  created_at timestamptz not null default now(), notified_at timestamptz
);
create index if not exists waitlist_lookup_idx on public.waitlist (business_id, desired_date, status);

create table if not exists public.winback_log (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  chat_id text not null, sent_at timestamptz not null default now()
);

create table if not exists public.conversation_state (
  business_id uuid not null references public.businesses(id) on delete cascade,
  channel text not null, chat_id text not null,
  intent text, service_id uuid references public.services(id) on delete set null,
  appt_date date, appt_time time, persons int not null default 1,
  step text not null default 'idle', updated_at timestamptz not null default now(),
  primary key (business_id, channel, chat_id)
);

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null, address text, sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  location_id uuid references public.locations(id) on delete set null,
  name text not null, role text not null default 'staff',
  active boolean not null default true, sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  channel text, chat_id text, client_name text, summary text not null,
  status text not null default 'new', created_at timestamptz not null default now()
);
create index if not exists leads_business_idx on public.leads (business_id, created_at desc);

create table if not exists public.processed_updates (
  id text primary key, created_at timestamptz not null default now()
);

-- ---------- RLS për tabelat e reja (pronari prek vetëm të vetat) ----------
do $$ begin
  perform 1;
  execute 'alter table public.messages           enable row level security';
  execute 'alter table public.waitlist           enable row level security';
  execute 'alter table public.winback_log        enable row level security';
  execute 'alter table public.conversation_state enable row level security';
  execute 'alter table public.locations          enable row level security';
  execute 'alter table public.staff              enable row level security';
  execute 'alter table public.leads              enable row level security';
  execute 'alter table public.processed_updates  enable row level security';
exception when others then null; end $$;

drop policy if exists "own_messages" on public.messages;
create policy "own_messages" on public.messages for all using (public.is_my_business(business_id)) with check (public.is_my_business(business_id));
drop policy if exists "own_waitlist" on public.waitlist;
create policy "own_waitlist" on public.waitlist for all using (public.is_my_business(business_id)) with check (public.is_my_business(business_id));
drop policy if exists "own_winback_log" on public.winback_log;
create policy "own_winback_log" on public.winback_log for select using (public.is_my_business(business_id));
drop policy if exists "own_conversation_state" on public.conversation_state;
create policy "own_conversation_state" on public.conversation_state for select using (public.is_my_business(business_id));
drop policy if exists "own_locations" on public.locations;
create policy "own_locations" on public.locations for all using (public.is_my_business(business_id)) with check (public.is_my_business(business_id));
drop policy if exists "own_staff" on public.staff;
create policy "own_staff" on public.staff for all using (public.is_my_business(business_id)) with check (public.is_my_business(business_id));
drop policy if exists "own_leads" on public.leads;
create policy "own_leads" on public.leads for all using (public.is_my_business(business_id)) with check (public.is_my_business(business_id));

-- ---------- Anti-double-booking (P0) ----------
create unique index if not exists appt_no_double_book
  on public.appointments (business_id, coalesce(staff_id, business_id), appt_date, appt_time)
  where status <> 'cancelled';

-- ---------- Trigger: kur anulohet takim → mbush orarin nga lista e pritjes ----------
create or replace function public.on_appt_cancelled()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    perform net.http_post(
      url := 'https://mhbrhrsjlxluxvwjhcne.supabase.co/functions/v1/fill-slot',
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body := jsonb_build_object('business_id', new.business_id, 'date', new.appt_date::text, 'time', to_char(new.appt_time, 'HH24:MI'))
    );
  end if;
  return new;
end; $$;
drop trigger if exists trg_appt_cancelled on public.appointments;
create trigger trg_appt_cancelled after update on public.appointments for each row execute function public.on_appt_cancelled();

-- =====================================================================
-- Gati! Të gjitha tabelat, kolonat, RLS, indeksi dhe triggeri janë vendosur.
-- (Cron-et për kujtesa/win-back/reviews vendosen veç, pasi të jenë funksionet.)
-- =====================================================================
