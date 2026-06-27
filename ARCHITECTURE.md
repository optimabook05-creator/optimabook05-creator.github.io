# OptimaBook — Arkitektura e Plotë (nga fillimi në fund)

> Dokument për konsultim teknik. Përshkruan çdo komponent, të dhënat, sigurinë, AI-në, kanalet, deploy-in, testimin, gjendjen reale dhe rreziqet. I përditësuar: 2026-06-27.

---

## 1. Çfarë është
**OptimaBook** = recepsionist AI + menaxhues biznesi (SaaS, multi-tenant) për **çdo lloj biznesi**. Klienti i biznesit shkruan në kanalin e tij të zakonshëm (Telegram/WhatsApp) → një AI i kupton, përgjigjet, rezervon takime ose merr porosi/kërkesa, 24/7, në çdo gjuhë. Pronari menaxhon gjithçka nga një panel web. **Çdo biznes ka AI-në e vet, plotësisht të izoluar.**

Dy mënyra biznesi:
- **appointments** — biznese me takime (berber, klinikë, fizio…): AI gjen orare reale dhe rezervon.
- **inquiry** — biznese me produkte/porosi (parfumeri, dyqan…): AI përgjigjet për produktet dhe kap kërkesa (leads).
- **both** — të dyja.

---

## 2. Stack-u teknologjik
| Shtresa | Teknologjia | Pse |
|---|---|---|
| Frontend | **HTML/CSS/JS i pastër (pa build)** | Zero kompleksitet, host falas, deploy = `git push` |
| Hosting | **GitHub Pages** (statik) | Falas, CDN global |
| Aplikacion | **PWA** (manifest + Service Worker) | Instalueshëm, offline, ngarkim i menjëhershëm |
| Backend | **Supabase** | Postgres + Auth + Edge Functions, të menaxhuara |
| Bazë të dhënash | **PostgreSQL** (me Row Level Security) | Izolim i fortë multi-tenant |
| Autentikim | **Supabase Auth** (email/password) | Standard, i sigurt |
| Logjika serverless | **Edge Functions (Deno / TypeScript)** | AI, kanalet, automatizimet |
| AI | **Google Gemini** (`gemini-2.5-flash-lite`); ose OpenAI (opsional) | Model-agnostik, kosto e ulët |
| Kanalet | **Telegram Bot API**, **WhatsApp Cloud API (Meta)** | Aty ku janë klientët |
| CI | **GitHub Actions** (teste node:test) | Cilësi e garantuar |

---

## 3. Diagrami i arkitekturës (i lartë)

```
            ┌──────────────────────────────────────────────────────────┐
            │                       KLIENTI FUNDOR                        │
            │            (shkruan në Telegram / WhatsApp)                 │
            └───────────────┬─────────────────────────┬─────────────────┘
                            │                          │
                   webhook?business_id=X      webhook?business_id=Y
                            ▼                          ▼
            ┌──────────────────────────────────────────────────────────┐
            │   EDGE FUNCTIONS (Deno)  ·  Supabase                       │
            │   telegram / whatsapp  ──►  chat (TRURI AI)                │
            │   cron: reminders, reviews, winback                       │
            │   trigger: fill-slot (kur anulohet një takim)             │
            └───────────────┬──────────────────────────┬───────────────┘
                            │ service_role             │ (Gemini/OpenAI)
                            ▼                          ▼
            ┌───────────────────────────┐   ┌──────────────────────────┐
            │  PostgreSQL (Supabase)    │   │   Google Gemini API       │
            │  RLS: is_my_business()    │   │   (vetëm NLU + frazim)    │
            └───────────────▲───────────┘   └──────────────────────────┘
                            │ RLS (owner-scoped)
            ┌───────────────┴──────────────────────────────────────────┐
            │   PANELI WEB (PWA)  ·  GitHub Pages                        │
            │   app.html + optima-app.js + core.js + style.css          │
            │   PRONARI menaxhon biznesin                                │
            └──────────────────────────────────────────────────────────┘
```

---

## 4. Frontend (paneli i pronarit)

