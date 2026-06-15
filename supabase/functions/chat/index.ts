// =====================================================================
// OptimaBook — Truri AI (Edge Function "chat")
// Merr mesazhin e klientit → Gemini kupton → motori jep orare reale /
// rezervon → kthen përgjigjen. Flet ÇDO gjuhë (Gemini).
//
// Parime "më i miri në botë":
//   • AI NUK shpik kurrë orare — i jepen vetëm oraret reale nga databaza.
//   • Rezervimi RIKONTROLLOHET në moment (transaksional) → s'dyfishohet.
//   • Çelësi Gemini + service role rrinë VETËM në server (asnjëherë frontend).
//
// Hyrje (POST JSON): { business_id, text, client_name?, client_phone?, history? }
// Dalje (JSON):      { reply, booked? }
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);
const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY")!;
// Modeli i ndryshueshëm nga një secret (GEMINI_MODEL).
// Parazgjedhje: 2.5-flash-lite (kuotë ditore e madhe falas). Me faturim
// të aktivizuar, vendos GEMINI_MODEL=gemini-2.5-flash për cilësi më të lartë.
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
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function norm(s: string) {
  return (s || "").toLowerCase().replace(/ë/g, "e").replace(/ç/g, "c").trim();
}

const parseDate = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const SQ_DAYS = ["E diel", "E hënë", "E martë", "E mërkurë", "E enjte", "E premte", "E shtunë"];
const SQ_MON = ["janar", "shkurt", "mars", "prill", "maj", "qershor", "korrik", "gusht", "shtator", "tetor", "nëntor", "dhjetor"];
const EN_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const EN_MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Konfirmim i përsosur, i ndërtuar në kod — gjithmonë i plotë dhe i bukur.
function buildConfirmation(svc: any, dateStr: string, time: string, biz: any): string {
  const isSq = biz.lang !== "en";
  const d = parseDate(dateStr);
  const today = fmtDate(new Date());
  const tom = fmtDate(new Date(Date.now() + 864e5));
  const days = isSq ? SQ_DAYS : EN_DAYS;
  const mon = isSq ? SQ_MON : EN_MON;
  let dayLabel = `${days[d.getDay()]}, ${d.getDate()} ${mon[d.getMonth()]}`;
  if (dateStr === today) dayLabel = (isSq ? "sot, " : "today, ") + dayLabel;
  else if (dateStr === tom) dayLabel = (isSq ? "nesër, " : "tomorrow, ") + dayLabel;
  const addr = biz.address ? `\n📍 ${biz.name}, ${biz.address}` : `\n📍 ${biz.name}`;
  const price = Number(svc.price) ? ` · ${svc.price}€` : "";
  return isSq
    ? `✅ U rezervua! ${svc.name} — ${dayLabel}, ora ${time}${price}${addr}\nTë presim! 🙌`
    : `✅ Booked! ${svc.name} — ${dayLabel}, ${time}${price}${addr}\nSee you! 🙌`;
}

/* ---------------- Motori i orareve ---------------- */
function freeSlots(
  dateStr: string,
  durMin: number,
  hoursRow: { open_time: string | null; close_time: string | null; is_closed: boolean } | undefined,
  appts: { appt_time: string; dur: number }[],
  blocks: { from_time: string; to_time: string }[],
): string[] {
  if (!hoursRow || hoursRow.is_closed || !hoursRow.open_time || !hoursRow.close_time) return [];
  const open = toMin(hm(hoursRow.open_time));
  const close = toMin(hm(hoursRow.close_time));
  const busy = appts.map((a) => [toMin(hm(a.appt_time)), toMin(hm(a.appt_time)) + a.dur])
    .concat(blocks.map((b) => [toMin(hm(b.from_time)), toMin(hm(b.to_time))]));
  const isToday = dateStr === fmtDate(new Date());
  const nowM = new Date().getHours() * 60 + new Date().getMinutes();
  const out: string[] = [];
  for (let t = open; t + durMin <= close; t += SLOT_STEP) {
    if (isToday && t <= nowM) continue;
    if (!busy.some(([s, e]) => t < e && t + durMin > s)) out.push(toHM(t));
  }
  return out;
}

