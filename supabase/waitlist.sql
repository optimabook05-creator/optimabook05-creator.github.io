-- =====================================================================
-- OptimaBook — Lista e pritjes + Mbushja automatike e orareve bosh
-- (pjesë e planit Pro: "Revenue/Retention" — ul boshllëqet, sjell para)
--
-- Si punon:
-- 1) Kur dita është plot, AI e fton klientin në "listën e pritjes".
-- 2) Kur dikush ANULON, një trigger lajmëron automatikisht funksionin
--    "fill-slot", i cili i shkruan klientit të parë në pritje që u lirua
--    një orar. Orari bosh mbushet vetë.
--
-- Ekzekuto te SQL Editor (idempotent). Kërkon: funksioni "fill-slot"
-- i vendosur me Verify JWT = OFF, dhe pg_net aktiv.
-- =====================================================================

create extension if not exists pg_net;

-- ---------- Tabela e listës së pritjes ----------
create table if not exists public.waitlist (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  service_id    uuid references public.services(id) on delete set null,
  client_name   text,
  channel       text,                 -- 'telegram' | 'whatsapp' | ...
  chat_id       text,                 -- ku ta lajmërojmë klientin
  desired_date  date not null,
  period        text,                 -- 'morning' | 'afternoon' | 'evening' | null (çdo orë)
  status        text not null default 'waiting'
                check (status in ('waiting','notified','converted','expired')),
  created_at    timestamptz not null default now(),
  notified_at   timestamptz
);
create index if not exists waitlist_lookup_idx
  on public.waitlist (business_id, desired_date, status);

-- ---------- RLS: pronari sheh vetëm listën e biznesit të vet ----------
alter table public.waitlist enable row level security;
drop policy if exists "own_waitlist" on public.waitlist;
create policy "own_waitlist" on public.waitlist
  for all using (public.is_my_business(business_id)) with check (public.is_my_business(business_id));
-- (Funksionet përdorin service_role që e anashkalon RLS — shkrimet nga AI punojnë.)

-- =====================================================================
-- TRIGGER: kur një takim kalon në 'cancelled', thirr "fill-slot"
-- që të mbushet orari i liruar nga lista e pritjes.
-- Mbulon ÇDO rrugë anulimi: nga chat-i (AI) dhe nga paneli i pronarit.
-- =====================================================================
create or replace function public.on_appt_cancelled()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    perform net.http_post(
      url := 'https://mhbrhrsjlxluxvwjhcne.supabase.co/functions/v1/fill-slot',
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body := jsonb_build_object(
        'business_id', new.business_id,
        'date',        new.appt_date::text,
        'time',        to_char(new.appt_time, 'HH24:MI')
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_appt_cancelled on public.appointments;
create trigger trg_appt_cancelled
  after update on public.appointments
  for each row execute function public.on_appt_cancelled();

-- =====================================================================
-- Gati. Lista e pritjes + mbushja automatike aktive.
-- =====================================================================
