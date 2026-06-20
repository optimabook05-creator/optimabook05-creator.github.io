-- =====================================================================
-- OptimaBook — Koha e dorëzimit për shërbime/produkte (mënyra 'porosi')
-- P.sh. "Web 1-3 faqe = 100€, dorëzim ~13 ditë". Te bizneset me takime
-- kjo fushë nuk përdoret (përdoret duration_min). Ekzekuto te SQL Editor.
-- =====================================================================

alter table public.services add column if not exists delivery text;

-- =====================================================================
-- Gati.
-- =====================================================================
