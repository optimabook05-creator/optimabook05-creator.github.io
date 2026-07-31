/* A e kap vërtet skaneri? E provojmë me TË TRE gabimet reale që kanë shkuar
   në kod në këtë projekt — plus kod të saktë, që të mos japë alarme false. */
const { scanText } = require("./damage.cjs");
const check = (line) => (scanText(line)[0] || {}).why || null;

const CASES = [
  // === GABIME REALE që kanë shkuar në kod ===
  ['if (!/^https?:///i.test(mu)) return;',                        true,  "optima-app.js — vrau tërë panelin"],
  ['photoMime = /.png$/i.test(fpath) ? "image/png" : "x";',        true,  "telegram — pika kap çdo shkronjë"],
  ['const IMG_RE = /https?://[^s<>"\')]+.(?:jpg)(?:?[^s]*)?/gi;',  true,  "pullImages — tre dëmtime njëherësh"],
  ['OPENAI_BASE = OPENAI_BASE.replace(//+$/, "");',                true,  "tre edge functions — regex u bë koment"],
  // === KOD I SAKTË — s'duhet alarm ===
  ['if (!/^https?:\\/\\//i.test(mu)) return;',                     false, "versioni i rregulluar"],
  ['s.replace(/[^\\S\\n]{2,}/g, " ")',                              false, "pastrimi i hapësirave"],
  ['const re = /^\\d{1,3}([.,]\\d{3})+$/;',                         false, "çmimet me mijëshe"],
  ['norm(text).split(/\\s+/)',                                      false, "ndarja e fjalëve"],
  ['/^\\/start\\s+oa_([0-9a-f-]{36})\\s*$/i',                        false, "lidhja e pronarit"],
  ['const url = "https://api.telegram.org/bot" + token;',          false, "URL në varg të thjeshtë"],
  ['fetch(`https://graph.facebook.com/v21.0/${id}`)',              false, "URL në template literal"],
  ['new RegExp("https?://[^\\\\s]+", "gi")',                        false, "regex i ndërtuar nga varg"],
  ['photoMime = /\\.png$/i.test(g.path) ? "image/png" : "x";',      false, "versioni i rregulluar i .png"],
];

let bad = 0;
for (const [line, duhet, emri] of CASES) {
  const got = !!check(line);
  const ok = got === duhet;
  if (!ok) bad++;
  console.log(`${ok ? "✅" : "❌"} ${duhet ? "duhet ALARM " : "duhet HESHTJE"} → ${got ? "alarm  " : "heshtje"} | ${emri}`);
}
console.log(bad
  ? `\n❌ skaneri s'është i besueshëm (${bad} gabime) — mos i beso rezultatit`
  : `\n✅ skaneri i provuar: kap të 4 gabimet reale, zero alarme false në ${CASES.length - 4} raste të sakta`);
process.exit(bad ? 1 : 0);
