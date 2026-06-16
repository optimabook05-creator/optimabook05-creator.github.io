# OptimaBook — Multi-AI Architecture (dizajn i detajuar)

> Parimi mbi gjithçka: **OptimaBook nuk varet nga asnjë kompani AI e vetme.** Modeli është i zëvendësueshëm. Truri ndryshon; produkti jo.
>
> **Verdikt i ndershëm (lexoje para se të ndërtosh):** ky është dizajni 10-vjeçar. Sot, **një model i mirë + rregullat + motori** mbulon ~95% të vlerës. Ndërto *abstraksionin + fallback + eval* tani; multi-model dhe 9 agjentët vijnë me shkallën dhe klientët.

---

## 1. AI Router (truri që zgjedh trurin)

Routeri vendos automatikisht **cilin model**, **për çfarë**, **me sa kosto**.

**Sinjalet që lexon:**
| Sinjal | Përdorim |
|---|---|
| Qëllimi + besueshmëria (nga rregullat/klasifikues) | rutinë → lirë; i paqartë → i fortë |
| Kompleksiteti i detyrës | chat i thjeshtë vs arsyetim me shumë hapa |
| Kanali + buxheti i latencës | Voice <1s → model i shpejtë; chat duron më shumë |
| Plani i biznesit (Start/Pro/Premium) | sa "i shtrenjtë" lejohet |
| Buxheti i kostos / kuota | parandalon shpenzim kot |
| Shëndeti i provajderit | nëse njëri bie → kalon te tjetri |

**Rrjedha e vendimit:**
```
Mesazhi
  │
  ├─ 1. RREGULLAT (falas) ── përputhje e sigurt? → përgjigju ($0)
  │
  ├─ 2. KLASIFIKO kompleksitetin (klasifikues i lirë/heuristikë)
  │       ├─ i thjeshtë → MODEL I LIRË (Flash/mini/Haiku)
  │       └─ kompleks  → MODEL I FORTË (GPT/Claude/Gemini Pro)
  │
  ├─ 3. Besueshmëri e ulët nga modeli i lirë? → ESHKALLËZO te i forti
  │
  └─ 4. Provajder i ngadaltë/i rënë? → FAILOVER te tjetri
```
**Kosto:** rregulla-së-pari + model-i-lirë-si-parazgjedhje + cache për përgjigje të zakonshme + buxhet për-tenant. **Cilësi:** prag besueshmërie; eshkallëzim vetëm kur duhet.

---

## 2. Shtresat e modeleve — çfarë, pse, kur, kur JO

### GPT Layer
- **Përdore për:** bisedë natyrale me klientë, **Voice AI (realtime)**, shitje, përvojë njerëzore.
- **Avantazhe:** bisedë shumë natyrale e shumëgjuhëshe, tool-calling i pjekur, variante mini të lira e të shpejta, ekosistem realtime/voice i pjekur.
- **Kufizime:** kosto te niveli i lartë; rrezik varësie nëse mbështetesh vetëm tek ai; ndonjëherë fjalaman.

### Claude Layer
- **Përdore për:** arsyetim kompleks, analiza biznesi, raportime, procese me shumë hapa, **kontroll cilësie (vlerësues/"gjyqtar")**, interpretim politikash.
- **Avantazhe:** arsyetim i fortë, ndjekje e kujdesshme e udhëzimeve, kontekst i gjatë, i shkëlqyer si "kontrollues" i daljeve të modeleve të tjera.
- **Kufizime:** kosto te niveli i lartë; për Voice duhet çiftuar me STT/TTS (më pak realtime nativ se GPT).

### Gemini Layer
- **Përdore për:** integrime Google (Calendar, Business/Reviews, Maps), analiza të mëdha, dokumente shumë të gjata, **kontekst tepër i madh**, vëllim i lartë me Flash (lirë).
- **Avantazhe:** dritare konteksti gjigante, niveli Flash lirë e shpejtë, integrime Google native, multimodal.
- **Kufizime:** kuota falas shumë e vogël (duhet billing); i lidhur me ekosistemin Google.

### Open-Source Layer (Llama / Mistral / Qwen, self-hosted)
- **Përdore për:** ulje kostosh në shkallë të madhe, **klasifikim** (qëllim/gjuhë/ndjenjë/rrezik mungese), detyra të thjeshta të brendshme, **embeddings**, data residency/on-prem për enterprise.
- **Kur JO:** në fillim — barra e mirëmbajtjes s'ia vlen pa vëllim.

---

## 3. Specialized AI Agents (9)

> E vërteta: këta s'janë 9 AI gjithmonë-aktive. Janë **aftësi + prompt-e + mjete** mbi **një orkestrator + memorie të përbashkët + të njëjtin motor**. Komunikojnë përmes **event bus + memories së përbashkët**, jo me biseda agjent-me-agjent.

