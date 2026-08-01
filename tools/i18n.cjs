/* Kontroll i përkthimeve: çdo `data-t` te HTML-ja duhet të ekzistojë NË TË DY gjuhët.

   PSE EKZISTON: një çelës i harruar nuk prish asgjë dhe s'jep asnjë gabim — thjesht
   teksti mbetet në gjuhën e gabuar, ose zhduket fare. Ka ndodhur tashmë në këtë
   projekt (`mediaHint`), dhe u kap rastësisht nga një pamje ekrani, jo nga një mjet.

   Përdorimi:  node tools/i18n.cjs                                                */
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

const html = fs.readFileSync(path.join(ROOT, "app.html"), "utf8");
const js = fs.readFileSync(path.join(ROOT, "optima-app.js"), "utf8");

// Çelësat e kërkuar nga HTML-ja: data-t, data-t-ph, data-t-title, data-info
const wanted = new Set();
for (const m of html.matchAll(/data-t(?:-ph|-title)?="([A-Za-z0-9_]+)"/g)) wanted.add(m[1]);
for (const m of html.matchAll(/data-info="([A-Za-z0-9_]+)"/g)) wanted.add(m[1]);

/* Objektet e gjuhëve: T = { sq: {...}, en: {...} }. I ndajmë me kufijtë e tyre
   dhe mbledhim emrat e çelësave brenda secilit. */
function keysOf(langTag) {
  const start = js.indexOf("\n  " + langTag + ": {");
  if (start < 0) return null;
  // fundi = fillimi i gjuhës tjetër, ose mbyllja e objektit T
  const rest = js.slice(start + 4);
  const nextLang = rest.search(/\n  (?:sq|en): \{/);
  const body = nextLang > 0 ? rest.slice(0, nextLang) : rest.slice(0, rest.indexOf("\n};"));
  const out = new Set();
  for (const m of body.matchAll(/(?:^|[,{]\s*|\n\s*)([A-Za-z0-9_]+)\s*:/g)) out.add(m[1]);
  return out;
}

const sq = keysOf("sq");
const en = keysOf("en");
if (!sq || !en) { console.log("❌ s'u gjetën objektet e gjuhëve te optima-app.js"); process.exit(1); }

const missSq = [...wanted].filter((k) => !sq.has(k)).sort();
const missEn = [...wanted].filter((k) => !en.has(k)).sort();
// Çelësa që ekzistojnë në njërën gjuhë por jo në tjetrën (edhe pa qenë në HTML)
const onlySq = [...sq].filter((k) => !en.has(k)).sort();
const onlyEn = [...en].filter((k) => !sq.has(k)).sort();

const show = (emri, arr) => {
  if (!arr.length) return 0;
  console.log(`\n⚠️  ${emri} (${arr.length}):`);
  console.log("   " + arr.join(", "));
  return arr.length;
};

console.log(`HTML kërkon ${wanted.size} çelësa. Shqip: ${sq.size}. Anglisht: ${en.size}.`);
let bad = 0;
bad += show("Kërkohen nga HTML-ja por MUNGOJNË në shqip", missSq);
bad += show("Kërkohen nga HTML-ja por MUNGOJNË në anglisht", missEn);
show("Vetëm në shqip (anglishtja bie te shqipja)", onlySq);
show("Vetëm në anglisht", onlyEn);

console.log(bad ? `\n❌ ${bad} çelësa të munguar — teksti do të dalë gabim` : "\n✅ çdo çelës i HTML-së ekziston në të dy gjuhët");
process.exit(bad ? 1 : 0);
