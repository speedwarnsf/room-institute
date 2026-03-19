// ZenSpace Service Worker - Enhanced for Production
const CACHE_NAME = 'zenspace-v5';
const RUNTIME_CACHE = 'zenspace-runtime-v5';
const IMAGES_CACHE = 'zenspace-images-v5';
const API_CACHE = 'zenspace-api-v5';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  // Add critical CSS/JS that should be cached
];

// Maximum cache sizes
const MAX_CACHE_SIZE = {
  runtime: 50,
  images: 20,
  api: 10,
};

// Cache duration in milliseconds
const CACHE_DURATION = {
  static: 30 * 24 * 60 * 60 * 1000, // 30 days
  runtime: 24 * 60 * 60 * 1000,     // 24 hours
  images: 7 * 24 * 60 * 60 * 1000,  // 7 days
  api: 5 * 60 * 1000,               // 5 minutes
};

// Utility functions
const isNavigationRequest = (request) => request.mode === 'navigate';
const isStaticAsset = (url) => /\.(js|css|png|jpg|jpeg|svg|ico|woff2?)$/i.test(url);
const isApiRequest = (url) => url.includes('/api/') || url.includes('generativelanguage.googleapis.com');
const isImageRequest = (url) => /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(url);

// Cache management
async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxSize) {
    const sortedKeys = keys.sort((a, b) => {
      // Remove oldest entries first
      return new Date(a.headers.get('date') || 0) - new Date(b.headers.get('date') || 0);
    });
    
    const keysToDelete = sortedKeys.slice(0, keys.length - maxSize);
    await Promise.all(keysToDelete.map(key => cache.delete(key)));
  }
}

async function isResponseFresh(response, maxAge) {
  if (!response) return false;
  
  const date = response.headers.get('date');
  if (!date) return false;
  
  const responseTime = new Date(date).getTime();
  return (Date.now() - responseTime) < maxAge;
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        const validCaches = [CACHE_NAME, RUNTIME_CACHE, IMAGES_CACHE, API_CACHE];
        return Promise.all(
          cacheNames
            .filter((name) => !validCaches.includes(name))
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        self.clients.claim();
      })
  );
});

// Fetch event - advanced caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Skip cross-origin requests — don't intercept external images/APIs
  if (url.origin !== self.location.origin) {
    return;
  }

  // Navigation requests (HTML pages) - Network first, fallback to cache
  if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // API requests - Network first with short cache
  if (isApiRequest(url.href)) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Image requests - Cache first with fallback
  if (isImageRequest(url.href)) {
    event.respondWith(handleImageRequest(request));
    return;
  }

  // Static assets - Cache first with network fallback
  if (isStaticAsset(url.href)) {
    event.respondWith(handleStaticAsset(request));
    return;
  }

  // Everything else - Network first
  event.respondWith(handleGenericRequest(request));
});

// Navigation request handler
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the response
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error(`Network response not ok: ${networkResponse.status}`);
  } catch (error) {
    console.log('[SW] Network failed for navigation, serving cached version');
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Final fallback to cached index.html
    const indexResponse = await caches.match('/');
    if (indexResponse) {
      return indexResponse;
    }
    
    // Last resort offline page
    return new Response(createOfflinePage(), {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// API request handler
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);
  const cachedResponse = await cache.match(request);
  
  try {
    // Always try network first for API requests
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful API responses briefly
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error(`API response not ok: ${networkResponse.status}`);
  } catch (error) {
    console.log('[SW] API network failed, checking cache...');
    
    // Return cached response if available and fresh
    if (cachedResponse && await isResponseFresh(cachedResponse, CACHE_DURATION.api)) {
      console.log('[SW] Serving cached API response');
      return cachedResponse;
    }
    
    // Return error response
    return new Response(JSON.stringify({
      error: 'Network unavailable',
      message: 'Please check your connection and try again',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Image request handler
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGES_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Return cached version if available
  if (cachedResponse) {
    // Check if we should update in background
    if (!await isResponseFresh(cachedResponse, CACHE_DURATION.images)) {
      // Update in background
      fetch(request).then(response => {
        if (response.ok) {
          cache.put(request, response.clone());
          limitCacheSize(IMAGES_CACHE, MAX_CACHE_SIZE.images);
        }
      }).catch(() => {}); // Silent fail for background update
    }
    return cachedResponse;
  }
  
  try {
    // Fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the image
      cache.put(request, networkResponse.clone());
      limitCacheSize(IMAGES_CACHE, MAX_CACHE_SIZE.images);
      return networkResponse;
    }
    
    throw new Error(`Image response not ok: ${networkResponse.status}`);
  } catch (error) {
    // Return placeholder for failed images
    return new Response(createImagePlaceholder(), {
      status: 200,
      headers: { 'Content-Type': 'image/svg+xml' }
    });
  }
}

// Static asset handler
async function handleStaticAsset(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Return cached version if available
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // Fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the asset
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error(`Static asset response not ok: ${networkResponse.status}`);
  } catch (error) {
    console.log('[SW] Failed to fetch static asset:', request.url);
    // Return nothing - let browser handle missing asset
    return new Response('', { status: 404 });
  }
}

// Generic request handler
async function handleGenericRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.log('[SW] Generic request failed:', request.url);
    return new Response('Service Unavailable', { status: 503 });
  }
}

// Create offline page HTML
function createOfflinePage() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ZenSpace - Offline</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
          color: #374151;
        }
        .container {
          text-align: center;
          max-width: 400px;
          padding: 2rem;
          background: white;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }
        .icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 1rem;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
        }
        h1 {
          margin: 0 0 1rem;
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
        }
        p {
          margin: 0 0 2rem;
          color: #6b7280;
          line-height: 1.5;
        }
        .btn {
          background: #10b981;
          color: white;
          border: none;
          padding: 12px 24px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn:hover {
          background: #059669;
          transform: translateY(-1px);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
        </div>
        <h1>You're Offline</h1>
        <p>ZenSpace works best with an internet connection. Please check your network and try again.</p>
        <button class="btn" onclick="window.location.reload()">Try Again</button>
      </div>
    </body>
    </html>
  `;
}

// Create image placeholder SVG
function createImagePlaceholder() {
  return `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <g transform="translate(200,150)">
        <circle r="20" fill="#d1d5db"/>
        <path d="m-8,0 16,0 m-8,-8 0,16" stroke="#9ca3af" stroke-width="2"/>
      </g>
      <text x="50%" y="80%" text-anchor="middle" fill="#6b7280" font-family="system-ui" font-size="14">
        Image unavailable offline
      </text>
    </svg>
  `;
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  console.log('[SW] Performing background sync...');
  
  try {
    // Sync offline actions stored in IndexedDB
    // This would integrate with the app's offline queue
    console.log('[SW] Background sync completed');
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Push notification handling (for future use)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: data.url
    })
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.notification.data) {
    event.waitUntil(
      clients.openWindow(event.notification.data)
    );
  }
});

// Message handling for manual cache updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_NEW_ROUTE') {
    event.waitUntil(
      caches.open(RUNTIME_CACHE)
        .then(cache => cache.add(event.data.payload.url))
    );
  }
});

console.log('[SW] ZenSpace Service Worker loaded successfully');