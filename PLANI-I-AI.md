# OptimaBook — Plani i plotë i AI-së (Agjenti i nivelit botëror)

> Si do të jetë dhe si do të funksionojë truri i OptimaBook — për small, big DHE complex business. I shkruar për konsultim.
>
> **Parimi mbi gjithçka:** AI-ja *kupton dhe vendos*; **motori deterministik ekzekuton dhe validon**; **databaza është e vërteta e vetme.** AI s'rezervon kurrë drejtpërdrejt → zero gabime kritike.

---

## 1. Vizioni
Një **agjent AI** që vepron si recepsionisti + asistenti më i mirë për çdo biznes me takime — nga një berber i vetëm te një zinxhir klinikash me shumë degë. Kupton çdo gjuhë/mënyrë të të folurit, trajton rezervim/anulim/zhvendosje/FAQ/kërkesa komplekse, kalon te njeriu kur duhet, kurrë s'gabon te rezervimet, dhe bëhet më i zgjuar me të dhënat.

---

## 2. Arkitektura e plotë (10 shtresa)

```
1. KANALET      WhatsApp · Telegram · Instagram · Messenger · Voice · Web
       ↓
2. PARA-PROCESIM  idempotency · rate-limit · normalizim · parser · gjuha
       ↓
3. MEMORIA       gjendje bisede (FSM) · histori · CRM (profile klientësh)
       ↓
4. ORKESTRATORI  Router (rregulla/model i lirë/model i fortë) + AGENT LOOP
       ↓            ↘ thërret mjetet (tools) në cikël
5. KNOWLEDGE (RAG)  politika/FAQ të biznesit → përgjigje të sakta
       ↓
6. MOTORI        disponueshmëri · resurse · rregulla komplekse · transaksione
       ↓
7. AUTOMATIZIME  kujtesa · mbushje orari · win-back · review · fushata
       ↓
8. HUMAN HANDOFF kalon te njeriu kur s'di / kërkohet
9. MODELET       rregulla→model i lirë→model i fortë (agnostik) → fine-tuned (vite)
10. OBSERVABILITY logje · metrika · eval-suite (përmirësim i vazhdueshëm)
```

---

## 3. Si funksionon (agent loop me mjete — zemra moderne)

Sot AI-ja kthen një JSON fiks. **Niveli botëror = "tool-calling agent loop":** AI-së i jepen **mjete** dhe i thërret vetë në cikël derisa të mbarojë detyrën:

**Mjetet (skills) e agentit:**
- `get_availability(service, date, staff?, location?)`
- `book(service, date, time, staff?, customer)`
- `cancel(appointment)` · `reschedule(appointment, new_time)`
- `lookup_customer(chat_id)` · `get_history(customer)`
- `search_knowledge(query)` ← RAG mbi FAQ/politikat
- `add_to_waitlist(...)` · `get_prices()` · `get_hours()`
- `escalate_to_human(reason)`

