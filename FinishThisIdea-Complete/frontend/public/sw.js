const CACHE_NAME = 'finishthisidea-v1.0.0';
const STATIC_CACHE_NAME = 'finishthisidea-static-v1.0.0';

// Files to cache for offline access
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/main.tsx',
  '/src/styles/globals.css',
  // Add other critical files as needed
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/profiles/,
  /\/api\/stats/,
  /\/api\/leaderboard/,
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker: Installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated successfully');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle navigation requests (SPA routing)
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Handle static assets
  event.respondWith(handleStaticRequest(request));
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  // Check if this API endpoint should be cached
  const shouldCache = API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
  
  if (!shouldCache) {
    // For non-cacheable APIs, just fetch from network
    try {
      return await fetch(request);
    } catch (error) {
      console.error('API request failed:', error);
      return new Response(JSON.stringify({ error: 'Network error' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  try {
    // Network first for API requests
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response
    return new Response(JSON.stringify({ 
      error: 'Offline', 
      message: 'This feature requires an internet connection' 
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle navigation requests (SPA)
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    // Fallback to cached index.html for SPA routing
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match('/index.html');
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return basic offline page
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>FinishThisIdea - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #030712;
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              text-align: center;
              padding: 20px;
            }
            .container {
              max-width: 400px;
            }
            h1 { color: #8B5CF6; margin-bottom: 16px; }
            p { color: #9CA3AF; line-height: 1.6; }
            .retry-btn {
              background: #8B5CF6;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              cursor: pointer;
              margin-top: 20px;
              font-size: 16px;
            }
            .retry-btn:hover { background: #7C3AED; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>You're Offline</h1>
            <p>
              FinishThisIdea needs an internet connection to clean your code. 
              Please check your connection and try again.
            </p>
            <button class="retry-btn" onclick="window.location.reload()">
              Try Again
            </button>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Handle static asset requests
async function handleStaticRequest(request) {
  // Cache first for static assets
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // Fetch from network and cache
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Failed to fetch static asset:', error);
    
    // Return a basic 404 response for missing assets
    return new Response('Asset not found', {
      status: 404,
      statusText: 'Not Found'
    });
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'upload-code') {
    event.waitUntil(syncUploadQueue());
  } else if (event.tag === 'share-results') {
    event.waitUntil(syncShareQueue());
  }
});

// Handle upload queue when back online
async function syncUploadQueue() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const queueData = await cache.match('/offline-queue/uploads');
    
    if (queueData) {
      const uploads = await queueData.json();
      
      for (const upload of uploads) {
        try {
          await fetch('/api/upload', {
            method: 'POST',
            body: upload.formData
          });
          console.log('Synced upload:', upload.id);
        } catch (error) {
          console.error('Failed to sync upload:', error);
        }
      }
      
      // Clear the queue
      await cache.delete('/offline-queue/uploads');
    }
  } catch (error) {
    console.error('Failed to sync upload queue:', error);
  }
}

// Handle share queue when back online
async function syncShareQueue() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const queueData = await cache.match('/offline-queue/shares');
    
    if (queueData) {
      const shares = await queueData.json();
      
      for (const share of shares) {
        try {
          await fetch('/api/social/share', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(share)
          });
          console.log('Synced share:', share.id);
        } catch (error) {
          console.error('Failed to sync share:', error);
        }
      }
      
      // Clear the queue
      await cache.delete('/offline-queue/shares');
    }
  } catch (error) {
    console.error('Failed to sync share queue:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  const options = {
    body: 'Your code cleanup is complete!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'code-cleanup',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View Results',
        icon: '/icons/view-action.png'
      },
      {
        action: 'share',
        title: 'Share Results',
        icon: '/icons/share-action.png'
      }
    ],
    data: {
      url: '/job/123', // This would come from the push payload
    }
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      options.body = data.message || options.body;
      options.data = data;
    } catch (error) {
      console.error('Failed to parse push data:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification('FinishThisIdea', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(urlToOpen)
    );
  } else if (event.action === 'share') {
    event.waitUntil(
      clients.openWindow(urlToOpen + '?share=true')
    );
  } else {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
  // Track notification dismissal analytics here
});