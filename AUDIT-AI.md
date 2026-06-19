# OptimaBook — Auditim i AI-së: të kuptuarit (NLU) + human-ness (tekst & zë)

> Ekzaminim i nivelit botëror i SHTRESËS SË TË KUPTUARIT — që agjenti të kuptojë çdo klient kur shkruan dhe flet (aksente, dialekte, gabime, zhargon, emocione). Gabime reale + rruga drejt "super-human".
> **E vërteta:** "i pamundur për t'u përmirësuar" s'ekziston. Por kjo listë e bën **vërtet super-human**.

---

## A. Dobësitë reale AKTUALE (tekst) — nga kodi

1. **Datat eksplicite NUK kuptohen** — `parseDay` njeh "sot/nesër/ditët e javës", por JO **"20 qershor", "18.06", "15/6", "më 20", "të hënën tjetër", "fundjavë", "pas 3 ditësh"**. → këto bien te AI (ose dështojnë). **Boshllëk i madh.**
2. **`parseService` fragjile** — përputhje me prefiks (`slice(0,4)`), pa **sinonime/alias** ("rruaj", "pres flokët", "m'i rregullo", "qethem" për "Qethje"). Pa fjalor per-biznes.
3. **Numrat jo të plotë** — kemi "pes/katër", por JO **"gjysmë", "çerek", "një e gjysmë" (1:30), "njëzet", "nga 2 deri 4", "rreth 5"**.
4. **Gabimet drejtshkrimore vetëm të koduara me dorë** — "sont/somte" i shtuam, por s'ka **fuzzy/edit-distance** për gabime të reja. Çdo typo i ri dështon.
5. **Dialekti (Geg) pjesërisht** — forma gege ("kam me ardh", "rri me t'pre", "n'mramje") jo të mbuluara.
6. **FSM e hollë** (idle/awaiting_time) — pa awaiting_service/date/confirm → **"Po" dështon**, humb konteksti.
7. **Fallback thotë "s'kuptova / vështirësi teknike"** — **e kundërta e super-human.** Klienti s'duhet ta marrë kurrë këtë.
8. **Pa inteligjencë emocionale** — s'dallon inat/mërzi; toni fiks.
9. **Pa mirroring/personalizim** — s'kopjon stilin e klientit; s'mban mend "zakonisht qethje me Tonin".
10. **Cilësia e përgjigjes varet nga modeli i lirë falas** për rastet e vështira.

---

## B. Çfarë duhet për SUPER-HUMAN (tekst)

### 1. Parser i fortë (FALAS — kap shumicën, ul varësinë nga AI)
- **Data eksplicite:** "20 qershor", "18.06", "15/6", "më 20", "të hënën tjetër", "fundjavë", "pas 3 ditësh"
- **Orë të plota:** gjysmë/çerek/"një e gjysmë"/"njëzet"/intervale/"rreth"
- **Numra të plotë** me shkronja (1–24) + shqip e anglisht
- **Dialekt Geg + Tosk** (folje/forma) — leksik i pasur
- **Fuzzy matching** (edit-distance) për gabime të reja
- **Sinonime/alias shërbimesh** (konfigurueshme per-biznes)

### 2. Actor-Critic loop (kurrë "s'kuptova")
```
Mesazhi → ACTOR (model i lirë: normalizon dialekt→standard + JSON intenti)
        → CRITIC (kodi yt: validon kundër gjendjes/shërbimeve/disponueshmërisë)
   ├─ vlen   → ekzekuto
   └─ dështon/paqartë → RESCUE me model të fortë (GPT-4o/Claude) → kurrë fallback "s'kuptova"
```
Critic = validim **deterministik** (jo "confidence score" i pabesueshëm i LLM-së).

### 3. Fjalor i mësuar per-biznes (moat i NLU)
Me kohë, mëso frazat e klientëve të SECILIT biznes (p.sh. klientët e këtij berberi thonë "rruaj") → shto te parser-i. Të dhënat reale → kuptueshmëri që s'kopjohet.

### 4. EQ Engine (më human se njeriu)
Zbulon SHKRONJA TË MËDHA, "!!!", fjalë të ashpra → `mood`. Nëse i inatosur → ton i butë, kërkon ndjesë specifike, `escalate_to_human` me prioritet (alarm te pronari).

### 5. Mirroring + personalizim
Kopjon formalitetin/gjatësinë/emoji/regjistrin e klientit. Përdor profilin: *"Si zakonisht — qethje me Tonin?"*

---

## C. SUPER-HUMAN kur FLET (zë)
- **Realtime API** (GPT-4o Realtime / Gemini Live) — VAD + streaming STT + TTS në një, **nën 1 sek** *(MOS ndërto pipeline WebSocket me dorë — e vjetruar dhe muaj punë kot)*
- Robustësi fonetike për **aksente/dialekte krahinore**
- **Barge-in** (klienti ndërhyn, agjenti ndalon) + TTS me emocion
- Fallback te teksti/handoff nëse zhurma është e lartë

---

## D. Si e MASIM "sa human është" (s'mund të përmirësosh atë që s'mat)
- **Eval-set:** 200+ mesazhe reale (dialekt/zhargon/gabime + transkripte zëri) → matet **understanding rate**; objektivi **>98%**
- Logo çdo dështim → shto te parser-i ose te fjalori per-biznes (cikël përmirësimi)

---

## Prioriteti i ndërtimit
1. **Parser i fortë** (data eksplicite, numra, dialekt, fuzzy, sinonime) — **FALAS**, ul varësinë nga AI, kap shumicën ← fillo këtu
2. **Actor-Critic + EQ + mirroring** — kërkon model të fortë për "rescue" (qindarka)
3. **Fjalor i mësuar per-biznes** (me të dhënat reale)
4. **Voice realtime** (fazë e mëvonshme)
5. **Eval-set** (matja e vazhdueshme)

## Të vërtetat e ndershme
1. **"Kurrë s'kuptova" KËRKON model të fortë rescue** (GPT-4o/Claude, qindarka). Me falas, ka tavan.
2. **Parser-i i fortë (falas)** e zgjidh shumicën e dialekteve/gabimeve PARA AI-së — pikërisht "pavarësia nga AI" që duam.
3. **Super-human i vërtetë vjen me TË DHËNAT reale** (fjalori per-biznes mësohet nga klientët realë) → prandaj klienti i parë real është kritik.
4. Themeli (parser + FSM + engine + agnostik) është i saktë — kjo është thellim, jo rindërtim.

---
*Dokument i gjallë.*
