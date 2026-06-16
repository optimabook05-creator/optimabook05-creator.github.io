// =====================================================================
// OptimaBook — Truri AI (HIBRID)
// Shtresa 1: RREGULLA falas (përshëndetje, çmime, orar, rezervim i plotë,
//            anulim) — pa kuotë, punojnë gjithmonë.
// Shtresa 2: AI (Gemini) — vetëm për mesazhet që rregullat s'i kapin dot
//            (dialekt, fraza të paqarta, gjuhë të tjera).
// Nëse AI s'është i disponueshëm (kuotë), kthen mesazh të sjellshëm, jo "...".
//
// Hyrje (POST JSON): { business_id, text, client_name?, client_phone?, history?, channel?, chat_id? }
// Dalje (JSON):      { reply, booked?, cancelled?, via }
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);
const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY")!;
const MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash-lite";
const SLOT_STEP = 30;
const DAYS_AHEAD = 10;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/* ---------------- Ndihmës kohe ---------------- */
const pad = (n: number) => String(n).padStart(2, "0");
const hm = (t: string) => (t ? t.slice(0, 5) : t);
const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const toHM = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const fmtDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDate = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SQ_DAYS = ["E diel", "E hënë", "E martë", "E mërkurë", "E enjte", "E premte", "E shtunë"];
const SQ_MON = ["janar", "shkurt", "mars", "prill", "maj", "qershor", "korrik", "gusht", "shtator", "tetor", "nëntor", "dhjetor"];
const EN_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const EN_MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function norm(s: string) {
  return (s || "").toLowerCase().replace(/ë/g, "e").replace(/ç/g, "c").replace(/['']/g, " ").replace(/\s+/g, " ").trim();
}
const isSqLang = (biz: any, lang?: string) => (lang || biz.lang || "sq").toLowerCase().startsWith("sq");
const isEnLang = (biz: any, lang?: string) => (lang || biz.lang || "sq").toLowerCase().startsWith("en");

function humanDay(dateStr: string, sq: boolean): string {
  const d = parseDate(dateStr);
  const today = fmtDate(new Date());
  const tom = fmtDate(new Date(Date.now() + 864e5));
  const days = sq ? SQ_DAYS : EN_DAYS;
  const mon = sq ? SQ_MON : EN_MON;
  let label = `${days[d.getDay()]}, ${d.getDate()} ${mon[d.getMonth()]}`;
  if (dateStr === today) label = (sq ? "sot, " : "today, ") + label;
  else if (dateStr === tom) label = (sq ? "nesër, " : "tomorrow, ") + label;
  return label;
}

function buildConfirmation(svc: any, dateStr: string, time: string, biz: any, lang?: string): string | null {
  if (!isSqLang(biz, lang) && !isEnLang(biz, lang)) return null;
  const sq = isSqLang(biz, lang);
  const addr = biz.address ? `\n📍 ${biz.name}, ${biz.address}` : `\n📍 ${biz.name}`;
  const price = Number(svc.price) ? ` · ${svc.price}€` : "";
  return sq
    ? `✅ U rezervua! ${svc.name} — ${humanDay(dateStr, true)}, ora ${time}${price}${addr}\nTë presim! 🙌`
    : `✅ Booked! ${svc.name} — ${humanDay(dateStr, false)}, ${time}${price}${addr}\nSee you! 🙌`;
}

function buildCancellation(dateStr: string, time: string, biz: any, lang?: string): string | null {
  if (!isSqLang(biz, lang) && !isEnLang(biz, lang)) return null;
  const sq = isSqLang(biz, lang);
  return sq
    ? `Takimi yt i ${humanDay(dateStr, true)} në orën ${time} u anulua dhe orari u lirua. Kur të duash një tjetër, më shkruaj! 😊`
    : `Your appointment on ${humanDay(dateStr, false)} at ${time} has been cancelled and the slot is free again. Message me anytime to rebook! 😊`;
}

