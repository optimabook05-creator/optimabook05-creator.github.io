# OptimaBook — Arkitektura për Lider Global (10-vjeçare)

> Vizioni: nga "sistem rezervimesh me AI" → **"infrastruktura globale e menaxhimit të klientëve dhe takimeve për çdo biznes në botë."**
>
> **Parim mbi gjithçka (verdikti i ndershëm):** këtë arkitekturë e **projektojmë** tani, por e **ndërtojmë** hap pas hapi. Arkitektura pa klientë realë = zero. Avantazhi afatgjatë nuk është AI — janë **të dhënat + kostoja e ndërrimit + efekti i rrjetit.**

---

## 0. Pamja e madhe

```
        KANALET (adapters të pavarur)
WhatsApp · Telegram · Instagram · Messenger · Voice · API
                      │
                      ▼
              API Gateway + Auth
                      │
                      ▼
        ┌──────── EVENT BUS (zemra) ────────┐
        │  message.received, booking.*,      │
        │  slot.freed, reminder.due, review.*│
        └───────────────────────────────────┘
        │          │            │           │
        ▼          ▼            ▼           ▼
   AI ORCHESTRATOR  BOOKING    NOTIF/      BILLING
   + AI Router      ENGINE     SCHEDULER   + USAGE
   (kupton/flet)    (vepron)
        │              │
        └──────┬───────┘
               ▼
        DATABAZA (e vërteta) + Business Memory + Vector store
               │
               ▼
        PANELI (web/PWA) + Analytics + Enterprise admin
```

**Pse Event Bus në qendër:** kanalet, AI, motori, njoftimet dhe analitika **shkëputen nga njëra-tjetra**. Secila dëgjon ngjarjet që i interesojnë. Kështu shtojmë një kanal të ri (p.sh. Voice) pa prekur motorin, dhe shkallëzojmë çdo pjesë veç.

---

## 1. Arkitektura Software

