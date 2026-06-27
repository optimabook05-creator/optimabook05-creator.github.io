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
-- Lejo 3 mënyra: takime / porosi / të dyja
alter table public.businesses   drop constraint if exists businesses_mode_check;
alter table public.businesses   add  constraint businesses_mode_check check (mode in ('appointments','inquiry','both'));
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

-- ---------- SHTRESA E TREGTISË (commerce): produkte, stok, çmime sipas sasisë, porosi ----------
alter table public.businesses add column if not exists currency text not null default 'EUR';
alter table public.businesses add column if not exists commerce_enabled boolean not null default false;
alter table public.businesses add column if not exists config jsonb not null default '{}'::jsonb;
alter table public.services add column if not exists kind        text not null default 'service' check (kind in ('service','product'));
alter table public.services add column if not exists description text;
alter table public.services add column if not exists sku         text;
alter table public.services add column if not exists track_stock boolean not null default false;
alter table public.services add column if not exists stock       numeric;
alter table public.services add column if not exists unit_label  text;
alter table public.services add column if not exists bookable    boolean not null default true;
alter table public.services add column if not exists addons      jsonb;   -- shtesa: [{name,price,cost,required}] (montim/postë/garanci…)
alter table public.services add column if not exists hidden_fields jsonb;  -- fushat e fshehura për KËTË artikull (p.sh. ["stock","sku","tiers"])
alter table public.services add column if not exists cost        numeric;

create table if not exists public.price_tiers (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  min_qty numeric not null default 1, unit_price numeric(12,2) not null default 0,
  label text, created_at timestamptz not null default now()
);
create index if not exists price_tiers_service_idx on public.price_tiers (service_id, min_qty);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_name text, customer_contact text, channel text, chat_id text,
  order_type text not null default 'retail' check (order_type in ('retail','wholesale')),
  status text not null default 'new' check (status in ('new','confirmed','in_progress','shipped','delivered','completed','cancelled')),
  placed_at timestamptz not null default now(), due_at date,
  currency text not null default 'EUR',
  subtotal numeric(12,2) not null default 0, discount numeric(12,2) not null default 0, total numeric(12,2) not null default 0,
  paid_status text not null default 'unpaid' check (paid_status in ('unpaid','partial','paid')),
  amount_paid numeric(12,2) not null default 0, notes text,
  created_by text not null default 'manual' check (created_by in ('manual','ai')),
  created_at timestamptz not null default now()
);
create index if not exists orders_business_idx on public.orders (business_id, placed_at desc);
create index if not exists orders_status_idx on public.orders (business_id, status);
create index if not exists orders_due_idx on public.orders (business_id, due_at);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  name text not null, qty numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0, line_total numeric(12,2) not null default 0, cost numeric(12,2)
);
alter table public.order_items add column if not exists cost numeric(12,2);
create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists order_items_business_idx on public.order_items (business_id, service_id);

alter table public.price_tiers enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;
drop policy if exists "own_price_tiers" on public.price_tiers;
create policy "own_price_tiers" on public.price_tiers for all using (public.is_my_business(business_id)) with check (public.is_my_business(business_id));
drop policy if exists "own_orders" on public.orders;
create policy "own_orders" on public.orders for all using (public.is_my_business(business_id)) with check (public.is_my_business(business_id));
drop policy if exists "own_order_items" on public.order_items;
create policy "own_order_items" on public.order_items for all using (public.is_my_business(business_id)) with check (public.is_my_business(business_id));

-- ---------- FAQJA PUBLIKE (rezervim/porosi pa llogari) — funksione të sigurta ----------
create or replace function public.public_business(bid uuid)
returns jsonb language sql security definer stable set search_path = public as $$
  select case when b.id is null then null else jsonb_build_object(
    'id', b.id, 'name', b.name, 'address', b.address, 'mode', b.mode,
    'currency', b.currency, 'commerce_enabled', b.commerce_enabled,
    -- Vetëm fushat publike të config-ut (default-deny): NUK ekspozohen kurrë fixedCosts/fixedMonthly/profitOn (të dhëna financiare private)
    'config', jsonb_build_object(
      'breaks', b.config->'breaks',
      'catDesc', b.config->'catDesc', 'catUnit', b.config->'catUnit', 'catStock', b.config->'catStock', 'catSku', b.config->'catSku', 'catTiers', b.config->'catTiers',
      'phone', b.config->'phone', 'email', b.config->'email', 'website', b.config->'website', 'instagram', b.config->'instagram', 'city', b.config->'city', 'about', b.config->'about'
    ),
    'timezone', b.timezone, 'lang', b.lang,
    'services', coalesce((select jsonb_agg(jsonb_build_object(
        'id', s.id, 'name', s.name, 'price', s.price, 'kind', s.kind, 'bookable', s.bookable,
        'description', s.description, 'unit_label', s.unit_label, 'addons', s.addons, 'hidden_fields', s.hidden_fields,
        'duration_min', s.duration_min, 'duration_value', s.duration_value, 'duration_unit', s.duration_unit
      ) order by s.sort_order) from services s where s.business_id = b.id and s.active), '[]'::jsonb),
    'tiers', coalesce((select jsonb_agg(jsonb_build_object('service_id', t.service_id, 'min_qty', t.min_qty, 'unit_price', t.unit_price))
        from price_tiers t where t.business_id = b.id), '[]'::jsonb),
    'hours', coalesce((select jsonb_agg(jsonb_build_object('weekday', w.weekday, 'open_time', w.open_time, 'close_time', w.close_time, 'is_closed', w.is_closed))
        from working_hours w where w.business_id = b.id), '[]'::jsonb),
    'busy', coalesce((select jsonb_agg(jsonb_build_object('d', a.appt_date, 't', a.appt_time, 'dur', coalesce(s.duration_min, 30)))
        from appointments a left join services s on s.id = a.service_id
        where a.business_id = b.id and a.status <> 'cancelled' and a.appt_date >= current_date), '[]'::jsonb),
    'blocks', coalesce((select jsonb_agg(jsonb_build_object('d', tb.block_date, 'f', tb.from_time, 't', tb.to_time))
        from time_blocks tb where tb.business_id = b.id and tb.block_date >= current_date), '[]'::jsonb)
  ) end
  from businesses b where b.id = bid;