/* ---------------- Motori i orareve ---------------- */
function freeSlots(dateStr: string, durMin: number, hoursRow: any, appts: any[], blocks: any[], includePast = false): string[] {
  if (!hoursRow || hoursRow.is_closed || !hoursRow.open_time || !hoursRow.close_time) return [];
  const open = toMin(hm(hoursRow.open_time));
  const close = toMin(hm(hoursRow.close_time));
  const busy = appts.map((a) => [toMin(hm(a.appt_time)), toMin(hm(a.appt_time)) + a.dur])
    .concat(blocks.map((b) => [toMin(hm(b.from_time)), toMin(hm(b.to_time))]));
  const isToday = dateStr === fmtDate(new Date());
  const nowM = new Date().getHours() * 60 + new Date().getMinutes();
  const out: string[] = [];
  for (let t = open; t + durMin <= close; t += SLOT_STEP) {
    if (!includePast && isToday && t <= nowM) continue;
    if (!busy.some(([s, e]) => t < e && t + durMin > s)) out.push(toHM(t));
  }
  return out;
}

async function loadContext(businessId: string) {
  const [{ data: biz }, { data: services }, { data: hours }, { data: staff }] = await Promise.all([
    supabase.from("businesses").select("*").eq("id", businessId).maybeSingle(),
    supabase.from("services").select("*").eq("business_id", businessId).eq("active", true).order("sort_order"),
    supabase.from("working_hours").select("*").eq("business_id", businessId),
    supabase.from("staff").select("id,name,location_id").eq("business_id", businessId).eq("active", true).order("sort_order"),
  ]);
  return { biz, services: services || [], hours: hours || [], staff: staff || [] };
}

function hoursByDow(hours: any[]) {
  const map: Record<number, any> = {};
  for (const h of hours) map[h.weekday] = h;
  return map;
}

async function busyFor(businessId: string, dateStr: string, svcDur: Record<string, number>) {
  const [{ data: appts }, { data: blocks }] = await Promise.all([
    supabase.from("appointments").select("appt_time,service_id,staff_id").eq("business_id", businessId).eq("appt_date", dateStr).neq("status", "cancelled"),
    supabase.from("time_blocks").select("from_time,to_time,staff_id").eq("business_id", businessId).eq("block_date", dateStr),
  ]);
  return {
    appts: (appts || []).map((a) => ({ appt_time: a.appt_time, dur: svcDur[a.service_id] || SLOT_STEP, staff_id: a.staff_id })),
    blocks: blocks || [],
  };
}

// Oraret e lira për një staf të vetëm (filtron takimet/bllokimet e tij + bllokimet e gjithë biznesit).
function freeSlotsForStaff(dateStr: string, durMin: number, hoursRow: any, appts: any[], blocks: any[], staffId: string, includePast = false): string[] {
  const fAppts = appts.filter((a) => a.staff_id === staffId);
  const fBlocks = blocks.filter((b: any) => !b.staff_id || b.staff_id === staffId);
  return freeSlots(dateStr, durMin, hoursRow, fAppts, fBlocks, includePast);
}

// Bashkimi i orareve të lira mbi gjithë stafin (kapacitet paralel). Pa staf → sjellja e vjetër (kapacitet 1).
function freeSlotsUnion(dateStr: string, durMin: number, hoursRow: any, appts: any[], blocks: any[], staff: any[], includePast = false): string[] {
  if (!staff || !staff.length) return freeSlots(dateStr, durMin, hoursRow, appts, blocks, includePast);
  const set = new Set<string>();
  for (const s of staff) for (const t of freeSlotsForStaff(dateStr, durMin, hoursRow, appts, blocks, s.id, includePast)) set.add(t);
  return [...set].sort();
}

// Kthen një staf të lirë për këtë orë (ose null nëse pa staf / asnjë i lirë).
function pickStaffFor(dateStr: string, durMin: number, hoursRow: any, appts: any[], blocks: any[], staff: any[], time: string): string | null {
  if (!staff || !staff.length) return null;
  for (const s of staff) {
    if (freeSlotsForStaff(dateStr, durMin, hoursRow, appts, blocks, s.id).includes(time)) return s.id;
  }
  return null;
}

