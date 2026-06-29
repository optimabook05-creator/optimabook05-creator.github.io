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
      const tm = tx.match(/\b(?:ora|oren|ne|at|rreth|nga)\s+([a-z]+)\b/);
      const w = tm ? tm[1] : ((tx.trim().match(/^([a-z]+)$/) || [])[1] || "");
      if (w && NW[w] !== undefined) h = NW[w];
    }
    if (min === 0) {
      if (/\bpa\s*[cq]erek\b/.test(tx)) { min = 45; if (h !== null) h -= 1; }
      else if (/\bgjys/.test(tx)) { min = 30; }
      else if (/\b[cq]erek\b/.test(tx)) { min = 15; }
    }
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

  const OB = { pad, hm, toMin, toHM, round2, durToMin, bestUnitPrice, computeSlots, overlaps, fieldVisible, extractAmounts, replyPriceOk, looksLikeInjection, parseTime };
  root.OB = OB;
  if (typeof module !== "undefined" && module.exports) module.exports = OB;
})(typeof globalThis !== "undefined" ? globalThis : this);
