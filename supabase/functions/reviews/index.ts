// =====================================================================
// OptimaBook — Kërkesa për vlerësime Google ("reviews")
// Thirret nga një cron një herë në ditë. Gjen takimet e DJESHME që kanë
// përfunduar dhe i kërkon klientit një vlerësim me linkun e Google.
// Rrit reputacionin → më shumë klientë të rinj.
//
// Dërgohet vetëm nëse biznesi ka vendosur "review_url".
// Verify JWT: OFF (thirret nga cron-i)
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);
const BOT = Deno.env.get("TELEGRAM_BOT_TOKEN")!;

const pad = (n: number) => String(n).padStart(2, "0");
const fmtDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

async function sendTelegram(chatId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT}/sendMessage`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: false }),
  });
}

Deno.serve(async () => {
  try {
    const yesterday = fmtDate(new Date(Date.now() - 864e5));
    const { data, error } = await supabase.from("appointments")
      .select("id, chat_id, channel, client_name, businesses(name, lang, review_url)")
      .eq("appt_date", yesterday).eq("review_requested", false).neq("status", "cancelled")
      .eq("channel", "telegram").not("chat_id", "is", null);
    if (error) return json({ error: error.message }, 500);

    let sent = 0;
    for (const a of (data || [])) {
      const biz: any = a.businesses;
      if (!biz?.review_url || !a.chat_id) continue;
      const sq = (biz.lang || "sq").toLowerCase().startsWith("sq");
      const first = (a.client_name || "").trim().split(" ")[0];
      const msg = sq
        ? `Faleminderit që zgjodhe ${biz.name}${first ? ", " + first : ""}! 🙏 Nëse ke pasur përvojë të mirë, një vlerësim i vogël na ndihmon shumë:\n${biz.review_url} ⭐`
        : `Thanks for choosing ${biz.name}${first ? ", " + first : ""}! 🙏 If you had a good experience, a quick review helps us a lot:\n${biz.review_url} ⭐`;
      await sendTelegram(a.chat_id, msg);
      await supabase.from("appointments").update({ review_requested: true }).eq("id", a.id);
      sent++;
    }
    return json({ ok: true, date: yesterday, sent });
  } catch (e) {
    return json({ error: String((e as any)?.message || e) }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
}
