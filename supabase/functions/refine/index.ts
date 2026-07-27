// @ts-nocheck  — Ekzekutohet në DENO (Supabase Edge Functions), jo në Node.
// =====================================================================
// OptimaBook — REDAKTORI I DIJES (kontrolli i përgjigjes para se të ruhet)
//
// PROBLEMI: "Rrethi i Mësimit" e bën AI-në të mësojë nga pronari. Por pronari
// është i zënë dhe shkruan si njeri: shkurt ("po bojme"), dykuptimësisht
// ("varet"), ose i paplotë (pa çmim, pa kusht, pa afat). Ajo përgjigje pastaj
// futet në ÇDO bisedë të ardhshme — dije e keqe, përgjithmonë.
//
// ZGJIDHJA: para se të ruhet, AI-ja e lexon si REDAKTOR:
//   • e rishkruan si përgjigje të qartë për klientin (në gjuhën e biznesit)
//   • thotë ÇFARË mungon ose ku është e dykuptimtë
//   • bën pyetje TË SHKURTRA vetëm kur pa to përgjigjja s'del dot e saktë
// Pronari e sheh, e pranon ose e ndryshon. VENDIMI MBETET GJITHMONË I TIJ —
// ky funksion nuk ruan asgjë dhe nuk prek fare bazën.
//
// SIGURI: pa akses në bazë; shkrimi bëhet nga paneli nën RLS-në e pronarit.
// DEPLOY: "Verify JWT" ON (parazgjedhja) → e thërrasin vetëm përdoruesit e
// loguar; kuota e AI-së s'digjet dot nga anonimët.
//
// Hyrje (POST JSON): { question, answer, biz_name?, lang?, services? }
// Dalje: { polished, issues: [], asks: [], ok, via }
// =====================================================================

export {}; // modul ES (si i trajton Deno; e lejon edhe validimin lokal me strip-types)

const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY")!;
const MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash-lite";
const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini";
/* Cdo ofrues me API te perputhshme me OpenAI punon ketu: Groq, DeepSeek,
   Together, OpenRouter (Qwen/Llama)… Ndrysho vetem OPENAI_BASE_URL + KEY + MODEL.
   Keshtu ofruesi i dyte behet rrjet sigurie pa asnje rresht kodi te ri. */
let OPENAI_BASE = Deno.env.get("OPENAI_BASE_URL") || "https://api.openai.com/v1";
while (OPENAI_BASE.endsWith("/")) OPENAI_BASE = OPENAI_BASE.slice(0, -1);
const AI_PROVIDER = (Deno.env.get("AI_PROVIDER") || "").toLowerCase();

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function systemFor(bizName: string, lang: string, services: string) {
  const L = lang === "en" ? "English" : "Albanian";
  return [
    `You are an editor helping a small business owner teach their AI receptionist.`,
    `The owner just wrote an answer to a customer question. It will be stored and used to answer EVERY future customer who asks something similar — so it must be clear, complete and impossible to misread.`,
    bizName ? `The business is "${bizName}".` : "",
    services ? `Their catalog (for cross-checking, do NOT invent beyond it):\n${services}` : "",
    ``,
    `Produce THREE things:`,
    `1) "polished": the owner's answer rewritten as a warm, complete, unambiguous reply the receptionist can say to a customer, in ${L}. Keep the owner's MEANING exactly — never add facts, prices, dates or promises they did not give. Keep it short (1–3 sentences). If the answer is already clear and complete, return it essentially unchanged.`,
    `2) "issues": what is wrong with the ORIGINAL answer, as short phrases in ${L}. Use ONLY these when they truly apply:`,
    `   - vague: it can be read in more than one way`,
    `   - incomplete: a customer would immediately need to ask a follow-up`,
    `   - missing_price: it implies a cost but gives no number`,
    `   - missing_condition: it depends on something (quantity, day, area, size) that is not stated`,
    `   - conflict: it contradicts the catalog above`,
    `   Each item: {"type": one of the above, "msg": one short sentence in ${L} explaining it plainly to the owner}`,
    `3) "asks": at most 2 SHORT questions in ${L} the owner should answer so the reply becomes exact. Ask ONLY when the answer genuinely cannot be made correct without that information. Empty array when the answer is fine.`,
    ``,
    `BE CONSERVATIVE. If the owner's answer is clear and complete, return empty "issues" and empty "asks" — do not invent problems to look useful. Never scold. Never rewrite a clear answer just to sound nicer.`,
  ].filter(Boolean).join("\n");
}

