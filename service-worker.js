/* =========================================
   Health Tracker PWA — service-worker.js
   ========================================= */

'use strict';

const CACHE_NAME   = 'health-tracker-v1';
const CACHE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
];

// ─── Install ──────────────────────────────────────────────────────
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching assets');
        return cache.addAll(CACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Cache install error:', err))
  );
});


// ─── Activate ─────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => {
            console.log('[SW] Deleting old cache:', k);
            return caches.delete(k);
          })
      ))
      .then(() => self.clients.claim())
  );
});


// ─── Fetch — Stale-While-Revalidate Strategy ──────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (CDN, API calls)
  if (url.origin !== self.location.origin) return;

  // Skip API calls
  if (url.pathname.includes('/api/')) return;

  event.respondWith(
    caches.match(request)
      .then(cached => {
        if (cached) {
          // Serve from cache, update in background
          fetch(request)
            .then(networkResponse => {
              if (networkResponse && networkResponse.status === 200) {
                const clone = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
              }
            })
            .catch(() => { /* network unavailable */ });

          return cached;
        }

        // Not in cache: fetch from network
        return fetch(request)
          .then(response => {
            if (!response || response.status !== 200 || response.type === 'opaque') {
              return response;
            }
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
            return response;
          })
          .catch(() => {
            // Offline fallback for HTML navigation
            if (request.headers.get('accept')?.includes('text/html')) {
              return caches.match('./index.html');
            }
          });
      })
  );
});


// ─── Push Event ───────────────────────────────────────────────────
self.addEventListener('push', event => {
  console.log('[SW] Push received');

  let data = {
    title: '健康日記提醒 ⏰',
    body:  '記得記錄今天的體重和飲食喔！',
    url:   '/health-pwa/?tab=today',
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body:    data.body,
    icon:    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'%3E%3Crect width='192' height='192' fill='%230891b2' rx='40'/%3E%3Ctext x='96' y='130' text-anchor='middle' font-size='100' fill='white'%3E%F0%9F%8C%9F%3C/text%3E%3C/svg%3E",
    badge:   "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Ctext y='.9em' font-size='90'%3E%E2%9A%96%EF%B8%8F%3C/text%3E%3C/svg%3E",
    vibrate: [200, 100, 200],
    tag:     'health-reminder',
    renotify: true,
    requireInteraction: false,
    data:    { url: data.url || '/health-pwa/' },
    actions: [
      { action: 'open',    title: '立即記錄' },
      { action: 'dismiss', title: '稍後提醒' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});


// ─── Notification Click ───────────────────────────────────────────
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event.action);
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/?tab=today';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.navigate(targetUrl);
            return;
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});


// ─── Message Handler ──────────────────────────────────────────────
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
