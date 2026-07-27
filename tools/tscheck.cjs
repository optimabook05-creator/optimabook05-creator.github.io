/* Kontroll i VERTETE sintakse per skedaret Deno/TS.
   Node-i i heq tipat sakte, por `--check` jep KALIM TE RREME per module ESM.
   Ndaj e IMPORTOJME: nese sintaksa eshte e prishur -> SyntaxError.
   Nese eshte ne rregull -> deshton me ReferenceError (Deno nuk ekziston ne Node) = OK. */
const { execFileSync } = require("child_process");
const { pathToFileURL } = require("url");
let bad = 0;
for (const f of process.argv.slice(2)) {
  const url = pathToFileURL(require("path").resolve(f)).href;
  let out = "";
  try {
    execFileSync(process.execPath,
      ["--experimental-strip-types", "--input-type=module", "-e", `await import(${JSON.stringify(url)})`],
      { stdio: ["ignore", "pipe", "pipe"] });
    out = "";
  } catch (e) { out = String(e.stderr || e.stdout || e.message); }
  const syntax = /SyntaxError|missing \)|Unexpected token/i.test(out);
  if (syntax) { bad++; console.log("❌ PRISHUR  " + f + "  → " + (out.match(/(SyntaxError|Unexpected token)[^\n]*/) || [""])[0].slice(0, 80)); }
  else console.log("✅ OK       " + f);
}
process.exit(bad ? 1 : 0);
