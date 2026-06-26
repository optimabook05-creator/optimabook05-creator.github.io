# 🔬 UX Research — OptimaBook

> Dokument pune nga këndvështrimi i një UX Researcher-i. Synimi: të lidhim nevojat e përdoruesit me qëllimet e biznesit, dhe të udhëheqim dizajnin me të vërtetën, jo me hamendje.
> ⚠️ Kufizim i ndershëm: pa testim me përdorues realë, këto janë hipoteza të arsyetuara. Vlera e vërtetë vjen kur 1 biznesmen real e përdor dhe e shohim ku ngec.

---

## 1) PERSONA KRYESORE — "Toni, pronari i zënë"
- **Kush:** Berber/parukier/estetist, 25–45 vjeç, 1–4 punëtorë.
- **Pajisja:** Telefon (90% e kohës), mes klientëve, me një dorë.
- **Aftësi teknike:** E ulët–mesatare. Përdor Instagram & WhatsApp çdo ditë.
- **Qëllimet:** Të mos humbasë klientë; të dijë sa fiton; të kursejë kohë.
- **Frikërat:** "S'kam kohë ta mësoj"; "është e komplikuar"; "po sikur klientët të mos e përdorin?".
- **Citat:** *"Unë dua të pres flokë, jo të rri në telefon."*

**Persona dytësore — "Klienti i Tonit":** shkruan në WhatsApp/IG për të rezervuar; **NUK** do faqe/app të ri (prandaj AI në kanal, jo faqe publike).

---

## 2) JOBS-TO-BE-DONE (çfarë "punësohet" OptimaBook të bëjë)
1. *Kur jam i zënë, dua që dikush t'u përgjigjet klientëve, që të mos humbas para.* → **AI në kanal.**
2. *Kur hap telefonin, dua të di menjëherë ditën time.* → **Karta "Sot".**
3. *Kur mbaron një takim, dua ta shënoj shpejt.* → **Swipe / butona.**
4. *Çdo fund jave, dua të di sa fitova.* → **Ekonomia.**
5. *Një herë, dua ta rregulloj biznesin pa mund.* → **Konfigurimi.**

---

## 3) HARTA E UDHËTIMIT (përdorimi ditor) + pikat e dhimbjes
| Faza | Veprimi | Ndjesia | Pika e dhimbjes (hipotezë) |
|---|---|---|---|
| Mëngjes | Hap app → kontrollon ditën | "Sa kam sot?" | ✅ Zgjidhur me kartën "Sot" |
| Gjatë ditës | Klient i ri shkruan në IG | Shpresë | AI duhet të jetë i lidhur (Hapi B + Meta) |
| Pas takimit | Shënon Erdhi/Mungoi | Shpejtësi | ✅ Swipe + butona |
| Klient vonohet | Ricakton | Stres | ✅ Ricaktim inline |
| Mbrëmje | Sheh paratë | Kënaqësi/shqetësim | ✅ Ekonomia me periudhë |
| Java e 1-rë | Konfigurimi fillestar | Ngarkesë | ⚠️ Ende mund të thjeshtohet (shih më poshtë) |

---

## 4) VLERËSIM HEURISTIK (10 parimet e Nielsen) — gjendja aktuale
1. **Dukshmëria e gjendjes** — ✅ toast, "AI aktiv", skeleton. 
2. **Përputhja me botën reale** — ✅ gjuhë e thjeshtë shqip, ikona të njohura.
3. **Kontroll & liri** — ✅ Anulo/✕ kudo; ⚠️ mungon "Undo" pas një veprimi (p.sh. anulova gabimisht).
4. **Konsistencë & standarde** — 🟡 mirë, por kërkon auditim (spacing/radius/hije uniforme).
5. **Parandalim gabimesh** — ✅ konfirmim për fshirje biznesi; ⚠️ swipe-anulim pa konfirmim → rrezik prekje aksidentale.
6. **Njohje > kujtesë** — ✅ butona "i" (info), Konfigurimi i udhëhequr.
7. **Fleksibilitet & efikasitet** — ✅ FAB, swipe, bottom-nav; ✅ tani FAB kontekstual.
8. **Estetikë & minimalizëm** — 🟡 glassmorphism i pasur; kujdes të mos teprohet (lexueshmëria > zbukurimi).
9. **Gabimet: njoh, diagnostiko, rikuperο** — ✅ errToast i qartë; ⚠️ disa mesazhe teknike.
10. **Ndihmë & dokumentim** — ✅ info-dots + hint-e; mund të shtohet një "tur" i shkurtër në hyrje.

**Top 3 dobësi UX (prioritet):**
- **A) Mungon "Undo"** për veprime të rrezikshme (anulim/no-show) → shto undo 5-sekondësh te toast.
- **B) Swipe-anulim pa konfirmim** → kërko konfirmim të lehtë ose undo.
- **C) Konfigurimi fillestar** ende mund të jetë barrë për një jo-teknik → tur i parë + vlera e parë në <2 min.

---

## 5) ARKITEKTURA E INFORMACIONIT (IA)
- **E mirë:** ndarja "Përdor çdo ditë" vs "Rregullo një herë"; bottom-nav me 5 + "Më shumë".
- **Për t'u vlerësuar me përdorues (card sorting):** a i gjen Toni "Lista e pritjes", "Bllokime", "Aktiviteti" aty ku pret? Hipotezë: "Aktiviteti" & "Bllokime" përdoren rrallë → drejt te "Më shumë" (✅ tashmë aty).
- **Bottom-nav fiks 5:** Kreu/Kalendari/Takimet/Ekonomia/Më shumë. Për biznese vetëm-porosi, "Kalendari/Takimet" s'kanë vlerë → **rekomandim: bottom-nav adaptive sipas mode** (porosi → Porositë/Kërkesa).

---

## 6) REKOMANDIME TË PRIORITIZUARA (impact × lehtësi)
**Bëj tani (i lartë, i lehtë):**
1. **Undo** te toast për anulim/no-show (parandalon humbje + stres).
2. **Konfirmim i lehtë** për swipe-anulim.
3. **Bottom-nav adaptive** sipas mode (porosi vs takime).

**Pas kësaj (i lartë, mesatar):**
4. **Tur i parë** 3-hapësh në hyrje (vlera e parë shpejt).
5. **Veprime inline** te karta "Sot" (shëno pa lënë faqen).
6. **Pull-to-refresh** + optimistic UI.

**Strukturore (i lartë, por kërkon ty/llogari/të dhëna):**
7. **AI në WhatsApp/IG live** (Meta) — pa këtë, JTBD #1 s'plotësohet.
8. **Testim me 1 biznesmen real** → e vërteta që zëvendëson hamendjen.

---

## 7) METRIKAT QË DUHET TË NDJEKIM (kur kemi përdorues)
- **Time-to-first-value**: sa shpejt nga regjistrimi → AI merr mesazhin e parë.
- **Task success**: % që shtojnë shërbim/orar pa ndihmë.
- **Retention 7/30 ditë**, **churn**, **NPS**.
- **Mesazhe të kapura nga AI / klientë të shpëtuar** (vlera kryesore).

---

### Përfundim
Produkti është funksionalisht i fortë dhe UX-i ka bazë solide. Fitoret e radhës më të mëdha nuk janë "edhe një ngjyrë" — janë **undo/parandalim gabimesh**, **bottom-nav adaptive**, dhe mbi të gjitha **një përdorues real** që na tregon të vërtetën.
