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

/* Linqet e fotove brenda përgjigjes së AI-së → dërgohen si FOTO, jo si URL e thatë.
   AI-ja tani e ka median e artikullit dhe e ngjit linkun kur klienti kërkon ta shohë. */
function pullImages(text: string): { clean: string; urls: string[] } {
  const re = new RegExp("https?://[^\\s<>\"')]+\\.(?:jpg|jpeg|png|webp|gif)(?:\\?[^\\s<>\"')]*)?", "gi");
  const all = [...new Set(String(text || "").match(re) || [])];
  const urls = all.slice(0, 3);                       // dërgojmë max 3 — pa spam
  let clean = String(text || "");
  for (const u of all) clean = clean.split(u).join(""); // hiq TË GJITHA, që asnjë të mos mbetet tekst i thatë
  clean = clean.replace(/[^\S\n]{2,}/g, " ")
               .replace(/[^\S\n]*[:—-][^\S\n]*(?=\n|$)/g, "")
               .replace(/\n{3,}/g, "\n\n").trim();
  return { clean, urls };
}
async function sendImageWA(phoneNumberId: string, to: string, url: string, caption: string) {
  const r = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${WA_TOKEN}` },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "image", image: { link: url, caption: caption ? caption.slice(0, 1024) : undefined } }),
  }).then((x) => x.json()).catch(() => null);
  return !!(r && r.messages);
}

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
    /* Pranohej VETËM `type === "text"` → dy klientë krejt normalë merrnin HESHTJE:
       ai që dërgon foto (screenshot reklame: "a e ke këtë?") dhe ai që dërgon ZË.
       Në WhatsApp zëri është mënyra kryesore e komunikimit për shumë njerëz. */
    if (!businessId || !msg) return new Response("ok");

    const from = msg.from;                                   // numri i klientit
    const isImg = msg.type === "image";
    const isAud = msg.type === "audio";
    let text = isImg ? String(msg.image?.caption || "").trim() : isAud ? "" : (msg.text?.body || "");

    /* ÇDO LLOJ TJETËR (skedar, video, vendndodhje, kontakt, sticker) s'shihet dot
       nga AI-ja — por heshtja është përgjigjja më e keqe. E përshkruajmë me fjalë
       dhe AI-ja përgjigjet natyrshëm në gjuhën e klientit. */
    if (!isImg && !isAud && msg.type !== "text") {
      if (msg.type === "document")      text = `[Klienti dërgoi një skedar: ${String(msg.document?.filename || "pa emër").slice(0, 80)}]`;
      else if (msg.type === "video")    text = "[Klienti dërgoi një video]";
      else if (msg.type === "location") text = "[Klienti ndau vendndodhjen e tij]";
      else if (msg.type === "contacts") text = "[Klienti ndau një kontakt]";
      else if (msg.type === "sticker")  text = "👋";
      else return new Response("ok");   // reactions, system, etj. → injoro
    }
    const phoneNumberId = value?.metadata?.phone_number_id;  // numri i biznesit
    const name = value?.contacts?.[0]?.profile?.name || "WhatsApp";
    if ((!text && !isImg && !isAud) || !phoneNumberId) return new Response("ok");

    // Ruaj phone_number_id të biznesit (që kujtuesit/winback WhatsApp të dinë nga ku të nisen).
    // Kapet automatikisht nga webhook-u — pa konfigurim manual.
    try { await supabase.from("businesses").update({ wa_phone_id: phoneNumberId }).eq("id", businessId); } catch (_e) { /* injoro */ }

    // P0-4: Idempotency — mos përpuno dy herë të njëjtin mesazh (Meta ridërgon)
    const waId = msg.id ? "wa_" + msg.id : null;
    if (waId) {
      const { error: dupErr } = await supabase.from("processed_updates").insert({ id: waId });
      if (dupErr && dupErr.code === "23505") return new Response("ok"); // tashmë i përpunuar
    }

    // Kujtesa e bisedës (10 të fundit)
    const { data: hist } = await supabase.from("messages").select("role,content")
      .eq("business_id", businessId).eq("channel", "whatsapp").eq("chat_id", from)
      .order("created_at", { ascending: true }).limit(10);
    const history = (hist || []).map((h: any) => ({ role: h.role, text: h.content }));

    /* Shkarko median (dy hapa te Meta: media-id → URL e përkohshme → bajtat).
       Cap 4MB. Dështimi s'e ndal bisedën — klienti merr gjithsesi përgjigje. */
    const waGrab = async (id: string): Promise<{ b64: string; mime: string }> => {
      const auth = { "Authorization": `Bearer ${WA_TOKEN}` };
      const meta = await fetch(`https://graph.facebook.com/v21.0/${id}`, { headers: auth }).then((r) => r.json());
      if (!meta?.url) return { b64: "", mime: "" };
      const bin = await fetch(meta.url, { headers: auth }).then((r) => r.arrayBuffer());
      if (bin.byteLength > 4_000_000) return { b64: "", mime: "" };
      const bytes = new Uint8Array(bin);
      let raw = "";
      // Në copa: `fromCharCode(...bytes)` mbi disa MB e mbush stivën dhe rrëzohet.
      for (let i = 0; i < bytes.length; i += 8192) raw += String.fromCharCode(...bytes.subarray(i, i + 8192));
      return { b64: btoa(raw), mime: String(meta.mime_type || "").split(";")[0] };
    };

    let photoB64 = "", photoMime = "";
    if (isImg && msg.image?.id) {
      try {
        const g = await waGrab(msg.image.id);
        photoB64 = g.b64;
        photoMime = g.mime || String(msg.image.mime_type || "image/jpeg").split(";")[0];
      } catch (_e) { /* foto e palexueshme → vazhdo */ }
    }

    // ZËRI — mënyra kryesore e komunikimit për shumë klientë. Kufizohet nga cap-i 4MB.
    let voiceB64 = "", voiceMime = "";
    if (isAud && msg.audio?.id) {
      try {
        const g = await waGrab(msg.audio.id);
        voiceB64 = g.b64;
        voiceMime = g.mime || String(msg.audio.mime_type || "audio/ogg").split(";")[0];
      } catch (_e) { /* zë i palexueshëm → vazhdo */ }
    }

    await supabase.from("messages").insert({
      business_id: businessId, channel: "whatsapp", chat_id: from, role: "user", content: (isImg ? "📷 [foto] " : isAud ? "🎤 [zë] " : "") + text,
    });

    // Thirr trurin AI
    const r = await fetch(`${SUPABASE_URL}/functions/v1/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${PUBLISHABLE}` },
      body: JSON.stringify({ business_id: businessId, text, client_name: name, history, channel: "whatsapp", chat_id: from, image_b64: photoB64 || undefined, image_mime: photoMime || undefined, audio_b64: voiceB64 || undefined, audio_mime: voiceMime || undefined }),
    });
    const out = await r.json().catch(() => ({}));
    const reply = out.reply || "…";

    await supabase.from("messages").insert({
      business_id: businessId, channel: "whatsapp", chat_id: from, role: "bot", content: reply,
    });
    /* Foto të vërteta, jo URL të thata. Nëse dërgimi dështon (link i vdekur
       ose host që Meta s'e pranon), biem prapa te teksti i plotë — kurrë heshtje. */
    const { clean, urls } = pullImages(reply);
    let sent = false;
    if (urls.length) {
      if (await sendImageWA(phoneNumberId, from, urls[0], clean)) {
        sent = true;
        for (let i = 1; i < urls.length; i++) await sendImageWA(phoneNumberId, from, urls[i], "");
      }
    }
    if (!sent) await sendWhatsApp(phoneNumberId, from, reply);

    return new Response("ok");
  } catch (_e) {
    return new Response("ok"); // Meta-s i kthejmë gjithmonë 200
  }
});
