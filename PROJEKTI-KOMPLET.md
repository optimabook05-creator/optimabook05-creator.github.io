# OptimaBook — Dokumenti i plotë (për konsultim)

> Përshkrim i ndershëm, nga fillimi në fund: çfarë është, si është ndërtuar (në detaje), me çfarë teknologjie, sa është mbaruar, dhe si do ta përfundojmë. I shkruar që ta ndash me këdo për konsultim.

---

## 1. Çfarë është OptimaBook

Një platformë **SaaS**: një **recepsionist me AI** që punon 24/7 për biznese me takime (berber, sallon, dentist, klinikë, fizio, avokat, veteriner, palestër, zinxhirë me shumë degë).

Klienti shkruan në **WhatsApp / Telegram / Instagram / telefon (Voice)** në çdo gjuhë → AI kupton, **rezervon nga kalendari real** (kurrë s'shpik orare, kurrë s'mbivendos), dërgon kujtesa, pranon anulime, mbush oraret bosh, rikthen klientë të humbur, kërkon vlerësime. Pronari menaxhon gjithçka nga një **panel**.

**Çmimet:** Start €15 · Pro €49 · Premium €99 në muaj.
**Ambicia:** lider global — për biznese të vogla (një person) dhe të mëdha (shumë staf/lokacione).

---

## 2. Arkitektura — si funksionon (në detaje)

### Pamja e madhe (5 shtresa)
```
KANALET            TRURI AI                 MOTORI            DATABAZA
WhatsApp/Telegram  (kupton + flet)          (rezervon,        (e vërteta
/Instagram/Voice → rregulla+parser+state  → s'mbivendos)   →  e vetme)
                   + LLM (rezervë)                              │
                                                               ▼
                                                        PANELI i pronarit
```
**Parimi i artë:** AI vetëm *kupton dhe flet*. **Rezervimin e bën MOTORI** (logjikë, jo AI). **Databaza është e vërteta e vetme.** Kështu kurrë s'shpiket një orar dhe kurrë s'mbivendosen dy klientë.

### Rrjedha e plotë e një mesazhi (hap pas hapi)
1. Klienti shkruan në Telegram/WhatsApp.
2. Webhook-u (funksioni `telegram`/`whatsapp`) merr mesazhin, ngarkon **historikun** (tabela `messages`, 10 të fundit), e ruan mesazhin.
3. Thërret **trurin `chat`** me: business_id, teksti, historiku, kanali, chat_id.
4. `chat` ngarkon **kontekstin** (biznesi, shërbimet, oraret, stafi) + **gjendjen e strukturuar** (`conversation_state`: shërbim/datë/orë/hap).
5. **Shtresa 1 — RREGULLAT (falas, deterministike):**
   - parser: ditë/orë/periudhë/shërbim (kupton `11:00`, `1100`, `ora pes`, `mas 4`, `sonte`, gabime drejtshkrimore)
   - state machine: bashkon mesazhin me gjendjen → di çfarë mungon → ofron orare ose rezervon
   - trajton: përshëndetje, çmime, orar/adresë, anulim, listë pritjeje