/* ---------------- Parsuesi (shqip + anglisht) ---------------- */
function parseDay(tx: string): string | null {
  if (tx.includes("pasneser") || tx.includes("day after tomorrow")) return fmtDate(new Date(Date.now() + 2 * 864e5));
  if (tx.includes("neser") || tx.includes("tomorrow")) return fmtDate(new Date(Date.now() + 864e5));
  if (/\bsot\b/.test(tx) || /\btoday\b/.test(tx) || /\btonight\b/.test(tx)) return fmtDate(new Date());
  const days: [string, number][] = [
    ["e diel", 0], ["sunday", 0], ["e hene", 1], ["te henen", 1], ["monday", 1],
    ["e marte", 2], ["te marten", 2], ["tuesday", 2], ["e merkure", 3], ["te merkuren", 3], ["wednesday", 3],
    ["e enjte", 4], ["te enjten", 4], ["thursday", 4], ["e premte", 5], ["te premten", 5], ["friday", 5],
    ["e shtune", 6], ["te shtunen", 6], ["saturday", 6],
  ];
  for (const [name, dow] of days) {
    if (tx.includes(name)) {
      const d = new Date();
      let diff = (dow - d.getDay() + 7) % 7;
      if (diff === 0) diff = 7;
      d.setDate(d.getDate() + diff);
      return fmtDate(d);
    }
  }
  return null;
}
function parsePeriod(tx: string): [number, number] | null {
  if (tx.includes("paradite") || tx.includes("mengjes") || tx.includes("morning")) return [0, 12 * 60];
  if (tx.includes("pasdite") || tx.includes("dreke") || tx.includes("afternoon") || tx.includes("noon")) return [12 * 60, 18 * 60];
  if (tx.includes("mbremje") || tx.includes("darke") || tx.includes("evening") || tx.includes("tonight")) return [17 * 60, 24 * 60];
  return null;
}
function periodLabel(tx: string): string | null {
  if (tx.includes("paradite") || tx.includes("mengjes") || tx.includes("morning")) return "morning";
  if (tx.includes("pasdite") || tx.includes("dreke") || tx.includes("afternoon") || tx.includes("noon")) return "afternoon";
  if (tx.includes("mbremje") || tx.includes("darke") || tx.includes("evening") || tx.includes("tonight")) return "evening";
  return null;
}
function parseTime(tx: string): string | null {
  let h: number | null = null, min = 0, mer: string | null = null;
  let m = tx.match(/\b(\d{1,2})[:.](\d{2})\s*(am|pm)?\b/);
  if (m) { h = +m[1]; min = +m[2]; mer = m[3] || null; }
  else {
    m = tx.match(/\b(\d{1,2})\s*(am|pm)\b/);
    if (m) { h = +m[1]; mer = m[2]; }
    else { m = tx.match(/\b(?:ora|oren|ne|tek?|at)\s+(\d{1,2})\b/) || tx.match(/^(\d{1,2})$/); if (m) h = +m[1]; }
  }
  if (h === null || h > 23 || min > 59) return null;
  if (mer === "pm" && h < 12) h += 12;
  else if (mer === "am" && h === 12) h = 0;
  else if (!mer && h >= 1 && h <= 7) h += 12; // pasdite si parazgjedhje
  return toHM(h * 60 + min);
}
function parseService(tx: string, services: any[]): any {
  let best = null, bestScore = 0;
  for (const s of services) {
    const words = norm(s.name).split(/[^a-z0-9]+/).filter((w) => w.length > 2);
    const score = words.filter((w) => tx.includes(w.slice(0, 4))).length;
    if (score > bestScore) { bestScore = score; best = s; }
  }
  return best;
}

/* ---------------- Veprime (të përbashkëta për rregullat dhe AI) ---------------- */
async function doBook(ctx: any, svc: any, dateStr: string, time: string, lang?: string) {
  const { businessId, biz, svcDur, staff, client_name, client_phone, channel, chat_id } = ctx;
  const { appts, blocks } = await busyFor(businessId, dateStr, svcDur);
  const hoursRow = ctx.hMap[parseDate(dateStr).getDay()];
  const free = freeSlotsUnion(dateStr, svc.duration_min, hoursRow, appts, blocks, staff);
  if (!free.includes(time)) {
    return { booked: false, reply: null, alternatives: free.slice(0, 3) };
  }
  // Zgjedh një staf të lirë (null nëse biznes me një person)
  const staffId = pickStaffFor(dateStr, svc.duration_min, hoursRow, appts, blocks, staff, time);
  const st = staffId ? (staff || []).find((x: any) => x.id === staffId) : null;
  const row: any = {
    business_id: businessId, service_id: svc.id,
    client_name: client_name || "Klient", client_phone: client_phone || null,
    appt_date: dateStr, appt_time: time, status: "pending", source: "ai",
    channel: channel || null, chat_id: chat_id || null,
  };
  // Vendos staf vetëm kur ka staf (do të thotë që enterprise.sql është ekzekutuar)
  if (staffId) { row.staff_id = staffId; row.location_id = st ? st.location_id : null; }
  const { error } = await supabase.from("appointments").insert(row);
  if (error) return { booked: false, reply: null, alternatives: [] };
  await supabase.from("notifications").insert({ business_id: businessId, text: `✅ ${client_name || "Klient"} — ${svc.name}, ${dateStr} ${time}${st ? " (" + st.name + ")" : ""}` });
  return { booked: true, reply: buildConfirmation(svc, dateStr, time, biz, lang) };
}

