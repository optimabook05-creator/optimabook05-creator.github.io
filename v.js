/* OptimaBook — auto-version: çdo vizitor merr GJITHMONË versionin e fundit.
   Lexon version.txt (gjithmonë i freskët) dhe, nëse faqja është e vjetër,
   rifreskohet vetë me ?v=<versioni>. Ruan parametrat ekzistues (p.sh. ?b=).
   Kështu ndan një link të vetëm e të pastër; përditësimet i sheh kushdo. */
(function () {
  try {
    fetch("version.txt?cb=" + Date.now(), { cache: "no-store" })
      .then(function (r) { return r.text(); })
      .then(function (v) {
        v = (v || "").trim();
        if (!v) return;
        var p = new URLSearchParams(location.search);
        if (p.get("v") !== v) {
          p.set("v", v);
          location.replace(location.pathname + "?" + p.toString() + location.hash);
        }
      })
      .catch(function () {});
  } catch (e) {}
})();
