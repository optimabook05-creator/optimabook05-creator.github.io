-- ============================================================
-- RRETHI I MËSIMIT (learning loop)
-- Pyetjet faktike që AI s'i përgjigj dot nga të dhënat → ruhen këtu.
-- Pronari i përgjigjet NJË herë në panel → AI e di PËRGJITHMONË.
-- Idempotent: mund ta ekzekutosh sa herë të duash pa dëm.
-- ============================================================
create table if not exists public.ai_questions (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  question     text not null,
  answer       text,
  status       text not null default 'open',   -- open | answered | dismissed
  asked_by     text,                            -- kanali (telegram/whatsapp/web/demo)
  times_asked  int  not null default 1,         -- sa herë e kanë pyetur klientët
  created_at   timestamptz not null default now(),
  answered_at  timestamptz
);

alter table public.ai_questions enable row level security;
drop policy if exists "aiq_owner" on public.ai_questions;
create policy "aiq_owner" on public.ai_questions for all
  using (public.is_my_business(business_id))
  with check (public.is_my_business(business_id));
-- (Funksioni chat shkruan me service-role → i pa-ndikuar nga RLS, si kudo.)

create index if not exists aiq_biz_status on public.ai_questions (business_id, status);

-- Realtime: pyetja e re i shfaqet pronarit VETË në panel (si rezervimet)
do $$ begin
  execute 'alter publication supabase_realtime add table public.ai_questions';
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