- **Multi-tenant SaaS, region-aware.** Çdo biznes = tenant i izoluar (RLS). Të dhënat e EU mbahen në EU (GDPR data residency).
- **Shërbime të shkëputura:** API Gateway · Channel Adapters · AI Orchestrator · **Booking Engine** (xhevahiri) · Scheduler/Notifications · Billing · Analytics · Admin.
- **Event-driven backbone** (queue/bus) → idempotencë, ripërpunim, qëndrueshmëri.
- **Idempotency keys** për webhook-et (Meta/Telegram/Twilio/Stripe ridërgojnë mesazhe — s'duhet të dyfishojmë).
- **Cache (Redis)** për leximin e disponueshmërisë + rate limiting.
- **Observability:** logje, trace, metrika, alarme. Pa këto s'ka shkallëzim.
- **Sot:** Supabase (Postgres + Edge Functions + static PWA) — i mjaftueshëm deri në mijëra biznese. Rritet me read-replicas + partitionim sipas tenant/rajon.

## 2. Arkitektura AI

Shtresore, nga e lira te e shtrenjta:
- **Shtresa 0 — Rregulla (falas, të çastit):** 70–80% e mesazheve (përshëndetje, çmim, orar, rezervim i thjeshtë). $0.
- **Shtresa 1 — LLM për të kuptuar (NLU):** nxjerr *qëllim + entitete* në JSON të strukturuar. **Kurrë s'rezervon vetë** — vetëm kthen qëllimin.
- **Guardrails:** dalja e LLM-së validohet nga motori (orari duhet të ekzistojë realisht) → zero halucinacion.
- **Memoria:** për-bisedë + Business Memory (RAG mbi historikun e klientit).
- **Gjuha:** zbulon + përgjigjet në gjuhën e klientit.

## 3. Multi-AI Router

Routeri zgjedh modelin sipas *detyrës · kostos · shpejtësisë · cilësisë*:

| Shtresa | Kur përdoret | Kur JO | Pse |
|---|---|---|---|
| **Rregulla** | mesazhe rutinë | dialekt/i paqartë | falas, i çastit |
| **LLM i lirë** (Gemini Flash / GPT-mini / Haiku) | NLU rutinë, chat shumëgjuhësh | arsyetim kompleks | lirë, shpejt |
| **LLM i fortë** (GPT / Claude / Gemini Pro) | rregulla komplekse, politika, raste të paqarta, narrativa analitike | mesazhe rutinë (kosto kot) | cilësi maksimale |
| **Open-source** (Llama/Mistral self-hosted) | në shkallë shumë të madhe, data residency | në fillim (s'ia vlen mirëmbajtja) | ul koston, kontroll |
| **Model i vetin (fine-tuned)** | pas miliona të dhënash | tani (s'ka të dhëna) | avantazhi përfundimtar |

**Të gjitha pas një abstraksioni model-agnostik** (e kemi) + zinxhir fallback-u.
**Verdikt i ndershëm:** routeri është *dizajni*. Tani përdor **një model të mirë**; multi-model paguhet vetëm në shkallë. (Pa anim: GPT/Claude/Gemini janë të tre të shkëlqyer — zgjidhim me **të dhënat tona reale**, jo me modë.)

## 4. AI Workforce (agjentë të specializuar)

Agjentët: **Reception · Sales · Retention · Review · Analytics · Voice · Marketing · Revenue.**

**E vërteta inxhinierike:** këta NUK janë 8 AI të veçanta gjithmonë-aktive. Janë **aftësi/prompt-e + mjete** mbi **një orkestrator + memorie të përbashkët + të njëjtin motor**. Komunikojnë përmes **gjendjes së përbashkët (databaza/event bus)**, jo me biseda agjent-me-agjent (të shtrenjta e të brishta).
- Reception/Sales/Voice = **në kohë reale** (kur shkruan klienti).
- Retention/Review/Marketing/Analytics = **punë të planifikuara (cron)** që ndizen vetë.

**Verdikt:** mos ndërto 8 agjentë autonomë tani. Ndërto orkestratorin + 1–2 agjentë realë (Reception + Retention), shto të tjerët kur sjellin para.

## 5. Business Memory (memoria afatgjatë)

- **Strukturë:** `customers` për tenant (profil, preferenca, **stafi i preferuar**, historik vizitash, numër anulimesh/mungesash, **LTV**) + memorie bisede + **embeddings** për kujtesë semantike.
- **Çfarë mban mend:** kush je, çfarë shërbimi do zakonisht, sa shpesh vjen, me kë staf, a anulon shpesh.
- **Privatësi/GDPR:** izolim për-tenant, enkriptim, politikë mbajtjeje, **e drejta për fshirje**, pëlqim.
- **Performancë:** indekse + cache; vector store për kujtesën; përmbledh historikun e vjetër.

## 6. Booking Engine (versioni më i sigurt)

Kërkesa: **zero rezervime të dyfishta**, konsistencë transaksionale, disponueshmëri e lartë.
- **Mbrojtja e artë:** kufizim në vetë databazën — Postgres `EXCLUDE USING gist` mbi (staf/resurs, interval kohor). Atëherë **databaza vetë e ndalon mbivendosjen**, edhe nëse dy kërkesa vijnë në të njëjtin çast. (Sot e bëjmë me kontroll në kod — funksionon, por ky është niveli "i pamposhtur".)
- Transaksione serializable / advisory locks për resurs, **idempotency keys**, audit log.
- **Orët e zonës (timezone)** të ruajtura saktë — kritike kur biznesi dhe klienti janë në vende të ndryshme.
- HA: replica për lexim; shkrimet serializohen për resurs.

## 7. Enterprise (bizneset e mëdha)

- Hierarki: **Organizatë → Lokacione → Staf → Shërbime → Resurse (karrige/dhoma).**
- **Role/leje:** pronar, menaxher, recepsionist, staf — secili sheh çfarë i takon.
- Kalendar për staf dhe për lokacion; raporte roll-up për gjithë organizatën.
- **Franshiza:** markë e përbashkët, të dhëna të ndara. SSO për organizata të mëdha.
- **Vendim arkitekture që duhet marrë HERËT:** modeli i të dhënave ta parashikojë staf+lokacion qysh tani, që të mos bëjmë migrim të dhimbshëm më vonë.

## 8. Analytics / Business Intelligence

- **Përshkruese (e nisëm):** fitime, anulime, VIP, zënia e orareve, performanca e stafit.
- **Parashikuese:** kërkesa e ardhshme, **rrezik mungese (no-show scoring)**, rrezik largimi (churn).
- **Rekomanduese (AI):** "blloko të martën në mëngjes — bosh gjithmonë", "promo të enjten", "klienti X po largohet — dërgo win-back".

## 9. Voice AI

- Telefonatë (Twilio) → **STT** (zë→tekst) → LLM → **Motori** → **TTS** (tekst→zë).
- Latencë e ulët, ndërhyrje natyrale (barge-in), zëra shumëgjuhësh.
- I njëjti tru + motor si chat-i (s'ndërtojmë dy sisteme).
- Fallback: nëse s'kupton, dërgon link rezervimi ose kalon te njeriu.

## 10. Siguria

- Izolim multi-tenant (RLS) · secrets me privilegj minimal · **enkriptim i PII** (fushat e ndjeshme).
- **Verifikim i nënshkrimit** të webhook-eve (Meta/Telegram/Twilio/Stripe).
- Rate limiting, anti-spam, **mbrojtje nga prompt-injection** (mesazhi i klientit s'mund të ndryshojë kurrë rregullat — motori i zbaton).
- Auth me **MFA** për enterprise, audit logs, DPA + GDPR.

---

## MOAT — Avantazhi ndaj konkurrencës

**Kopjohet lehtë:** modeli AI, dizajni, rezervimi bazë, çmimet.
**S'kopjohet lehtë:**
1. **Të dhënat** (miliona biseda/rezervime/sjellje klientësh) → modeli i vetin + parashikime.
2. **Kostoja e ndërrimit:** gjithë marrëdhënia me klientët e biznesit jeton brenda OptimaBook (historik, kujtesa, automatizime). Largimi dhemb.
3. **Integrimet që punojnë realisht** (WhatsApp/IG/Voice njëkohësisht, stabël) — të vështira teknikisht.
4. **Efekti i rrjetit** (marketplace më vonë): sa më shumë biznese e klientë, aq më e vlefshme.
5. **Marka + besimi.**

**Mbrojtja më e fortë afatgjatë:** *të dhënat + kostoja e ndërrimit* (sot), pastaj *efekti i rrjetit*.

## Burimet e të ardhurave

1. **Abonime** (Start/Pro/Premium) — bërthama.
2. **Overage / usage** (biseda ekstra, minuta Voice).
3. **Seats** (për staf/lokacion) — enterprise.
4. **Take-rate i pagesave** (nëse procesojmë depozita/pagesa për takime) — i madh.
5. **Add-ons:** Voice AI, fushata marketingu, menaxhim vlerësimesh.
6. **White-label / API** për enterprise.
7. **Marketplace lead-gen** (vite më vonë).

---

## Objektivi final + plani konkret

Nga "booking system" → **system of record + system of engagement + system of intelligence** për biznese me takime. Pra OptimaBook zotëron *gjithë marrëdhënien me klientin*, jo vetëm kalendarin.

### Çfarë projektojmë TANI por ndërtojmë më vonë
Multi-region · open-source models · 8 agjentë · model i vetin · marketplace · SSO.

### Vendime arkitekture që i bëjmë DREJT tani (lirë tani, shtrenjt më vonë)
1. **Booking Engine me kufizim në databazë** (zero double-booking i garantuar nga DB).
2. **AI model-agnostik** ✅ (e kemi).
3. **Izolim multi-tenant** ✅ (e kemi).
4. **Modeli i të dhënave që parashikon staf + lokacion + customers** (që të mos migrojmë me dhimbje).
5. **Strukturë miqësore me ngjarje** (events) për kanale e automatizime.

### Rendi i ndërtimit (lidhur me fazat)
0 ✅ Themelet → 1 AI i zgjuar → 2 Veçoritë "punonjës" (auto-fill, win-back, reviews) → 3 WhatsApp → 4 Pagesat → 5 Enterprise → 6 IG/Messenger → 7 Voice → 8 Lançimi → 9 (vite) model i vetin + marketplace.

**E vërteta që mban gjithçka bashkë:** çdo fazë financohet nga e mëparshmja, dhe asgjë s'ka kuptim pa **klientin e parë real**. Ndërtojmë si lider global — por hap pas hapi, jo gjithçka njëherësh.
