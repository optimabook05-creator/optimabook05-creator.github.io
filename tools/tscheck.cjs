/* Kontroll i VERTETE sintakse per skedaret e projektit (Deno/TS + module ESM te shfletuesit).

   PSE EKZISTON, ME FJALE TE THJESHTA:
   `node --check file.js` jep KALIM TE RREME. E provuar dy here me kete projekt:
     • nje skedar TS i prishur qellimisht doli "OK";
     • optima-app.js me nje regex ku backslash-et e URL-se i hengri shell-i doli "OK" me `node -c`,
       ndersa shfletuesi refuzoi TE GJITHE modulin -> paneli s'lidhte asnje buton.
   Arsyeja: `--check` e lexon skedarin si skript, jo si MODUL. Regullat ndryshojne.
   Ndaj ketu e detyrojme te parsohet si modul, dhe per TS e importojme vertet:
   sintakse e prishur -> SyntaxError; sintakse e sakte -> deshton me ReferenceError
   (Deno s'ekziston ne Node) ose ngarkohet - te dyja jane KALIM.

   Perdorimi:  node tools/tscheck.cjs <skedare...>
               node tools/tscheck.cjs            (pa argumente = kontrollon gjithcka)  */
const { execFileSync } = require("child_process");
const { pathToFileURL } = require("url");
const path = require("path");
const fs = require("fs");
const os = require("os");

const ROOT = path.resolve(__dirname, "..");
// Pa argumente: cdo skedar qe ngarkohet si modul ne shfletues ose si funksion Deno.
const DEFAULTS = [
  "optima-app.js", "app.js", "core.js", "config.js", "v.js", "sw.js",
  ...fs.existsSync(path.join(ROOT, "supabase/functions"))
    ? fs.readdirSync(path.join(ROOT, "supabase/functions"))
        .map((d) => `supabase/functions/${d}/index.ts`)
    : [],
].filter((f) => fs.existsSync(path.join(ROOT, f)));

const files = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULTS;

let bad = 0;
for (const f of files) {
  const abs = path.resolve(ROOT, f);
  if (!fs.existsSync(abs)) { console.log("⚠️  MUNGON   " + f); continue; }
  let out = "";

  if (/\.ts$/.test(abs)) {
    // TS/Deno: importoje vertet (heqja e tipave + parsim i plote si modul)
    try {
      execFileSync(process.execPath,
        ["--experimental-strip-types", "--input-type=module", "-e",
         `await import(${JSON.stringify(pathToFileURL(abs).href)})`],
        { stdio: ["ignore", "pipe", "pipe"] });
    } catch (e) { out = String(e.stderr || e.stdout || e.message); }
  } else {
    /* JS i shfletuesit: kopjoje si .mjs dhe parsoje si MODUL.
       Pikerisht kjo e kap regex-in e prishur qe `node -c file.js` e la te kalonte. */
    const tmp = path.join(os.tmpdir(), "tscheck-" + process.pid + "-" + path.basename(abs) + ".mjs");
    try {
      fs.copyFileSync(abs, tmp);
      execFileSync(process.execPath, ["--check", tmp], { stdio: ["ignore", "pipe", "pipe"] });
    } catch (e) { out = String(e.stderr || e.stdout || e.message); }
    finally { try { fs.unlinkSync(tmp); } catch (_e) {} }
  }

  if (/SyntaxError|missing \)|Unexpected token|Unexpected identifier/i.test(out)) {
    bad++;
    const first = (out.match(/(SyntaxError|Unexpected token|Unexpected identifier)[^\n]*/) || [""])[0];
    console.log("❌ PRISHUR  " + f + "  → " + first.slice(0, 90));
  } else {
    console.log("✅ OK       " + f);
  }
}
console.log(bad ? `\n❌ ${bad} skedar(e) me sintakse te prishur` : `\n✅ ${files.length} skedare, te gjithe ne rregull`);
process.exit(bad ? 1 : 0);
