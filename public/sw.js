self.addEventListener("push", (event) => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }

  const title = payload.title || "안다미로 알림";
  const iconUrl = new URL("favicon.png", self.registration.scope).href;
  const options = {
    body: payload.body || "새 소식이 도착했어요.",
    icon: iconUrl,
    badge: iconUrl,
    tag: payload.tag || "andamiro-notification",
    data: {
      url: payload.url || "/",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const rawUrl = event.notification.data?.url || "/";
  const scopeUrl = new URL(self.registration.scope);
  const basePath = scopeUrl.pathname.replace(/\/$/, "");
  const scopedUrl = rawUrl.startsWith("/") && basePath ? `${basePath}${rawUrl}` : rawUrl;
  const targetUrl = new URL(scopedUrl, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const client = clients.find((item) => item.url === targetUrl);
      if (client) return client.focus();
      return self.clients.openWindow(targetUrl);
    }),
  );
});
