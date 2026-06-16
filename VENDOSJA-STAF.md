# Vendosja — Staf i shumtë + Lokacione (Faza 5)

Çfarë bën: bizneset e mëdha shtojnë staf dhe lokacione. Çdo person pret klientë **paralelisht** — p.sh. 3 berberë mund të kenë 3 klientë në të njëjtën orë. AI-ja zgjedh vetë një person të lirë kur rezervon. Bizneset me një person punojnë **njësoj si më parë** (prapa-përputhshëm).

## Hapat

1. **SQL Editor** → ekzekuto `supabase/enterprise.sql`
   *(krijon tabelat `locations` + `staff`, shton `staff_id`/`location_id` te takimet dhe `staff_id` te bllokimet, me RLS)*

2. **Edge Functions** → **ri-vendos** këto (u bënë staf-i-vetëdijshme):
   - `chat` (rezervon te një staf i lirë, kapacitet paralel)
   - `fill-slot` (zbulon saktë orarin e liruar të një stafi)

3. **Frontend** → bëj push → del skeda **👥 Stafi** + filtri i stafit te Kalendari + zgjedhja e stafit te takimi manual.

## Si ta provosh
1. Te paneli → skeda **👥 Stafi** → shto 2 persona (p.sh. "Toni", "Eri").
2. Te Kalendari del një filtër stafi (lart djathtas) — zgjidh personin për të parë ditën e tij.
3. Në Telegram rezervo dy klientë në të njëjtën orë → AI i vendos te dy persona të ndryshëm (s'mbivendosen).
4. Takimi manual: zgjedh personin; oraret e lira janë sipas tij.

> Shënim: në këtë version oraret e punës janë të përbashkëta (të biznesit). Oraret e veçanta për çdo staf (p.sh. dikush punon vetëm pasdite) vijnë në një hap të ardhshëm. Bllokimet mund të jenë për gjithë biznesin ose, më vonë, për një person.
