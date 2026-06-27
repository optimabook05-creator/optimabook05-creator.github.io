/* OptimaBook — Service Worker
   Qëllimi: ngarkim i MENJËHERSHËM në vizita të përsëritura + punon offline.
   I projektuar që të MOS shkaktojë kurrë "nuk shoh ndryshimet":
     • HTML (navigime)            → network-first (gjithmonë i freskët; cache vetëm fallback offline)
     • version.txt                → gjithmonë rrjeti (që auto-versioni të punojë)
     • Supabase / esm.sh / fontet → gjithmonë rrjeti (cross-origin, s'i prekim)
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

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  let url;
  try { url = new URL(req.url); } catch (_e) { return; }

  if (url.origin !== location.origin) return;        // Supabase / esm.sh / Google Fonts → rrjeti
  if (url.pathname.endsWith("version.txt")) return;   // auto-version → gjithmonë rrjeti

  // HTML / navigime → network-first (i freskët gjithmonë), offline → cache
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then((res) => putInCache(req, res)).catch(() => caches.match(req))
    );
    return;
  }

  // Asete me ?v= (immutable) → cache-first (i menjëhershëm)
  if (url.searchParams.has("v")) {
    e.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => putInCache(req, res)))
    );
    return;
  }

  // Asete lokale pa version → network-first (qëndrojnë të freskëta), offline → cache
  e.respondWith(
    fetch(req).then((res) => putInCache(req, res)).catch(() => caches.match(req))
  );
});