async function doCancel(ctx: any, lang?: string) {
  const { businessId, biz, chat_id } = ctx;
  if (!chat_id) return { cancelled: false, reply: null };
  const today = fmtDate(new Date());
  const { data: up } = await supabase.from("appointments").select("*")
    .eq("business_id", businessId).eq("chat_id", chat_id).neq("status", "cancelled")
    .gte("appt_date", today).order("appt_date").order("appt_time").limit(1).maybeSingle();
  if (!up) return { cancelled: false, reply: null };
  await supabase.from("appointments").update({ status: "cancelled" }).eq("id", up.id);
  await supabase.from("notifications").insert({ business_id: businessId, text: `❌ ${up.client_name} anuloi — ${up.appt_date} ${hm(up.appt_time)}` });
  return { cancelled: true, reply: buildCancellation(up.appt_date, hm(up.appt_time), biz, lang) };
}

// Shton klientin në listën e pritjes (mbushja automatike e orareve bosh).
async function addWaitlist(ctx: any, svc: any, dateStr: string, period: string | null) {
  const { businessId, channel, chat_id, client_name } = ctx;
  await supabase.from("waitlist").insert({
    business_id: businessId, service_id: svc?.id || null,
    client_name: client_name || "Klient", channel: channel || null, chat_id: chat_id || null,
    desired_date: dateStr, period: period || null, status: "waiting",
  });
}

/* ---------------- Shtresa 1: RREGULLAT (falas) ---------------- */
function svcListText(services: any[]) {
  return services.map((s) => `• ${s.name} — ${s.duration_min} min — ${s.price}€`).join("\n");
}
function hoursListText(hours: any[], sq: boolean) {
  const map = hoursByDow(hours);
  const days = sq ? SQ_DAYS : EN_DAYS;
  return days.map((n, i) => `${n}: ${map[i] && !map[i].is_closed ? hm(map[i].open_time) + "–" + hm(map[i].close_time) : (sq ? "pushim" : "closed")}`).join("\n");
}

