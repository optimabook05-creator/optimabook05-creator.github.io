-- =====================================================================
-- OptimaBook — SHTRESA E TREGTISË (commerce): produkte + stok, çmime
-- sipas sasisë (shumicë/pakicë), porosi të strukturuara me cikël jetese
-- (përfshirë porosi që zgjasin muaj: ETA + status), pagesa, monedhë.
-- Kjo e bën OptimaBook të mjaftueshëm për ÇDO biznes: shërbime DHE mallra,
-- të vegjël deri te shumica/prodhuesit. Backward-compatible & idempotent.
-- Ekzekuto te SQL Editor (i sigurt disa herë).
-- =====================================================================

-- ---------- Monedha + ndezja e tregtisë (pronari e ndez kur i duhet) ----------
alter table public.businesses add column if not exists currency text not null default 'EUR';
alter table public.businesses add column if not exists commerce_enabled boolean not null default false;

-- ---------- Katalogu universal: shërbim OSE produkt + inventar ----------
alter table public.services add column if not exists kind        text not null default 'service' check (kind in ('service','product'));
alter table public.services add column if not exists description text;            -- detaje për klientin (p.sh. 199 ml, erë e fortë, përbërës)
alter table public.services add column if not exists sku         text;            -- kodi i produktit (opsional)
alter table public.services add column if not exists track_stock boolean not null default false;
alter table public.services add column if not exists stock       numeric;         -- null = i pakufizuar
alter table public.services add column if not exists unit_label  text;            -- p.sh. 'copë','kg','m','litër'

-- ---------- Çmime sipas sasisë (pronari përcakton shkallët) ----------
-- Shembull: 1 copë = 10€, ≥10 = 8€, ≥100 = 6€  → shumica ndryshon çmimin vetë.
create table if not exists public.price_tiers (
  id          uuid primary key default gen_random_uuid(),
  service_id  uuid not null references public.services(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  min_qty     numeric not null default 1,            -- vlen për sasi >= min_qty
  unit_price  numeric(12,2) not null default 0,
  label       text,                                  -- opsionale: 'pakicë','shumicë'
  created_at  timestamptz not null default now()
);
create index if not exists price_tiers_service_idx on public.price_tiers (service_id, min_qty);

-- ---------- POROSITË (transaksion i strukturuar: shitje, jo takim kalendar) ----------
create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  business_id      uuid not null references public.businesses(id) on delete cascade,
  customer_name    text,
  customer_contact text,
  channel          text,
  chat_id          text,
  order_type       text not null default 'retail'  check (order_type in ('retail','wholesale')),
  status           text not null default 'new'     check (status in ('new','confirmed','in_progress','shipped','delivered','completed','cancelled')),
  placed_at        timestamptz not null default now(),
  due_at           date,                            -- ETA / data e dorëzimit (porosi që zgjasin muaj)
  currency         text not null default 'EUR',
  subtotal         numeric(12,2) not null default 0,
  discount         numeric(12,2) not null default 0,
  total            numeric(12,2) not null default 0,
  paid_status      text not null default 'unpaid'  check (paid_status in ('unpaid','partial','paid')),
  amount_paid      numeric(12,2) not null default 0,
  notes            text,
  created_by       text not null default 'manual'  check (created_by in ('manual','ai')),
  created_at       timestamptz not null default now()
);
create index if not exists orders_business_idx on public.orders (business_id, placed_at desc);
create index if not exists orders_status_idx   on public.orders (business_id, status);
create index if not exists orders_due_idx      on public.orders (business_id, due_at);

-- ---------- Artikujt e porosisë (rreshtat) ----------
create table if not exists public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  service_id  uuid references public.services(id) on delete set null,
  name        text not null,                        -- foto e emrit në momentin e shitjes
  qty         numeric(12,2) not null default 1,
  unit_price  numeric(12,2) not null default 0,
  line_total  numeric(12,2) not null default 0
);
create index if not exists order_items_order_idx    on public.order_items (order_id);
create index if not exists order_items_business_idx on public.order_items (business_id, service_id);

-- ---------- RLS (pronari prek vetëm të vetat) ----------
alter table public.price_tiers enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "own_price_tiers" on public.price_tiers;
create policy "own_price_tiers" on public.price_tiers for all using (public.is_my_business(business_id)) with check (public.is_my_business(business_id));
drop policy if exists "own_orders" on public.orders;
create policy "own_orders" on public.orders for all using (public.is_my_business(business_id)) with check (public.is_my_business(business_id));
drop policy if exists "own_order_items" on public.order_items;
create policy "own_order_items" on public.order_items for all using (public.is_my_business(business_id)) with check (public.is_my_business(business_id));

-- =====================================================================
-- Gati. Katalog universal (shërbim/produkt+stok), çmime sipas sasisë,
-- porosi me cikël jetese + ETA + pagesa. Baza për raporte shitjesh.
-- =====================================================================
