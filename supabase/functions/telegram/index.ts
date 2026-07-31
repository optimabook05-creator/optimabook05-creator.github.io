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

// Normalizim teksti për përputhje emrash artikujsh (pa theksa: ç→c, ë→e; hapësira të pastruara)
function normTxt(s: string): string {
  return String(s || "").toLowerCase()
    .replace(/ç/g, "c").replace(/ë/g, "e")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
}
// "1.200"/"1,200" = mijëshe → 1200; "430,50" → 430.5
function parsePriceNum(s: string): number {
  s = String(s || "").trim();
  if (/^\d{1,3}([.,]\d{3})+$/.test(s)) return Number(s.replace(/[.,]/g, ""));
  return Number(s.replace(",", "."));
}

/* Linqet e fotove brenda përgjigjes së AI-së.
   AI-ja tani ngjit URL-në e fotos së artikullit ("ja ku është"). Një URL e thatë
   e detyron klientin të dalë nga biseda; një foto e vërtetë e mban aty dhe shet.
   Prandaj i nxjerrim, i dërgojmë si foto, dhe i heqim nga teksti. */
function pullImages(text: string): { clean: string; urls: string[] } {
  const re = new RegExp("https?://[^\\s<>\"')]+\\.(?:jpg|jpeg|png|webp|gif)(?:\\?[^\\s<>\"')]*)?", "gi");
  const found = String(text || "").match(re) || [];
  const all = [...new Set(found)];
  const urls = all.slice(0, 3);                          // dërgojmë max 3 foto — pa spam
  let clean = String(text || "");
  // HIQ TË GJITHA nga teksti, edhe ato mbi kufirin: përndryshe e katërta i
  // mbetej klientit si URL e thatë në mes të fjalisë.
  for (const u of all) clean = clean.split(u).join("");
  // Pastro mbeturinat që mbeten pas heqjes (dy hapësira, ": " pa asgjë pas, rreshta bosh)
  clean = clean.replace(/[^\S\n]{2,}/g, " ")
               .replace(/[^\S\n]*[:—-][^\S\n]*(?=\n|$)/g, "")
               .replace(/\n{3,}/g, "\n\n").trim();
  return { clean, urls };
}
async function sendPhotoTG(chatId: string, url: string, caption: string, token: string) {
  const r = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, photo: url, caption: caption ? caption.slice(0, 1024) : undefined }),
  }).then((x) => x.json()).catch(() => null);
  return !!(r && r.ok);
}

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

    /* SHENJA E VERSIONIT — para çdo kontrolli tjetër.
       PSE KETU: kontrolli i sekretit më poshtë kthen "ok" të heshtur për çdo
       kërkesë pa sekret. Po ta vendosja pas tij, shenja s'arrihej kurrë dhe
       verifikimi i ngarkimit mbetej i pamundur — pikërisht problemi që zgjidh.
       Nuk zbulon asgjë: vetëm një numër versioni, asnjë të dhënë, asnjë sekret. */
    const peek = req.method === "POST" ? await req.clone().json().catch(() => ({})) : {};
    if (peek && peek.ping) return new Response(JSON.stringify({ ok: true, build: "179", photo: true, voice: true }), { headers: { "Content-Type": "application/json" } });

    // SIGURI: verifiko secret_token-in që Telegram e dërgon në çdo webhook.
    // Vendoset kur regjistrohet webhook-u (setWebhook?secret_token=<X>). Kështu
    // askush s'mund të POST-ojë mesazhe të rreme edhe nëse di business_id-në.
    // Backward-compatible: pa sekretin e vendosur, s'bllokon (webhook-et e vjetra punojnë).
    const got = req.headers.get("x-telegram-bot-api-secret-token");
    const WH_SECRET = Deno.env.get("TELEGRAM_WEBHOOK_SECRET");
    /* Dy lloje bot-esh, dy sekrete:
       • BOT-I I PËRBASHKËT (pa business_id në URL) → sekreti global i platformës.
       • BOT-I I VETË BIZNESIT (me business_id) → biznesi e regjistron vetë
         webhook-un nga paneli dhe NUK e di sekretin global; ndaj secili biznes
         ka sekretin e vet (businesses.tg_webhook_secret) dhe verifikohet me të.
       Pa këtë ndarje, çdo biznes me bot të vetin do të hidhej në heshtje. */
    const bidParam = url.searchParams.get("business_id");
    let whTrusted = false;
    if (bidParam) {
      const { data: bsec } = await supabase.from("businesses")
        .select("tg_webhook_secret").eq("id", bidParam).maybeSingle();
      const own = bsec && (bsec as any).tg_webhook_secret;
      if (own) {
        if (got !== String(own)) return new Response("ok");   // hesht
        whTrusted = true;
      }
    } else if (WH_SECRET) {
      if (got !== WH_SECRET) return new Response("ok"); // hesht (200) — mos i jep info sulmuesit
      whTrusted = true;
    }
    /* A e KEMI PROVUAR se kjo kërkesë vjen vërtet nga Telegram?
       Vetëm sekreti i webhook-ut e provon. Pa të, kushdo që di URL-në e funksionit
       mund të POST-ojë një "mesazh" të rremë me chat_id-në e pronarit dhe të
       ekzekutojë /off ose të ndryshojë çmimet. Mesazhet e klientëve nuk kanë
       këtë rrezik (një klient i rremë thjesht marrë një përgjigje), ndaj rruga e
       klientit vazhdon normalisht — POR KOMANDAT E PRONARIT bllokohen derisa
       sekreti të vendosen. Sigurinë nuk e lëmë të varet nga një cilësim i harruar.
       (whTrusted u vendos më lart — nga sekreti global ose ai i vetë biznesit.) */

    const update = await req.json().catch(() => ({}));
    const msg = update.message || update.edited_message;
    if (!msg?.chat) return new Response("ok");

    /* ---- FOTO DHE ZË (zbulimi) ----
       Deri tani `if (!msg.text)` e hidhte mesazhin → dy klientë krejt normalë
       merrnin HESHTJE TË PLOTË dhe mendonin se u injoruan:
         • ai që dërgon një screenshot nga rrjetet sociale ("a e ke këtë?");
         • ai që dërgon ZË — dhe në Shqipëri zëri përdoret më shumë se shkrimi.
       Këtu vetëm i ZBULOJMË; shkarkimi bëhet më poshtë, kur dihet token-i i
       saktë i bot-it (i përbashkët ose ai i vetë biznesit). */
    const photo = Array.isArray(msg.photo) && msg.photo.length ? msg.photo : null;
    const voice = msg.voice || msg.audio || null;   // zë i regjistruar ose skedar audio
    if (!msg.text) msg.text = String(msg.caption || "").trim();

    /* ÇDO GJË TJETËR (skedar, video, vendndodhje, kontakt, sticker) nuk shihet
       dot nga AI-ja — POR heshtja është përgjigjja më e keqe e mundshme. Ndaj i
       përshkruajmë me fjalë dhe ia japim AI-së: ajo përgjigjet natyrshëm, në
       gjuhën e klientit, dhe mund të marrë prapë emrin e numrin. */
    if (!msg.text && !photo && !voice) {
      const d = msg.document, v = msg.video || msg.video_note, c = msg.contact;
      if (d)                 msg.text = `[Klienti dërgoi një skedar: ${String(d.file_name || "pa emër").slice(0, 80)}]`;
      else if (v)            msg.text = "[Klienti dërgoi një video]";
      else if (msg.location) msg.text = "[Klienti ndau vendndodhjen e tij]";
      else if (c)            msg.text = `[Klienti ndau një kontakt: ${String(c.first_name || "")} ${String(c.phone_number || "")}`.trim() + "]";
      else if (msg.sticker)  msg.text = String(msg.sticker.emoji || "👋");   // sticker → trajtohet si emoji/përshëndetje
      else return new Response("ok");   // vërtet s'ka asgjë për të përpunuar
    }

    const chatId = String(msg.chat.id);
    const name = msg.from?.first_name || "Telegram";

    /* ---- LIDHJA E PRONARIT PËR NJOFTIME (punon në ÇDO mënyrë webhook-u) ----
       Pronari hap t.me/<BOT>?start=oa_<token_sekret> → këtu ruajmë chat_id-në
       e tij si kanal njoftimesh. Token-i është sekret (vetëm pronari e sheh në
       panel), ndaj askush s'mund të regjistrohet për njoftimet e një biznesi tjetër. */
    const mOwner = msg.text.match(/^\/start\s+oa_([0-9a-f-]{36})\s*$/i);
    if (mOwner) {
      const token = mOwner[1].toLowerCase();
      const { data: b } = await supabase.from("businesses")
        .select("id, name, lang, owner_tg_chat, telegram_token").eq("owner_alert_token", token).maybeSingle();
      if (b) {
        /* SIGURIA E LIDHJES — token-i është UUID (122 bit): i pahamendësueshëm, dhe
           duket VETËM në panelin e pronarit (pas hyrjes + RLS). Prandaj askush s'bëhet
           pronar "nga rruga". POR linku mund të RRJEDHË (screenshot, përcjellë, grup),
           dhe kanali i pronarit tani ka pushtet real: /off dhe ndryshim çmimesh.
           Ndaj: (1) token-i NDRYSHON menjëherë pas lidhjes → linku i përdorur vdes;
                 (2) nëse zëvendësohet një lidhje e vjetër, ATA njoftohen — zaptimi
                     i heshtur bëhet i pamundur. */
        const prev = b.owner_tg_chat;
        try {
          await supabase.from("businesses")
            .update({ owner_tg_chat: chatId, owner_alert_token: crypto.randomUUID() })
            .eq("id", b.id);
        } catch (_e) {}
        if (prev && String(prev) !== String(chatId)) {
          const sqP = (b.lang || "sq").toLowerCase().startsWith("sq");
          try {
            await sendTelegram(String(prev), sqP
              ? `⚠️ Njoftimet e "${b.name}" u kaluan te një pajisje tjetër tani. Nëse NUK e bëre ti, hap panelin → Cilësimet → "Shkëput Telegram-in" dhe lidhu sërish me link të re.`
              : `⚠️ Alerts for "${b.name}" were just moved to another device. If this was NOT you, open the panel → Settings → "Disconnect Telegram" and re-link with a fresh link.`,
              (b as any).telegram_token || BOT);
          } catch (_e) { /* njoftimi është shtesë */ }
        }
        const sq = (b.lang || "sq").toLowerCase().startsWith("sq");
        await sendTelegram(chatId, sq
          ? `✅ U lidh! Do të marrësh këtu çdo rezervim, porosi e kërkesë të re për "${b.name}" — në çast, edhe kur je jashtë.\n\n💡 Truk: ndrysho çmimet që këtu:\n• Një artikull: iPhone 15 = 430\n• Gjithë familja: iphone 17 = -10%\n• Gjithë katalogu: * = +5%`
          : `✅ Connected! You'll get every new booking, order and request for "${b.name}" right here — instantly, even when you're away.\n\n💡 Tip: update prices right here:\n• One item: iPhone 15 = 430\n• A whole family: iphone 17 = -10%\n• Whole catalog: * = +5%`, BOT);
      }
      return new Response("ok");
    }

    /* =====================================================================
       PORTA PRONAR / KLIENT — vendoset NJË herë, PARA çdo trajtimi tjetër.
       Nëse ky chat është kanali i njoftimeve të pronarit, ai NUK është kurrë
       bisedë klienti: mesazhet e tij s'ruhen te `messages`, s'shkojnë te truri
       AI, s'krijojnë rezervime e s'i sjellin njoftime për "klient të re" vetes.
       Përndryshe biseda e tij do ndotte Bisedat AI me biseda të rreme dhe një
       provë e pakujdesshme mund të krijonte takim ose kërkesë të vërtetë.
       (Për të provuar AI-në si klient, pronari ka "Provo AI-në" te paneli —
       modaliteti preview, që nuk shkruan asgjë në bazë.)
       Kjo NUK është çështje sigurie: një klient s'mund të ekzekutojë komanda
       pronari, sepse kontrolli bëhet mbi chat_id-në, jo mbi tekstin.
       ===================================================================== */
    const { data: ownerBiz } = await supabase.from("businesses")
      .select("id, name, lang, config").eq("owner_tg_chat", chatId).limit(5);
    const isOwnerChat = !!(ownerBiz && ownerBiz.length);

    if (isOwnerChat) {
      const sqO = (ownerBiz[0].lang || "sq").toLowerCase().startsWith("sq");
      const txt = msg.text.trim();
      const isSwitch = /^\/(off|on|status)\b/i.test(txt);
      const isPriceCmd = /^[^=\n]{1,80}?\s*=\s*[+-]?[\d.,]+\s*%?\s*(?:€|eur|euro|lek|lekë)?$/i.test(txt) && !/https?:\/\//i.test(txt);

      /* PORTA E FUNDIT: komandat që kushtojnë para (çmimet) ose që ndalin
         shërbimin (/off) NUK ekzekutohen nëse s'kemi provuar që kërkesa vjen
         nga Telegram. Pronarit i shpjegohet saktësisht si e rregullon. */
      if ((isSwitch || isPriceCmd) && !whTrusted) {
        await sendTelegram(chatId, sqO
          ? `🔒 Komandat e pronarit janë të bllokuara për sigurinë tënde.\n\nMungon sekreti i webhook-ut, ndaj nuk provohet se kërkesa vjen vërtet nga Telegram — dhe pa këtë, dikush që di adresën mund të ndalonte AI-në ose të ndryshonte çmimet.\n\nRregullimi (një herë): Supabase → Edge Functions → Secrets → shto TELEGRAM_WEBHOOK_SECRET, pastaj ri-regjistro webhook-un me të njëjtin sekret. Njoftimet vazhdojnë normalisht ndërkohë.`
          : `🔒 Owner commands are blocked for your own safety.\n\nThe webhook secret is missing, so we can't prove this request really came from Telegram — and without that, anyone who knows the address could pause the AI or change your prices.\n\nFix (once): Supabase → Edge Functions → Secrets → add TELEGRAM_WEBHOOK_SECRET, then re-register the webhook with the same secret. Alerts keep working meanwhile.`, BOT);
        return new Response("ok");
      }
      if (!isSwitch && !isPriceCmd) {
        // Çdo gjë tjetër nga pronari → udhëzues i shkurtër, dhe STOP (kurrë si klient)
        const names = ownerBiz.map((b: any) => {
          const off = !!(b.config && b.config.aiOff);
          return `${off ? "🔕" : "✅"} ${b.name}${off ? (sqO ? " — AI E NDALUR" : " — AI OFF") : ""}`;
        }).join("\n");
        await sendTelegram(chatId, sqO
          ? `👋 Kjo bisedë është paneli yt, jo bisedë klienti — ndaj mesazhet e tua nuk shkojnë te AI-ja.\n\n${names}\n\nKomandat:\n/off — ndal AI-në në çast\n/on — kthee në punë\n/status — gjendja\niPhone 15 = 430 — vendos çmimin\niphone 17 = -10% — gjithë familja\n* = +5% — gjithë katalogun\n\nDo t'i provosh përgjigjet e AI-së? Hap panelin → "Provo AI-në" (atje nuk ruhet asgjë).`
          : `👋 This chat is your control panel, not a customer chat — so your messages don't go to the AI.\n\n${names}\n\nCommands:\n/off — pause the AI instantly\n/on — bring it back\n/status — current state\niPhone 15 = 430 — set a price\niphone 17 = -10% — a whole family\n* = +5% — the whole catalog\n\nWant to try the AI's replies? Open the panel → "Try the AI" (nothing is saved there).`, BOT);
        return new Response("ok");
      }
    }

    /* ---- ÇELËSI I NDALIMIT NGA TELEFONI (vetëm pronari i lidhur) ----
       Kur AI-ja thotë diçka që pronarit nuk i pëlqen, ai është në rrugë — jo
       para panelit. "/off" e ndal në çast, "/on" e kthen, "/status" e thotë
       gjendjen. Klientët vazhdojnë të marrin një përgjigje njerëzore dhe
       pronari njoftohet për çdo mesazh (shih rojen aiOff te funksioni chat). */
    const mSw = msg.text.trim().toLowerCase().match(/^\/(off|on|status)\b/);
    if (mSw) {
      const owned = ownerBiz;
      if (owned && owned.length) {
        const cmd = mSw[1];
        for (const b of owned) {
          if (cmd === "status") continue;
          const cfg = Object.assign({}, b.config || {});
          cfg.aiOff = cmd === "off";
          try { await supabase.from("businesses").update({ config: cfg }).eq("id", b.id); b.config = cfg; } catch (_e) {}
        }
        const sq = (owned[0].lang || "sq").toLowerCase().startsWith("sq");
        const lines = owned.map((b: any) => {
          const off = !!(b.config && b.config.aiOff);
          return `${off ? "🔕" : "✅"} ${b.name}: ${off ? (sq ? "AI E NDALUR" : "AI OFF") : (sq ? "AI aktive" : "AI on")}`;
        }).join("\n");
        const tip = cmd === "off"
          ? (sq ? "\n\nKlientët do marrin: \"Do t'ju kthehemi personalisht shumë shpejt\" — dhe ti njoftohesh për çdo mesazh. Shkruaj /on për ta kthyer."
                : "\n\nCustomers will get: \"We'll get back to you personally very soon\" — and you get notified for every message. Send /on to switch it back.")
          : (sq ? "\n\nShkruaj /off për ta ndalur në çast kurdo." : "\n\nSend /off to stop it instantly at any time.");
        await sendTelegram(chatId, lines + tip, BOT);
        return new Response("ok");
      }
      // s'është kanal pronari → vazhdo si mesazh klienti normal
    }

    /* ---- ÇMIMET ME NJË MESAZH (vetëm pronari i lidhur për njoftime) ----
       NJË artikull:   "iphone 15 128gb = 430"      → vendos çmimin saktë
       FAMILJE me %:   "iphone 17 = -10%"           → TË GJITHË variantet (Pro,
                       Pro Max, 128GB…) njëherësh; edhe paketat (variants) shkallëzohen
       GJITHË katalogu:"* = +5%"  (ose "te gjitha = -5%")
       Trigger-i në bazë e freskon price_updated_at vetë → AI-ja i citon sërish
       me besim (modaliteti "çmime të gjalla"). Klientët s'preken kurrë:
       ndërhyn VETËM kur chat_id-ja është kanal pronari DHE trajta "emër = numër". */
    const mPrice = msg.text.match(/^([^=\n]{1,80}?)\s*=\s*([+-]?[\d.,]+)\s*(%)?\s*(?:€|eur|euro|lek|lekë)?\s*$/i);
    if (mPrice && !/https?:\/\//i.test(msg.text)) {
      const owned = ownerBiz;   // porta e mësipërme e ka gjetur tashmë (një pyetje, jo dy)
      if (owned && owned.length) {
        const sq = (owned[0].lang || "sq").toLowerCase().startsWith("sq");
        const isPct = !!mPrice[3];
        const rawNum = mPrice[2];
        const q = normTxt(mPrice[1]);
        const round2 = (n: number) => Math.round(n * 100) / 100;
        const ids = owned.map((b: any) => b.id);
        const { data: svcs } = await supabase.from("services")
          .select("id, business_id, name, sku, price, variants").in("business_id", ids).eq("active", true).limit(10000);
        const all = svcs || [];
        // "*", "te gjitha", "gjithcka", "all" → i gjithë katalogu
        const wantAll = /^(\*|te gjitha|të gjitha|gjithcka|gjithçka|all|everything)$/.test(q) || mPrice[1].trim() === "*";
        const qWords = q.split(" ").filter(Boolean);
        const cands = wantAll ? all : all.filter((s: any) => {
          const nn = normTxt(s.name), ns = normTxt(s.sku || "");
          return (ns && ns === q) || nn === q || qWords.every((w: string) => nn.includes(w));
        });
        // Përputhja e plotë (emër/SKU) fiton mbi të pjesshmet — VETËM për vendosje absolute
        const exact = cands.filter((s: any) => normTxt(s.name) === q || normTxt(s.sku || "") === q);

        if (isPct) {
          /* ---- NDRYSHIM MASIV ME PËRQINDJE: një mesazh → gjithë familja ---- */
          const pct = Number(rawNum.replace(",", "."));
          if (!/^[+-]/.test(rawNum) || !Number.isFinite(pct) || pct < -90 || pct > 500) {
            await sendTelegram(chatId, sq
              ? `Për ndryshim masiv shkruaj me shenjë: "iphone 17 = -10%" (ulje) ose "= +5%" (rritje). Kufijtë: -90% deri +500%.`
              : `For bulk changes use a sign: "iphone 17 = -10%" (down) or "= +5%" (up). Limits: -90% to +500%.`, BOT);
            return new Response("ok");
          }
          const targets = cands.filter((s: any) => Number(s.price) > 0); // pa çmim = "me kërkesë" → s'shkallëzohet
          if (!targets.length) {
            await sendTelegram(chatId, sq
              ? `S'gjeta artikuj me çmim që përputhen me "${mPrice[1].trim()}".`
              : `No priced items match "${mPrice[1].trim()}".`, BOT);
            return new Response("ok");
          }
          const factor = 1 + pct / 100;
          const rows = targets.map((s: any) => {
            const r: any = { id: s.id, business_id: s.business_id, name: s.name, price: round2(Number(s.price) * factor) };
            // Paketat/variantet shkallëzohen bashkë (të mos mbeten me çmim të vjetër)
            if (Array.isArray(s.variants) && s.variants.length) {
              r.variants = s.variants.map((v: any) => (v && Number(v.price) > 0) ? { ...v, price: round2(Number(v.price) * factor) } : v);
            }
            return r;
          });
          for (let i = 0; i < rows.length; i += 300) {
            const { error: upErr } = await supabase.from("services").upsert(rows.slice(i, i + 300));
            if (upErr) {
              await sendTelegram(chatId, sq ? `Diçka dështoi — provo sërish.` : `Something failed — try again.`, BOT);
              return new Response("ok");
            }
          }
          const ex = targets.slice(0, 3).map((s: any, i: number) => `• ${s.name}: ${s.price}€ → ${rows[i].price}€`).join("\n");
          const more = targets.length > 3 ? (sq ? `\n…dhe ${targets.length - 3} të tjerë` : `\n…and ${targets.length - 3} more`) : "";
          await sendTelegram(chatId, sq
            ? `✅ ${targets.length} artikuj u përditësuan (${pct > 0 ? "+" : ""}${pct}%):\n${ex}${more}\n\nÇmimet u freskuan tani.`
            : `✅ ${targets.length} items updated (${pct > 0 ? "+" : ""}${pct}%):\n${ex}${more}\n\nPrices refreshed now.`, BOT);
          return new Response("ok");
        }

        /* ---- VENDOSJE ABSOLUTE (një artikull i vetëm, kërkon saktësi) ---- */
        const newPrice = parsePriceNum(rawNum);
        if (!q || wantAll || !Number.isFinite(newPrice) || newPrice < 0 || newPrice > 100000000) {
          await sendTelegram(chatId, sq
            ? `Çmimi s'u lexua. Shkruaj: emri i artikullit = çmimi (p.sh. iPhone 15 = 430), ose masivisht me %: iphone 17 = -10%`
            : `Couldn't read that. Write: item name = price (e.g. iPhone 15 = 430), or in bulk with %: iphone 17 = -10%`, BOT);
          return new Response("ok");
        }
        const hits = exact.length ? exact : cands;
        if (!hits.length) {
          await sendTelegram(chatId, sq
            ? `S'e gjeta "${mPrice[1].trim()}" në katalog. Shkruaje emrin siç është në panel (ose kodin SKU) = çmimi.`
            : `Couldn't find "${mPrice[1].trim()}" in the catalog. Use the exact name from the panel (or the SKU) = price.`, BOT);
          return new Response("ok");
        }
        if (hits.length > 1) {
          const list = hits.slice(0, 5).map((s: any) => `• ${s.name}${s.sku ? " (" + s.sku + ")" : ""}`).join("\n");
          await sendTelegram(chatId, sq
            ? `Gjeta ${hits.length} artikuj që përputhen:\n${list}\n\nShkruaje emrin e plotë (ose SKU-në) = çmimi.\n💡 Për t'i ndryshuar TË GJITHË njëherësh: ${mPrice[1].trim()} = -10%`
            : `Found ${hits.length} matching items:\n${list}\n\nWrite the full name (or SKU) = price.\n💡 To change them ALL at once: ${mPrice[1].trim()} = -10%`, BOT);
          return new Response("ok");
        }
        const hit = hits[0];
        const { error: upErr } = await supabase.from("services").update({ price: newPrice }).eq("id", hit.id);
        await sendTelegram(chatId, upErr
          ? (sq ? `Diçka dështoi — provo sërish.` : `Something failed — try again.`)
          : (sq ? `✅ ${hit.name}: ${hit.price}€ → ${newPrice}€ — çmimi u freskua tani.` : `✅ ${hit.name}: ${hit.price}€ → ${newPrice}€ — price refreshed now.`), BOT);
        return new Response("ok");
      }
      // s'është kanal pronari → mesazh klienti normal (vazhdon poshtë)
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

    /* ALBUM (disa foto njëherësh) — Telegram e dërgon SECILËN foto si update të
       veçantë. Pa këtë, klienti që dërgon 4 foto merr 4 përgjigje njëra pas
       tjetrës dhe duket si bot i prishur. Përgjigjemi vetëm për të parën. */
    if (msg.media_group_id) {
      const { error: gErr } = await supabase.from("processed_updates").insert({ id: "tgg_" + msg.media_group_id });
      if (gErr && gErr.code === "23505") return new Response("ok");
    }

    // P0-3: Rate limit i thjeshtë — mbrojtje nga spam/kosto (maks ~12 mesazhe/min)
    const since60 = new Date(Date.now() - 60000).toISOString();
    const { count: recentCount } = await supabase.from("messages").select("id", { count: "exact", head: true })
      .eq("business_id", businessId).eq("channel", "telegram").eq("chat_id", chatId).eq("role", "user").gte("created_at", since60);
    if ((recentCount || 0) > 12) return new Response("ok");

    // Token-i i bot-it i KËTIJ biznesi (vetë-shërbim); fallback te token-i i përbashkët
    const { data: bizRow } = await supabase.from("businesses").select("telegram_token").eq("id", businessId).maybeSingle();
    const botToken = (bizRow && bizRow.telegram_token) || BOT;

    /* Shkarkimi i fotos/zërit me token-in E SAKTË (bot i biznesit ose i përbashkët).
       Kufi 4MB dhe dështim i heshtur: një skedar i madh ose një gabim rrjeti
       s'duhet ta bllokojë kurrë bisedën — klienti merr gjithsesi përgjigje. */
    const tgGrab = async (fileId: string): Promise<{ b64: string; path: string }> => {
      const fi = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${encodeURIComponent(fileId)}`).then((r) => r.json());
      const fpath = fi?.result?.file_path;
      if (!fpath) return { b64: "", path: "" };
      const bin = await fetch(`https://api.telegram.org/file/bot${botToken}/${fpath}`).then((r) => r.arrayBuffer());
      if (bin.byteLength > 4_000_000) return { b64: "", path: "" };
      const bytes = new Uint8Array(bin);
      let raw = "";
      // Në copa: `String.fromCharCode(...bytes)` mbi disa MB e mbush stivën dhe rrëzohet.
      for (let i = 0; i < bytes.length; i += 8192) raw += String.fromCharCode(...bytes.subarray(i, i + 8192));
      return { b64: btoa(raw), path: fpath };
    };

    let photoB64 = "", photoMime = "";
    if (photo) {
      try {
        // Madhësia e parafundit: mjaft për njohje, pa harxhuar kuotë kot.
        const sizes = photo.slice().sort((a: any, b: any) => (a.width || 0) - (b.width || 0));
        const pick = sizes[Math.max(0, sizes.length - 2)] || sizes[sizes.length - 1];
        const g = await tgGrab(pick.file_id);
        photoB64 = g.b64;
        photoMime = /\.png$/i.test(g.path) ? "image/png" : "image/jpeg";
      } catch (_e) { /* foto e palexueshme → vazhdo si mesazh teksti */ }
    }

    /* ZËRI — në Shqipëri klientët dërgojnë zë më shpesh se tekst. Deri tani
       merrnin heshtje. Kufi 3 minuta: mbi këtë s'është pyetje klienti. */
    let voiceB64 = "", voiceMime = "";
    if (voice && !photoB64) {
      try {
        if (!voice.duration || voice.duration <= 180) {
          const g = await tgGrab(voice.file_id);
          voiceB64 = g.b64;
          voiceMime = String(voice.mime_type || "audio/ogg").split(";")[0];
        }
      } catch (_e) { /* zë i palexueshëm → vazhdo */ }
    }

    // Kujtesa e bisedës (10 mesazhet e fundit)
    const { data: hist } = await supabase.from("messages").select("role,content")
      .eq("business_id", businessId).eq("channel", "telegram").eq("chat_id", chatId)
      .order("created_at", { ascending: true }).limit(10);
    const history = (hist || []).map((h: any) => ({ role: h.role, text: h.content }));

    /* Ruaj mesazhin e klientit PARA thirrjes së AI-së — që edhe nëse AI-ja
       dështon, pronari ta shohë gjithsesi se çfarë shkroi klienti. */
    const { data: uRow } = await supabase.from("messages").insert({
      business_id: businessId, channel: "telegram", chat_id: chatId, role: "user", content: (photo ? "📷 [foto] " : voice ? "🎤 [zë] " : "") + msg.text,
    }).select("id").maybeSingle();

    // Thirr trurin AI
    const r = await fetch(`${SUPABASE_URL}/functions/v1/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${PUBLISHABLE}` },
      body: JSON.stringify({ business_id: businessId, text: msg.text, client_name: name, history, channel: "telegram", chat_id: chatId, image_b64: photoB64 || undefined, image_mime: photoMime || undefined, audio_b64: voiceB64 || undefined, audio_mime: voiceMime || undefined }),
    });
    const out = await r.json().catch(() => ({}));
    const reply = out.reply || "…";

    /* KUJTESA E FOTOS — pjesa që i mungonte gjithçkaje.
       Klienti dërgon screenshot-in ("a e ke këtë?") dhe pastaj VAZHDON të pyesë:
       "sa kushton?", "a e ke ngjyrë tjetër?", "sa është stoku?". Në ato mesazhe
       fotoja NUK bashkëngjitet më. Pa këtë, historia mbante vetëm "📷 [foto]" —
       një gjurmë boshe — dhe AI-ja e humbte fillin se për cilin produkt bëhej fjalë.
       Ndaj ruajmë PËRSHKRIMIN e asaj që pa, dhe ai udhëton me bisedën. */
    if (uRow && uRow.id && out.image_desc) {
      try {
        await supabase.from("messages")
          .update({ content: `📷 [foto: ${String(out.image_desc).slice(0, 120)}] ${msg.text}`.trim() })
          .eq("id", uRow.id);
      } catch (_e) { /* shtesë — mospërmbushja s'prish asgjë */ }
    }

    // Ruaj përgjigjen + dërgoje në Telegram
    await supabase.from("messages").insert({
      business_id: businessId, channel: "telegram", chat_id: chatId, role: "bot", content: reply,
    });
    /* Nëse përgjigja përmban foto: dërgo FOTOT (e para me tekstin si titull),
       jo URL të thata. Nëse dërgimi i fotos dështon (link i vdekur, host që
       s'e pranon Telegram-i), biem prapa te teksti i plotë — klienti merr
       gjithmonë një përgjigje, kurrë heshtje. */
    const { clean, urls } = pullImages(reply);
    let sent = false;
    if (urls.length) {
      const okFirst = await sendPhotoTG(chatId, urls[0], clean, botToken);
      if (okFirst) {
        sent = true;
        for (let i = 1; i < urls.length; i++) await sendPhotoTG(chatId, urls[i], "", botToken);
      }
    }
    if (!sent) await sendTelegram(chatId, reply, botToken);

    return new Response("ok");
  } catch (_e) {
    return new Response("ok"); // Telegram-it i kthejmë gjithmonë 200
  }
});
