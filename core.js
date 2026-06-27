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

  const OB = { pad, hm, toMin, toHM, round2, durToMin, bestUnitPrice, computeSlots, overlaps, fieldVisible, extractAmounts, replyPriceOk };
  root.OB = OB;
  if (typeof module !== "undefined" && module.exports) module.exports = OB;
})(typeof globalThis !== "undefined" ? globalThis : this);