async function tryRules(ctx: any): Promise<any | null> {
  const { biz, services, hours, hMap, svcDur, businessId, text, client_name, staff } = ctx;
  // Rregullat japin përgjigje vetëm për biznese shqip/anglisht
  if (!isSqLang(biz) && !isEnLang(biz)) return null;
  const sq = isSqLang(biz);
  const tx = norm(text);
  const name = (client_name || "").split(" ")[0];
  const hist: any[] = ctx.history || [];

  // Pranim i listës së pritjes (klienti tha "po" pas OFERTËS për mbushje orari).
  // Kërkojmë frazën unike të ofertës (jo thjesht "listën e pritjes"), që mesazhi
  // i konfirmimit ("U shtove në listën e pritjes…") të mos ri-shtojë gabimisht.
  const lastBot = [...hist].reverse().find((m: any) => m.role === "bot");
  if (lastBot && /(shkruaj "po"|reply "yes")/i.test(lastBot.text || "") &&
      /^(po|yes|dakord|okay|ok|sure|patjet[eë]r|e dua|me intereson|yes please|po ju lutem)\b/.test(tx) && ctx.chat_id) {
    let wDay = parseDay(tx), wPeriod = periodLabel(tx), wSvc = parseService(tx, services);
    for (let i = hist.length - 1; i >= 0 && i >= hist.length - 8; i--) {
      const ht = norm(hist[i].text || "");
      if (!wDay) wDay = parseDay(ht);
      if (!wSvc) wSvc = parseService(ht, services);
      if (!wPeriod) wPeriod = periodLabel(ht);
    }
    if (!wSvc && services.length === 1) wSvc = services[0];
    if (wDay) {
      await addWaitlist(ctx, wSvc, wDay, wPeriod);
      return { reply: sq ? `U shtove në listën e pritjes për ${humanDay(wDay, true)} ✅ Të lajmëroj menjëherë sapo lirohet një orar! 🙌` : `You're on the waiting list for ${humanDay(wDay, false)} ✅ I'll message you the moment a slot frees up! 🙌`, via: "rule" };
    }
  }

  // Anulim
  if (/(anulo|anullo|nuk vij|s vij|s mund|nuk mund|hiqe takimin|fshije takimin|\bcancel\b|can ?t (come|make)|cannot come)/.test(tx)) {
    const r = await doCancel(ctx);
    if (r.cancelled) return { reply: r.reply, cancelled: true, via: "rule" };
    return null; // s'kishte takim → le ta marrë AI/ose njoftim
  }
  // Çmimet
  if (/(sa kushton|cmim|qmim|sa eshte|cmimet|sa ben|\bprice|\bcost|how much|pricing)/.test(tx)) {
    const r = sq
      ? `Ja shërbimet tona:\n${svcListText(services)}\n\nTë rezervoj një orar? Më thuaj ditën. 📅`
      : `Here are our services:\n${svcListText(services)}\n\nShall I book you a slot? Tell me the day. 📅`;
    return { reply: r, via: "rule" };
  }
  // Orari / adresa
  if (/(orari|kur (jeni )?hapur|sa hapeni|kur mbyllni|ku ndodheni|ku jeni|adresa|opening hours|working hours|when.*open|where are you|address|location)/.test(tx)) {
    const addr = biz.address ? (sq ? `📍 ${biz.name}, ${biz.address}\n\n` : `📍 ${biz.name}, ${biz.address}\n\n`) : "";
    const r = sq ? `${addr}Orari ynë:\n${hoursListText(hours, true)}\n\nDo një rezervim? Më thuaj ditën!`
                 : `${addr}Our hours:\n${hoursListText(hours, false)}\n\nWant to book? Tell me the day!`;
    return { reply: r, via: "rule" };
  }

  // Rezervim: nxjerr ditën/orën/shërbimin nga mesazhi + historiku i afërt
  const wantsBooking = /(orar|rezervo|prenot|takim|termin|te vij|a ke|a keni|dua|kur ke|\bbook\b|appointment|reserve|slot|availab|do you have|qeth|qethje)/.test(tx);
  let day = parseDay(tx);
  const period = parsePeriod(tx);
  const time = parseTime(tx);
  let svc = parseService(tx, services);

  // Konteksti nga historiku (për mesazhe si "ne 3" pas një oferte)
  if (!day || !svc) {
    for (let i = hist.length - 1; i >= 0 && i >= hist.length - 6; i--) {
      const ht = norm(hist[i].text || "");
      if (!day) day = parseDay(ht);
      if (!svc) svc = parseService(ht, services);
    }
  }
  if (!svc && services.length === 1) svc = services[0];

  if (wantsBooking || (time && (day || svc))) {
    if (!svc || !day) return null; // mungon info → AI e trajton më mirë
    // Kemi shërbim + ditë
    const { appts, blocks } = await busyFor(businessId, day, svcDur);
    let slots = freeSlotsUnion(day, svc.duration_min, hMap[parseDate(day).getDay()], appts, blocks, staff);
    if (period) slots = slots.filter((x) => toMin(x) >= period[0] && toMin(x) < period[1]);
    if (time) {
      // ka orë konkrete → rezervo nëse e lirë
      const all = freeSlotsUnion(day, svc.duration_min, hMap[parseDate(day).getDay()], appts, blocks, staff);
      if (all.includes(time)) {
        const r = await doBook(ctx, svc, day, time);
        if (r.booked) return { reply: r.reply, booked: true, via: "rule" };
      }
      const alt = all.slice(0, 3);
      if (alt.length) {
        return { reply: sq ? `Në ${time} jam i zënë. Të lira: ${alt.join(", ")} — cila të rri?` : `${time} is taken. Free: ${alt.join(", ")} — which works?`, via: "rule" };
      }
      if (ctx.chat_id) {
        return { reply: sq ? `${humanDay(day, true)} është plot 😕 Të të shtoj në listën e pritjes dhe të lajmëroj sapo lirohet një orar? Shkruaj "po". 🙌` : `${humanDay(day, false)} is full 😕 Shall I add you to the waiting list and tell you the moment a slot frees up? Reply "yes". 🙌`, via: "rule" };
      }
      return null;
    }
    // s'ka orë konkrete → ofro 2-3 (fallback te gjithë dita nëse periudha s'ka)
    if (!slots.length && period) slots = freeSlotsUnion(day, svc.duration_min, hMap[parseDate(day).getDay()], appts, blocks, staff);
    if (slots.length) {
      const offer = slots.slice(0, 3).join(", ");
      return { reply: sq ? `Po, për ${humanDay(day, true)} kam të lira: ${offer}. Cila të rri më mirë? 😊` : `Yes, for ${humanDay(day, false)} I have: ${offer}. Which suits you? 😊`, via: "rule" };
    }
    // ditë plot → ofro listën e pritjes (mbushja automatike)
    if (ctx.chat_id) {
      return { reply: sq ? `${humanDay(day, true)} është plot 😕 Të të shtoj në listën e pritjes dhe të lajmëroj sapo lirohet një orar? Shkruaj "po". 🙌` : `${humanDay(day, false)} is full 😕 Shall I add you to the waiting list and tell you the moment a slot frees up? Reply "yes". 🙌`, via: "rule" };
    }
    return null;
  }

  // Përshëndetje
  if (/^(pershendetje|ckemi|tung|tungjatjeta|hello|hi|hey|miremengjes|mirembrema|miredita|start|\/start|alo)\b/.test(tx) && tx.length < 30) {
    return { reply: sq ? `Përshëndetje${name ? " " + name : ""}! 👋 Si mund të ndihmoj? Mund të rezervosh orar këtu — vetëm më thuaj ditën. 😊`
                       : `Hello${name ? " " + name : ""}! 👋 How can I help? You can book a slot here — just tell me the day. 😊`, via: "rule" };
  }
  // Falënderim
  if (/(faleminderit|flm|rrofsh|thanks|thank you|thx)/.test(tx)) {
    return { reply: sq ? "Me kënaqësi! 😊" : "You're welcome! 😊", via: "rule" };
  }

  return null; // → AI
}

