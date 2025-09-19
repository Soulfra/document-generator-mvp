/**
 * 📱 D2JSP MOBILE SERVICE WORKER
 * Provides offline functionality, caching, and push notifications
 */

const CACHE_NAME = 'd2jsp-mobile-v1.0.0';
const STATIC_CACHE = 'd2jsp-static-v1.0.0';
const API_CACHE = 'd2jsp-api-v1.0.0';

// Files to cache for offline use
const STATIC_FILES = [
    '/',
    '/pwa-manifest.json',
    '/api/wallet',
    '/api/mobile-sync'
];

// API endpoints to cache
const API_ENDPOINTS = [
    '/api/wallet',
    '/api/mobile-sync',
    '/proxy/game/api/game-state',
    '/proxy/forum/api/forums',
    '/proxy/crypto/api/wallets',
    '/proxy/mining/api/status',
    '/proxy/reasoning/api/reasoning'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
    console.log('📥 Service Worker: Installing...');
    
    event.waitUntil(
        Promise.all([
            // Cache static files
            caches.open(STATIC_CACHE).then((cache) => {
                console.log('📦 Caching static files...');
                return cache.addAll(STATIC_FILES);
            }),
            
            // Initialize API cache
            caches.open(API_CACHE).then((cache) => {
                console.log('📦 Initializing API cache...');
                return Promise.resolve();
            })
        ]).then(() => {
            console.log('✅ Service Worker: Installation complete');
            // Force activation
            return self.skipWaiting();
        })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('🚀 Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && 
                        cacheName !== STATIC_CACHE && 
                        cacheName !== API_CACHE) {
                        console.log('🗑️ Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('✅ Service Worker: Activation complete');
            return self.clients.claim();
        })
    );
});

// Fetch event - handle requests with caching strategy
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Only handle GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Handle different types of requests
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/proxy/')) {
        // API requests - network first, cache fallback
        event.respondWith(handleAPIRequest(request));
    } else {
        // Static files - cache first, network fallback
        event.respondWith(handleStaticRequest(request));
    }
});

// Handle API requests with network-first strategy
async function handleAPIRequest(request) {
    const cache = await caches.open(API_CACHE);
    
    try {
        // Try network first
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache successful responses
            cache.put(request, networkResponse.clone());
            console.log('📡 API cached:', request.url);
        }
        
        return networkResponse;
    } catch (error) {
        console.log('📡 Network failed, trying cache:', request.url);
        
        // Network failed, try cache
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            console.log('📦 Serving from cache:', request.url);
            return cachedResponse;
        }
        
        // Return offline response
        return createOfflineResponse(request);
    }
}

// Handle static requests with cache-first strategy
async function handleStaticRequest(request) {
    const cache = await caches.open(STATIC_CACHE);
    
    // Try cache first
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
        console.log('📦 Serving from cache:', request.url);
        return cachedResponse;
    }
    
    try {
        // Cache miss, try network
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache the response
            cache.put(request, networkResponse.clone());
            console.log('📡 Cached from network:', request.url);
        }
        
        return networkResponse;
    } catch (error) {
        console.log('❌ Request failed:', request.url);
        return createOfflineResponse(request);
    }
}

