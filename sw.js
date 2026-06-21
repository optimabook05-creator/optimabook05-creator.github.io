/* OptimaBook — service worker VETË-SHKATËRRUES.
   Heq çdo cache + çregjistron veten, që përdoruesit të marrin GJITHMONË
   versionin më të fundit (fund i problemit "nuk po i shoh ndryshimet").
   Pa fetch handler → shfletuesi i merr të gjitha drejt nga rrjeti (të freskëta). */

"use strict";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach((c) => c.navigate(c.url));
    } catch (_e) { /* injoro */ }
  })());
});
