-- =====================================================================
-- OptimaBook — FAQJA PUBLIKE (rezervim/porosi pa llogari)
-- Qasje publike e SIGURT nëpërmjet funksioneve SECURITY DEFINER:
--   • public_business(bid)  → vetëm fusha të sigurta (PA token/owner) + shërbimet + orari + oraret e zëna
--   • public_book(...)      → krijon takim (mbron dyfishimin nga indeksi unik)
--   • public_order(...)     → krijon porosi; çmimet llogariten NË SERVER (s'i beson klientit)
-- Anon NUK lexon dot tabelat drejtpërdrejt — vetëm këto funksione të kuruara.
-- Ekzekuto te SQL Editor (idempotent).
-- =====================================================================

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
        'description', s.description, 'unit_label', s.unit_label, 'addons', s.addons,
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
declare new_id uuid;
begin
  if bid is null or p_date is null or p_time is null then return jsonb_build_object('ok', false, 'error', 'missing'); end if;
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

create or replace function public.public_order(bid uuid, p_name text, p_contact text, p_items jsonb, p_notes text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare oid uuid; sub numeric := 0; cur text; r record; sid uuid; q numeric; up numeric; ar record; ap numeric;
begin
  if bid is null then return jsonb_build_object('ok', false, 'error', 'missing'); end if;
  select currency into cur from businesses where id = bid;
  insert into orders (business_id, customer_name, customer_contact, status, currency, created_by, channel, notes)
  values (bid, left(coalesce(nullif(trim(p_name),''),'Web'),60), left(coalesce(p_contact,''),60), 'new', coalesce(cur,'EUR'), 'manual', 'web', left(coalesce(p_notes,''),200))
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
  if sub = 0 then
    delete from orders where id = oid;
    return jsonb_build_object('ok', false, 'error', 'no_items');
  end if;
  update orders set subtotal = sub, total = sub where id = oid;
  insert into notifications (business_id, text) values (bid, '🌐 Porosi e re nga faqja online: ' || coalesce(p_name,'klient'));
  return jsonb_build_object('ok', true, 'id', oid);
exception when others then
  return jsonb_build_object('ok', false, 'error', 'failed');
end; $$;

-- Portal klienti: gjurmim i një porosie/takimi me ID (UUID i rastësishëm = token i sigurt)
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
grant execute on function public.public_order(uuid, text, text, jsonb, text) to anon, authenticated;
grant execute on function public.public_track(text, uuid) to anon, authenticated;

-- =====================================================================
-- Gati. Faqja publike (book.html) thërret këto funksione me anon key.
-- =====================================================================