const SHAPE = {
  polished: "string",
  issues: "array of {type, msg}",
  asks: "array of string",
};

async function askGemini(system: string, user: string) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            polished: { type: "STRING" },
            issues: {
              type: "ARRAY",
              items: { type: "OBJECT", properties: { type: { type: "STRING" }, msg: { type: "STRING" } }, required: ["type", "msg"] },
            },
            asks: { type: "ARRAY", items: { type: "STRING" } },
          },
          required: ["polished", "issues", "asks"],
        },
      },
    }),
  });
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini: " + JSON.stringify(data).slice(0, 200));
  return JSON.parse(text);
}

async function askOpenAI(system: string, user: string) {
  const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: OPENAI_MODEL, temperature: 0.2,
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "answer_review", strict: true,
          schema: {
            type: "object", additionalProperties: false,
            properties: {
              polished: { type: "string" },
              issues: {
                type: "array",
                items: { type: "object", additionalProperties: false, properties: { type: { type: "string" }, msg: { type: "string" } }, required: ["type", "msg"] },
              },
              asks: { type: "array", items: { type: "string" } },
            },
            required: ["polished", "issues", "asks"],
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

const ISSUE_TYPES = new Set(["vague", "incomplete", "missing_price", "missing_condition", "conflict"]);

/* ---- MBUROJA E KUOTËS ----
   Çelësi publik i Supabase-it ndodhet te config.js — pra e sheh kushdo, dhe me të
   mund të thirret ky funksion. Pa kufi, dikush mund të skriptonte mijëra thirrje
   dhe të digjte kuotën e AI-së; atëherë recepsionisti do të ndalonte për klientët
   realë. Kufiri mbahet në kujtesën e instancës (pa bazë, pa varësi). */
const rlHits = new Map<string, number[]>();
function rateLimited(key: string, max: number): boolean {
  const now = Date.now();
  const arr = (rlHits.get(key) || []).filter((t) => now - t < 60000);
  if (arr.length >= max) { rlHits.set(key, arr); return true; }
  arr.push(now); rlHits.set(key, arr);
  if (rlHits.size > 5000) rlHits.clear(); // sigurim kujtese (sulm me çelësa unikë)
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "?";
    if (rateLimited(ip, 30) || rateLimited("_all", 300)) {
      // 200 me ok:false → paneli thjesht ruan fjalët e pronarit, pa mesazh gabimi
      return new Response(JSON.stringify({ ok: false, error: "rate" }), { headers: { ...cors, "Content-Type": "application/json" } });
    }
    const body = await req.json();
    const question = String(body?.question || "").trim().slice(0, 500);
    const answer = String(body?.answer || "").trim().slice(0, 1500);
    if (!answer) {
      return new Response(JSON.stringify({ error: "bad input" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }
    const system = systemFor(
      String(body?.biz_name || "").slice(0, 80),
      String(body?.lang || "sq").toLowerCase().startsWith("en") ? "en" : "sq",
      String(body?.services || "").slice(0, 3000),
    );
    const user = `CUSTOMER QUESTION:\n${question || "(not recorded)"}\n\nOWNER'S ANSWER:\n${answer}`;

    const useOpenAI = OPENAI_KEY && (AI_PROVIDER === "openai" || !GEMINI_KEY);
    const out = useOpenAI ? await askOpenAI(system, user) : await askGemini(system, user);

    // Pastrim: kurrë mos kthe një "polished" bosh — atëherë origjinali fiton
    const polished = String(out?.polished || "").trim().slice(0, 1500) || answer;
    const issues = (Array.isArray(out?.issues) ? out.issues : [])
      .filter((i: any) => i && ISSUE_TYPES.has(String(i.type)) && String(i.msg || "").trim())
      .slice(0, 4)
      .map((i: any) => ({ type: String(i.type), msg: String(i.msg).trim().slice(0, 200) }));
    const asks = (Array.isArray(out?.asks) ? out.asks : [])
      .filter((a: any) => String(a || "").trim())
      .slice(0, 2)
      .map((a: any) => String(a).trim().slice(0, 200));

    return new Response(JSON.stringify({
      ok: true, polished, issues, asks,
      via: useOpenAI ? "openai" : "gemini",
    }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    // Dështimi i redaktorit NUK duhet ta bllokojë mësimin — paneli ruan origjinalin.
    return new Response(JSON.stringify({ ok: false, error: String(e && e.message || e).slice(0, 300) }), {
      status: 200, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