**Shembull (klinikë komplekse):** *"Dua pastrim javën tjetër me Dr. Anën te dega qendër, dhe kam një pyetje për sigurimin."*
1. Para-procesim → parser (service=pastrim, ~javën tjetër, staf=Dr Ana, lokacion=qendër)
2. Orkestratori → kompleks → model i fortë + mjete
3. Agjenti thërret `get_availability(...)` → motori kthen orare reale
4. Agjenti thërret `search_knowledge("sigurim")` → RAG kthen politikën
5. Përgjigje: ofron orare + përgjigjet për sigurimin
6. Klienti zgjedh → `book(...)` → motori validon (Dr Ana e lirë, dhoma e lirë, s'mbivendoset) → konfirmon
7. Nëse diçka e paqartë → `escalate_to_human`

**Guardrails:** çdo mjet rezervimi **ri-validon te motori**; AI s'shkruan kurrë vetë → kurrë double-booking, kurrë orar i shpikur.

---

## 4. Knowledge Base (RAG) — kritike për complex
Biznesi ngarkon **politika, FAQ, rregulla speciale, detaje shërbimesh** → ndahen në copa → embeddings → vector store. Agjenti thërret `search_knowledge` → përgjigjet **saktë** për pyetje specifike (anulime, çmime speciale, përgatitje para procedurës, sigurim). Pa këtë, complex business s'mbulohet.

## 5. Memoria (3 nivele)
- **E shkurtër:** gjendja e bisedës (FSM rigoroze: intent → service → date → time → confirm → booked)
- **Bisedore:** historiku i mesazheve
- **Afatgjatë (CRM):** profili i klientit — preferenca, historik, frekuencë, no-show risk, stafi i preferuar, LTV. **Të gjithë agjentët/mjetet përdorin të njëjtën memorie.**

## 6. Booking Engine për COMPLEX (jo-AI, deterministik)
- Disponueshmëri mbi **staf + resurse (dhoma/pajisje) + lokacione** (kapacitet paralel)
- Rregulla komplekse: kohëzgjatje, **buffer** mes takimeve, varësi, **grup-rezervime**, **paketa**, **depozita**
- Siguri transaksionale: **mbivendosja e ndaluar nga vetë DB** (EXCLUDE constraint)
- Timezone-korrekt

## 7. Human Handoff
Kur AI s'është i sigurt / klienti kërkon njeri / rast kompleks → njofton pronarin/stafin, kalon biseda te njeriu (live takeover), AI rifillon pas. **Bizneset e mëdha e kërkojnë patjetër.**

## 8. Strategjia e modeleve (agnostike + sipas planit)
- **Rregulla (falas)** → ~70% e mesazheve, $0
- **Model i lirë** (Gemini Flash / GPT-mini) → NLU rutinë
- **Model i fortë** (GPT-4o / Claude) → arsyetim kompleks, tool-calling, RAG, raste të paqarta
- **Router** zgjedh sipas kompleksitetit/kostos/planit; fallback chain; abstraksion provajderi (ndërron çdo model)
- **Vite më vonë:** model i vetin (fine-tuned) mbi të dhënat tona

**Lidhja me planet:** Start = rregulla + model i lirë · Pro = model i fortë + tool-calling + RAG · Premium/Enterprise = agjent i plotë + voice + resurse komplekse + handoff + integrime. Marzhi mbrohet (kostoja te planet me pagesë).

## 9. Observability + Eval
- Logo çdo hap: via (rule/cheap/strong), sukses/dështim, mjetet e thirrura, latencë, tokens, kosto
- Panel metrikash: rule% vs LLM%, % sukses rezervimi, % braktisje, kosto/bisedë
- **Eval-suite:** 100+ biseda reale ekzekutohen automatikisht para çdo deploy → s'ka regres

---

## 10. Ku jemi TANI vs objektivi

| Komponenti | Tani | Objektiv botëror |
|---|---|---|
| Kanalet | Telegram ✓, WhatsApp gati | + IG/Messenger/Voice/Web |
| Para-procesim (parser, normalizim) | ✓ | + më i fortë |
| FSM / gjendje | 🟡 bazike | FSM rigoroze |
| **Tool-calling agent loop** | ❌ (JSON fiks) | ✓ |
| **RAG knowledge base** | ❌ | ✓ |
| **Human handoff** | ❌ | ✓ |
| Motori (staf paralel) | ✓ | + resurse/buffer/grupe/paketa |
| CRM / memorie afatgjatë | ❌ | ✓ |
| Automatizime | ✓ (4) | + fushata |
| Model-agnostik | ✓ (Gemini/GPT) | + router + fine-tuned |
| Observability / eval | ❌ | ✓ |
| Siguri (P0) | ✓ (no-double-book, timezone, idempotency, rate-limit) | + audit/compliance |

---

## 11. Fazat e ndërtimit drejt nivelit botëror
- **Faza A:** model i fortë + **tool-calling agent loop** + FSM rigoroze *(zemra e agjentit modern)*
- **Faza B:** **RAG knowledge base** + **human handoff**
- **Faza C:** rregulla komplekse resursesh (dhoma/pajisje/buffer/grupe/paketa) + CRM
- **Faza D:** observability + eval-suite
- **Faza E:** integrime (Google Calendar/CRM) + Voice agent
- **Faza F (vite):** model i vetin (fine-tuned) + workforce shumë-agjentësh

---

## 12. Të vërtetat e ndershme (për konsulentin)
1. **Niveli botëror për complex KËRKON model të fortë me pagesë** (GPT-4o/Claude, qindarka/bisedë). Falasi ka tavan. Marzhi mbahet me tierim.
2. **Themeli është i saktë** (engine i ndarë, agnostik, multi-tenant, P0 i fortë) — kjo është **shtesë, jo rindërtim nga zero.**
3. **Framework-et e jashtme** (CrewAI/LangGraph/Lindy/OpenCopilot) thërrasin të njëjtat modele poshtë — s'janë tru magjik. Për korrektësi jetike, motori ynë + LLM me tool-calling është më i mirë.
4. **Rreziku #1 s'është teknik — janë 0 klientët realë.** Ndërto për complex, por çdo fazë financohet nga klientët realë.

---
*Dokument i gjallë. Përditësohet me përparimin.*
