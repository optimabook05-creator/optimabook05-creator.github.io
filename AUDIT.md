# OptimaBook — Auditim teknik i nivelit botëror

> Ekzaminim i ndershëm i kodit real, me gabime konkrete + rregullime. I renditur sipas rëndësisë. Qëllimi: ta çojmë nga "bazë e fortë" → "i klasit botëror".
> **E vërteta:** "i pamundur për t'u përmirësuar" s'ekziston në softuer. Por kjo listë e bën **vërtet world-class.**

---

## 🔴 P0 — Kritike (korrektësi + siguri). Duhen para çdo klienti real.

### P0-1. Double-booking nën garë (race condition) — XHEVAHIRI s'është i mbrojtur sa duhet
**Ku:** `doBook` te `chat/index.ts` — kontrollon `freeSlotsUnion` pastaj `insert`. Mes kontrollit dhe insert-it **NUK ka atomicitet.** Dy kërkesa në të njëjtin çast mund të kalojnë të dyja kontrollin → **dy takime në të njëjtin orar/staf.**
**Fix (niveli Apple):** kufizim në VETË databazën — Postgres `EXCLUDE USING gist` mbi (staff_id, tstzrange(start,end)) → databaza e bën **fizikisht të pamundur** mbivendosjen, edhe nën garë. Kjo është mbrojtja e vërtetë; re-check-u në kod është vetëm shtresë e parë.

### P0-2. Timezone — i gjithë sistemi llogarit në UTC, jo në orën e biznesit
**Ku:** `new Date()`, `fmtDate(new Date())`, `nowM` te `freeSlots` — funksioni Deno punon në **UTC**. Për Shqipërinë (UTC+1/+2), "sot/nesër" dhe "a është orari në të shkuarën" janë **gabim 1–2 orë.** Afër mesnatës, "nesër" mund të jetë dita e gabuar; mund të ofrohen orare të kaluara.
**Fix:** shto `businesses.timezone` (p.sh. "Europe/Tirane"); të gjitha llogaritjet e datës/orës me timezone-in e biznesit. Kritike për produkt global.

### P0-3. Funksioni `chat` është publik pa autentikim → abuzim
**Ku:** `chat` ka Verify JWT OFF dhe thirret me publishable key. Kushdo mund të bëjë POST me çdo `business_id`/`chat_id` → të **rezervojë spam, të anulojë takime të të tjerëve** (nëse di chat_id), ose të **shterojë kuotën e AI-së (sulm kostoje).**
**Fix:** (a) sekret i përbashkët mes funksioneve kanal↔chat (header `x-internal-secret`); (b) rate limiting për (business_id, chat_id); (c) validim që chat_id-ja i përket kanalit thirrës.

### P0-4. Webhook pa idempotency → dublime
**Ku:** `telegram`/`whatsapp` — Telegram/Meta **ridërgojnë** të njëjtin update kur s'marrin 200 shpejt. Pa dedup nga `update_id`/`message_id`, i njëjti mesazh mund të përpunohet **dy herë** → dy përgjigje / dy rezervime.
**Fix:** tabelë `processed_updates` ose kontroll i `update_id` para përpunimit.

---

## 🟠 P1 — Lartë (besueshmëri + cilësi)

### P1-1. Thirrjet AI pa timeout/retry
`askGemini/askOpenAI` përdorin `fetch` pa timeout → mund të **ngrijnë** dhe të bllokojnë përgjigjen. **Fix:** `AbortController` me timeout 8–10s + 1 retry + fallback.

### P1-2. `buildAvailability` bën N+1 query (ngadalë + ngarkesë)
**Ku:** loop 10 ditë × `busyFor` (2 query secila) = **~20 query** për çdo thirrje AI. **Fix:** një query e vetme për gjithë intervalin 10-ditor (appts + blocks), pastaj grupim në kujtesë. Ul latencën dhe ngarkesën dramatikisht.

