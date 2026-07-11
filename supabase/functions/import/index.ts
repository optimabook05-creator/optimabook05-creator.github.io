// @ts-nocheck  — Ekzekutohet në DENO (Supabase Edge Functions), jo në Node.
// =====================================================================
// OptimaBook — IMPORTI I KATALOGUT (lexuesi AI i listave)
// Merr çfarëdo liste produktesh — tekst nga Excel/CSV/PDF ose FOTO të
// çmimores — dhe e kthen në produkte të strukturuara për katalogun.
//
// SIGURI: ky funksion NUK prek bazën fare — është vetëm lexues/parser.
// Shkrimi në katalog bëhet nga paneli, nën RLS-në e pronarit të loguar.
// DEPLOY: "Verify JWT" duhet ON (parazgjedhja) → e thërrasin vetëm
// përdoruesit e loguar të panelit; kuota e AI-së s'digjet dot nga anonimët.
//
// Hyrje (POST JSON): { kind: "text"|"image", content: string, mime?: string }
//   - text:  copë teksti nga lista (paneli e copëton vetë skedarët e mëdhenj)
//   - image: base64 pa prefix (foto çmimoreje / screenshot / PDF i skanuar)
// Dalje: { products: [{name, description, price, stock, sku, unit, uncertain, note}],
//          currency, warnings, via }
// =====================================================================

export {}; // modul ES (si i trajton Deno; e lejon edhe validimin lokal me strip-types)

const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY")!;
const MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash-lite";
const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini";
const AI_PROVIDER = (Deno.env.get("AI_PROVIDER") || "").toLowerCase();

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM = [
  `You are an expert at reading MESSY business product/price lists in ANY language and ANY format:`,
  `Excel/CSV exports, price sheets, PDFs, photos of printed lists, handwritten-style shorthand.`,
  `Extract EVERY distinct product you can see. Rules:`,
  `- "name": the product name, cleaned up (proper capitalization). Expand abbreviations ONLY when obvious from context`,
  `  (e.g. "pb" among clothing → "pambuk", "M/L/XL" are sizes). If unsure what an abbreviation means, KEEP it as written and set uncertain=true with a short "note".`,
  `- "price": the unit/retail price as a plain NUMBER (no currency symbol). If a row shows several prices (retail + wholesale tiers), use the RETAIL/single-unit one and mention the rest in "note".`,
  `- "description": any extra details on the row (material, size, color, packaging). Empty string if none.`,
  `- "stock": quantity on hand if the list shows one, else 0.`,
  `- "sku": product code/barcode if present, else empty string.`,
  `- "unit": unit label if shown (copë, m, kg, palë...), else empty string.`,
  `- "uncertain": true when you guessed anything important (price ambiguous, name unclear, columns confusing) — the owner will review these rows.`,
  `- "note": ONE short sentence (in the same language as the list) explaining what to check. Empty string when certain.`,
  `- "currency": the currency you detected for the whole list (EUR, ALL, USD...), empty string if unknown.`,
  `- "warnings": list-level problems (e.g. "two columns look swapped", "page 3 unreadable"). Empty array if none.`,
  `NEVER invent products that are not in the source. NEVER skip products silently — when in doubt, include with uncertain=true.`,
].join("\n");

/* ---- Gemini (parazgjedhja): tekst OSE foto → JSON i strukturuar ---- */
async function askGemini(kind: string, content: string, mime: string) {
  const parts: any[] = kind === "image"
    ? [{ inline_data: { mime_type: mime || "image/jpeg", data: content } },
       { text: "Extract all products from this price list image." }]
    : [{ text: "Extract all products from this list:\n\n" + content }];
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0, responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            products: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  name: { type: "STRING" }, description: { type: "STRING" },
                  price: { type: "NUMBER" }, stock: { type: "NUMBER" },
                  sku: { type: "STRING" }, unit: { type: "STRING" },
                  uncertain: { type: "BOOLEAN" }, note: { type: "STRING" },
                },
                required: ["name", "price"],
              },
            },
            currency: { type: "STRING" },
            warnings: { type: "ARRAY", items: { type: "STRING" } },
          },
          required: ["products"],
        },
      },
    }),
  });
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini: " + JSON.stringify(data).slice(0, 200));
  return JSON.parse(text);
}

/* ---- OpenAI (nëse AI_PROVIDER=openai): i njëjti rezultat ---- */
async function askOpenAI(kind: string, content: string, mime: string) {
  const userContent: any = kind === "image"
    ? [{ type: "image_url", image_url: { url: `data:${mime || "image/jpeg"};base64,${content}` } },
       { type: "text", text: "Extract all products from this price list image." }]
    : "Extract all products from this list:\n\n" + content;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: OPENAI_MODEL, temperature: 0,
      messages: [{ role: "system", content: SYSTEM }, { role: "user", content: userContent }],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "product_import", strict: true,
          schema: {
            type: "object", additionalProperties: false,
            properties: {
              products: {
                type: "array",
                items: {
                  type: "object", additionalProperties: false,
                  properties: {
                    name: { type: "string" }, description: { type: "string" },
                    price: { type: "number" }, stock: { type: "number" },
                    sku: { type: "string" }, unit: { type: "string" },
                    uncertain: { type: "boolean" }, note: { type: "string" },
                  },
                  required: ["name", "description", "price", "stock", "sku", "unit", "uncertain", "note"],
                },
              },
              currency: { type: "string" },
              warnings: { type: "array", items: { type: "string" } },
            },
            required: ["products", "currency", "warnings"],
          },
        },
      },
    }),
  });
  const data = await res.json();
  const txt = data?.choices?.[0]?.message?.content;
  if (!txt) throw new Error("OpenAI: " + JSON.stringify(data).slice(0, 200));
  return JSON.parse(txt);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { kind, content, mime } = await req.json();
    if (!content || (kind !== "text" && kind !== "image")) {
      return new Response(JSON.stringify({ error: "bad input" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }
    // Kufij mbrojtës: tekst deri ~40k shkronja për copë; foto deri ~4MB base64
    if (kind === "text" && String(content).length > 40000) {
      return new Response(JSON.stringify({ error: "chunk too large" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }
    if (kind === "image" && String(content).length > 4_200_000) {
      return new Response(JSON.stringify({ error: "image too large" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }
    const useOpenAI = OPENAI_KEY && (AI_PROVIDER === "openai" || !GEMINI_KEY);
    const out = useOpenAI ? await askOpenAI(kind, content, mime) : await askGemini(kind, content, mime);
    // Pastrim: vetëm rreshta me emër; numra të sigurt
    const products = (out.products || [])
      .filter((p: any) => p && String(p.name || "").trim())
      .map((p: any) => ({
        name: String(p.name).trim().slice(0, 120),
        description: String(p.description || "").trim().slice(0, 400),
        price: Math.max(0, Math.round((Number(p.price) || 0) * 100) / 100),
        stock: Math.max(0, Math.round(Number(p.stock) || 0)),
        sku: String(p.sku || "").trim().slice(0, 60),
        unit: String(p.unit || "").trim().slice(0, 30),
        uncertain: !!p.uncertain,
        note: String(p.note || "").trim().slice(0, 200),
      }));
    return new Response(JSON.stringify({
      products,
      currency: String(out.currency || "").trim().slice(0, 8),
      warnings: Array.isArray(out.warnings) ? out.warnings.slice(0, 10).map((w: any) => String(w).slice(0, 200)) : [],
      via: useOpenAI ? "openai" : "gemini",
    }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e && e.message || e).slice(0, 300) }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
