-- ============================================================
-- OptimaBook — RREGULLAT E PAKETIMIT (shtesa me kushte)
-- Rifreskon funksionin public_order me mbeshtetjen per:
--   "nga 3 cope transporti FALAS"  (when.qty  + then=free)
--   "nga 10 cope paketimi i DETYRUESHEM" (when.qty + then=required)
--   "mbi 500EUR montimi falas"     (when.total + then=free)
-- Shtesat pa rregull sillen SAKTESISHT si me pare (prapa-perputhshem).
-- I sigurt te ekzekutohet sa here te duash.
-- ============================================================

drop function if exists public.public_order(uuid, text, text, jsonb, text);
create or replace function public.public_order(bid uuid, p_name text, p_contact text, p_items jsonb, p_notes text, p_idem uuid default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare oid uuid; sub numeric := 0; cur text; r record; sid uuid; q numeric; up numeric; ar record; ap numeric; recent int;
        lt numeric; a_req boolean; a_then text; a_qthr numeric; a_tthr numeric;
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
    lt := q * up;   -- vlera e rreshtit → për kushtet e tipit "mbi 500€"
    -- Shtesat: të detyrueshme gjithmonë + opsionalet e zgjedhura nga klienti (çmimi merret nga baza, jo nga klienti)
    for ar in select value as av from jsonb_array_elements(coalesce((select addons from services where id = sid), '[]'::jsonb)) loop
      /* RREGULLAT E PAKETIMIT — pasqyrë EKZAKTE e OB.resolveAddons (core.js).
         Nëse këto dy divergjojnë, klienti sheh një çmim dhe paguan një tjetër.
         Pragjet lexohen VETËM nëse janë numra të vlefshëm (një varg si "abc"
         do të rrëzonte gjithë porosinë me gabim cast-i). */
      a_req  := coalesce((ar.av->>'required')::boolean, false);
      ap     := coalesce((ar.av->>'price')::numeric, 0);
      a_then := ar.av->>'then';
      a_qthr := case when (ar.av->'when'->>'qty')   ~ '^[0-9]+(\.[0-9]+)?$' then (ar.av->'when'->>'qty')::numeric   else null end;
      a_tthr := case when (ar.av->'when'->>'total') ~ '^[0-9]+(\.[0-9]+)?$' then (ar.av->'when'->>'total')::numeric else null end;
      if a_then is not null and ((a_qthr is not null and q >= a_qthr) or (a_tthr is not null and lt >= a_tthr)) then
        if a_then = 'required' then a_req := true; end if;
        if a_then = 'free'     then ap := 0;       end if;
      end if;
      if a_req or (coalesce(r.v->'addons','[]'::jsonb) ? (ar.av->>'name')) then
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
