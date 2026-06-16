// @ts-nocheck  — Ekzekutohet në DENO (Supabase Edge Functions), jo në Node.
// VSCode i shfaq gabimet si false (Deno.*, import nga URL janë të vlefshme në Deno).
// =====================================================================
// OptimaBook — Rikthimi i klientëve të humbur ("winback")
// Thirret nga një cron (një herë në ditë). Gjen klientët që s'kanë ardhur
// prej > WINBACK_DAYS ditësh dhe s'kanë takim të ardhshëm, dhe i fton
// me dashamirësi të rikthehen. Sjell para nga klientë që ndryshe humbeshin.
//
// Mbrojtje nga spam-i: çdo klient lajmërohet maksimumi një herë në RESEND_DAYS.
// Verify JWT: OFF (thirret nga cron-i)
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);
const BOT = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const WINBACK_DAYS = Number(Deno.env.get("WINBACK_DAYS") || "60");   // sa ditë pa ardhur = i humbur
const MAX_LAPSE_DAYS = 365;                                          // mos prek më të vjetër se 1 vit
const RESEND_DAYS = 90;                                              // mos ri-lajmëro brenda kësaj kohe

const pad = (n: number) => String(n).padStart(2, "0");
const fmtDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

async function sendTelegram(chatId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT}/sendMessage`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

Deno.serve(async () => {
  try {
    const today = fmtDate(new Date());
    const cutoff = fmtDate(new Date(Date.now() - WINBACK_DAYS * 864e5));   // vizita e fundit duhet të jetë para kësaj
    const tooOld = fmtDate(new Date(Date.now() - MAX_LAPSE_DAYS * 864e5));

    // Bizneset (emër + gjuhë)
    const { data: bizs } = await supabase.from("businesses").select("id, name, lang");
    const bizMap: Record<string, any> = {};
    for (const b of (bizs || [])) bizMap[b.id] = b;

    // Të gjitha takimet Telegram me chat_id (i grupojmë në kod)
    const { data: appts } = await supabase.from("appointments")
      .select("business_id, chat_id, client_name, appt_date, status")
      .eq("channel", "telegram").not("chat_id", "is", null);

    // Llogarit për çdo (biznes, klient): vizita e fundit + a ka takim të ardhshëm
    const agg: Record<string, { biz: string; chat: string; name: string; last: string; future: boolean }> = {};
    for (const a of (appts || [])) {
      if (a.status === "cancelled") continue;
      const key = `${a.business_id}|${a.chat_id}`;
      const cur = agg[key] || { biz: a.business_id, chat: a.chat_id, name: a.client_name || "", last: "0000-00-00", future: false };
      if (a.appt_date > cur.last) { cur.last = a.appt_date; cur.name = a.client_name || cur.name; }
      if (a.appt_date >= today) cur.future = true;
      agg[key] = cur;
    }

    let sent = 0;
    for (const k of Object.keys(agg)) {
      const c = agg[k];
      if (c.future) continue;                       // ka takim të ardhshëm → aktiv
      if (c.last > cutoff) continue;                // ka ardhur së fundi → jo i humbur
      if (c.last < tooOld) continue;                // shumë i vjetër → mos e bezdis
      const biz = bizMap[c.biz];
      if (!biz) continue;

      // A e kemi lajmëruar së fundi?
      const since = new Date(Date.now() - RESEND_DAYS * 864e5).toISOString();
      const { data: recent } = await supabase.from("winback_log")
        .select("id").eq("business_id", c.biz).eq("chat_id", c.chat).gte("sent_at", since).limit(1);
      if (recent && recent.length) continue;

      const sq = (biz.lang || "sq").toLowerCase().startsWith("sq");
      const first = (c.name || "").trim().split(" ")[0];
      const msg = sq
        ? `Përshëndetje${first ? " " + first : ""}! 👋 Ka ca kohë që s'të kemi parë te ${biz.name}. Të rezervoj një orar? Vetëm më thuaj ditën dhe e bëjmë. 😊`
        : `Hi${first ? " " + first : ""}! 👋 It's been a while since we saw you at ${biz.name}. Shall I book you a slot? Just tell me the day and we're set. 😊`;
      await sendTelegram(c.chat, msg);
      await supabase.from("winback_log").insert({ business_id: c.biz, chat_id: c.chat });
      await supabase.from("notifications").insert({ business_id: c.biz, text: `💌 Ftesë rikthimi dërguar: ${c.name || "një klient"}` });
      sent++;
    }

    return json({ ok: true, sent });
  } catch (e) {
    return json({ error: String((e as any)?.message || e) }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
}
