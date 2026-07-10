/* =====================================================================
   OptimaBook — CORE (logjika e pastër, e testueshme)
   Pa DOM, pa rrjet, pa gjendje globale → e njëjta logjikë përdoret nga
   paneli (app.html), faqja publike (book.html) DHE testet (node:test).
   Një burim i vetëm i së vërtetës për: kohën, çmimet me shumicë, slotet.
   UMD: bashkëngjitet te globalThis.OB dhe te module.exports (Node).
   ===================================================================== */
(function (root) {
  "use strict";

  const pad = (n) => String(n).padStart(2, "0");
  const hm = (t) => (t ? String(t).slice(0, 5) : t);              // "09:00:00" -> "09:00"
  const toMin = (t) => { const [h, m] = String(t).split(":").map(Number); return (h || 0) * 60 + (m || 0); };
  const toHM = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

  // Para pa gabime presjeje dhjetore (float)
  const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

  // Kohëzgjatja në minuta për motorin e kalendarit (vetëm min/orë janë slote reale)
  function durToMin(value, unit) {
    const v = Math.max(0, +value || 0);
    if (unit === "min") return Math.max(5, v || 30);
    if (unit === "hour") return Math.max(5, v * 60 || 30);
    return 30; // ditë/javë/muaj/vit/none → s'janë slote; default për motorin
  }

  // Çmimi/njësi sipas sasisë: shkalla më e mirë (min_qty më e madhe që ≤ qty), përndryshe çmimi bazë
  function bestUnitPrice(basePrice, tiers, qty) {
    let best = Number(basePrice) || 0;
    let bestQ = -1;
    for (const t of (tiers || [])) {
      const mq = Number(t.min_qty);
      if (mq <= qty && mq > bestQ) { best = Number(t.unit_price) || 0; bestQ = mq; }
    }
    return best;
  }

  // Gjeneron oraret e lira — ZEMRA e saktësisë së rezervimit.
  // opts: { openMin, closeMin, durMin, stepMin=30, busy:[[startMin,endMin]], nowMin=null, includePast=false }
  // busy = takimet (me kohëzgjatje) + bllokimet + pushimet, të gjitha si intervale minutash.
  function computeSlots(opts) {
    const open = opts.openMin, close = opts.closeMin;
    const dur = Math.max(5, opts.durMin || 30);
    const step = Math.max(5, opts.stepMin || 30);
    const busy = opts.busy || [];
    const nowMin = (opts.nowMin == null) ? null : opts.nowMin;
    const includePast = !!opts.includePast;
    const out = [];
    if (open == null || close == null) return out;
    for (let t = open; t + dur <= close; t += step) {
      if (!includePast && nowMin != null && t <= nowMin) continue;
      if (busy.some(([s, e]) => t < e && t + dur > s)) continue; // mbivendosje
      out.push(toHM(t));
    }
    return out;
  }

  // A mbivendoset [aStart, aStart+aDur) me ndonjë interval të zënë? (përdoret edhe nga serveri konceptualisht)
  function overlaps(aStart, aDur, intervals) {
    return (intervals || []).some(([s, e]) => aStart < e && aStart + aDur > s);
  }

  // A shfaqet një fushë për një artikull? Override per-artikull (hidden_fields) > default global.
  function fieldVisible(key, hiddenFields, globalDefault) {
    if (Array.isArray(hiddenFields)) return !hiddenFields.includes(key);
    return globalDefault !== false; // pa override → ndjek default-in global
  }

  // Roja anti-halucinacion çmimi: nxjerr shumat me MONEDHË nga teksti (€, euro, eur, lek, lekë).
  // (Nuk përfshijmë "all" si monedhë — përplaset me fjalën angleze "all".)
  function extractAmounts(text) {
    const out = [];
    const re = /(?:€|eur|euro|lek[eë]?)\s*(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?)\s*(?:€|eur|euro|lek[eë]?)/gi;
    const s = String(text || "");
    let m;
    while ((m = re.exec(s))) {
      const num = (m[1] != null ? m[1] : m[2]);
      if (num != null) out.push(round2(String(num).replace(",", ".")));
    }
    return out;
  }
  // A janë TË GJITHA çmimet e përmendura në përgjigje brenda listës së lejuar?
  // (Nëse AI shpik një çmim që s'është te të dhënat reale → false → sistemi e zëvendëson.)
  function replyPriceOk(reply, allowed) {
    const amts = extractAmounts(reply);
    if (!amts.length) return true;
    const ok = new Set((allowed || []).map((a) => round2(a)));
    return amts.every((a) => ok.has(a));
  }

  // Zbulon përpjekje manipulimi (prompt-injection / jailbreak) te mesazhi i klientit — SQ + EN.
  // Deterministik → i testueshëm; sistemi forcon prompt-in kur kjo është true.
  function looksLikeInjection(text) {
    const t = String(text || "").toLowerCase();
    return /(ignore|disregard|forget|override)\b.{0,30}\b(instruction|instructions|rule|rules|prompt)\b/.test(t)
      || /\b(act as|pretend to be|pretend you are|roleplay as|system prompt|developer mode|jailbreak|new instructions)\b/.test(t)
      || /\byou are now (a |an |the |my )/.test(t)
      || /\breveal your (instructions|prompt|rules|system)\b/.test(t)
      || /(injoro|shpërfill|harro)\b.{0,30}\b(udhëzim|udhëzimet|rregull|rregullat|prompt)\b/.test(t)
      || /\b(tani je një|tani ti je|bëhu si|shfaq (udhëzimet|rregullat)|(udhëzimet|rregullat) e tua)\b/.test(t);
  }

  // NLU: kupton orën nga teksti shqip/anglisht (dialekt, "e gjysmë/çerek/pa çerek", paradite/mbrëma…)
  // Kthen "HH:MM" ose null. (Pasqyrohet te funksioni `chat`; këtu testohet nga CI.)
  function parseTime(raw) {
    const tx = String(raw || "").toLowerCase().replace(/ë/g, "e").replace(/ç/g, "c");
    if (/\bmesdite\b/.test(tx)) return "12:00";
    if (/\bmesnate\b/.test(tx)) return "00:00";
    let h = null, min = 0, mer = null, m;
    if ((m = tx.match(/\b(\d{1,2})[:.](\d{2})\s*(am|pm)?\b/))) { h = +m[1]; min = +m[2]; mer = m[3] || null; }
    else if ((m = tx.match(/\b(\d{1,2})\s*(am|pm)\b/))) { h = +m[1]; mer = m[2]; }
    else if ((m = tx.match(/\bpa\s*[cq]erek\s+(\d{1,2})\b/))) { h = +m[1]; }
    else if ((m = tx.match(/\b(?:ora|oren|rreth|nga|tek?|ne|at)\s+(?:ores?\s+)?(\d{1,2})\b/))) { h = +m[1]; }
    else if ((m = tx.match(/\b(\d{1,2})\s+(?:e\s+)?(?:gjys|[cq]erek|paradite|pasdite|mbasdite|mbrem|nate|drek|pm|am)/))) { h = +m[1]; }
    else if ((m = tx.match(/\b([01]?\d|2[0-3])([0-5]\d)\b/))) { h = +m[1]; min = +m[2]; }
    else if ((m = tx.match(/^(\d{1,2})$/))) { h = +m[1]; }
    if (h === null) {
      const NW = { nje: 1, njesh: 1, dy: 2, tre: 3, tri: 3, kater: 4, kat: 4, pese: 5, pes: 5, gjashte: 6, gjasht: 6, shtate: 7, shtat: 7, tete: 8, tet: 8, nente: 9, nent: 9, dhjete: 10, dhjet: 10, njembedhjete: 11, dymbedhjete: 12, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, noon: 12 };
      let w = "";
      const tm = tx.match(/\b(?:ora|oren|ne|at|rreth|nga)\s+([a-z]+)\b/);
      if (tm) w = tm[1];
      else { const tw = tx.match(/\b([a-z]+)\s+(?:e|pa)\s/); if (tw && NW[tw[1]] !== undefined) w = tw[1]; }  // "tre pa njëzet", "dy e gjysmë"
      if (!w) { const so = tx.trim().match(/^([a-z]+)$/); if (so) w = so[1]; }
      if (w && NW[w] !== undefined) h = NW[w];
    }
    if (h !== null && min === 0) {
      // Minuta me fjalë: "pese"=5 … "njezet"=20 … (për "e 20" / "pa 20")
      const MIN = { pese: 5, pes: 5, dhjete: 10, dhjet: 10, pesembedhjete: 15, njezet: 20, njezetepese: 25, gjysme: 30, gjys: 30, tridhjete: 30, tridhjet: 30, dyzet: 40, dyzete: 40, pesedhjete: 50 };
      let mm;
      if (/\bpa\s*[cq]erek\b/.test(tx)) { min = 45; h -= 1; }                                   // "pa çerek" → :45
      else if ((mm = tx.match(/\bpa\s+(\d{1,2})\b/)) && +mm[1] >= 1 && +mm[1] <= 59) { min = 60 - +mm[1]; h -= 1; }   // "pa 20" → :40
      else if ((mm = tx.match(/\bpa\s+([a-z]+)\b/)) && MIN[mm[1]]) { min = 60 - MIN[mm[1]]; h -= 1; }                  // "pa njëzet"
      else if (/\bgjys/.test(tx)) { min = 30; }                                                  // "e gjysmë"
      else if (/\b[cq]erek\b/.test(tx)) { min = 15; }                                            // "e çerek"
      else if ((mm = tx.match(/\be\s+(\d{1,2})\b/)) && +mm[1] >= 1 && +mm[1] <= 59) { min = +mm[1]; }                 // "e 20" → :20
      else if ((mm = tx.match(/\be\s+([a-z]+)\b/)) && MIN[mm[1]]) { min = MIN[mm[1]]; }                               // "e njëzet"
    }
    if (h !== null && h < 0) h += 24;
    if (h === null || h > 23 || min > 59) return null;
    const am = /\b(paradite|mengjes|mengjesi|am)\b/.test(tx);
    const pm = /\b(pasdite|mbasdite|dreke|drek|mbrema|mbremje|mbremjes|mbrem|nate|naten|pm|afternoon|evening|night|noon)\b/.test(tx);
    if (mer === "pm" && h < 12) h += 12;
    else if (mer === "am" && h === 12) h = 0;
    else if (pm && h >= 1 && h <= 11) h += 12;
    else if (am) { if (h === 12) h = 0; }
    else if (h >= 1 && h <= 7) h += 12;
    return toHM(h * 60 + min);
  }

  // NLU: kupton DATËN nga teksti shqip/anglisht (nesër, të hënën, "pas 3 ditësh", "15 korrik", "15/7", "datën 20")
  // Kthen "YYYY-MM-DD" ose null. `todayStr` = baza (timezone i biznesit). Pasqyrohet te `chat`; testohet nga CI.
  function parseDay(raw, todayStr) {
    const tx = String(raw || "").toLowerCase().replace(/ë/g, "e").replace(/ç/g, "c");
    const base = todayStr ? (function (s) { const p = String(s).split("-").map(Number); return new Date(p[0], (p[1] || 1) - 1, p[2] || 1); })(todayStr) : new Date();
    const fmt = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
    const add = (n) => { const d = new Date(base); d.setDate(d.getDate() + n); return fmt(d); };
    if (/\bpasneser\b|day after tomorrow/.test(tx)) return add(2);
    if (/\bneser\b|\bnesr\b|tomorrow/.test(tx)) return add(1);
    if (/\bsot\b|\bsonte\b|\bsont\b|\bsomte\b|\bsonet\b|\btoday\b|\btonight\b/.test(tx)) return fmt(base);
    let m = tx.match(/\bpas\s+(\d{1,2})\s*dit/);
    if (m) return add(+m[1]);                                  // "pas 3 ditësh"
    const MO = { janar: 1, shkurt: 2, mars: 3, prill: 4, maj: 5, qershor: 6, korrik: 7, gusht: 8, shtator: 9, tetor: 10, nentor: 11, dhjetor: 12, january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12 };
    const mre = Object.keys(MO).join("|");
    m = tx.match(new RegExp("\\b(\\d{1,2})\\s+(" + mre + ")\\b")) || tx.match(new RegExp("\\b(" + mre + ")\\s+(\\d{1,2})\\b"));
    if (m) {
      const dd = +(/^\d/.test(m[1]) ? m[1] : m[2]);
      const mo = MO[/^\d/.test(m[1]) ? m[2] : m[1]];
      if (dd >= 1 && dd <= 31) { const d = new Date(base.getFullYear(), mo - 1, dd); if (d < base) d.setFullYear(d.getFullYear() + 1); return fmt(d); }
    }
    m = tx.match(/\b(\d{1,2})[\/.](\d{1,2})(?:[\/.](\d{2,4}))?\b/);   // 15/7 ose 15.07.2026
    if (m) { const dd = +m[1], mo = +m[2]; if (dd >= 1 && dd <= 31 && mo >= 1 && mo <= 12) { let y = m[3] ? (+m[3] < 100 ? 2000 + +m[3] : +m[3]) : base.getFullYear(); const d = new Date(y, mo - 1, dd); if (!m[3] && d < base) d.setFullYear(d.getFullYear() + 1); return fmt(d); } }
    m = tx.match(/\b(?:daten|diten|date)\s+(\d{1,2})\b/);            // "datën 20" (jo "me 5" — përplaset me 'me 5 faqe')
    if (m) { const dd = +m[1]; if (dd >= 1 && dd <= 31) { let d = new Date(base.getFullYear(), base.getMonth(), dd); if (d < base) d = new Date(base.getFullYear(), base.getMonth() + 1, dd); return fmt(d); } }
    const days = [["dielen", 0], ["diel", 0], ["sunday", 0], ["henen", 1], ["hene", 1], ["monday", 1], ["marten", 2], ["marte", 2], ["tuesday", 2], ["merkuren", 3], ["merkure", 3], ["wednesday", 3], ["enjten", 4], ["enjte", 4], ["thursday", 4], ["premten", 5], ["premte", 5], ["friday", 5], ["shtunen", 6], ["shtune", 6], ["saturday", 6]];
    for (const dn of days) {
      if (new RegExp("\\b" + dn[0] + "\\b").test(tx)) {
        const d = new Date(base); let diff = (dn[1] - d.getDay() + 7) % 7; if (diff === 0) diff = 7;
        d.setDate(d.getDate() + diff); return fmt(d);
      }
    }
    return null;
  }

  /* -------------------------------------------------------------------
     KUJTESA E TË DHËNAVE (Faza 1 — paneli i menjëhershëm si aplikacion nativ)
     Tri copëza të pastra, pa DOM e pa rrjet, që paneli i thur bashkë:

     makeCache() — mban listat në kujtesë me "rev" (numër versioni).
       rev rritet sa herë të dhënat ndryshojnë → pamja e di nëse duhet
       rivizatuar apo jo (asnjë rivizatim = asnjë dridhje e kotë).

     makeSeq() — roje kundër garave (race): çdo kërkesë merr një biletë;
       nëse ndërkohë ndodhi një ndryshim lokal (bump), përgjigjet e vjetra
       hidhen poshtë — s'mund të mbishkruajnë kurrë gjendjen më të re.

     listChanged(a,b) — a ndryshoi vërtet lista? (krahasim i thellë, i lirë
       për listat tona ≤ qindra rreshta). Përdoret që rifreskimi në sfond
       të mos prekë DOM-in fare kur asgjë s'ka ndryshuar.
     ------------------------------------------------------------------- */
  function makeCache() {
    const m = new Map(); // key -> { data, rev, at }
    return {
      get(key) { return m.get(key) || null; },
      set(key, data) {
        const e = m.get(key);
        m.set(key, { data, rev: (e ? e.rev + 1 : 1), at: Date.now() });
      },
      /* Ndryshim lokal (optimist): transformo të dhënat + rrit rev.
         Kthen funksionin e rikthimit (rollback) po refuzoi serveri. */
      mutate(key, fn) {
        const e = m.get(key);
        if (!e) return null;
        const before = e.data;
        this.set(key, fn(JSON.parse(JSON.stringify(before))));
        return () => this.set(key, before);
      },
      del(key) { m.delete(key); },
      clear() { m.clear(); },
    };
  }

  function makeSeq() {
    const s = new Map(); // key -> numri aktual i biletës
    return {
      begin(key) { const n = (s.get(key) || 0) + 1; s.set(key, n); return n; },
      valid(key, ticket) { return s.get(key) === ticket; },
      bump(key) { s.set(key, (s.get(key) || 0) + 1); },
    };
  }

  function listChanged(a, b) {
    if (a === b) return false;
    if (a == null || b == null) return true;
    try { return JSON.stringify(a) !== JSON.stringify(b); }
    catch (e) { return true; }
  }

  const OB = { pad, hm, toMin, toHM, round2, durToMin, bestUnitPrice, computeSlots, overlaps, fieldVisible, extractAmounts, replyPriceOk, looksLikeInjection, parseTime, parseDay, makeCache, makeSeq, listChanged };
  root.OB = OB;
  if (typeof module !== "undefined" && module.exports) module.exports = OB;
})(typeof globalThis !== "undefined" ? globalThis : this);