| # | Agjenti | Modeli ideal | Përgjegjësia | Akses në të dhëna | Komunikimi |
|---|---|---|---|---|---|
| 1 | **Reception** | i lirë (Flash/mini/Haiku) + rregulla | mirëpret, kupton, drejton | lexon shërbime/orare/klient | i jep qëllimin Booking-ut (event) |
| 2 | **Booking** | **JO AI — motor** (opsion model i vogël për paqartësi) | rezervon/anulon/zhvendos | **i vetmi që shkruan takime** | nxjerr `booking.*` events |
| 3 | **Sales** | i fortë (GPT) | upsell, paketa, konverton pyetje | çmime + LTV klienti (lexim) | sugjeron te Reception/Revenue |
| 4 | **Retention** | i lirë + rregulla (cron) | rikthen klientë të humbur | historik vizitash, churn (lexim) | dërgon outbound nga kanalet |
| 5 | **Review** | i lirë (i nxitur pas takimit) | kërkon vlerësim Google | takime + a u kërkua më parë | dëgjon `appointment.completed` |
| 6 | **Analytics** | i fortë për narrativë (Claude/GPT); llogaritë SQL | nxjerr insight & rekomandime | view-t analitike (read-only) | ushqen panelin + Revenue |
| 7 | **Voice** | realtime (GPT realtime) + STT/TTS | rezervim me zë | disponueshmëri (lexim) | njëlloj si Reception → Booking |
| 8 | **Marketing** | i fortë (cron) | fushata (promo për orare bosh, sezonale) | segmente klientësh + zënie | kanalet; bashkëpunon me Retention |
| 9 | **Revenue Optimization** | i fortë + analitikë | mbush boshllëqe, çmime/paketa, menaxhon pikun | gjithë performanca (lexim) | orkestron Marketing/Retention/Sales |

**Në kohë reale:** Reception, Booking, Voice, Sales. **Të planifikuara (cron):** Retention, Review, Marketing, Analytics, Revenue.

---

## 4. Shared Business Memory

**Asnjë agjent s'mban memorie të izoluar.** Të gjithë lexojnë të njëjtën memorie përmes një **Memory Service** me izolim për-tenant.
- **E strukturuar:** klientë, preferenca, staf i preferuar, lokacione, rezervime, performancë.
- **Bisedore:** historiku i mesazheve.
- **Semantike:** embeddings/vector store për kujtesë "kuptimore".
- Shkrimet kalojnë nga shërbimet/motori (konsistencë). GDPR: izolim, enkriptim, e drejtë fshirjeje.

---

## 5. Fallback Strategy (disponueshmëri ~100%)

- **Abstraksion provajderi** me health-check + circuit breaker.
- **Zinxhir:** model primar → provajder dytësor → model i lirë → **vetëm rregulla (përgjigje e sjellshme)**. Kurrë "…".
- **Vazhdimësia e bisedës:** gjendja ruhet në DB, jo te modeli → çdo model e vazhdon bisedën nga ku mbeti.
- Timeout + retry me backoff + idempotency. Cache për përgjigje të zakonshme.
- **Çelësi:** motori (JO-AI) punon edhe nëse të GJITHA LLM-të bien — rezervimi nuk ndalet kurrë.

---

## 6. Future-Proof (modeli i zëvendësueshëm)

- **Një ndërfaqe e brendshme `LLMProvider`** (`generate(system, messages, schema) → JSON`). Adaptues për GPT/Claude/Gemini/OSS. **Produkti s'thërret kurrë drejtpërdrejt SDK-në e një kompanie.**
- Prompt-et + skemat të versionuara, të pavarura nga modeli.
- **Routing me konfigurim** (ndërro model pa prekur kodin).
- **Eval harness:** një grup bisedash reale që noton çdo model të ri **para** se ta kalojmë në prodhim.
- ✅ Bërthama jonë është tashmë model-agnostike → kjo është themeli i gjithçkaje.

---

## Çfarë ndërtojmë TANI vs më vonë (verdikt)

| Tani (lirë, vlerë e madhe) | Më vonë (me shkallë/klientë) |
|---|---|
| `LLMProvider` abstraksion ✅ | Router me 4 familje modelesh |
| Fallback chain → rregulla (kurrë "…") ✅ pjesërisht | GPT realtime Voice |
| Eval harness (bisedat tona) | Open-source self-hosted |
| Router i thjeshtë: lirë-default + eshkallëzo-te-forti | 9 agjentë të plotë të orkestruar |
| Reception + Retention + Review si cron/skill | Model i vetin (fine-tuned) |

**Mos ndërto routerin me 4 modele + 9 agjentë autonomë me zero klientë.** Dizajno për të — ndërto për hapin tjetër.
