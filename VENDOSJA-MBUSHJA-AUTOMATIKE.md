# Vendosja — Faza 2 (veçoritë "punonjës i mirë")

Tre veçori të reja (plani Pro): **mbushja automatike e orareve bosh**, **rikthimi i klientëve të humbur**, **vlerësime Google automatike**.

> Të gjitha lajmërimet tani punojnë për **Telegram** (kanali ynë live). WhatsApp shtohet kur të lidhet (Faza 3) — kodi është gati.

## Hapat në Supabase (një herë)

### 1. SQL Editor — ekzekuto këto 3 skedarë
- `supabase/waitlist.sql` → tabela `waitlist` + RLS + triggeri që ndizet kur anulohet një takim
- `supabase/winback.sql` → tabela `winback_log` + cron ditor (10:00 UTC)
- `supabase/reviews.sql` → shton `businesses.review_url` + `appointments.review_requested` + cron ditor (11:00 UTC)

### 2. Edge Functions — vendos 3 funksione të reja (Verify JWT = OFF te secili)
- `fill-slot`  (dosja `supabase/functions/fill-slot/`)
- `winback`    (dosja `supabase/functions/winback/`)
- `reviews`    (dosja `supabase/functions/reviews/`)

### 3. Edge Functions — ri-vendos funksionin ekzistues
- `chat` (u përditësua me logjikën e listës së pritjes)

### 4. Frontend — bëj push
`git push origin master` → del skeda **⏳ Lista e pritjes** + fusha **⭐ Linku i vlerësimeve Google** te Statistikat.

## Si t'i provosh

**Mbushja automatike:** mbush një ditë plot → në Telegram kërko atë ditë → AI ofron listën e pritjes → shkruaj "po". Pastaj anulo një takim të asaj dite → klienti në pritje merr menjëherë "🎉 U lirua një orar…".

**Vlerësime:** te paneli (Statistika) vendos linkun e Google → ditën pas një takimi, klienti merr kërkesën për vlerësim.

**Rikthim:** ndodh vetë — klientët pa ardhur prej > 60 ditësh (pa takim të ardhshëm) marrin një ftesë miqësore. (Mund ta ndryshosh me secret-in `WINBACK_DAYS`.)

## Cilësime opsionale (Edge Function secrets)
- `WINBACK_DAYS` — sa ditë pa ardhur quhet "i humbur" (parazgjedhje 60)
