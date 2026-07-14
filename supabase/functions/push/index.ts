// @ts-nocheck  — Ekzekutohet në DENO (Supabase Edge Functions), jo në Node.
// =====================================================================
// OptimaBook — WEB PUSH (njoftime në telefonin e pronarit, panel i mbyllur)
// Thirret nga trigger-at e bazës (push.sql) kur vjen rezervim/porosi/
// kërkesë/pyetje e re → dërgon njoftim te ÇDO pajisje e abonuar e pronarit.
//
// DEPLOY: Verify JWT OFF (thirret nga pg_net, si fill-slot/reminders).
// SEKRETET: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:...)
// SIGURIA: lexon vetëm push_subs të biznesit të dhënë dhe dërgon tekst
// njoftimi — s'ekspozon asnjë të dhënë; keqpërdorimi maksimal = ping i tepërt.
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const VAPID_PUB = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const VAPID_PRIV = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:optimabook@gmail.com";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });

// Kufi thirrjesh për biznes: funksioni thirret pa JWT (nga triggers/pg_net), pra
// teorikisht kushdo mund ta POST-onte për të spam-uar telefonin e pronarit me njoftime
// të rreme. Breshëri realë ngjarjesh janë të vegjël → 6/min/biznes i mjafton; sulmi throttle-ohet.
const rl = new Map<string, number[]>();
function tooMany(bid: string, max = 6): boolean {
  const now = Date.now();
  const arr = (rl.get(bid) || []).filter((t) => now - t < 60000);
  if (arr.length >= max) { rl.set(bid, arr); return true; }
  arr.push(now); rl.set(bid, arr);
  if (rl.size > 5000) rl.clear();
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    if (!VAPID_PUB || !VAPID_PRIV) return json({ error: "VAPID secrets missing" }, 500);
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUB, VAPID_PRIV);

    const { business_id, title, body } = await req.json();
    if (!business_id || !title) return json({ error: "business_id and title required" }, 400);
    if (tooMany(String(business_id))) return json({ ok: true, throttled: true });

    const t = String(title).slice(0, 80), b = String(body || "").slice(0, 160);

    // KANALI 1 — TELEGRAM te pronari (s'vonon kurrë; zgjidh vonesat e push-it në Android ekonomik)
    let tg = 0;
    try {
      const { data: biz } = await supabase.from("businesses")
        .select("owner_tg_chat, telegram_token").eq("id", business_id).maybeSingle();
      if (biz && biz.owner_tg_chat) {
        const token = biz.telegram_token || Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
        if (token) {
          const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: biz.owner_tg_chat, text: `${t}\n${b}` }),
          });
          if (r.ok) tg = 1;
        }
      }
    } catch (_e) { /* Telegram opsional → mos e ndal push-in */ }

    // KANALI 2 — WEB PUSH te pajisjet e regjistruara
    const { data: subs } = await supabase.from("push_subs")
      .select("id, endpoint, p256dh, auth").eq("business_id", business_id).limit(20);
    const payload = JSON.stringify({ title: t, body: b });
    let sent = 0;
    for (const s of (subs || [])) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        );
        sent++;
      } catch (e) {
        // 404/410 = pajisja e hoqi abonimin (uninstall, leje e hequr) → pastro rreshtin
        const code = e && (e.statusCode || e.status);
        if (code === 404 || code === 410) {
          try { await supabase.from("push_subs").delete().eq("id", s.id); } catch (_e2) {}
        }
      }
    }
    return json({ ok: true, sent, tg });
  } catch (e) {
    return json({ error: String(e && e.message || e).slice(0, 300) }, 500);
  }
});
