/* OptimaBook — auto-version: çdo vizitor merr GJITHMONË versionin e fundit,
   PA ngarkim të dyfishtë (glitch-i i vjetër: çdo hapje pa ?v → reload i plotë).
   Si punon tani:
     1. Lexon versionin e FAQES SË NGARKUAR nga linku i stylesheet-it (?v=N).
     2. Faqe pa asete të versionuara (landing-u inline) → s'ka ç'të freskojë → ZERO reload.
     3. Version i njëjtë me version.txt → je i freskët → ZERO reload (rasti 99%).
     4. Version i vjetër i vërtetë → reload NJË herë me ?v të ri (kalon CDN-në).
        Roja anti-lak: nëse URL-ja e ka tashmë ?v të saktë por HTML-ja mbetet
        e vjetër (CDN vonon), NUK rifreskon në lak — pret vizitën e radhës. */
(function () {
  try {
    var link = document.querySelector('link[rel="stylesheet"][href*="v="]');
    var m = link && link.getAttribute("href").match(/[?&]v=(\d+)/);
    var docV = m ? m[1] : null;
    if (!docV) return; // faqe vetë-mbajtëse (index) — asgjë për të versionuar
    fetch("version.txt?cb=" + Date.now(), { cache: "no-store" })
      .then(function (r) { return r.text(); })
      .then(function (v) {
        v = (v || "").trim();
        if (!v || !/^\d+$/.test(v)) return;
        if (docV === v) return;                       // i freskët → zero rifreskim
        var p = new URLSearchParams(location.search);
        if (p.get("v") === v) return;                 // roja anti-lak (CDN ende i vjetër)
        p.set("v", v);
        location.replace(location.pathname + "?" + p.toString() + location.hash);
      })
      .catch(function () {});
  } catch (e) {}
})();
