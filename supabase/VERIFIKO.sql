-- =====================================================================
-- APEXIFY — VERIFIKIMI I BAZËS SË TË DHËNAVE
--
-- PSE EKZISTON: skedarët SQL ekzekutohen ME DORË te SQL Editor-i. Nëse
-- njëri harrohet, ASGJË nuk të njofton — tabela mungon, kolona mungon,
-- ose roja kundër rezervimit të dyfishtë s'ekziston, dhe e merr vesh
-- vetëm kur një klient i vërtetë humbet. Kjo pyetje e thotë me zë të lartë.
--
-- ËSHTË VETËM LEXIM. Nuk shkruan, nuk fshin, nuk ndryshon asgjë.
-- (Nëse del gabim "relation cron.job does not exist" — kjo VETË është
--  përgjigjja: pg_cron s'është instaluar, pra ekzekuto supabase/cron.sql.)
-- Ngjite te Supabase → SQL Editor → Run. Lexo kolonën "gjendja".
-- Çdo ❌ është një skedar SQL që duhet ekzekutuar.
-- =====================================================================

with

-- ---------- 1) SIGURIA: RLS mbi çdo tabelë ----------
rls as (
  select 1 as rend, 'SIGURIA' as kategoria,
         'RLS te tabela "' || c.relname || '"' as kontrolli,
         case when c.relrowsecurity
              then '✅ ndezur'
              else '❌ FIKUR — të dhënat e klientëve të ekspozuara publikisht'
         end as gjendja
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
),

-- ---------- 2) REZERVIMET: mbrojtja kundër rezervimit të dyfishtë ----------
booking as (
  select 2, 'REZERVIMET',
         'Indeksi unik "appts_slot_uniq" (dy klientë s''marrin dot të njëjtin orar)',
         case when exists (select 1 from pg_indexes
                           where schemaname = 'public' and indexname = 'appts_slot_uniq')
              then '✅ ekziston'
              else '❌ MUNGON — ekzekuto supabase/booking-race.sql'
         end
  union all
  select 2, 'REZERVIMET',
         'public_book përdor bllokim transaksioni (pg_advisory_xact_lock)',
         case when exists (select 1 from pg_proc p
                           join pg_namespace n on n.oid = p.pronamespace
                           where n.nspname = 'public' and p.proname = 'public_book'
                             and p.prosrc like '%advisory%')
              then '✅ i mbrojtur'
              else '❌ I PAMBROJTUR — ekzekuto supabase/booking-race.sql'
         end
  union all
  select 2, 'REZERVIMET',
         'public_order pranon çelës idempotence (p_idem) — kundër porosisë së dyfishtë',
         case when exists (select 1 from pg_proc p
                           join pg_namespace n on n.oid = p.pronamespace
                           where n.nspname = 'public' and p.proname = 'public_order'
                             and pg_get_function_arguments(p.oid) like '%p_idem%')
              then '✅ po'
              else '❌ JO — ekzekuto supabase/bundle-rules.sql'
         end
),

-- ---------- 3) FUNKSIONET publike që përdor faqja ----------
fn as (
  select 3, 'FUNKSIONET',
         'Funksioni "' || x.want || '"',
         case when exists (select 1 from pg_proc p
                           join pg_namespace n on n.oid = p.pronamespace
                           where n.nspname = 'public' and p.proname = x.want)
              then '✅ ekziston'
              else '❌ MUNGON — faqja publike do të dështojë'
         end
  from (values ('public_business'), ('public_book'), ('public_order'),
               ('public_track'), ('aal_ok'), ('is_my_business'), ('notify_push')) as x(want)
),

