/**
 * Definite Habit Intelligence - Production Service Worker
 * Version: 1.0.0
 * 
 * Features:
 * - Offline App Shell caching with Stale-While-Revalidate & Cache-First routing
 * - Complete security bypass for Firebase Auth, Firestore, and Dynamic User APIs
 * - Safe cache cleanup and instant client activation
 * - Network-First navigation with offline index.html fallback
 */

const CACHE_VERSION = 'v1.0.7';
const STATIC_CACHE = `definite-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `definite-runtime-${CACHE_VERSION}`;


// Core static assets required for offline app shell
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/site.webmanifest',
  '/favicon.svg',
  '/favicon.ico',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/icon-d-black.svg',
  '/icon-d-white.svg',
  '/logo-black.svg',
  '/logo-white.svg'
];

// Domains and endpoints that must NEVER be cached by the Service Worker
const EXCLUDED_HOSTS = [
  'firestore.googleapis.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'firebaseinstallations.googleapis.com',
  'firebasestorage.googleapis.com',
  'accounts.google.com',
  'apis.google.com',
  'content-firebaseappcheck.googleapis.com'
];

// Install Event: Precache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache partial error (non-fatal):', err);
      });
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate Event: Clean up outdated caches
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Helper: Check if request is an excluded Firebase/Auth/API request
function isExcludedRequest(url, method) {
  if (method !== 'GET') return true;
  return EXCLUDED_HOSTS.some(host => url.hostname.includes(host));
}

// Fetch Event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Completely bypass caching for Firebase, Auth, Non-GET, and analytics endpoints
  if (isExcludedRequest(url, request.method)) {
    return; // Normal network pass-through
  }

  // 2. Navigation Request (HTML Pages): Network-First with Offline Cache Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // 3. Vite Hashed Chunks (/assets/*): Network-First so new deploys reach users immediately
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => caches.match(request)) // fallback to cache if offline
    );
    return;
  }

  // 4. External Fonts & CDN Scripts (Google Fonts, Phosphor CDN Icons): Stale-While-Revalidate
  const isCdn = url.hostname.includes('fonts.googleapis.com') ||
                url.hostname.includes('fonts.gstatic.com') ||
                url.hostname.includes('unpkg.com');

  if (isCdn) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        }).catch(() => null);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 5. Static local images, SVGs, audio, manifest: Stale-While-Revalidate
  if (request.destination === 'image' || 
      request.destination === 'audio' || 
      url.pathname.endsWith('.svg') || 
      url.pathname.endsWith('.json') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.ico')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        }).catch(() => null);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Default: Network with Cache Fallback
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        return networkResponse;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Message Event: Handle update triggers
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'GET_VERSION') {
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ version: CACHE_VERSION });
    }
  }
});

// Notification Click Event: Navigate directly to D1 Today section on PWA
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/#/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Push Event: Handle background push messages for PWA
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_) {
    data = { title: 'D1 Habit Reminder', body: event.data ? event.data.text() : 'Complete your daily habits!' };
  }

  const title = data.title || 'D1 Habit Reminder';
  const options = {
    body: data.body || 'Complete your day before bedtime.',
    icon: '/pwa-192x192.png',
    badge: '/favicon-32x32.png',
    tag: 'd1_bedtime_reminder',
    renotify: true,
    data: {
      route: 'open_today',
      url: data.url || '/#/'
    },
    actions: [
      { action: 'open_today', title: 'Open Today' }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

