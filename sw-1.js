const CACHE = 'tasks-fa-v2';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Same-origin: network first (so updates show up immediately), cache as offline fallback.
// Cross-origin (fonts): cache first, refresh in background.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const same = new URL(req.url).origin === self.location.origin;
  e.respondWith(
    caches.open(CACHE).then(cache => {
      if (same) {
        return fetch(req).then(res => {
          if (res && res.status === 200) cache.put(req, res.clone());
          return res;
        }).catch(() => cache.match(req).then(hit => hit || cache.match('./index.html')));
      }
      return cache.match(req).then(hit => {
        const net = fetch(req).then(res => {
          if (res && (res.status === 200 || res.type === 'opaque')) cache.put(req, res.clone());
          return res;
        }).catch(() => hit);
        return hit || net;
      });
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      if (list.length) return list[0].focus();
      return self.clients.openWindow('./index.html');
    })
  );
});
