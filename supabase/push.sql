-- ============================================================
-- WEB PUSH (njoftime në telefon edhe me panelin TË MBYLLUR)
-- Rezervim/porosi/kërkesë/pyetje e re → telefoni i pronarit i bie
-- si WhatsApp. Idempotent: mund ta ekzekutosh sa herë të duash.
-- KËRKON: funksionin 'push' të vendosur (Verify JWT OFF) +
--         sekretet VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT.
-- ============================================================

-- Abonimet push të pajisjeve të pronarit (çdo telefon/kompjuter = 1 rresht)
create table if not exists public.push_subs (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  endpoint     text not null unique,
  p256dh       text not null,
  auth         text not null,
  created_at   timestamptz not null default now()
);

alter table public.push_subs enable row level security;
drop policy if exists "push_owner" on public.push_subs;
create policy "push_owner" on public.push_subs for all
  using (public.is_my_business(business_id))
  with check (public.is_my_business(business_id));

create index if not exists push_biz on public.push_subs (business_id);

-- ============================================================
-- TRIGGER-at: ngjarje e re nga AI/faqja publike → thirr funksionin push
-- (pg_net = asinkron: inserti NUK pret dërgimin — zero vonesë për klientin)
-- ============================================================
create or replace function public.notify_push()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  t_title text; t_body text;
begin
  if tg_table_name = 'appointments' then
    if new.source = 'manual' then return new; end if;  -- veprimet e vetë pronarit s'i bëjnë push vetes
    t_title := '📅 Rezervim i ri';
    t_body  := coalesce(new.client_name, 'Klient') || ' — ' || to_char(new.appt_date, 'DD.MM') || ' ' || to_char(new.appt_time, 'HH24:MI');
  elsif tg_table_name = 'orders' then
    if new.created_by = 'manual' then return new; end if;
    t_title := '🧾 Porosi e re';
    t_body  := coalesce(new.customer_name, 'Klient') || ' — ' || coalesce(new.total::text, '') || ' ' || coalesce(new.currency, '');
  elsif tg_table_name = 'leads' then
    t_title := '📥 Kërkesë e re';
    t_body  := coalesce(new.client_name, 'Klient') || ': ' || left(coalesce(new.summary, ''), 80);
  elsif tg_table_name = 'ai_questions' then
    if new.asked_by = 'owner' then return new; end if;
    t_title := '❓ Pyetje e re — mësoje AI-në';
    t_body  := left(new.question, 90);
  else
    return new;
  end if;

  perform net.http_post(
    url := 'https://mhbrhrsjlxluxvwjhcne.supabase.co/functions/v1/push',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := jsonb_build_object('business_id', new.business_id, 'title', t_title, 'body', t_body)
  );
  return new;
end;
$$;

drop trigger if exists trg_push_appt on public.appointments;
create trigger trg_push_appt after insert on public.appointments
  for each row execute function public.notify_push();

drop trigger if exists trg_push_order on public.orders;
create trigger trg_push_order after insert on public.orders
  for each row execute function public.notify_push();

drop trigger if exists trg_push_lead on public.leads;
create trigger trg_push_lead after insert on public.leads
  for each row execute function public.notify_push();

drop trigger if exists trg_push_aiq on public.ai_questions;
create trigger trg_push_aiq after insert on public.ai_questions
  for each row execute function public.notify_push();