/* ---------------- Shtresa 2: AI (Gemini) ---------------- */
async function askGemini(system: string, contents: any[]) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents,
      generationConfig: {
        temperature: 0.1, responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            reply: { type: "STRING" }, lang: { type: "STRING" },
            wants_to_book: { type: "BOOLEAN" }, wants_to_cancel: { type: "BOOLEAN" },
            service: { type: "STRING" }, date: { type: "STRING" }, time: { type: "STRING" },
          },
          required: ["reply", "wants_to_book"],
        },
      },
    }),
  });
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini: " + JSON.stringify(data).slice(0, 200));
  return JSON.parse(text);
}

async function buildAvailability(businessId: string, services: any[], hMap: any, svcDur: Record<string, number>, staff: any[]) {
  const minDur = Math.min(...services.map((s: any) => s.duration_min), SLOT_STEP);
  const lines: string[] = [];
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const d = new Date(Date.now() + i * 864e5);
    const ds = fmtDate(d);
    const { appts, blocks } = await busyFor(businessId, ds, svcDur);
    const slots = freeSlotsUnion(ds, minDur, hMap[d.getDay()], appts, blocks, staff);
    if (slots.length) lines.push(`${DOW[d.getDay()]} ${ds} (${d.getDate()} ${MON[d.getMonth()]}): ${slots.join(", ")}`);
  }
  return lines.join("\n") || "(no free slots in the next 10 days)";
}

