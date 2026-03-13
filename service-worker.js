const CACHE_NAME = 'eyes-closed-wp-v6';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/style.css',
    './js/main.js',
    './js/ui.js',
    './js/audio.js',
    './js/storage.js',
    './js/monitor.js',
    './js/drive.js',
    './manifest.webmanifest'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // We only want to cache our own assets, not Google APIs
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                return response || fetch(event.request).then((fetchRes) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, fetchRes.clone());
                        return fetchRes;
                    });
                });
            })
            .catch(() => {
                // If network fails and we request HTML, return index.html cache
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            })
    );
});