-- ---------- 4) KOLONAT që shtojnë skedarët e mëvonshëm ----------
cols as (
  select 4, 'KOLONAT',
         'Kolona ' || x.tbl || '.' || x.col,
         case when exists (select 1 from information_schema.columns
                           where table_schema = 'public'
                             and table_name = x.tbl and column_name = x.col)
              then '✅ ekziston'
              else '❌ MUNGON — një skedar SQL s''është ekzekutuar'
         end
  from (values
    ('businesses','timezone'), ('businesses','mode'), ('businesses','config'),
    ('businesses','telegram_token'), ('businesses','wa_phone_id'),
    ('businesses','ai_notes'), ('businesses','linguistic_profile'),
    ('businesses','review_url'), ('businesses','currency'), ('businesses','commerce_enabled'),
    ('appointments','channel'), ('appointments','chat_id'), ('appointments','reminded'),
    ('appointments','review_requested'), ('appointments','staff_id'), ('appointments','location_id'),
    ('orders','idempotency_key'), ('order_items','cost'), ('time_blocks','staff_id'),
    ('services','sku'), ('services','stock'), ('services','track_stock'), ('services','variants'),
    ('services','addons'), ('services','media'), ('services','kind'), ('services','cost'),
    ('services','delivery'), ('services','bookable'), ('services','hidden_fields'),
    ('services','duration_unit'), ('services','duration_value'), ('services','unit_label'),
    ('services','description'), ('services','price_updated_at')
  ) as x(tbl, col)
),

-- ---------- 5) AUTOMATIZIMI: punët periodike ----------
autom as (
  select 5, 'AUTOMATIZIMI',
         'Zgjerimi pg_cron',
         case when exists (select 1 from pg_extension where extname = 'pg_cron')
              then '✅ i instaluar'
              else '❌ MUNGON — kujtesat s''nisen kurrë'
         end
  union all
  select 5, 'AUTOMATIZIMI',
         'Punë periodike të planifikuara (kujtesa / dita ime / winback / vlerësime)',
         coalesce(
           (select case when count(*) = 0
                        then '❌ ASNJË — ekzekuto supabase/cron.sql dhe digest.sql'
                        else '✅ ' || count(*)::text || ': ' || string_agg(jobname, ', ')
                   end
            from cron.job),
           '❌ s''lexohet dot cron.job')
),

-- ---------- 6) TË DHËNAT reale (a ka klientë ende?) ----------
dt as (
  select 6, 'TË DHËNAT', 'Biznese të regjistruara',   coalesce((select count(*)::text from public.businesses),  '?')
  union all
  select 6, 'TË DHËNAT', 'Shërbime/produkte',         coalesce((select count(*)::text from public.services),    '?')
  union all
  select 6, 'TË DHËNAT', 'Takime',                    coalesce((select count(*)::text from public.appointments),'?')
  union all
  select 6, 'TË DHËNAT', 'Porosi',                    coalesce((select count(*)::text from public.orders),      '?')
  union all
  select 6, 'TË DHËNAT', 'Kërkesa (leads)',           coalesce((select count(*)::text from public.leads),       '?')
  union all
  select 6, 'TË DHËNAT', 'Pajisje me njoftime push',  coalesce((select count(*)::text from public.push_subs),   '?')
  union all
  select 6, 'TË DHËNAT', 'Pyetje pa përgjigje (AI)',  coalesce((select count(*)::text from public.ai_questions),'?')
  union all
  /* Nëse ky është 0, webhook-u i Telegram-it S'ËSHTË i regjistruar: bot-i
     ekziston, por Telegram-i s'i dërgon kurrë mesazhet te funksioni ynë.
     Nga jashtë duket sikur gjithçka punon — dhe asnjë klient s'merr përgjigje. */
  select 6, 'TË DHËNAT',
         'Mesazhe Telegram të mbërritura ndonjëherë (0 = webhook-u JO i regjistruar)',
         coalesce((select count(*)::text from public.processed_updates), '?')
  union all
  select 6, 'TË DHËNAT', 'Biseda të ruajtura (messages)', coalesce((select count(*)::text from public.messages), '?')
)

select kategoria, kontrolli, gjendja
from (
  select * from rls
  union all select * from booking
  union all select * from fn
  union all select * from cols
  union all select * from autom
  union all select * from dt
) t
-- Problemet lart: ai që kërkon punë duhet parë i pari.
order by (gjendja like '❌%') desc, rend, kontrolli;
