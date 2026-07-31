/* Zbulon regex-e të dëmtuar nga shell-i (backslash-e të ngrëna).

   MËSIMI QË E FORMOI KËTË: përpjekja e parë nxirrte fillimisht regex-literalet
   dhe pastaj i shqyrtonte. S'punonte — sepse pikërisht dëmtimi e prish edhe
   nxjerrjen e literalit (një `/` i pambrojtur e mbyll regex-in herët).
   Ndaj këtu kërkohen GJURMËT E DËMIT drejtpërdrejt në tekst: sekuenca që
   nuk shfaqen kurrë në kod të shëndoshë, as në vargje të thjeshta. */
const SIGNS = [
  [/:\/\/\//,                    "`:///` — `\\/\\/` u bë `//` (URL brenda regex-i)"],
  [/\/https?:\/\//,              "regex që nis me `/https?://` — slash-et duhen `\\/`"],
  [/\(\?:\?/,                    "`(?:?` — `\\?` humbi backslash-in"],
  [/\[\^s[\]<>"'\\]/,            "`[^s…]` — duhej `[^\\s…]` (kap shkronjën s, jo hapësirën)"],
  [/\[\^S[\]\\]/,                "`[^S…]` — duhej `[^\\S…]`"],
  [/\/\.(png|jpe?g|gif|webp|mp4|pdf|zip|com|net|org)\$?\//i, "`/.ext/` — pika kap çdo shkronjë; duhej `\\.`"],
  [/replace\(\/\//,              "`replace(//` — regex-i u bë koment"],
  [/\/\\\\[dswb]/,               "`\\\\d`/`\\\\s` i dyfishuar brenda regex-i"],
];

function scanText(src) {
  const out = [];
  src.split("\n").forEach((line, i) => {
    // Komentet qe DOKUMENTOJNE gjurmen s'jane gabim (perndryshe skaneri alarmohet nga vetja)
    const t = line.trim();
    if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*")) return;
    for (const [re, why] of SIGNS) if (re.test(line)) { out.push({ line: i + 1, text: t, why }); break; }
  });
  return out;
}
module.exports = { scanText, SIGNS };

if (require.main === module) {
  const fs = require("fs"), path = require("path");
  const ROOT = "C:/Users/Lenovo/Desktop/upgradeYourSelf";
  const files = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      // Vetë skaneri dhe testi i tij i përmbajnë gjurmët si TË DHËNA prove — jo gabime.
      if (["node_modules", ".git", "fonts", "damage.cjs", "damage.test.cjs"].includes(e.name)) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p); else if (/\.(js|cjs|ts|html)$/.test(e.name)) files.push(p);
    }
  })(ROOT);
  let n = 0;
  for (const f of files) {
    for (const h of scanText(fs.readFileSync(f, "utf8"))) {
      n++;
      console.log(`⚠️  ${path.relative(ROOT, f)}:${h.line}\n    ${h.text.slice(0, 90)}\n    → ${h.why}\n`);
    }
  }
  console.log(`${files.length} skedarë të skanuar.`);
  console.log(n ? `⚠️  ${n} vende për t'u parë` : "✅ asnjë regex i dëmtuar");
}
