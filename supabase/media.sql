-- =====================================================================
-- APEXIFY — MEDIA E ARTIKUJVE (foto, video, linqe)
-- Ekzekuto një herë në Supabase → SQL Editor → Run.
--
-- PSE:
--   Një web designer dërgon linqe të websiteve që ka ndërtuar. Klienti thotë
--   "dua një si ky". Pa këtë kolonë, AI-ja s'ka ide se për çfarë flet klienti.
--   Njësoj: shitësi i makinave ka foto të secilës makinë; klienti sheh një
--   reklamë dhe pyet "a e ke më?". Media e artikullit e mbyll këtë boshllëk.
--
-- FORMATI (jsonb, listë):
--   [{ "type":"image"|"video"|"link", "url":"https://…", "label":"Restorant Bella — faqe moderne, e errët" }]
--   Etiketa (label) është ajo që LEXON AI-ja. Sa më e qartë, aq më mirë
--   e njeh AI-ja se cilit artikull i referohet klienti.
-- =====================================================================

alter table public.services add column if not exists media jsonb;

comment on column public.services.media is
  'Foto/video/linqe të artikullit: [{type,url,label}]. Etiketa lexohet nga AI për të njohur "dua një si ky".';
