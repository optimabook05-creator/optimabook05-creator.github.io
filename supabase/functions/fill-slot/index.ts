// =====================================================================
// OptimaBook — Mbushja automatike e orareve bosh ("fill-slot")
// Thirret nga një trigger në databazë kur një takim ANULOHET.
// Gjen klientin e parë në listën e pritjes për atë ditë, kontrollon që
// vërtet ka tani një orar të lirë, dhe i shkruan menjëherë.
// Orari bosh mbushet vetë → biznesi nuk humb para.
//
// Hyrje (POST JSON): { business_id, date, time? }
// Verify JWT: OFF (thirret nga databaza, pa çelës Supabase)
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);
const BOT = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const SLOT_STEP = 30;

const pad = (n: number) => String(n).padStart(2, "0");
const hm = (t: string) => (t ? t.slice(0, 5) : t);
const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const toHM = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const fmtDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDate = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };

const SQ_DAYS = ["E diel", "E hënë", "E martë", "E mërkurë", "E enjte", "E premte", "E shtunë"];
const EN_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SQ_MON = ["janar", "shkurt", "mars", "prill", "maj", "qershor", "korrik", "gusht", "shtator", "tetor", "nëntor", "dhjetor"];
const EN_MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const PERIODS: Record<string, [number, number]> = {
  morning: [0, 12 * 60], afternoon: [12 * 60, 18 * 60], evening: [17 * 60, 24 * 60],
};

function humanDay(dateStr: string, sq: boolean): string {
  const d = parseDate(dateStr);
  const today = fmtDate(new Date());
  const tom = fmtDate(new Date(Date.now() + 864e5));
  const days = sq ? SQ_DAYS : EN_DAYS, mon = sq ? SQ_MON : EN_MON;
  let label = `${days[d.getDay()]}, ${d.getDate()} ${mon[d.getMonth()]}`;
  if (dateStr === today) label = (sq ? "sot, " : "today, ") + label;
  else if (dateStr === tom) label = (sq ? "nesër, " : "tomorrow, ") + label;
  return label;
}

function freeSlots(dateStr: string, durMin: number, hoursRow: any, appts: any[], blocks: any[]): string[] {
  if (!hoursRow || hoursRow.is_closed || !hoursRow.open_time || !hoursRow.close_time) return [];
  const open = toMin(hm(hoursRow.open_time)), close = toMin(hm(hoursRow.close_time));
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

function freeSlotsForStaff(dateStr: string, durMin: number, hoursRow: any, appts: any[], blocks: any[], staffId: string): string[] {
  const fAppts = appts.filter((a) => a.staff_id === staffId);
  const fBlocks = blocks.filter((b: any) => !b.staff_id || b.staff_id === staffId);
  return freeSlots(dateStr, durMin, hoursRow, fAppts, fBlocks);
}
// Bashkimi mbi gjithë stafin (kapacitet paralel). Pa staf → kapacitet 1.
function freeSlotsUnion(dateStr: string, durMin: number, hoursRow: any, appts: any[], blocks: any[], staff: any[]): string[] {
  if (!staff || !staff.length) return freeSlots(dateStr, durMin, hoursRow, appts, blocks);
  const set = new Set<string>();
  for (const s of staff) for (const t of freeSlotsForStaff(dateStr, durMin, hoursRow, appts, blocks, s.id)) set.add(t);
  return [...set].sort();
}

async function sendTelegram(chatId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT}/sendMessage`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

Deno.serve(async (req) => {
  try {
    const { business_id, date } = await req.json().catch(() => ({}));
    if (!business_id || !date) return json({ error: "business_id and date required" }, 400);

    // Biznesi (emër + gjuhë)
    const { data: biz } = await supabase.from("businesses").select("name, lang").eq("id", business_id).maybeSingle();
    if (!biz) return json({ error: "business not found" }, 404);
    const sq = (biz.lang || "sq").toLowerCase().startsWith("sq");

    // Orari i ditës
    const dow = parseDate(date).getDay();
    const { data: hrows } = await supabase.from("working_hours").select("*").eq("business_id", business_id).eq("weekday", dow);
    const hoursRow = (hrows || [])[0];

    // Kohëzgjatjet e shërbimeve
    const { data: services } = await supabase.from("services").select("id, duration_min").eq("business_id", business_id);
    const svcDur: Record<string, number> = {};
    for (const s of (services || [])) svcDur[s.id] = s.duration_min;
    const minDur = Math.min(SLOT_STEP, ...(services || []).map((s: any) => s.duration_min));

    // Stafi aktiv (për kapacitet paralel; bosh = biznes me një person)
    const { data: staff } = await supabase.from("staff").select("id").eq("business_id", business_id).eq("active", true);

    // Të zëna për atë ditë
    const [{ data: appts }, { data: blocks }] = await Promise.all([
      supabase.from("appointments").select("appt_time, service_id, staff_id").eq("business_id", business_id).eq("appt_date", date).neq("status", "cancelled"),
      supabase.from("time_blocks").select("from_time, to_time, staff_id").eq("business_id", business_id).eq("block_date", date),
    ]);
    const busyAppts = (appts || []).map((a: any) => ({ appt_time: a.appt_time, dur: svcDur[a.service_id] || SLOT_STEP, staff_id: a.staff_id }));

    // Lista e pritjes për atë ditë (më të vjetrit të parët)
    const { data: waiters } = await supabase.from("waitlist")
      .select("*").eq("business_id", business_id).eq("desired_date", date).eq("status", "waiting")
      .order("created_at", { ascending: true });

    let notified = 0;
    for (const w of (waiters || [])) {
      if (w.channel !== "telegram" || !w.chat_id) continue; // tani vetëm Telegram
      const dur = (w.service_id && svcDur[w.service_id]) ? svcDur[w.service_id] : minDur;
      let slots = freeSlotsUnion(date, dur, hoursRow, busyAppts, blocks || [], staff || []);
      if (w.period && PERIODS[w.period]) {
        const [a, b] = PERIODS[w.period];
        const f = slots.filter((x) => toMin(x) >= a && toMin(x) < b);
        if (f.length) slots = f;
      }
      if (!slots.length) continue; // ende plot për këtë klient

      const times = slots.slice(0, 3).join(", ");
      const msg = sq
        ? `🎉 U lirua një orar te ${biz.name} për ${humanDay(date, true)}! Të lira: ${times}. E do? Më shkruaj orën dhe ta rezervoj. 😊`
        : `🎉 A slot just opened at ${biz.name} for ${humanDay(date, false)}! Free: ${times}. Want it? Reply with a time and I'll book it. 😊`;
      await sendTelegram(w.chat_id, msg);
      await supabase.from("waitlist").update({ status: "notified", notified_at: new Date().toISOString() }).eq("id", w.id);
      await supabase.from("notifications").insert({ business_id, text: `🔔 Orar i liruar — lajmërova ${w.client_name || "një klient"} nga lista e pritjes (${date})` });
      notified++;
      break; // një orar i liruar = lajmëro të parin në radhë (drejtësi + s'mbushim dy herë)
    }

    return json({ ok: true, date, notified });
  } catch (e) {
    return json({ error: String((e as any)?.message || e) }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
}