/* ---------------- Ngarkesa e biznesit ---------------- */
async function loadContext(businessId: string) {
  const [{ data: biz }, { data: services }, { data: hours }] = await Promise.all([
    supabase.from("businesses").select("*").eq("id", businessId).maybeSingle(),
    supabase.from("services").select("*").eq("business_id", businessId).eq("active", true).order("sort_order"),
    supabase.from("working_hours").select("*").eq("business_id", businessId),
  ]);
  return { biz, services: services || [], hours: hours || [] };
}

function hoursByDow(hours: any[]) {
  const map: Record<number, any> = {};
  for (const h of hours) map[h.weekday] = h;
  return map;
}

async function busyFor(businessId: string, dateStr: string, svcDur: Record<string, number>) {
  const [{ data: appts }, { data: blocks }] = await Promise.all([
    supabase.from("appointments").select("appt_time,service_id")
      .eq("business_id", businessId).eq("appt_date", dateStr).neq("status", "cancelled"),
    supabase.from("time_blocks").select("from_time,to_time")
      .eq("business_id", businessId).eq("block_date", dateStr),
  ]);
  return {
    appts: (appts || []).map((a) => ({ appt_time: a.appt_time, dur: svcDur[a.service_id] || SLOT_STEP })),
    blocks: blocks || [],
  };
}

/* ---------------- Disponueshmëria për promptin ---------------- */
async function buildAvailability(businessId: string, services: any[], hMap: Record<number, any>, svcDur: Record<string, number>) {
  const minDur = Math.min(...services.map((s) => s.duration_min), SLOT_STEP);
  const lines: string[] = [];
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const d = new Date(Date.now() + i * 864e5);
    const ds = fmtDate(d);
    const { appts, blocks } = await busyFor(businessId, ds, svcDur);
    const slots = freeSlots(ds, minDur, hMap[d.getDay()], appts, blocks);
    if (slots.length) {
      lines.push(`${DOW[d.getDay()]} ${ds} (${d.getDate()} ${MON[d.getMonth()]}): ${slots.join(", ")}`);
    }
  }
  return lines.join("\n") || "(no free slots in the next 10 days)";
}

/* ---------------- Gemini ---------------- */
async function askGemini(system: string, contents: any[]) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents,
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              reply: { type: "STRING" },
              wants_to_book: { type: "BOOLEAN" },
              service: { type: "STRING" },
              date: { type: "STRING" },
              time: { type: "STRING" },
            },
            required: ["reply", "wants_to_book"],
          },
        },
      }),
    },
  );
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini: " + JSON.stringify(data).slice(0, 300));
  return JSON.parse(text);
}