6. **Shtresa 2 — LLM (vetëm nëse rregullat s'mjaftojnë):** ndërton oraret e lira (10 ditë) + gjendjen + historikun → thërret modelin (Gemini ose GPT) → merr JSON {reply, wants_to_book, service, date, time}.
7. **MOTORI (doBook):** ri-kontrollon disponueshmërinë (mbi gjithë stafin = kapacitet paralel), zgjedh një staf të lirë, fut takimin. Nëse s'është e lirë → refuzon (mbron databazën).
8. Përgjigja kthehet → ruhet → dërgohet te klienti. Pas rezervimit, gjendja pastrohet.

### Komponentët kryesorë
- **Frontend (faqja + paneli):** HTML/CSS/JS i pastër, PWA, dizajn "Milk Glass" (glassmorphism). Pa "build step".
- **Databaza (Postgres/Supabase):** tabela: businesses, services, working_hours, time_blocks, appointments, notifications, messages, waitlist, winback_log, locations, staff, conversation_state. **Row Level Security (RLS):** çdo pronar prek VETËM të dhënat e veta — e garantuar nga databaza.
- **Truri AI (`chat`):** hibrid — rregulla falas + parser + state machine + LLM rezervë. **Model-agnostik:** ndërrohet Gemini↔GPT me një cilësim.
- **Motori i rezervimeve:** logjikë (jo AI), transaksional, kapacitet paralel për staf.
- **Automatizimet (cron/trigger):**
  - `reminders` — çdo ditë dërgon kujtesat e nesërme
  - `fill-slot` — kur dikush anulon, lajmëron klientin e parë në listën e pritjes
  - `winback` — rikthen klientët pa ardhur prej >60 ditësh
  - `reviews` — ditën pas takimit kërkon vlerësim Google
- **Paneli i pronarit:** hyrje/regjistrim, kalendar (filtër stafi), takimet, bllokimet, **inteligjencë biznesi** (të ardhura, trend, % e AI-së, anulime, ditë/orë pik, shërbime TOP, VIP, ngarkesa javore), listë pritjeje, menaxhim stafi/lokacionesh, link vlerësimesh.

---

## 3. Teknologjia (tech stack)
- **Hosting frontend:** GitHub Pages (falas)
- **Backend:** Supabase — Postgres + RLS + Auth + Edge Functions (Deno/TypeScript) + pg_cron + pg_net
- **AI:** model-agnostik — Google **Gemini** (tani, falas) ose OpenAI **GPT** (gati, qindarka); dalje JSON e strukturuar
- **Kanalet:** Telegram (LIVE), WhatsApp (i ndërtuar, pa lidhur), Instagram/Voice (të planifikuara)
- **Kosto aktuale:** ~$0 (gjithçka në tiere falas)

---

## 4. Çfarë është ndërtuar deri tani (gjendje reale)
✅ Faqja shitëse (sq+en) · ✅ Paneli i plotë i pronarit · ✅ Databaza + siguria (multi-tenant) · ✅ Truri AI hibrid (rregulla + parser + **state machine** + LLM) · ✅ Motori me kapacitet paralel · ✅ **Telegram LIVE** (rezervim/anulim provuar) · ✅ Kujtesa automatike · ✅ Mbushje orare bosh (listë pritjeje) · ✅ Rikthim klientësh · ✅ Vlerësime Google · ✅ Inteligjencë biznesi · ✅ Staf + lokacione · ✅ Mbështetje GPT (model-agnostik) · 🟡 WhatsApp (kodi gati, pa lidhur)

---

## 5. Vendimet & kompromiset kryesore (e ndershme)
- **Falas vs i sofistikuar:** zgjodhëm parser-a falas të bërë me dorë → kosto $0, por kërkojnë përmirësim rast pas rasti. Një **model top (GPT-4o/Claude)** i kupton vetvetiu gabimet/zhargonin → "i sofistikuar nga fillimi", por qindarka për bisedë.
- **Çmimet vs kosto:** veçoritë e shtrenjta AI shkojnë te planet me pagesë → klienti që paguan e mbulon koston → marzh ~95%, nuk humbet para.
- **Hibrid:** shumica e mesazheve trajtohen FALAS nga rregullat; LLM hyn vetëm te rastet e vështira → kosto e ulët + besueshmëri (punon edhe pa LLM).
- **Booking ≠ AI:** AI s'rezervon kurrë drejtpërdrejt; motori validon → zero double-booking (konfirmuar nga rishikim i jashtëm).

---

## 6. Si do ta përfundojmë (roadmap deri në fund)
| Faza | Çfarë | Kush |
|---|---|---|
| **AI cilësi maksimale** | model top (GPT-4o/Claude) + test-suite me 50+ raste reale | user: çelës · unë: kod |
| **WhatsApp** | lidhja (kodi gati) | user: Meta · unë: kod |
| **Pagesat** | abonime Start/Pro/Premium + provë falas 14-ditore | user: llogari · unë: kod |
| **Instagram + Messenger** | kanalet shtesë | user: Meta · unë: kod |
| **Voice AI** | rezervim me telefonatë | user: Twilio · unë: kod |
| **Bizneset e mëdha** | role/leje, raporte (staf+lokacione ✅) | unë |
| **Lançimi** | domain (optimabook.com), ligje/GDPR, regjistrim vetë-shërbim, monitorim | user+unë |
| **Më vonë (vite)** | modeli i vetin i trajnuar + marketplace | — |

---

## 7. Sa kemi mbaruar
- **Produkti bazë (një biznes, Telegram): ~85%**
- **Vizioni i plotë global (gjithë kanalet + pagesa + voice + të mëdhenjtë): ~50%**

## 8. Vlerësimi i ndershëm + rreziqet
- **E fortë:** arkitektura është e saktë (engine i ndarë, RLS, hibrid, model-agnostik) — e konfirmuar nga rishikim i pavarur.
- **Boshllëku kryesor:** cilësia e të kuptuarit në mesazhe të çuditshme → zgjidhet me model top (qindarka), jo me më shumë rregulla.
- **Rreziku #1 real (jo teknik):** ende **0 klientë realë.** Avantazhi afatgjatë (të dhëna + kosto ndërrimi + rrjet) ndërtohet vetëm me biznese reale. Hapi më i vlefshëm: **klienti i parë real.**
- **E vërteta për "perfekt nga fillimi":** asnjë softuer (as Google/OpenAI) s'del perfekt — ndërtohet, testohet, përmirësohet. Klasi botëror = arkitekturë e saktë + përmirësim i shpejtë + model top, jo zero përsëritje.

---

*Dokument i gjallë. Përditësohet me përparimin.*
