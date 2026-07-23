const CACHE_NAME = "smartalert-pwa-assets-v1";

const PWA_ASSETS = [
  "/smartalert/manifest.webmanifest",
  "/smartalert/browserconfig.xml",
  "/smartalert/assets/icons/favicon.ico",
  "/smartalert/assets/icons/favicon-16x16.png",
  "/smartalert/assets/icons/favicon-32x32.png",
  "/smartalert/assets/icons/apple-touch-icon.png",
  "/smartalert/assets/icons/android-chrome-192x192.png",
  "/smartalert/assets/icons/android-chrome-512x512.png",
  "/smartalert/assets/icons/maskable-icon-192x192.png",
  "/smartalert/assets/icons/maskable-icon-512x512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PWA_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const isPwaAsset =
    url.origin === self.location.origin &&
    (
      url.pathname.startsWith("/smartalert/assets/icons/") ||
      url.pathname === "/smartalert/manifest.webmanifest" ||
      url.pathname === "/smartalert/browserconfig.xml"
    );

  if (!isPwaAsset) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, copy);
        });
        return response;
      });
    })
  );
});
