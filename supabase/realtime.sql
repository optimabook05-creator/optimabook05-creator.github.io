-- ============================================================
-- REALTIME (Faza 2) — paneli merr ndryshimet LIVE, pa rifreskim
-- Shton tabelat e panelit në publikimin e Supabase Realtime.
-- Idempotent: mund ta ekzekutosh sa herë të duash pa dëm.
-- SIGURIA: RLS vlen edhe për Realtime — çdo pronar merr VETËM
-- rreshtat e bizneseve të veta (is_my_business), si kudo tjetër.
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array[
    'appointments', 'orders', 'order_items', 'time_blocks',
    'messages', 'waitlist', 'leads', 'notifications', 'ai_questions'
  ] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception
      when duplicate_object then null;   -- tashmë e shtuar → në rregull
      when undefined_table then null;    -- tabela opsionale mungon → kapërce
    end;
  end loop;
end $$;
