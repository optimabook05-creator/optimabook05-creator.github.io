-- =====================================================================
-- OptimaBook — "Info për AI-në" (knowledge-base v0) + profili gjuhësor
-- Ekzekuto te SQL Editor (idempotent).
--
-- ai_notes: pronari shkruan paketa/çmime/kohë dorëzimi/politika/FAQ →
--           AI-ja i di dhe ua thotë klientëve (pa i rezervuar si slote).
--           P.sh. për një web designer: "Web 1-3 faqe = 100€, ~13 ditë."
-- linguistic_profile: kujtesë e stilit të të folurit (për të ardhmen).
-- =====================================================================

alter table public.businesses add column if not exists ai_notes text;
alter table public.businesses add column if not exists linguistic_profile jsonb;

-- =====================================================================
-- Gati. "Info për AI-në" + profili gjuhësor.
-- =====================================================================
