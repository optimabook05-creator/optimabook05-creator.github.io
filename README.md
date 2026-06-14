# OptimaBook — Recepsionisti AI që nuk fle kurrë

Demo i Fazës 1: platforma ku bizneset e shërbimit (berberë, dentistë, sallone…)
marrin rezervime automatikisht në WhatsApp nga një AI, me kujtesa që ulin mungesat.

**Dygjuhëshe që nga dita e parë**: Shqip + English, e ndërrueshme me butonin
SQ/EN lart djathtas — gjithë ndërfaqja, biseda AI dhe parseri i mesazheve.
Platforma është ndërtuar e pavarur nga modeli AI: në prodhim, "truri" rule-based
zëvendësohet me cilindo LLM (vendimi merret me test krahasues në fund) dhe
mbulon automatikisht çdo gjuhë të botës.

## Live

- **Faqja:** https://user555-cyber.github.io/rezervoai/
- **Demoja:** https://user555-cyber.github.io/rezervoai/demo.html

Lokalisht: hap `index.html` (faqja shitëse) ose `demo.html` (demoja) në çdo browser.
PWA: nga telefoni, "Add to Home Screen" — instalohet si app dhe hapet edhe offline.

## Çfarë tregon demo

| Pjesa | Ku | Çfarë provon |
|---|---|---|
| Biseda AI | telefoni majtas | klienti shkruan shqip, AI rezervon vetëm orare reale |
| Kalendari i pagabueshëm | paneli → 📅 | asnjë orar i dyfishuar, kurrë (rezervim transaksional) |
| Kujtesat | paneli → 📋 → 🔔 | klienti konfirmon ose anulon — orari lirohet vetë |
| Paneli i pronarit | djathtas | bllokime, takime manuale, njoftime, statistika |
| Regjistrimi 5-minutësh | ⚙ Cilësimet | premtimi: biznesi gati për klientë në nën 5 min |

## Provo këto në bisedë

- `Pershendetje, a ke neser pasdite nje orar per qethje?`
- `Sa kushtojne sherbimet?`
- `A ke te shtunen ne 4 nje orar?`
- `Dua te anuloj takimin`
- diçka e çuditshme (p.sh. `a ma bën flokun si të Messit?`) → AI nuk hamendëson,
  ia kalon pronarit te 🔔 Njoftimet

## Arkitektura (e vlefshme edhe për produksionin)

- **Motori i rezervimeve** (`freeSlots`, `book`) është burimi i vetëm i së vërtetës —
  AI s'ka të drejtë të shpikë orare, vetëm të pyesë motorin.
- Në produksion, biseda rregull-bazë zëvendësohet me **Claude API (tool-use)**
  mbi të njëjtat funksione, dhe WhatsApp lidhet me **Meta Cloud API**.
- Faza 2: Instagram DM + Messenger + vlerësime Google.
  Faza 3: riaktivizim automatik i klientëve (Premium).
  Faza 4: self-service global.

## Çmimet (plani)

- **Start — 15$/muaj**: WhatsApp + rezervime + kujtesa
- **Pro — 49$/muaj**: + Instagram/Messenger, staf të shumtë, vlerësime Google, marketing
- **Premium — 99$/muaj**: + riaktivizim automatik, shumë lokacione, suport prioritar
