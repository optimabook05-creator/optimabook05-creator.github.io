# Vendosja — Mbushja automatike e orareve bosh (Faza 2)

Çfarë bën: kur dita është plot, AI fton klientin në **listën e pritjes**. Kur dikush **anulon**, sistemi lajmëron automatikisht klientin e parë në pritje që u lirua një orar. Orari bosh mbushet vetë.

## Hapat (në Supabase)

1. **SQL Editor** → ngjit & ekzekuto skedarin `supabase/waitlist.sql`
   *(krijon tabelën `waitlist` + RLS + triggerin që ndizet kur anulohet një takim)*

2. **Edge Functions** → vendos funksionin e ri **`fill-slot`** (dosja `supabase/functions/fill-slot/`)
   - Pas vendosjes: **Settings → Verify JWT = OFF** (thirret nga databaza)

3. **Edge Functions** → **ri-vendos** funksionin **`chat`** (u përditësua me logjikën e listës së pritjes)

4. **Faqja/Paneli**: bëj push (`git push origin master`) — shtohet skeda **⏳ Lista e pritjes**

## Si ta testosh
1. Mbush një ditë plot (ose blloko oraret), pastaj në Telegram kërko atë ditë → AI ofron listën e pritjes → shkruaj **"po"**.
2. Te paneli, anulo një takim të asaj dite (ose klienti shkruan "anulo").
3. Klienti në pritje merr automatikisht mesazh: *"🎉 U lirua një orar…"*.
4. Te paneli, skeda **Lista e pritjes** e tregon si **"u lajmërua"**.

> Shënim: tani lajmërimi punon për **Telegram** (kanali ynë live). WhatsApp shtohet kur të lidhet (Faza 3) — kodi është gati ta mbështesë.
