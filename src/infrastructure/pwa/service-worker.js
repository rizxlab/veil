const PREFIX = "veil-offline-";
const CACHE_NAME = PREFIX + "__VEIL_BUILD__";
self.addEventListener("install", (event) =>
  event.waitUntil(
    (async () => {
      const response = await fetch("/precache.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Offline manifest unavailable");
      const { version, assets } = await response.json();
      if (PREFIX + version !== CACHE_NAME)
        throw new Error("Offline build changed; retry on next visit");
      const name = CACHE_NAME;
      const cache = await caches.open(name);
      // Only activate once every card and module has been cached successfully.
      try {
        await cache.addAll(assets);
      } catch (error) {
        await caches.delete(name);
        throw error;
      }
      await self.skipWaiting();
    })(),
  ),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(
    (async () => {
      const current = CACHE_NAME;
      await Promise.all(
        (await caches.keys())
          .filter((key) => key.startsWith(PREFIX) && key !== current)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  ),
);
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin)
    return;
  event.respondWith(
    (async () => {
      // Network-first keeps local development fresh; precache supports offline use.
      try {
        const response = await fetch(event.request);
        if (response.ok) return response;
      } catch {
        /* Read the complete last successful offline version. */
      }
      const name = CACHE_NAME;
      const cache = name ? await caches.open(name) : null;
      const cached = await cache?.match(
        event.request.mode === "navigate" ? "/" : event.request,
      );
      return (
        cached ||
        new Response("Veil: resource unavailable offline", { status: 503 })
      );
    })(),
  );
});
