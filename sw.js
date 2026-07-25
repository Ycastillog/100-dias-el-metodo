self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const requestedUrl = event.notification.data?.url || "./acceso.html#dia";
  const targetUrl = new URL(requestedUrl, self.location.origin);
  const safeUrl = targetUrl.origin === self.location.origin
    ? targetUrl.href
    : new URL("./acceso.html#dia", self.location.href).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const existing = windows.find((client) => client.url.startsWith(self.location.origin));
      if (existing) {
        existing.navigate(safeUrl);
        return existing.focus();
      }
      return self.clients.openWindow(safeUrl);
    })
  );
});
