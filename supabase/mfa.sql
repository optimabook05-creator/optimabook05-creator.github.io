-- =====================================================================
-- OptimaBook — Forcim 2FA në nivel BAZE (siguri e vërtetë, jo vetëm UI)
-- Nëse përdoruesi KA 2FA aktiv, çdo qasje në të dhëna kërkon sesion "aal2"
-- (fjalëkalim + kod). Përdoruesit PA 2FA s'preken fare.
-- Zbatohet te is_my_business() → mbron automatikisht ÇDO tabelë me RLS.
-- Funksionet Edge (chat etj.) përdorin service-role → s'preken.
-- Ekzekuto te SQL Editor (idempotent). Kërkon që is_member/is_my_business
-- të ekzistojnë tashmë (SETUP-ALL.sql).
-- =====================================================================

-- A është sesioni i pranueshëm? aal2, OSE përdoruesi s'ka fare 2FA të aktivizuar.
create or replace function public.aal_ok()
returns boolean language sql security definer stable set search_path = public as $$
  select coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
      or not exists (
        select 1 from auth.mfa_factors f
        where f.user_id = auth.uid() and f.status = 'verified'
      );
$$;

create or replace function public.is_my_business(bid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select public.aal_ok()
     and ( exists (select 1 from public.businesses where id = bid and owner_id = auth.uid())
           or public.is_member(bid) );
$$;

-- =====================================================================
-- Gati. (Shënim: politika "team_owner_all"/"businesses" me kontroll direkt
-- owner_id mbeten aal1 — mbulojnë vetëm listën e biznesit/ekipit, jo të dhënat.)
-- =====================================================================