**Faqet:**
- `index.html` — landing/marketing (CSS+i18n inline).
- `app.html` — aplikacioni kryesor (3 pamje: **Auth → Onboarding → Panel**).
- `book.html` — faqe publike rezervimi (e deprioritizuar; klientët përdorin Telegram/WhatsApp).
- `demo.html`, `privacy.html`, `terms.html`, `track.html` — ndihmëse.

**Skedarët bërthamë:**
- `optima-app.js` (~3000 rreshta) — logjika e panelit (UI, CRUD, render, navigim mobil, i18n SQ/EN).
- `core.js` — **logjikë e pastër e testuar** (UMD): kohë, çmime me shumicë, llogaritja e slot-eve, roja anti-halucinacion (`extractAmounts`, `replyPriceOk`), anti-injection (`looksLikeInjection`). Një burim i vetëm i së vërtetës, e ndarë nga DOM/rrjeti → e testueshme.
- `config.js` — URL + publishable key i Supabase (publik, i mbrojtur nga RLS).
- `style.css` — design system "Milk/Liquid Glass" (glassmorphism, variabla CSS, dark mode, mobil native).
- `v.js`, `sw.js` — versionim + Service Worker (shih §10).

**Design system:** variabla CSS (ngjyrë smerald, spacing, radius, shadow, fonte Sora+Manrope), aurora e animuar, glassmorphism; UX mobil native (bottom-nav, bottom-sheets, FAB, swipe, haptic, skeleton). Akses: `aria-*`, focus-rings, `prefers-reduced-motion`.

---

## 5. Modeli i të dhënave (PostgreSQL)

**Tabelat bërthamë (`schema.sql`):**
| Tabela | Fushat kryesore | Roli |
|---|---|---|
| `businesses` | id, **owner_id**→auth.users, name, type, address, lang, config(jsonb), timezone, telegram_token, ai_notes | Biznesi (tenant) |
| `services` | id, **business_id**, name, duration_min, price, sort_order, active, addons(jsonb), hidden_fields(jsonb) | Shërbime/produkte |
| `working_hours` | business_id, weekday(0–6), open_time, close_time, is_closed | Orari |
| `time_blocks` | business_id, block_date, from_time, to_time, reason | Bllokime |
| `appointments` | business_id, service_id, client_name, appt_date, appt_time, status(pending/confirmed/cancelled), source(ai/manual), idempotency_key | Takimet |
| `notifications` | business_id, text, read | Njoftime për pronarin |

**Tabelat shtesë (`SETUP-ALL.sql`):** `messages` (historiku i bisedave AI), `conversation_state` (state machine e bisedës), `waitlist` (lista e pritjes), `leads` (kërkesa nga inquiry), `staff` + `locations` (kapacitet paralel), `winback_log`, `processed_updates` (idempotency e webhook-ut).

**Çdo tabelë ka `business_id`** → çelësi i izolimit multi-tenant.

---

## 6. Siguria (kjo është kritike)

**6.1 Row Level Security (RLS)** — në çdo tabelë:
```sql
create function is_my_business(bid uuid) returns boolean
  security definer stable as $$
  select exists(select 1 from businesses where id = bid and owner_id = auth.uid());
$$;

create policy "own_services" on services
  for all using (is_my_business(business_id)) with check (is_my_business(business_id));
```
→ Një pronar **fizikisht nuk i sheh dot** të dhënat e një biznesi tjetër. Databaza e zbaton, jo aplikacioni.

**6.2 Çelësat / sekretet:**
- Frontend: vetëm **publishable key** (publik me qëllim; RLS mbron të dhënat). I verifikuar: asnjë çelës privat në kod/repo.
- Edge Functions: `SUPABASE_SERVICE_ROLE_KEY` (jepet automatikisht), `GEMINI_API_KEY`, `TELEGRAM_BOT_TOKEN`, `WHATSAPP_TOKEN` — të gjitha te **Supabase Secrets**, kurrë në kod.

