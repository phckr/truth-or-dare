const CACHE_NAME = 'tod.gorpli';

const urlsToCache = [
  'apple-touch-icon.png',
  'browserconfig.xml',
  'click.mp3',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'favicon.ico',
  'manifest.json',
  'mstile-150x150.png',
  'reset.html',
  'safari-pinned-tab.svg',
  'tod-128.png',
  'tod-192.png',
  'tod-256.png',
  'tod-512.png',
  'tod.css',
  'tod-data.json',
  'tod.html',
  'tod.js',
  'windgong.mp3',
  "https://code.jquery.com/jquery-3.7.1.min.js",
  "https://code.jquery.com/ui/1.14.1/jquery-ui.min.js",
];

// Install Event: Caches the app shell.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Fetch Event: Handles requests, applying the exclusion logic.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    // Try to fetch from the network first.
    fetch(event.request)
      .then(networkResponse => {
	// If successful, update the cache with the new response.
	if (networkResponse && networkResponse.status == 200 && networkResponse.type == 'basic') {
	  const responseToCache = networkResponse.clone();
	  caches.open(CACHE_NAME).then(cache => {
	    cache.put(event.request, responseToCache);
	  });
	}
	return networkResponse;
      })
      .catch(() => {
	return caches.match(event.request);
      })
  );
  return;
});

// Activate Event: Cleans up old caches.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
