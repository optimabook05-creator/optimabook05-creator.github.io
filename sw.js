/* OptimaBook — Service Worker
   Qëllimi: ngarkim i MENJËHERSHËM në vizita të përsëritura + punon offline.
   I projektuar që të MOS shkaktojë kurrë "nuk shoh ndryshimet":
     • HTML (navigime)            → network-first (gjithmonë i freskët; cache vetëm fallback offline)
     • version.txt                → gjithmonë rrjeti (që auto-versioni të punojë)
     • Supabase / esm.sh (cross-origin) → gjithmonë rrjeti
     • fonts/*.woff2 (të pandryshueshme, same-origin) → cache-first
     • asetet lokale ME ?v=N      → cache-first (URL ndryshon kur ndryshon versioni ⇒ i freskët vetvetiu)
     • asetet lokale PA version    → network-first (qëndrojnë të freskëta; cache vetëm offline)
*/
"use strict";

const CACHE = "optimabook-cache-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function putInCache(req, res) {
  if (res && res.status === 200 && res.type === "basic") {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
  }
  return res;
}

/* ---- WEB PUSH: njoftime në telefon edhe me panelin TË MBYLLUR ----
   Serveri (funksioni push) dërgon {title, body} — këtu vetëm shfaqet.
   Klikimi hap/fokuson panelin. Zero lidhje me cache-in (asnjë rrezik "stale"). */
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_e) {}
  e.waitUntil(self.registration.showNotification(d.title || "OptimaBook", {
    body: d.body || "Diçka e re në panelin tënd",
    icon: "icon-192.png", badge: "icon-192.png",
    tag: d.tag || "ob-" + Date.now(),  // tag unik → njoftimet s'e mbishkruajnë njëra-tjetrën
  }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const target = new URL("app.html", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    for (const c of list) { if (c.url.indexOf("app.html") !== -1 && "focus" in c) return c.focus(); }
    return self.clients.openWindow(target);
  }));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  let url;
  try { url = new URL(req.url); } catch (_e) { return; }

  if (url.origin !== location.origin) return;        // Supabase / esm.sh / Google Fonts → rrjeti
  if (url.pathname.endsWith("version.txt")) return;   // auto-version → gjithmonë rrjeti

  // HTML / navigime → network-first (i freskët gjithmonë), offline → cache
  // ignoreSearch: app.html?v=150 i ruajtur shërben edhe kur URL-ja kërkon ?v=151
  // (ndryshe pas çdo ndryshimi versioni PWA-ja s'hapej dot offline)
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then((res) => putInCache(req, res)).catch(() => caches.match(req, { ignoreSearch: true }))
    );
    return;
  }

  // Fontet e self-hostuara (të pandryshueshme) → cache-first (të çastit + offline)
  if (url.pathname.startsWith("/fonts/")) {
    e.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => putInCache(req, res)))
    );
    return;
  }

  // Asete me ?v= (immutable) → cache-first (i menjëhershëm)
  if (url.searchParams.has("v")) {
    e.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        // Version i ri i të njëjtit aset → fshi të vjetrit (cache-i s'fryhet pafund)
        caches.open(CACHE).then((c) => c.keys().then((keys) => {
          keys.forEach((k) => {
            try { const ku = new URL(k.url); if (ku.pathname === url.pathname && ku.search !== url.search) c.delete(k); } catch (_e) {}
          });
        })).catch(() => {});
        return putInCache(req, res);
      }))
    );
    return;
  }

  // Asete lokale pa version → network-first (qëndrojnë të freskëta), offline → cache
  e.respondWith(
    fetch(req).then((res) => putInCache(req, res)).catch(() => caches.match(req))
  );
});
