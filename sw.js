// Economic Engine Service Worker
// Provides offline functionality and background sync for real-time economic data

const CACHE_NAME = 'economic-engine-v1.0.0';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';
const API_CACHE = 'api-v1';

// Files to cache for offline use
const STATIC_FILES = [
  '/',
  '/free',
  '/menu',
  '/economy',
  '/godot',
  '/engine',
  '/vc-game',
  '/visualization',
  '/manifest.json',
  '/babylon-economic-engine.html',
  '/godot-web-economic-engine.html',
  '/economic-visualization-3d.html',
  '/vc-billion-trillion-game.html',
  '/ai-economy-dashboard.html',
  // External CDN resources
  'https://cdn.babylonjs.com/babylon.js',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/economy/status',
  '/api/vc-game/ai-invest',
  '/api/status'
];

// Install event - cache static files
self.addEventListener('install', event => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static files
      caches.open(STATIC_CACHE).then(cache => {
        console.log('📦 Caching static files...');
        return cache.addAll(STATIC_FILES.filter(url => !url.startsWith('http')));
      }),
      // Cache external resources
      caches.open(DYNAMIC_CACHE).then(cache => {
        console.log('🌐 Caching external resources...');
        const externalUrls = STATIC_FILES.filter(url => url.startsWith('http'));
        return Promise.allSettled(
          externalUrls.map(url => cache.add(url).catch(err => console.warn('Failed to cache:', url)))
        );
      })
    ]).then(() => {
      console.log('✅ Service Worker installed successfully');
      self.skipWaiting(); // Activate immediately
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== API_CACHE) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activated');
      return self.clients.claim(); // Take control immediately
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(event.request));
    return;
  }
  
  // Handle static files
  event.respondWith(handleStaticRequest(event.request));
});

// Handle API requests with cache-first strategy for non-critical data
async function handleAPIRequest(request) {
  const url = new URL(request.url);
  
  try {
    // For real-time data, try network first
    if (url.pathname.includes('/economy/status')) {
      return await networkFirstStrategy(request, API_CACHE);
    }
    
    // For other API requests, try cache first
    return await cacheFirstStrategy(request, API_CACHE);
    
  } catch (error) {
    console.error('API request failed:', error);
    
    // Return cached data if available
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('📦 Serving cached API data');
      return cachedResponse;
    }
    
    // Return fallback response
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'Economic data unavailable offline',
      cached: false,
      timestamp: Date.now()
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle static file requests
async function handleStaticRequest(request) {
  try {
    // Try cache first for static files
    return await cacheFirstStrategy(request, STATIC_CACHE);
  } catch (error) {
    // If not in cache, try network and cache the response
    try {
      const response = await fetch(request);
      
      if (response.ok) {
        const cache = await caches.open(DYNAMIC_CACHE);
        cache.put(request, response.clone());
        return response;
      }
      
      throw new Error('Network response not ok');
      
    } catch (networkError) {
      console.error('Failed to fetch from network:', networkError);
      
      // Return offline page for navigation requests
      if (request.mode === 'navigate') {
        return caches.match('/free') || new Response('Offline', { status: 503 });
      }
      
      throw networkError;
    }
  }
}

// Network-first strategy (for real-time data)
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the fresh response
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
    
  } catch (error) {
    console.log('🌐 Network failed, trying cache...');
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Cache-first strategy (for static content)
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    console.log('📦 Serving from cache:', request.url);
    return cachedResponse;
  }
  
  console.log('🌐 Fetching from network:', request.url);
  const networkResponse = await fetch(request);
  
  if (networkResponse.ok && cacheName) {
    const cache = await caches.open(cacheName);
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

// Background sync for economic data
self.addEventListener('sync', event => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'economic-data-sync') {
    event.waitUntil(syncEconomicData());
  }
});

// Sync economic data in background
async function syncEconomicData() {
  try {
    console.log('🔄 Syncing economic data...');
    
    const response = await fetch('/api/economy/status');
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put('/api/economy/status', response.clone());
      
      // Notify clients of updated data
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'ECONOMIC_DATA_UPDATED',
          timestamp: Date.now()
        });
      });
      
      console.log('✅ Economic data synced successfully');
    }
  } catch (error) {
    console.error('❌ Failed to sync economic data:', error);
  }
}

// Push notifications for economic alerts
self.addEventListener('push', event => {
  console.log('📱 Push notification received');
  
  let data = { title: 'Economic Engine', body: 'New economic data available' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (error) {
      console.error('Failed to parse push data:', error);
    }
  }
  
  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: [
      {
        action: 'view',
        title: 'View Economy',
        icon: '/icon-192.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    tag: 'economic-alert',
    renotify: true
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('📱 Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/economy')
    );
  }
});

// Message handling for client communication
self.addEventListener('message', event => {
  console.log('📨 Message received:', event.data);
  
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
        
      case 'REQUEST_CACHE_UPDATE':
        event.waitUntil(updateCaches());
        break;
        
      case 'SYNC_ECONOMIC_DATA':
        event.waitUntil(syncEconomicData());
        break;
        
      default:
        console.log('Unknown message type:', event.data.type);
    }
  }
});

// Update all caches
async function updateCaches() {
  console.log('🔄 Updating all caches...');
  
  try {
    // Clear old caches
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(name => caches.delete(name))
    );
    
    // Rebuild caches
    await Promise.all([
      caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_FILES.filter(url => !url.startsWith('http')))),
      caches.open(DYNAMIC_CACHE).then(cache => {
        const externalUrls = STATIC_FILES.filter(url => url.startsWith('http'));
        return Promise.allSettled(
          externalUrls.map(url => cache.add(url).catch(() => {}))
        );
      })
    ]);
    
    console.log('✅ Caches updated successfully');
    
    // Notify clients
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'CACHE_UPDATED',
        timestamp: Date.now()
      });
    });
    
  } catch (error) {
    console.error('❌ Failed to update caches:', error);
  }
}

// Periodic cache cleanup
setInterval(() => {
  console.log('🧹 Running periodic cache cleanup...');
  
  caches.keys().then(cacheNames => {
    cacheNames.forEach(cacheName => {
      if (cacheName.includes('dynamic') || cacheName.includes('api')) {
        caches.open(cacheName).then(cache => {
          cache.keys().then(requests => {
            // Remove old entries (older than 24 hours)
            const cutoff = Date.now() - (24 * 60 * 60 * 1000);
            
            requests.forEach(request => {
              cache.match(request).then(response => {
                if (response) {
                  const cacheTime = response.headers.get('date');
                  if (cacheTime && new Date(cacheTime).getTime() < cutoff) {
                    cache.delete(request);
                  }
                }
              });
            });
          });
        });
      }
    });
  });
}, 60 * 60 * 1000); // Run every hour