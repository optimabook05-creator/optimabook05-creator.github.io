-- =====================================================================
-- APEXIFY — MBROJTJA NGA REZERVIMI I DYFISHTË (race condition)
-- Ekzekuto një herë: Supabase → SQL Editor → Run.
--
-- PROBLEMI I GJETUR NË AUDITIM:
--   Të dyja rrugët e rezervimit lexojnë oraret e zëna, vendosin se ora është e
--   lirë, dhe pastaj shkruajnë — pa asnjë bllokim mes dy hapave:
--     • faqja publike : public.public_book (public.sql)
--     • AI-ja         : supabase/functions/chat/index.ts (bookAppointment)
--   Dy klientë që shtypin "rezervo" në të njëjtin çast lexojnë TË DY "e lirë"
--   dhe shkruajnë TË DY. Rezultati: dy klientë në të njëjtin orar.
--
--   Komenti te public.sql:5 thoshte "mbron dyfishimin nga indeksi unik" —
--   POR ai indeks nuk ekzistonte askund. `exception when unique_violation`
--   nuk aktivizohej kurrë. Mbrojtja ishte vetëm në letër.
--
-- ÇFARË BËN KY SKEDAR:
--   1) Indeks UNIK: e njëjta orë, i njëjti staf, i njëjti biznes → e pamundur.
--      Vepron te baza, pra mbron ÇDO rrugë njëherësh (AI, web, panel, e ardhme).
--   2) Bllokim këshillues në public_book: dy kërkesa për të njëjtin biznes+ditë
--      radhiten, pra edhe MBIVENDOSJET (orare të ndryshme që përplasen) kapen.
--
-- ÇFARË NUK MBULON:
--   Mbivendosjet në rrugën e AI-së (orare të ndryshme që përplasen, p.sh. 10:00
--   për 60 min dhe 10:30 për 30 min). Ato mbrohen te kodi, me verifikim pas
--   shkrimit. Shih koment te chat/index.ts.
-- =====================================================================

-- Takimet e anuluara nuk e zënë orarin → jashtë indeksit.
-- coalesce për staff_id: bizneset me një person kanë staff_id null.
create unique index if not exists appts_slot_uniq
  on public.appointments (
    business_id,
    appt_date,
    appt_time,
    coalesce(staff_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
  where status <> 'cancelled';

comment on index public.appts_slot_uniq is
  'Nje orar = nje takim (per staf). Mbron nga rezervimi i dyfishte ne cdo rruge.';

-- Bllokim këshillues: serializon rezervimet për të njëjtin biznes + ditë.
-- Mbahet deri në fund të transaksionit; kërkesat e tjera presin, nuk dështojnë.
create or replace function public.public_book(bid uuid, p_service uuid, p_name text, p_phone text, p_date date, p_time time)
returns jsonb language plpgsql security definer set search_path = public as $$
declare new_id uuid; ndur int; cap int; noverlap int; recent int;
begin
  if bid is null or p_date is null or p_time is null then return jsonb_build_object('ok', false, 'error', 'missing'); end if;

  -- SERIALIZIMI: nga këtu e deri në fund të transaksionit, vetëm një kërkesë
  -- për këtë biznes+ditë ecën. Pa të, kontrolli i mbivendosjes më poshtë është
  -- "lexo pastaj shkruaj" — dhe dy kërkesa paralele e kalojnë të dyja.
  perform pg_advisory_xact_lock(hashtext(bid::text || p_date::text));

  select count(*) into recent from appointments where business_id = bid and channel = 'web' and created_at > now() - interval '1 minute';
  if recent >= 20 then return jsonb_build_object('ok', false, 'error', 'rate'); end if;

  select coalesce(duration_min, 30) into ndur from services where id = p_service;
  ndur := coalesce(ndur, 30);
  select greatest(1, count(*)) into cap from staff where business_id = bid and active;

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

grant execute on function public.public_book(uuid, uuid, text, text, date, time) to anon, authenticated;