$$;

create or replace function public.public_book(bid uuid, p_service uuid, p_name text, p_phone text, p_date date, p_time time)
returns jsonb language plpgsql security definer set search_path = public as $$
declare new_id uuid; ndur int; cap int; noverlap int; recent int;
begin
  if bid is null or p_date is null or p_time is null then return jsonb_build_object('ok', false, 'error', 'missing'); end if;
  -- Rate limit: maks 20 rezervime web/min për biznes (mbrojtje nga spam/kosto)
  select count(*) into recent from appointments where business_id = bid and channel = 'web' and created_at > now() - interval '1 minute';
  if recent >= 20 then return jsonb_build_object('ok', false, 'error', 'rate'); end if;
  -- Kohëzgjatja e shërbimit + kapaciteti paralel (numri i stafit, min 1)
  select coalesce(duration_min, 30) into ndur from services where id = p_service;
  ndur := coalesce(ndur, 30);
  select greatest(1, count(*)) into cap from staff where business_id = bid and active;
  -- Mbrojtje serveri kundër MBIVENDOSJES (jo vetëm ora identike) — respekton kapacitetin paralel
  select count(*) into noverlap from appointments a left join services s on s.id = a.service_id
   where a.business_id = bid and a.appt_date = p_date and a.status <> 'cancelled'
     and a.appt_time < (p_time + make_interval(mins => ndur))
     and (a.appt_time + make_interval(mins => coalesce(s.duration_min, 30))) > p_time;
  if noverlap >= cap then return jsonb_build_object('ok', false, 'error', 'slot_taken'); end if;
  insert into appointments (business_id, service_id, client_name, client_phone, appt_date, appt_time, status, source, channel)
  values (bid, p_service, left(coalesce(nullif(trim(p_name),''),'Web'),60), left(coalesce(p_phone,''),40), p_date, p_time, 'pending', 'manual', 'web')
  returning id into new_id;
  insert into notifications (business_id, text)
  values (bid, '🌐 Rezervim i ri nga faqja online: ' || coalesce(p_name,'klient') || ' · ' || p_date::text || ' ' || to_char(p_time,'HH24:MI'));
  return jsonb_build_object('ok', true, 'id', new_id);
exception
  when unique_violation then return jsonb_build_object('ok', false, 'error', 'slot_taken');
  when others then return jsonb_build_object('ok', false, 'error', 'failed');
end; $$;

-- Idempotencë për porositë e faqes publike (mbron nga dyfishimi në dy-klikim/retry)
alter table public.orders add column if not exists idempotency_key uuid;
create unique index if not exists orders_idem_uniq on public.orders (business_id, idempotency_key) where idempotency_key is not null;

