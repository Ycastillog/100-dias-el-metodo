const CACHE_NAME = "100-dias-shell-v6";
const SHELL_FILES = [
  "./",
  "./index.html",
  "./acceso.html",
  "./biblioteca.html",
  "./manifest.webmanifest",
  "./assets/styles.css",
  "./assets/app.js",
  "./assets/life-program.js",
  "./assets/library.js",
  "./assets/affiliate-links.js",
  "./assets/payments.js",
  "./assets/site-config.js",
  "./assets/ops.js",
  "./assets/icon-100-dias.svg",
  "./assets/icon-100-dias-192.png",
  "./assets/icon-100-dias-512.png",
  "./assets/aurelia-guia.webp",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("100-dias-shell-") && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

async function networkFirstNavigation(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    const url = new URL(request.url);
    return cache.match(
      url.pathname.endsWith("acceso.html") ? "./acceso.html" : "./index.html"
    );
  }
}

async function networkFirstAsset(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request, { ignoreSearch: true });
    return (
      cached ||
      new Response("Recurso no disponible sin conexion.", {
        status: 503,
        headers: { "Content-Type": "text/plain;charset=utf-8" },
      })
    );
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  const isAppAsset =
    url.pathname.includes("/assets/") ||
    url.pathname.endsWith("/manifest.webmanifest");
  if (isAppAsset) {
    event.respondWith(networkFirstAsset(request));
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const requestedUrl = event.notification.data?.url || "./acceso.html#hoy";
  const targetUrl = new URL(requestedUrl, self.location.origin);
  const safeUrl =
    targetUrl.origin === self.location.origin
      ? targetUrl.href
      : new URL("./acceso.html#hoy", self.location.href).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windows) => {
        const existing = windows.find((client) =>
          client.url.startsWith(self.location.origin)
        );
        if (existing) {
          existing.navigate(safeUrl);
          return existing.focus();
        }
        return self.clients.openWindow(safeUrl);
      })
  );
});
