-- =====================================================================
-- OptimaBook — Analytics minimal me Supabase (pa Google, pa cookies)
-- Faqja publike dërgon një "beacon" anonim për çdo vizitë → tabela page_views.
-- Vetëm INSERT nga anon (askush s'lexon dot via API); ti i sheh te SQL Editor.
-- Ekzekuto te SQL Editor (idempotent).
-- =====================================================================

create table if not exists public.page_views (
  id bigint generated always as identity primary key,
  path text, ref text, lang text, w int,
  created_at timestamptz not null default now()
);

alter table public.page_views enable row level security;
drop policy if exists "anon_insert_views" on public.page_views;
create policy "anon_insert_views" on public.page_views for insert to anon with check (true);
-- (asnjë policy SELECT → të dhënat lexohen vetëm nga ti në dashboard)

create index if not exists page_views_time_idx on public.page_views (created_at);

-- =====================================================================
-- Shembuj raportesh (pas grumbullimit):
--   Vizita sot:    select count(*) from page_views where created_at > current_date;
--   Nga vijnë:     select ref, count(*) from page_views group by ref order by 2 desc limit 10;
--   Faqet:         select path, count(*) from page_views group by path order by 2 desc;
-- =====================================================================