drop function if exists public.public_order(uuid, text, text, jsonb, text);
create or replace function public.public_order(bid uuid, p_name text, p_contact text, p_items jsonb, p_notes text, p_idem uuid default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare oid uuid; sub numeric := 0; cur text; r record; sid uuid; q numeric; up numeric; ar record; ap numeric; recent int;
begin
  if bid is null then return jsonb_build_object('ok', false, 'error', 'missing'); end if;
  -- Idempotencë: nëse kjo porosi është dërguar tashmë me të njëjtin çelës, ktheje (pa dublikatë)
  if p_idem is not null then
    select id into oid from orders where business_id = bid and idempotency_key = p_idem limit 1;
    if oid is not null then return jsonb_build_object('ok', true, 'id', oid); end if;
  end if;
  -- Rate limit: maks 30 porosi web/min për biznes
  select count(*) into recent from orders where business_id = bid and channel = 'web' and created_at > now() - interval '1 minute';
  if recent >= 30 then return jsonb_build_object('ok', false, 'error', 'rate'); end if;
  select currency into cur from businesses where id = bid;
  insert into orders (business_id, customer_name, customer_contact, status, currency, created_by, channel, notes, idempotency_key)
  values (bid, left(coalesce(nullif(trim(p_name),''),'Web'),60), left(coalesce(p_contact,''),60), 'new', coalesce(cur,'EUR'), 'manual', 'web', left(coalesce(p_notes,''),200), p_idem)
  returning id into oid;
  for r in select value as v from jsonb_array_elements(p_items) loop
    sid := (r.v->>'service_id')::uuid;
    q := coalesce((r.v->>'qty')::numeric, 1);
    if sid is null or q <= 0 then continue; end if;
    select coalesce(
      (select pt.unit_price from price_tiers pt where pt.service_id = sid and pt.min_qty <= q order by pt.min_qty desc limit 1),
      (select s.price from services s where s.id = sid), 0) into up;
    insert into order_items (order_id, business_id, service_id, name, qty, unit_price, line_total)
    values (oid, bid, sid, coalesce((select name from services where id = sid), '-'), q, up, q * up);
    sub := sub + q * up;
    -- Shtesat: të detyrueshme gjithmonë + opsionalet e zgjedhura nga klienti (çmimi merret nga baza, jo nga klienti)
    for ar in select value as av from jsonb_array_elements(coalesce((select addons from services where id = sid), '[]'::jsonb)) loop
      if (ar.av->>'required')::boolean is true or (coalesce(r.v->'addons','[]'::jsonb) ? (ar.av->>'name')) then
        ap := coalesce((ar.av->>'price')::numeric, 0);
        insert into order_items (order_id, business_id, service_id, name, qty, unit_price, line_total)
        values (oid, bid, sid, left('+ ' || (ar.av->>'name'), 60), q, ap, q * ap);
        sub := sub + q * ap;
      end if;
    end loop;
  end loop;
  if sub = 0 then delete from orders where id = oid; return jsonb_build_object('ok', false, 'error', 'no_items'); end if;
  update orders set subtotal = sub, total = sub where id = oid;
  insert into notifications (business_id, text) values (bid, '🌐 Porosi e re nga faqja online: ' || coalesce(p_name,'klient'));
  return jsonb_build_object('ok', true, 'id', oid);
exception
  when unique_violation then  -- garë idempotence → ktheje porosinë ekzistuese
    select id into oid from orders where business_id = bid and idempotency_key = p_idem limit 1;
    if oid is not null then return jsonb_build_object('ok', true, 'id', oid); end if;
    return jsonb_build_object('ok', false, 'error', 'failed');
  when others then return jsonb_build_object('ok', false, 'error', 'failed');
end; $$;

create or replace function public.public_track(p_kind text, p_id uuid)
returns jsonb language sql security definer stable set search_path = public as $$
  select case
    when p_kind = 'order' then (select jsonb_build_object('kind','order','status',o.status,'paid',o.paid_status,
        'total',o.total,'currency',o.currency,'due',o.due_at,'placed',o.placed_at,'customer',o.customer_name,
        'items',(select jsonb_agg(jsonb_build_object('name',i.name,'qty',i.qty,'line_total',i.line_total)) from order_items i where i.order_id=o.id))
      from orders o where o.id = p_id)
    when p_kind = 'appt' then (select jsonb_build_object('kind','appt','status',a.status,'date',a.appt_date,'time',a.appt_time,
        'customer',a.client_name,'service',(select name from services where id=a.service_id),'currency',(select currency from businesses where id=a.business_id))
      from appointments a where a.id = p_id)
    else null end;
$$;

grant execute on function public.public_business(uuid) to anon, authenticated;
grant execute on function public.public_book(uuid, uuid, text, text, date, time) to anon, authenticated;
grant execute on function public.public_order(uuid, text, text, jsonb, text, uuid) to anon, authenticated;
grant execute on function public.public_track(text, uuid) to anon, authenticated;

-- ---------- EKIPI (llogari të shumta për një biznes, me role) ----------
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  email text not null, role text not null default 'staff' check (role in ('manager','staff')),
  created_at timestamptz not null default now()
);
-- Unik per (biznes, email pa-rast): index unik i vecante (Postgres s'lejon shprehje ne unique() te CREATE TABLE)
create unique index if not exists team_members_biz_email_uniq on public.team_members (business_id, lower(email));
create index if not exists team_business_idx on public.team_members(business_id);
create index if not exists team_email_idx on public.team_members(lower(email));

create or replace function public.is_member(bid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.team_members tm
    where tm.business_id = bid and lower(tm.email) = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;
create or replace function public.is_my_business(bid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.businesses where id = bid and owner_id = auth.uid())
      or public.is_member(bid);
$$;

alter table public.team_members enable row level security;
drop policy if exists "team_owner_all" on public.team_members;
create policy "team_owner_all" on public.team_members for all
  using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()));
drop policy if exists "team_member_read" on public.team_members;
create policy "team_member_read" on public.team_members for select
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));
drop policy if exists "members_read_business" on public.businesses;
create policy "members_read_business" on public.businesses for select
  using (owner_id = auth.uid() or public.is_member(id));

-- =====================================================================
-- Gati! Tabela, kolona, RLS, indeks, trigger, tregti + faqja publike.
-- (Cron-et për kujtesa/win-back/reviews vendosen veç, pasi të jenë funksionet.)
-- =====================================================================
