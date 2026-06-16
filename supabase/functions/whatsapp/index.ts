// @ts-nocheck  — Ekzekutohet në DENO (Supabase Edge Functions), jo në Node.
// VSCode i shfaq gabimet si false (Deno.*, import nga URL janë të vlefshme në Deno).
// =====================================================================
// OptimaBook — Lidhësi WhatsApp (Meta Cloud API)
// Mesazhi i klientit në WhatsApp → truri "chat" (AI) → përgjigja kthehet.
// I njëjti tru si Telegram-i; mban kontekstin (tabela messages).
//
// Webhook URL:  https://<ref>.supabase.co/functions/v1/whatsapp?business_id=<ID>
// Secrets:      WHATSAPP_TOKEN (token-i i Meta), WHATSAPP_VERIFY_TOKEN (varg që zgjedh vetë)
// Verify JWT:   OFF (Meta s'dërgon çelës Supabase)
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const supabase = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const WA_TOKEN = Deno.env.get("WHATSAPP_TOKEN")!;
const VERIFY = Deno.env.get("WHATSAPP_VERIFY_TOKEN") || "optimabook";
// Publishable key është publik (i njëjti si te frontend) — i sigurt këtu.
const PUBLISHABLE = "sb_publishable_pwtiVjYqEYLYPZXfgponIg_YC3xSIgs";

async function sendWhatsApp(phoneNumberId: string, to: string, text: string) {
  await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${WA_TOKEN}` },
    body: JSON.stringify({ messaging_product: "whatsapp", to, text: { body: text } }),
  });
}

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // ---- Verifikimi i webhook-ut (GET nga Meta) ----
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token === VERIFY) {
      return new Response(challenge || "", { status: 200 });
    }
    return new Response("forbidden", { status: 403 });
  }

  // ---- Mesazh hyrës (POST nga Meta) ----
  try {
    const businessId = url.searchParams.get("business_id");
    const body = await req.json().catch(() => ({}));
    const value = body?.entry?.[0]?.changes?.[0]?.value;
    const msg = value?.messages?.[0];
    if (!businessId || !msg || msg.type !== "text") return new Response("ok");

    const from = msg.from;                                   // numri i klientit
    const text = msg.text?.body;
    const phoneNumberId = value?.metadata?.phone_number_id;  // numri i biznesit
    const name = value?.contacts?.[0]?.profile?.name || "WhatsApp";
    if (!text || !phoneNumberId) return new Response("ok");

    // Kujtesa e bisedës (10 të fundit)
    const { data: hist } = await supabase.from("messages").select("role,content")
      .eq("business_id", businessId).eq("channel", "whatsapp").eq("chat_id", from)
      .order("created_at", { ascending: true }).limit(10);
    const history = (hist || []).map((h: any) => ({ role: h.role, text: h.content }));

    await supabase.from("messages").insert({
      business_id: businessId, channel: "whatsapp", chat_id: from, role: "user", content: text,
    });

    // Thirr trurin AI
    const r = await fetch(`${SUPABASE_URL}/functions/v1/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${PUBLISHABLE}` },
      body: JSON.stringify({ business_id: businessId, text, client_name: name, history, channel: "whatsapp", chat_id: from }),
    });
    const out = await r.json().catch(() => ({}));
    const reply = out.reply || "…";

    await supabase.from("messages").insert({
      business_id: businessId, channel: "whatsapp", chat_id: from, role: "bot", content: reply,
    });
    await sendWhatsApp(phoneNumberId, from, reply);

    return new Response("ok");
  } catch (_e) {
    return new Response("ok"); // Meta-s i kthejmë gjithmonë 200
  }
});