async function runAI(ctx: any) {
  const { biz, services, hMap, svcDur, businessId, text, client_name, history, staff } = ctx;
  const availability = await buildAvailability(businessId, services, hMap, svcDur, staff);
  const todayStr = fmtDate(new Date());
  const bizLang = biz.lang === "en" ? "English" : "Albanian";
  const firstName = (client_name || "").trim().split(" ")[0];
  const system = [
    `You are the warm, friendly booking receptionist for "${biz.name}".${firstName ? ` The customer's name is ${firstName}.` : ""}`,
    biz.address ? `Address: ${biz.address}.` : "",
    `Today is ${DOW[new Date().getDay()]} ${todayStr}. The business operates in ${bizLang}.`,
    `STYLE: warm, human, 1–2 short sentences, offer only 2–3 times, occasional tasteful emoji, never robotic.`,
    `LANGUAGE: ALWAYS reply in ${bizLang} unless the customer writes a full sentence clearly in another language (then mirror it). Set "lang" to the ISO code of your reply language (sq, en, it, ...).`,
    `SERVICES (name — minutes — price):`,
    services.map((s: any) => `- ${s.name} — ${s.duration_min} min — ${s.price}`).join("\n"),
    `AVAILABLE START TIMES (use ONLY these; never invent):`,
    availability,
    `CONTEXT: read the whole history; the date is often in an earlier message ("nesër"=tomorrow); never re-ask what's known; if one service exists assume it.`,
    `TIMES: "ora 2 pasdite"/"2pm"=14:00, "ora 3" afternoon=15:00.`,
    `BOOKING: when service+date+available time are known, set wants_to_book=true (exact service, date YYYY-MM-DD, time HH:MM) and write a complete warm confirmation in the customer's language.`,
    `CANCELLING: if they want to cancel / can't come, set wants_to_cancel=true.`,
  ].filter(Boolean).join("\n");

  const contents: any[] = [];
  for (const m of (history || []).slice(-10)) contents.push({ role: m.role === "bot" ? "model" : "user", parts: [{ text: String(m.text || "") }] });
  contents.push({ role: "user", parts: [{ text: String(text) }] });

  const out = await askGemini(system, contents);
  let reply = out.reply || "";
  let booked = false, cancelled = false;

  if (out.wants_to_book && out.service && out.date && out.time) {
    const svc = services.find((s: any) => norm(s.name) === norm(out.service))
      || services.find((s: any) => norm(s.name).includes(norm(out.service)) || norm(out.service).includes(norm(s.name)));
    if (svc) {
      const r = await doBook(ctx, svc, out.date, hm(out.time), out.lang);
      if (r.booked) { booked = true; reply = r.reply || reply; }
      else if (r.alternatives?.length) reply = (reply ? reply + "\n\n" : "") + `(${r.alternatives.join(", ")})`;
    }
  }
  if (out.wants_to_cancel && !booked) {
    const r = await doCancel(ctx, out.lang);
    if (r.cancelled) { cancelled = true; reply = r.reply || reply; }
  }
  return { reply, booked, cancelled, via: "ai" };
}

/* ---------------- Handler ---------------- */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { business_id, text, client_name, client_phone, history, channel, chat_id } = await req.json();
    if (!business_id || !text) return json({ error: "business_id and text are required" }, 400);

    const { biz, services, hours, staff } = await loadContext(business_id);
    if (!biz) return json({ error: "business not found" }, 404);
    if (!services.length) return json({ reply: "Booking is not set up yet." });

    const hMap = hoursByDow(hours);
    const svcDur: Record<string, number> = {};
    for (const s of services) svcDur[s.id] = s.duration_min;
    const ctx = { businessId: business_id, biz, services, hours, staff, hMap, svcDur, text, client_name, client_phone, channel, chat_id, history };

    // Shtresa 1: rregullat falas
    const ruled = await tryRules(ctx);
    if (ruled) return json(ruled);

    // Shtresa 2: AI (me mesazh të sjellshëm nëse s'është i disponueshëm)
    try {
      const out = await runAI(ctx);
      return json(out);
    } catch (_aiErr) {
      const sq = isSqLang(biz);
      const reply = sq
        ? "Më fal, pata një vështirësi të vogël teknike. Mund të më shkruash ditën dhe orën që dëshiron (p.sh. \"nesër në 15:00\") dhe ta rezervoj? 🙏"
        : "Sorry, I had a small technical hiccup. Could you tell me the day and time you'd like (e.g. \"tomorrow at 3pm\") and I'll book it? 🙏";
      return json({ reply, via: "fallback" });
    }
  } catch (e) {
    return json({ error: String((e as any)?.message || e) }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });
}
