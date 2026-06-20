/* OptimaBook service worker — network-first me rezervë nga cache.
   Faqja hapet edhe pa internet pasi është vizituar një herë. */

"use strict";

const CACHE = "optimabook-v9";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  const sameOrigin = url.origin === self.location.origin;
  // Same-origin (HTML/CSS/JS yni) → GJITHMONË i freskët kur ka internet (bypass cache),
  // që përdoruesit të marrin përditësimet menjëherë. Pa internet → nga cache.
  const req = sameOrigin ? new Request(e.request, { cache: "no-store" }) : e.request;
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
