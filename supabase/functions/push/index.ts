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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    if (!VAPID_PUB || !VAPID_PRIV) return json({ error: "VAPID secrets missing" }, 500);
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUB, VAPID_PRIV);

    const { business_id, title, body } = await req.json();
    if (!business_id || !title) return json({ error: "business_id and title required" }, 400);

    const { data: subs } = await supabase.from("push_subs")
      .select("id, endpoint, p256dh, auth").eq("business_id", business_id).limit(20);
    if (!subs || !subs.length) return json({ ok: true, sent: 0 });

    const payload = JSON.stringify({ title: String(title).slice(0, 80), body: String(body || "").slice(0, 160) });
    let sent = 0;
    for (const s of subs) {
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
    return json({ ok: true, sent });
  } catch (e) {
    return json({ error: String(e && e.message || e).slice(0, 300) }, 500);
  }
});