### P1-3. FSM jo rigoroze + mungon `awaiting_confirm` → "Po" dështon
Vetëm 2 hapa (idle/awaiting_time). Konfirmimi "Po" s'ka gjendje → AI gabon. **Fix:** FSM eksplicit `IDLE→SERVICE→DATE→TIME→CONFIRM→BOOKED` me tabelë transitionsh.

### P1-4. Gjendja i jepet LLM-së si tekst, jo JSON
**Fix (rekomandim i konsulentit):** dërgo `{ state:{intent,service,date,time,step}, parsed:{...}, message:"..." }` → edhe model mesatar performon shumë më mirë.

### P1-5. Zero observability/metrics
S'matet rule% vs AI% vs success/fail/abandoned. **Fix:** logo `via` + rezultatin në një tabelë `chat_events`; panel metrikash.

### P1-6. `esc()` mbron vetëm `&` dhe `<` (rrezik XSS në panel)
**Ku:** `optima-app.js` — emrat e klientëve/shërbimeve futen me innerHTML. **Fix:** shto `>`, `"`, `'` te `esc()`; ose përdor `textContent`/`createElement` kudo.

### P1-7. Availability përdor `minDur` për të gjitha shërbimet
Oraret e ofruara AI-së llogariten me shërbimin më të shkurtër → mund të tregojë orare që s'janë realisht të lira për një shërbim më të gjatë. **Fix:** llogarit availability për shërbimin konkret kur dihet.

---

## 🟡 P2 — Mesatare (shkallëzim + pastërti)

- **P2-1. Orari i punës është i biznesit, jo per-staf** — stafi s'ka orare individuale. Shto `working_hours.staff_id`.
- **P2-2. Pastrim i të dhënave të vjetra** — `conversation_state`, `waitlist` (entries "waiting" s'skadojnë kurrë), `winback_log` rriten pakufi. Shto cron pastrimi / `expires_at`.
- **P2-3. Pa kufi gjatësie input-i** — mesazh gjigant → kosto AI/DB. Shto limit (p.sh. 1000 karaktere).
- **P2-4. GDPR** — `messages`/`conversation_state` ruajnë PII pa enkriptim/politikë mbajtjeje. Para lançimit: retention + e drejtë fshirjeje.
- **P2-5. Parser edge cases** — `2026` mund të lexohet 20:26; `parseService` fuzzy i dobët. Shto kufij plausibiliteti + scoring më të mirë.
- **P2-6. Booking pa `end_time`** — kohëzgjatja varet nga shërbimi; nëse fshihet shërbimi, humbet. Ruaj `duration_min` te vetë takimi.

---

## 🟢 P3 — Polish (drejt përsosjes)

- **P3-1. Eval/test-suite** — 50+ biseda reale (slang, gabime, multi-turn) që ekzekutohen automatikisht para çdo deploy.
- **P3-2. Few-shot examples** në prompt (input→output) — rrit konsistencën.
- **P3-3. Loading/error states** në panel + retry.
- **P3-4. Prompt më i shkurtër** — vetëm dita relevante, jo 10 ditë → më pak tokens, më fokus.
- **P3-5. CI/lint** — Deno lint/test në GitHub Actions.

---

## Përparësia e ekzekutimit (rekomandimi im)
1. **P0-1 (DB no-overlap)** + **P0-2 (timezone)** — pa këto, dështon te klienti i parë real.
2. **P0-3/P0-4 (siguri/idempotency)** — para se ta dijë publiku.
3. **P1 (FSM rigoroze + JSON state + timeout + N+1 + metrics)** — cilësi + besueshmëri.
4. **P2/P3** — shkallëzim + përsosje.

**E vërteta:** arkitektura bazë është e fortë (e konfirmuar). Këto gjetje s'janë "beginner mistakes" — janë **shtresa e dytë e pjekurisë** që çdo sistem serioz i kalon nga "punon" → "i pathyeshëm në shkallë globale".
