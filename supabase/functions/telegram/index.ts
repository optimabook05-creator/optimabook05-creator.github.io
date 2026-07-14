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

    // SIGURI: verifiko secret_token-in që Telegram e dërgon në çdo webhook.
    // Vendoset kur regjistrohet webhook-u (setWebhook?secret_token=<X>). Kështu
    // askush s'mund të POST-ojë mesazhe të rreme edhe nëse di business_id-në.
    // Backward-compatible: pa sekretin e vendosur, s'bllokon (webhook-et e vjetra punojnë).
    const WH_SECRET = Deno.env.get("TELEGRAM_WEBHOOK_SECRET");
    if (WH_SECRET) {
      const got = req.headers.get("x-telegram-bot-api-secret-token");
      if (got !== WH_SECRET) return new Response("ok"); // hesht (200) — mos i jep info sulmuesit
    }

    const update = await req.json().catch(() => ({}));
    const msg = update.message || update.edited_message;
    if (!msg?.text || !msg.chat) return new Response("ok");

    const chatId = String(msg.chat.id);
    const name = msg.from?.first_name || "Telegram";

    /* ---- LIDHJA E PRONARIT PËR NJOFTIME (punon në ÇDO mënyrë webhook-u) ----
       Pronari hap t.me/<BOT>?start=oa_<token_sekret> → këtu ruajmë chat_id-në
       e tij si kanal njoftimesh. Token-i është sekret (vetëm pronari e sheh në
       panel), ndaj askush s'mund të regjistrohet për njoftimet e një biznesi tjetër. */
    const mOwner = msg.text.match(/^\/start\s+oa_([0-9a-f-]{36})\s*$/i);
    if (mOwner) {
      const token = mOwner[1].toLowerCase();
      const { data: b } = await supabase.from("businesses").select("id, name, lang").eq("owner_alert_token", token).maybeSingle();
      if (b) {
        try { await supabase.from("businesses").update({ owner_tg_chat: chatId }).eq("id", b.id); } catch (_e) {}
        const sq = (b.lang || "sq").toLowerCase().startsWith("sq");
        await sendTelegram(chatId, sq
          ? `✅ U lidh! Do të marrësh këtu çdo rezervim, porosi e kërkesë të re për "${b.name}" — në çast, edhe kur je jashtë.`
          : `✅ Connected! You'll get every new booking, order and request for "${b.name}" right here — instantly, even when you're away.`, BOT);
      }
      return new Response("ok");
    }

    /* ---- MËNYRA MASTER (lidhja 1-klik, pa business_id në URL) ----
       Klienti hap t.me/<BOT>?start=<business_id> → Telegram dërgon "/start <id>"
       → lidhja klient→biznes ruhet te chat_links → çdo mesazh i mëpasshëm
       i këtij klienti shkon vetë te biznesi i duhur. Zero BotFather për pronarin.
       (Nëse klienti hap linkun e një biznesi tjetër më vonë, lidhja kalon aty.) */
    let businessId = url.searchParams.get("business_id"); // bot-et personalë (mënyra e vjetër) punojnë si më parë
    if (!businessId) {
      const mStart = msg.text.match(/^\/start\s+([0-9a-f-]{36})\s*$/i);
      if (mStart) {
        const bid = mStart[1].toLowerCase();
        const { data: b } = await supabase.from("businesses").select("id, name, lang").eq("id", bid).maybeSingle();
        if (!b) return new Response("ok"); // id e pavlefshme → hesht
        try {
          await supabase.from("chat_links").upsert({ channel: "telegram", chat_id: chatId, business_id: b.id });
        } catch (_e) { /* tabela mungon para master-bot.sql → thjesht s'mbahet mend */ }
        const sq = (b.lang || "sq").toLowerCase().startsWith("sq");
        await sendTelegram(chatId, sq
          ? `Përshëndetje! 👋 Jam recepsionisti i "${b.name}" — më shkruaj lirshëm për çmime, orare a rezervim.`
          : `Hi! 👋 I'm the receptionist for "${b.name}" — ask me anything about prices, hours or booking.`, BOT);
        return new Response("ok");
      }
      // Mesazh normal te bot-i master → gjej biznesin nga lidhja e ruajtur
      try {
        const { data: link } = await supabase.from("chat_links").select("business_id")
          .eq("channel", "telegram").eq("chat_id", chatId).maybeSingle();
        businessId = link?.business_id || null;
      } catch (_e) { businessId = null; }
      if (!businessId) {
        // S'ka lidhje → udhëzim i shkurtër (dygjuhësh), pa zhurmë të mëtejshme
        await sendTelegram(chatId, "Për të filluar, hap linkun e biznesit (t.me/…?start=…) që të lidhem me të. / To start, open the business's link (t.me/…?start=…) so I know who to connect you with. 🙏", BOT);
        return new Response("ok");
      }
      if (/^\/start\b/.test(msg.text)) msg.text = "Përshëndetje"; // /start i thjeshtë → përshëndetje njerëzore
    }

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