/* ---------------- Handler ---------------- */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { business_id, text, client_name, client_phone, history } = await req.json();
    if (!business_id || !text) {
      return json({ error: "business_id and text are required" }, 400);
    }

    const { biz, services, hours } = await loadContext(business_id);
    if (!biz) return json({ error: "business not found" }, 404);
    if (!services.length) return json({ reply: "Booking is not set up yet." });

    const hMap = hoursByDow(hours);
    const svcDur: Record<string, number> = {};
    for (const s of services) svcDur[s.id] = s.duration_min;

    const availability = await buildAvailability(business_id, services, hMap, svcDur);
    const todayStr = fmtDate(new Date());

    const bizLang = biz.lang === "en" ? "English" : "Albanian";
    const firstName = (client_name || "").trim().split(" ")[0];
    const examples = biz.lang === "en"
      ? [
          `Customer: do you have a slot tomorrow for a haircut?`,
          `You: Yes, of course! Tomorrow I have 2:00 PM, 3:30 PM or 5:00 PM free — which works best for you? 😊`,
          `Customer: 3pm`,
          `You: Perfect, you're all set! ✅`,
          `Customer: how much is it?`,
          `You: A haircut is 15€. Want me to find you a time? 😊`,
          `Customer: where are you?`,
          `You: We're easy to find — want me to book you in while you're here?`,
        ].join("\n")
      : [
          `Klienti: a ke nesër një orar për qethje?`,
          `Ti: Po, patjetër! Nesër kam të lira 14:00, 15:30 ose 17:00 — cila të rri më mirë? 😊`,
          `Klienti: ora 3`,
          `Ti: Perfekt, je sistemuar! ✅`,
          `Klienti: sa kushton?`,
          `Ti: Qethja është 15€. Të gjej një orar? 😊`,
          `Klienti: ku ndodheni?`,
          `Ti: Na gjen lehtë — të të rezervoj një orar ndërkohë?`,
        ].join("\n");

    const system = [
      `You are the booking receptionist for "${biz.name}" — warm, friendly and efficient, like the best human receptionist a customer has ever talked to.${firstName ? ` The customer's name is ${firstName}; use it naturally and warmly now and then.` : ""}`,
      biz.address ? `Address: ${biz.address}.` : "",
      `Today is ${DOW[new Date().getDay()]} ${todayStr}. The business operates in ${bizLang}.`,
      ``,
      `STYLE — this is what makes you world-class, not beginner:`,
      `- Warm, human, natural — sound genuinely happy to help. Acknowledge, then act.`,
      `- Keep it to 1–2 short sentences. Never robotic, never a wall of text or a dump of all times.`,
      `- When offering times, suggest only 2–3 good options.`,
      `- Use one tasteful emoji now and then (not in every message).`,
      ``,
      `LANGUAGE (critical):`,
      `- ALWAYS write the "reply" field in ${bizLang}. Only exception: the customer writes a full sentence clearly in another language — then mirror it.`,
      `- Greetings, "ok", "/start", names, numbers and single words are ALWAYS ${bizLang}. Never drift to English.`,
      ``,
      `SERVICES (name — duration minutes — price):`,
      services.map((s: any) => `- ${s.name} — ${s.duration_min} min — ${s.price}`).join("\n"),
      ``,
      `AVAILABLE START TIMES (use ONLY these; never invent times or prices):`,
      availability,
      ``,
      `CONTEXT (critical) — read the WHOLE conversation history:`,
      `- The date is often in an earlier message (e.g. "nesër" = tomorrow = the next calendar day). Compute the real date yourself.`,
      `- NEVER ask again for the service, date or time if it already appears anywhere in the conversation.`,
      `- If the business has only one service and the customer asked about it, assume that service.`,
      ``,
      `TIMES: "ora 2 pasdite"/"2pm" = 14:00, "ora 3" afternoon = 15:00, "ora 10" morning = 10:00. Map to one of the available start times.`,
      ``,
      `BOOKING: the moment you can determine service + a real date + an available time, set wants_to_book=true and fill service (exact name from the list), date (YYYY-MM-DD), time (HH:MM). Do not re-confirm what you already have. Only ask when something essential is genuinely missing. (The system writes the final confirmation message itself, so keep your reply short when booking.)`,
      ``,
      `EXAMPLES of your tone for the "reply" field — match this warmth and brevity:`,
      examples,
    ].filter(Boolean).join("\n");

    const contents: any[] = [];
    for (const m of (history || []).slice(-10)) {
      contents.push({ role: m.role === "bot" ? "model" : "user", parts: [{ text: String(m.text || "") }] });
    }
    contents.push({ role: "user", parts: [{ text: String(text) }] });

    const out = await askGemini(system, contents);
    let reply = out.reply || "";
    let booked = false;

    // ---- Rezervim transaksional: rikontroll në moment ----
    if (out.wants_to_book && out.service && out.date && out.time) {
      const svc = services.find((s: any) => norm(s.name) === norm(out.service))
        || services.find((s: any) => norm(s.name).includes(norm(out.service)) || norm(out.service).includes(norm(s.name)));
      if (svc) {
        const wantTime = hm(out.time);
        const { appts, blocks } = await busyFor(business_id, out.date, svcDur);
        const free = freeSlots(out.date, svc.duration_min, hMap[new Date(out.date + "T00:00:00").getDay()], appts, blocks);
        if (free.includes(wantTime)) {
          const { error } = await supabase.from("appointments").insert({
            business_id, service_id: svc.id,
            client_name: client_name || "WhatsApp", client_phone: client_phone || null,
            appt_date: out.date, appt_time: wantTime, status: "pending", source: "ai",
          });
          if (!error) {
            booked = true;
            reply = buildConfirmation(svc, out.date, wantTime, biz);
            await supabase.from("notifications").insert({
              business_id,
              text: `✅ AI booking: ${client_name || "client"} — ${svc.name}, ${out.date} ${wantTime}`,
            });
          }
        } else if (free.length) {
          // Orari u zu ndërkohë — ofro alternativa, mos e konfirmo
          reply = (reply ? reply + "\n\n" : "") +
            `(That time was just taken — still free on ${out.date}: ${free.slice(0, 4).join(", ")})`;
        }
      }
    }

    return json({ reply, booked });
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
