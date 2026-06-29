// @ts-nocheck  — Ekzekutohet në DENO (Supabase Edge Functions), jo në Node.
// VSCode i shfaq gabimet si false (Deno.*, import nga URL janë të vlefshme në Deno).
// =====================================================================
// OptimaBook — Kujtesat automatike
// Thirret nga një cron një herë në ditë. Gjen takimet e NESËRME që s'kanë
// marrë ende kujtesë dhe i dërgon klientit (Telegram), pastaj i shënon.
// Ul mungesat — problemi #1 i parave për bizneset me takime.
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);
const BOT = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const WA_TOKEN = Deno.env.get("WHATSAPP_TOKEN") || "";

const pad = (n: number) => String(n).padStart(2, "0");
const hm = (t: string) => (t ? t.slice(0, 5) : t);
const fmtDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

async function sendTelegram(token: string, chatId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

async function sendWhatsApp(phoneNumberId: string, to: string, text: string) {
  await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${WA_TOKEN}` },
    body: JSON.stringify({ messaging_product: "whatsapp", to, text: { body: text } }),
  });
}

Deno.serve(async () => {
  try {
    const tomorrow = fmtDate(new Date(Date.now() + 864e5));
    const { data, error } = await supabase.from("appointments")
      .select("id, appt_time, chat_id, channel, services(name), businesses(name, lang, telegram_token, wa_phone_id)")
      .eq("appt_date", tomorrow).eq("reminded", false).neq("status", "cancelled")
      .not("chat_id", "is", null);
    if (error) return json({ error: error.message }, 500);

    let sent = 0;
    for (const a of (data || [])) {
      const biz: any = a.businesses;
      const svc: any = a.services;
      if (!a.chat_id || !biz) continue;
      const isSq = biz.lang !== "en";
      const time = hm(a.appt_time);
      const svcName = svc?.name || (isSq ? "takimin" : "your appointment");
      const msg = isSq
        ? `⏰ Kujtesë: nesër ke takim te ${biz.name} — ${svcName} në orën ${time}. Të presim! 🙌\nNëse s'mund të vish, shkruaj "anulo" dhe orari lirohet.`
        : `⏰ Reminder: tomorrow you have an appointment at ${biz.name} — ${svcName} at ${time}. See you! 🙌\nIf you can't make it, reply "cancel" and the slot is freed.`;

      if (a.channel === "telegram") {
        await sendTelegram(biz.telegram_token || BOT, a.chat_id, msg);
      } else if (a.channel === "whatsapp" && biz.wa_phone_id && WA_TOKEN) {
        await sendWhatsApp(biz.wa_phone_id, a.chat_id, msg);
      } else {
        continue; // kanal pa rrugë dërgimi → mos e shëno si i kujtuar
      }
      await supabase.from("appointments").update({ reminded: true }).eq("id", a.id);
      sent++;
    }
    return json({ ok: true, date: tomorrow, sent });
  } catch (e) {
    return json({ error: String((e as any)?.message || e) }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status, headers: { "Content-Type": "application/json" },
  });
}
