const CACHE_NAME = 'tod.gorpli-1';

const urlsToCache = [
  'apple-touch-icon.png',
  'browserconfig.xml',
  'click.mp3',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'favicon.ico',
  'manifest.json',
  'mstile-150x150.png',
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
    // 1. Check for the Range header
    var theRequest = event.request;
    if (event.request.headers.has('range')) {
      // 2. Clone the request
      const originalRequest = event.request;

      // 3. Create a new Headers object, omitting 'Range'
      const newHeaders = new Headers();
      for (const [key, value] of originalRequest.headers.entries()) {
	if (key.toLowerCase() !== 'range') {
	  newHeaders.append(key, value);
	}
      }

      // 4. Create a new Request object without the Range header
      theRequest = new Request(originalRequest.url, {
	method: originalRequest.method,
	headers: newHeaders, // Use the new headers
	mode: originalRequest.mode,
	credentials: originalRequest.credentials,
	cache: originalRequest.cache,
	redirect: originalRequest.redirect,
	referrer: originalRequest.referrer,
	referrerPolicy: originalRequest.referrerPolicy,
	integrity: originalRequest.integrity,
      });
    }
    fetch(theRequest)
      .then(networkResponse => {
	// If successful, update the cache with the new response.
	if (networkResponse && networkResponse.status == 200 && networkResponse.type == 'basic') {
	  const responseToCache = networkResponse.clone();
	  caches.open(CACHE_NAME).then(cache => {
	    cache.put(theRequest, responseToCache);
	  });
	}
	return networkResponse;
      })
      .catch(() => {
	return caches.match(theRequest);
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
