const CACHE = 'hw-v3';

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(['/', '/index.html', '/manifest.json']))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
      .catch(() => caches.match('/index.html'))
  );
});

// Show notification triggered from app
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'NOTIFY') {
    const { title, body, tag, taskId } = e.data;
    e.waitUntil(
      self.registration.showNotification(title, {
        body: body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: tag,
        dir: 'rtl',
        lang: 'he',
        requireInteraction: true,
        silent: false,
        vibrate: [300, 100, 300],
        data: { taskId: taskId },
        actions: [
          { action: 'snooze',  title: '🔔 דחי' },
          { action: 'dismiss', title: '✓ סגרי' }
        ]
      })
    );
  }
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const taskId = e.notification.data && e.notification.data.taskId;
  if (e.action === 'snooze') {
    e.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
        if (list.length) {
          list[0].focus();
          list[0].postMessage({ type: 'SNOOZE', taskId: taskId });
        } else {
          clients.openWindow('/');
        }
      })
    );
  } else {
    e.waitUntil(
      clients.matchAll({ type: 'window' }).then(list => {
        if (list.length) list[0].focus();
        else clients.openWindow('/');
      })
    );
  }
});
