const CACHE_NAME = "komet-v1";
const STATIC_ASSETS = [
  "/",
  "/login",
  "/register",
  "/komet-icon.svg",
];

// Install: cache static assets (silent fail if any resource is unavailable)
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          fetch(url, { cache: "reload" }).then((r) => {
            if (r.ok) cache.put(url, r.clone());
          })
        )
      );
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Network-first strategy for API/navigation
// Cache-first strategy for static assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip non-HTTP(S) schemes (chrome-extension://, moz-extension://, etc.)
  if (!url.protocol.startsWith("http")) return;

  // API requests: network only
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(request).catch(() => new Response(null, { status: 503 })));
    return;
  }

  // Navigation / page requests: network first, fallback to cache
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => {
            if (cached) return cached;
            // Fallback to root cache entry, then to a minimal offline page
            return caches.match("/").then((root) => {
              if (root) return root;
              return new Response(
                "<!DOCTYPE html><html><head><meta charset=utf-8><title>Offline</title></head><body><h1>You are offline</h1><p>Please check your connection.</p></body></html>",
                { status: 200, headers: { "Content-Type": "text/html" } }
              );
            });
          })
        )
    );
    return;
  }

  // Static assets: cache first, network fallback
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response || response.status >= 400) {
          return caches.match(request).then((c) => {
            if (c) return c;
            return new Response(null, { status: 502 });
          });
        }
        const cloned = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
        return response;
      }).catch(() =>
        caches.match(request).then((c) => {
          if (c) return c;
          return new Response(null, { status: 502 });
        })
      );
    })
  );
});
