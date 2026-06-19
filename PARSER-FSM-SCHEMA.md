# OptimaBook — Kontrata FSM ↔ Parser (Data Schema)

> Dizajni i saktë i të dhënave PARA se të shkruajmë kodin — që të shmangim kolizionet semantike. Bazuar në 4 kritikat e konsulentit (të pranuara plotësisht).

## Parimet e pranuara (nga kritikat)
1. **Parser-i = "typer-strict"** — vetëm gjëra ekzakte (data, orë, sinonime direkte). Dialektin kompleks ("kam me ardh me t'pre") **nuk** e kodojmë → ia lëmë LLM-së (Actor-Critic). *(S'ka spaghetti.)*
2. **State-Aware** — parser-i merr gjendjen e FSM-së + tipin e biznesit → s'ka kolizion ("në 5" = orë nëse `awaiting_time`).
3. **Ambiguitet → pyetje sqaruese** — kohë relative e paqartë ("të hënën tjetër") → `is_ambiguous:true`, jo hamendësim.
4. **Fuzzy vetëm > 90%** — ndryshe ia kalon AI-së (jo "Raje"→"Larje" gabim).

---

## 1. INPUT i parser-it: `parseMessage(rawText, ctx)`
```ts
ctx = {
  businessType: "barber" | "clinic" | "salon" | "hotel" | ...,
  lang: "sq" | "en" | ...,
  timezone: "Europe/Tirane",
  now: { todayStr: "2026-06-19", nowMin: 1037 },        // tz-aware
  fsm: {
    step: "idle" | "awaiting_service" | "awaiting_date" | "awaiting_time" | "awaiting_confirm",
    intent: "booking" | "cancel" | null,
    service_id?: uuid, service_name?: string,
    appt_date?: "YYYY-MM-DD", appt_time?: "HH:MM",
    persons?: int,
    offered_times?: ["09:00","09:30","10:00"],          // që "e para"/"po" të zgjidhë saktë
  },
  services: [
    { id, name: "Qethje", aliases: ["qethje","qeth","rruaj","pres flokët","m'i rregullo"],
      duration_min: 30, price: 15 }
  ],
}
```

## 2. OUTPUT i parser-it
```ts
{
  intent: "booking" | "cancel" | "reschedule" | "confirm" | "deny"
        | "price" | "hours" | "greeting" | "thanks" | null,
  service_id?: uuid,
  date?: "YYYY-MM-DD",          // VETËM kur ekzakte
  time?: "HH:MM",               // VETËM kur ekzakte
  period?: "morning" | "afternoon" | "evening" | {after:"16:00"} | {before:"17:00"},
  persons?: int,

  confidence: number,           // 0..1 — siguria deterministike
  is_ambiguous: boolean,        // true → BËJ pyetje, mos ekzekuto
  ambiguity?: {
    type: "date" | "time" | "service",
    options: [{label, value}],  // p.sh. [{"E hënë 22","2026-06-22"},{"E hënë 29","2026-06-29"}]
    question: { sq: "...", en: "..." },
  },
  needs_ai: boolean,            // true → kalo te Actor-Critic (dialekt/kompleks/fuzzy i ulët)
  matched_by: "strict" | "synonym" | "state" | null,
}
```

## 3. Çfarë bën parser-i (vetëm 3 gjëra — pragmatik)
**A) Data & orë strikte → timestamp:** `DD.MM`, `DD/MM`, `20 qershor`, `HH:MM`, `1100`, `ora pesë`. → `date`/`time` me `confidence:1`.
**B) Fjalor sinonimesh i pastër:** përputh fjalët kyçe ekzakte të `services[].aliases`. Fuzzy vetëm nëse ≥0.90, ndryshe `needs_ai:true`.
**C) State-validation (sipas `fsm.step`):**
| `fsm.step` | Mesazhi | Veprimi |
|---|---|---|
| `awaiting_confirm` | "po / ok / dakord / u kry / po bre / patjetër" | `intent:"confirm"` |
| `awaiting_confirm` | "jo / s'dua / lëre" | `intent:"deny"` |
| `awaiting_time` | numër bosh ("5","në 5","ora 5") | `time` (njësi=orë, pa kolizion) |
| `awaiting_time` | "e para / po / ajo" | zgjedh `fsm.offered_times[0]` |
| `awaiting_date` | fragment dite/date | `date` |
| `awaiting_service` | alias shërbimi | `service_id` |

## 4. Rregulli i ambiguitetit (sjellje super-human)
- Kohë relative jo-ekzakte ("të hënën tjetër", "fundjavë", "javën tjetër") → **`is_ambiguous:true`** + `ambiguity.options` + pyetje: *"E ke fjalën për të hënën 22 apo 29?"*
- Datë ekzakte (18.06, 20 qershor) → `is_ambiguous:false`, ekzekuto.

## 5. Rrjedha pas parser-it
```
parseMessage(text, ctx)
  ├─ is_ambiguous → agjenti bën pyetjen sqaruese (NUK rezervon)
  ├─ needs_ai     → Actor-Critic (Gemini Flash normalizon + Critic validon → rescue i fortë)
  └─ confident    → motori ekzekuton (validon prapë → zero double-booking)
```

## 6. Ndryshime DB të nevojshme
- `services.aliases text[]` (ose tabelë `service_aliases`) — sinonimet per-biznes (mësohen me kohë → moat NLU).
- `conversation_state.offered_times text[]` — që "e para/po" të zgjidhë saktë orarin e ofruar.

## 7. Leksiku i konfirmimit (shqip real, përfshi zhargon)
`po, yes, ok, okay, dakord, e dua, patjetër, sure, konfirmo, u kry, po bre, gjithsesi, biem dakord` → confirm
`jo, no, s'dua, nuk dua, lëre, anulo, jo tani` → deny

---

**Përfundim:** ky dizajn e mban parser-in të vogël e të sigurt, e bën **state-aware** (pa kolizione), trajton ambiguitetin si njeri (pyet, s'hamendëson), dhe ia kalon kompleksitetin LLM-së — pikërisht ndarja e duhur e punës. Gati për kod.