**6.3 Faqja publike (anon):** funksionet `public_business / public_book / public_order` janë `SECURITY DEFINER` me whitelist fushash (s'ekspozojnë financat), me **rate-limit** dhe **idempotency**.

---

## 7. Truri AI (recepsionisti) — zemra e produktit

**7.1 Arkitektura hibride (funksioni `chat`):**
- **Shtresa 1 — Rregulla deterministike (falas, pa AI):** përshëndetje, lista e çmimeve/orarit, rezervim i plotë, anulim. Të shpejta, të sakta, pa kosto.
- **Shtresa 2 — AI (Gemini/OpenAI):** vetëm për mesazhet që rregullat s'i kapin (dialekt, fraza të paqarta, gjuhë të tjera).

**7.2 Parimi botëror: "AI te skajet, sistemi në mes."**
AI **vetëm**: kupton tekstin e çrregullt → nxjerr intent të strukturuar (JSON) + shkruan përgjigjen e ngrohtë.
Sistemi (deterministik) **vendos & vepron**: llogarit oraret e lira (`core.js → computeSlots`), validon shërbimin/orarin kundër të dhënave reale, shkruan rezervimin (transaksional, anti-dyfishim), në timezone-in e biznesit. **AI s'vendos kurrë një fakt.**

**7.3 Izolimi multi-tenant (zero përzierje):**
Çdo thirrje merr `business_id`. Konteksti ngarkohet **i filtruar**:
```ts
businesses.eq("id", businessId)        // emri, config
services.eq("business_id", businessId) // VETËM shërbimet e tij
working_hours / appointments / staff … .eq("business_id", businessId)
```
Prompt-i përmban **vetëm** emrin + shërbimet + FAQ-në e atij biznesi. → Parfumeria s'merr kurrë të dhëna makinash.

**7.4 Rrethojat (guardrails) — Niveli 0, i verifikuar me teste:**
1. **Dalje JSON e strukturuar** (`responseSchema`, temperaturë 0.1) → pak halucinacion, e parsushme.
2. **SCOPE guard** — "përfaqëson VETËM këtë biznes; mos shpik gjëra jashtë ofertës; mos përmend biznese të tjera".
3. **Roja anti-çmim** (`replyPriceOk`) — nëse AI shpik një çmim që s'është te të dhënat → sistemi e zëvendëson me fallback të sigurt.
4. **Anti-injection** (`looksLikeInjection` + rresht SECURITY) — klienti s'e ndryshon dot rolin/rregullat e bot-it.
5. **Parsim JSON i sigurt** — s'rrëzon kurrë rrjedhën.
6. **Shembuj shqip (few-shot)** — kupton dialektin/gabimet.
7. **State machine** (`conversation_state`) — sistemi mban çfarë dihet → AI s'ripyet.

---

## 8. Kanalet (si flasin klientët me AI-në)

- **Telegram** (`telegram` function): webhook `…/telegram?business_id=<ID>`. Çdo biznes = bot-i i vet (kolona `telegram_token`) → rutim i pastër multi-tenant. Ka idempotency (`processed_updates`) + rate-limit. **Falas, i menjëhershëm.**
- **WhatsApp** (`whatsapp` function): Meta Cloud API, i njëjti tru. Kërkon verifikim Meta (ditë pune).
- **Web demo** (paneli): "Provo AI-në" në modalitet `preview` (s'shkruan asgjë në bazë).

Të gjitha → i njëjti funksion `chat`. Historiku ruhet te `messages` (10 mesazhet e fundit si kontekst).

---

## 9. Automatizimet (para pa AI — sistemi i bën vetë)

| Funksioni | Nxitja | Vlera |
|---|---|---|
| `reminders` | cron ditor | Kujton takimet e nesërme → ul mungesat |
| `reviews` | cron ditor | Kërkon vlerësim Google pas takimit → reputacion |
| `winback` | cron ditor | Rikthen klientët e humbur → para shtesë |
| `fill-slot` | trigger në DB (kur anulohet takim) | Fton listën e pritjes → orari bosh mbushet vetë |

---

## 10. Versionimi, Cache & Deploy

- **`version.txt`** (numër i plotë) = burimi i së vërtetës. **`v.js`** rifreskon faqen te `?v=N` nëse është e vjetër (bust i HTML-së).
- Asetet ngarkohen si `<link>`/`<script>` **statike me `?v=N`** (preload-scanner i gjen menjëherë; pa `document.write` që bllokonte).
- **Service Worker (`sw.js`)**: asetet me `?v=` → cache-first (ngarkim i menjëhershëm + offline); HTML & `version.txt` & cross-origin → network-first. → **shpejt, por kurrë i vjetëruar.**
- Deploy = `git push` (GitHub Pages, ~1 min). Edge Functions & SQL deploy-ohen veçmas te Supabase.

---

## 11. Testimi & Cilësia
- `core.js` (logjikë e pastër) + `tests/core.test.js` (**node:test, 14 teste**): round2, slots, mbivendosje, pushime, çmime me shumicë, roja e çmimit, anti-injection.
- **GitHub Actions CI** i ekzekuton në çdo push.
- Logjika kritike (slot-et, çmimet, rrethojat AI) është e ndarë e e testuar.

---

## 12. Rrjedha end-to-end (shembull)
1. Klienti shkruan në Telegram: *"a ke nesër në 3 për qethje?"*
2. `telegram` (me `business_id` nga webhook) ruan mesazhin, merr historikun → thërret `chat`.
3. `chat` ngarkon kontekstin e **atij** biznesi, kontrollon anti-injection, provon rregullat; nëse s'mjaftojnë → Gemini me prompt të hardenuar + JSON schema.
4. AI kthen `{wants_to_book, service, date, time, reply}`. Sistemi **validon** shërbimin + orarin kundër availability reale, e rezervon (anti-dyfishim), aplikon rojen e çmimit.
5. Përgjigjja kthehet në Telegram + ruhet; pronari merr njoftim.

---

## 13. Gjendja reale (e ndershme)
| Dimensioni | % | Shënim |
|---|---|---|
| Produkti (UI/UX/PWA/performancë) | ~90% | I fortë |
| AI backend (chat + SQL) | ~90% | Deploy-uar, verifikuar |
| AI saktësi/izolim/siguri (Niveli 0) | ~95% | I plotë + i testuar |
| Kanali live (Telegram) | në proces | Funksioni gati; lidhja bëhet nga pronari |
| Pagesat (Stripe) | 0% | Mungon |
| Klientë pagues | 0 | Rreziku #1 |
| Moat (të dhëna/rrjet/lock-in) | ~5% | Fillon me klientët |

**Përkthim:** produkti është i ndërtuar mirë; **kompania** (klientë, shpërndarje, pagesa, moat) sapo fillon.

---

## 14. Skalueshmëria & kostoja
- **Frontend:** statik në CDN → praktikisht i pakufizuar, falas.
- **DB/Auth/Functions:** Supabase shkallëzon; RLS + indekset (`business_id`) e mbajnë të shpejtë.
- **AI:** Gemini flash-lite = kosto shumë e ulët; Shtresa 1 (rregullat) trajton shumicën pa kosto AI; rate-limit mbron nga abuzimi.
- **Kosto për biznes:** afër zeros në fillim → marzh i lartë.

---

## 15. Rreziqet & boshllëqet
- **Pa pagesa (Stripe)** → s'faturon dot ende.
- **WhatsApp/IG** kërkon verifikim Meta (Telegram është rruga e shpejtë).
- **AI probabilistik:** rrethojat e ulin rrezikun ~99%, jo 100% (asnjë LLM s'është perfekt) → duhet observability + rishikim njerëzor (Niveli 2).
- **Pa observability/human-handoff** ende (Niveli 2).
- **Varësi nga një ofrues** (Supabase/Gemini) — e zbutshme (model-agnostik tashmë).

---

## 16. Roadmap
- **Niveli 0 — Saktësi, izolim, siguri:** ✅ i plotë + i testuar.
- **Niveli 1 — Inteligjencë për biznes (MOAT):** bazë njohurish e pasur, persona/ton, **pronari korrigjon → bot-i mësohet** (flywheel i pakopjueshëm).
- **Niveli 2 — Shkallë & besim:** observability, dorëzim te njeriu, kuota/pagesa, të gjitha kanalet.
- **Niveli 3 — Mbrojtje (miliarda):** mësim mes bizneseve pa rrjedhur të dhëna, modele sipas vertikalit.

**Hapi i ardhshëm me leva më të lartë:** lidhja e kanalit (bërë) + **klienti i parë real** + Stripe. Nga këtu, vlera vjen nga ekzekutimi/shpërndarja, jo nga kodi.
