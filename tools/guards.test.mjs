/* TESTE PËR ROJET E ÇMIMIT (funksionet e edge function-it "chat").

   PSE EKZISTON: deri më sot, të 27 testet mbulonin VETËM core.js. Asnjë rresht
   i `chat/index.ts` nuk testohej — përfshirë rojen e çmimeve, që është pikërisht
   mekanizmi që e dallon këtë produkt. Kjo mungesë fshehu dy gabime reale:
     1) allowedAmounts i nxirrte numrat me `JSON.stringify(services)`, ndaj
        copëzat e datës (`price_updated_at: "2026-07-02T14:06:47.94Z"`) hynin si
        "çmime të lejuara": 2026, 7, 2, 14, 6, 47.94.
     2) çmimi i një artikulli TË PAFRESKUAR hynte gjithsesi në listë, ndaj roja
        e linte të kalonte edhe pse prompt-i e kishte hequr.

   Funksionet nxirren FJALË PËR FJALË nga skedari — jo të rishkruara — që testi
   të mos provojë një kopje të pastruar të kodit.

   Ekzekutimi:  node --experimental-strip-types tools/guards.test.mjs           */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = fs.readFileSync(path.join(ROOT, "supabase/functions/chat/index.ts"), "utf8");

function grab(name) {
  const i = SRC.indexOf("function " + name);
  if (i < 0) throw new Error("s'u gjet funksioni " + name);
  return SRC.slice(i, SRC.indexOf("\n}", i) + 2);
}
const names = ["priceStale", "extractAmounts", "allowedAmounts", "guardReply"];
const tmp = path.join(os.tmpdir(), `guards-${process.pid}.ts`);
fs.writeFileSync(tmp, names.map(grab).join("\n\n") + `\n\nexport { ${names.join(", ")} };\n`);
const G = await import("file://" + tmp.replace(/\\/g, "/"));
fs.unlinkSync(tmp);

let pass = 0, fail = 0;
const t = (emri, kusht) => { if (kusht) { pass++; console.log("  ✅ " + emri); } else { fail++; console.log("  ❌ " + emri); } };

const iSotem = new Date().toISOString();
const iVjeter = new Date(Date.now() - 30 * 86400000).toISOString();

console.log("A) Biznes me ÇMIME TË GJALLA (volatilePrices)");
{
  const biz = { config: { volatilePrices: true, priceFreshDays: 7 } };
  const svc = [
    { name: "iPhone 15", price: 430, price_updated_at: iVjeter },
    { name: "Kabllo", price: 5, price_updated_at: iSotem },
  ];
  const ok = new Set(G.allowedAmounts(svc, biz));
  t("çmimi i vjetër (430) NUK lejohet", !ok.has(430));
  t("çmimi i freskët (5) lejohet", ok.has(5));
  t("copëzat e datës (2026) nuk hyjnë si çmim", !ok.has(2026));
  t("copëzat e datës (47.94) nuk hyjnë si çmim", !ok.has(47.94));
  const r = "Po, iPhone 15 kushton 430 €.";
  t("roja e ndalon çmimin e vjetër në përgjigje", G.guardReply(r, svc, biz, true) !== r);
  const r2 = "Kabllo kushton 5 €.";
  t("roja e lejon çmimin e freskët", G.guardReply(r2, svc, biz, true) === r2);
}

console.log("\nB) Biznes NORMAL (pa çmime të gjalla)");
{
  const biz = { config: {} };
  const svc = [{ name: "Prerje", price: 1200, price_updated_at: iVjeter }];
  const ok = new Set(G.allowedAmounts(svc, biz));
  t("çmimi i vjetër lejohet (s'ka rregull freskie)", ok.has(1200));
  const r = "Prerja kushton 1200 lekë.";
  t("përgjigja kalon normalisht", G.guardReply(r, svc, biz, true) === r);
}

console.log("\nC) Çmime të shpikura");
{
  const biz = { config: {} };
  const svc = [{ name: "Prerje", price: 1200 }];
  const r = "Kushton 999 €.";
  t("çmim jashtë katalogut ndalohet", G.guardReply(r, svc, biz, true) !== r);
  t("përgjigje pa çmim kalon e paprekur", G.guardReply("Mirëdita!", svc, biz, true) === "Mirëdita!");
}

console.log("\nD) Shtesat, paketat dhe përgjigjet e mësuara");
{
  const biz = { config: {}, _learned: "Transporti jashtë qytetit është 350 lekë." };
  const svc = [{
    name: "Montim", price: 100,
    addons: [{ name: "Postë", price: 60 }],
    variants: [{ label: "1-3 faqe", price: 220 }],
    tiers: [{ min_qty: 10, unit_price: 80 }],
  }];
  const ok = new Set(G.allowedAmounts(svc, biz));
  t("çmimi i shtesës (60) lejohet", ok.has(60));
  t("çmimi i paketës (220) lejohet", ok.has(220));
  t("çmimi me shumicë (80) lejohet", ok.has(80));
  t("çmimi nga përgjigja e mësuar (350) lejohet", ok.has(350));
}

console.log(`\n${pass} kaluan, ${fail} dështuan`);
process.exit(fail ? 1 : 0);
