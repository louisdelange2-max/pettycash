const CACHE_NAME = "petty-cash-pwa-v10.02";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/notification-badge-96.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === "opaque") {
            return response;
          }
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
          return response;
        })
        .catch(() => caches.match("./index.html"))
    })
  );
});

importScripts('https://www.gstatic.com/firebasejs/12.2.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.2.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyCoARI_5Aj06ZF2GRFve_u75u9zI9RRd9c',
  authDomain: 'pettycash-earthlabs.firebaseapp.com',
  projectId: 'pettycash-earthlabs',
  storageBucket: 'pettycash-earthlabs.firebasestorage.app',
  messagingSenderId: '477886037099',
  appId: '1:477886037099:web:1e3f284c52d1f98da5852e',
  measurementId: 'G-WPFSZTCEDD'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const title =
    (payload && payload.data && payload.data.title) ||
    (payload && payload.notification && payload.notification.title) ||
    'Petty Cash App Live';

  const body =
    (payload && payload.data && payload.data.body) ||
    (payload && payload.notification && payload.notification.body) ||
    'New petty cash activity.';

  const txId =
    (payload && payload.data && payload.data.transactionId) || '';

  const url =
    (payload && payload.data && payload.data.url) || './';

  const tag = txId || 'pettycash-push';

  const options = {
    body: body,
    icon: './icons/icon-192.png',
    badge: './icons/notification-badge-96.png',
    tag: tag,
    renotify: false,
    requireInteraction: false,
    data: {
      url: url,
      transactionId: txId
    }
  };

  return clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
    clientList.forEach(function(client) {
      try { client.postMessage({ type: 'PETTY_CASH_PUSH', transactionId: txId, title: title, body: body }); } catch (e) {}
    });
    return self.registration.getNotifications({ tag: tag }).then(function(existing) {
      existing.forEach(function(n) { try { n.close(); } catch (e) {} });
      return self.registration.showNotification(title, options);
    });
  });
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = (event.notification && event.notification.data && event.notification.data.url) || './';
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
    for (const client of clientList) {
      if ('focus' in client) {
        client.navigate(url).catch(() => {});
        return client.focus();
      }
    }
    if (clients.openWindow) return clients.openWindow(url);
  }));
});
