// @ts-nocheck  — Ekzekutohet në DENO (Supabase Edge Functions), jo në Node.
// VSCode i shfaq gabimet si false (Deno.*, import nga URL janë të vlefshme në Deno).
// =====================================================================
// OptimaBook — Lidhësi Telegram
// Mesazhi i klientit në Telegram → truri "chat" (AI) → përgjigja kthehet.
// Mban kontekstin e bisedës (tabela messages). Një biznes = një bot;
// business_id jepet si query param te webhook-u (multi-tenant gati).
//
// Webhook URL:  https://<ref>.supabase.co/functions/v1/telegram?business_id=<ID>
// Secret:       TELEGRAM_BOT_TOKEN
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const supabase = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const BOT = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
// Publishable key është publik (i njëjti si te frontend) — i sigurt këtu.
const PUBLISHABLE = "sb_publishable_pwtiVjYqEYLYPZXfgponIg_YC3xSIgs";

async function sendTelegram(chatId: string, text: string, token: string) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const businessId = url.searchParams.get("business_id");
    const update = await req.json().catch(() => ({}));
    const msg = update.message || update.edited_message;
    if (!businessId || !msg?.text || !msg.chat) return new Response("ok");

    const chatId = String(msg.chat.id);
    const name = msg.from?.first_name || "Telegram";

    // P0-4: Idempotency — mos përpuno dy herë të njëjtin update (Telegram ridërgon)
    const updateId = update.update_id != null ? "tg_" + update.update_id : null;
    if (updateId) {
      const { error: dupErr } = await supabase.from("processed_updates").insert({ id: updateId });
      if (dupErr && dupErr.code === "23505") return new Response("ok"); // tashmë i përpunuar
      // gabime të tjera (p.sh. tabela s'ekziston ende) → vazhdo normalisht (prapa-përputhshëm)
    }

    // P0-3: Rate limit i thjeshtë — mbrojtje nga spam/kosto (maks ~12 mesazhe/min)
    const since60 = new Date(Date.now() - 60000).toISOString();
    const { count: recentCount } = await supabase.from("messages").select("id", { count: "exact", head: true })
      .eq("business_id", businessId).eq("channel", "telegram").eq("chat_id", chatId).eq("role", "user").gte("created_at", since60);
    if ((recentCount || 0) > 12) return new Response("ok");

    // Token-i i bot-it i KËTIJ biznesi (vetë-shërbim); fallback te token-i i përbashkët
    const { data: bizRow } = await supabase.from("businesses").select("telegram_token").eq("id", businessId).maybeSingle();
    const botToken = (bizRow && bizRow.telegram_token) || BOT;

    // Kujtesa e bisedës (10 mesazhet e fundit)
    const { data: hist } = await supabase.from("messages").select("role,content")
      .eq("business_id", businessId).eq("channel", "telegram").eq("chat_id", chatId)
      .order("created_at", { ascending: true }).limit(10);
    const history = (hist || []).map((h: any) => ({ role: h.role, text: h.content }));

    // Ruaj mesazhin e klientit
    await supabase.from("messages").insert({
      business_id: businessId, channel: "telegram", chat_id: chatId, role: "user", content: msg.text,
    });

    // Thirr trurin AI
    const r = await fetch(`${SUPABASE_URL}/functions/v1/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${PUBLISHABLE}` },
      body: JSON.stringify({ business_id: businessId, text: msg.text, client_name: name, history, channel: "telegram", chat_id: chatId }),
    });
    const out = await r.json().catch(() => ({}));
    const reply = out.reply || "…";

    // Ruaj përgjigjen + dërgoje në Telegram
    await supabase.from("messages").insert({
      business_id: businessId, channel: "telegram", chat_id: chatId, role: "bot", content: reply,
    });
    await sendTelegram(chatId, reply, botToken);

    return new Response("ok");
  } catch (_e) {
    return new Response("ok"); // Telegram-it i kthejmë gjithmonë 200
  }
});