// Create offline response
function createOfflineResponse(request) {
    const url = new URL(request.url);
    
    if (url.pathname.startsWith('/api/')) {
        // API requests - return JSON error
        return new Response(
            JSON.stringify({
                offline: true,
                error: 'No network connection',
                cached: false,
                timestamp: Date.now()
            }),
            {
                status: 503,
                statusText: 'Service Unavailable',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    } else {
        // HTML requests - return offline page
        return new Response(
            createOfflinePage(),
            {
                status: 503,
                statusText: 'Service Unavailable',
                headers: {
                    'Content-Type': 'text/html'
                }
            }
        );
    }
}

// Create offline HTML page
function createOfflinePage() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📱 D2JSP Mobile - Offline</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #0a0a0a, #1a1a2e);
            color: #ffffff;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            text-align: center;
            padding: 20px;
        }
        .offline-icon { font-size: 80px; margin-bottom: 20px; }
        h1 { color: #ff4444; margin-bottom: 10px; }
        p { color: #ccc; margin-bottom: 30px; }
        .retry-btn {
            background: #00ff00;
            color: #000;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            font-size: 16px;
        }
    </style>
</head>
<body>
    <div class="offline-icon">📵</div>
    <h1>You're Offline</h1>
    <p>D2JSP Mobile is working in offline mode.<br>Some features may be limited.</p>
    <button class="retry-btn" onclick="location.reload()">Try Again</button>
    
    <script>
        // Auto-retry when online
        window.addEventListener('online', () => {
            location.reload();
        });
    </script>
</body>
</html>`;
}

// Push notification event
self.addEventListener('push', (event) => {
    console.log('🔔 Push notification received');
    
    let data = {};
    
    if (event.data) {
        try {
            data = event.data.json();
        } catch (error) {
            data = { title: 'D2JSP Mobile', body: event.data.text() };
        }
    }
    
    const options = {
        title: data.title || 'D2JSP Mobile',
        body: data.body || 'New activity in your account',
        icon: '/pwa-manifest.json',
        badge: '/pwa-manifest.json',
        tag: data.tag || 'default',
        data: data,
        actions: [
            {
                action: 'open',
                title: 'Open App',
                icon: '/pwa-manifest.json'
            },
            {
                action: 'dismiss',
                title: 'Dismiss'
            }
        ],
        vibrate: [200, 100, 200],
        requireInteraction: data.requireInteraction || false
    };
    
    event.waitUntil(
        self.registration.showNotification(options.title, options)
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('🔔 Notification clicked:', event.action);
    
    event.notification.close();
    
    if (event.action === 'dismiss') {
        return;
    }
    
    // Open or focus the app
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clients) => {
            // Check if app is already open
            for (const client of clients) {
                if (client.url.includes('localhost:9001') && 'focus' in client) {
                    return client.focus();
                }
            }
            
            // Open new window
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});

// Background sync event
self.addEventListener('sync', (event) => {
    console.log('🔄 Background sync:', event.tag);
    
    if (event.tag === 'wallet-sync') {
        event.waitUntil(syncWalletData());
    } else if (event.tag === 'game-sync') {
        event.waitUntil(syncGameData());
    } else if (event.tag === 'forum-sync') {
        event.waitUntil(syncForumData());
    }
});

// Sync wallet data in background
async function syncWalletData() {
    try {
        console.log('💳 Syncing wallet data...');
        const response = await fetch('/api/wallet');
        
        if (response.ok) {
            const cache = await caches.open(API_CACHE);
            cache.put('/api/wallet', response.clone());
            console.log('✅ Wallet data synced');
        }
    } catch (error) {
        console.log('❌ Wallet sync failed:', error);
    }
}

// Sync game data in background
async function syncGameData() {
    try {
        console.log('🎮 Syncing game data...');
        const response = await fetch('/proxy/game/api/game-state');
        
        if (response.ok) {
            const cache = await caches.open(API_CACHE);
            cache.put('/proxy/game/api/game-state', response.clone());
            console.log('✅ Game data synced');
        }
    } catch (error) {
        console.log('❌ Game sync failed:', error);
    }
}

// Sync forum data in background
async function syncForumData() {
    try {
        console.log('🏛️ Syncing forum data...');
        const response = await fetch('/proxy/forum/api/forums');
        
        if (response.ok) {
            const cache = await caches.open(API_CACHE);
            cache.put('/proxy/forum/api/forums', response.clone());
            console.log('✅ Forum data synced');
        }
    } catch (error) {
        console.log('❌ Forum sync failed:', error);
    }
}

// Message event for communication with main thread
self.addEventListener('message', (event) => {
    console.log('📨 Service Worker message:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    } else if (event.data && event.data.type === 'CACHE_UPDATE') {
        // Force cache update
        updateCaches();
    }
});

// Update all caches
async function updateCaches() {
    console.log('🔄 Updating all caches...');
    
    try {
        const cache = await caches.open(API_CACHE);
        
        // Update API endpoints
        for (const endpoint of API_ENDPOINTS) {
            try {
                const response = await fetch(endpoint);
                if (response.ok) {
                    cache.put(endpoint, response.clone());
                    console.log('✅ Updated cache:', endpoint);
                }
            } catch (error) {
                console.log('⚠️ Failed to update:', endpoint);
            }
        }
        
        console.log('✅ Cache update complete');
    } catch (error) {
        console.log('❌ Cache update failed:', error);
    }
}

// Periodic background sync (when supported)
self.addEventListener('periodicsync', (event) => {
    console.log('⏰ Periodic sync:', event.tag);
    
    if (event.tag === 'wallet-check') {
        event.waitUntil(
            syncWalletData().then(() => {
                console.log('⏰ Periodic wallet sync complete');
            })
        );
    }
});

console.log('📱 D2JSP Mobile Service Worker loaded');