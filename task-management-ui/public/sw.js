const CACHE_NAME = 'task-management-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  // Add other static assets
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/auth\/me/,
  /\/api\/teams/,
  /\/api\/projects/,
  /\/api\/tasks/,
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful navigation responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          // Serve cached version or offline page
          return caches.match(request)
            .then((cachedResponse) => {
              return cachedResponse || caches.match('/offline.html');
            });
        })
    );
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      handleApiRequest(request)
    );
    return;
  }

  // Handle static assets
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((response) => {
            // Cache successful responses
            if (response.status === 200) {
              const responseClone = response.clone();
              const cacheName = STATIC_FILES.includes(url.pathname) ? STATIC_CACHE : DYNAMIC_CACHE;
              
              caches.open(cacheName)
                .then((cache) => {
                  cache.put(request, responseClone);
                });
            }
            return response;
          })
          .catch(() => {
            // Return offline fallback for images
            if (request.destination === 'image') {
              return new Response(
                '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f3f4f6"/><text x="100" y="100" text-anchor="middle" dy=".3em" fill="#9ca3af">Offline</text></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
              );
            }
            throw error;
          });
      })
  );
});

// Handle API requests with caching strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const shouldCache = API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));

  if (request.method === 'GET' && shouldCache) {
    // Cache-first strategy for GET requests
    try {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        // Serve from cache and update in background
        fetchAndCache(request);
        return cachedResponse;
      }

      // Fetch from network and cache
      const response = await fetch(request);
      if (response.status === 200) {
        await cacheResponse(request, response.clone());
      }
      return response;
    } catch (error) {
      // Return cached version if available
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      throw error;
    }
  } else {
    // Network-first strategy for non-GET requests
    try {
      const response = await fetch(request);
      
      // Invalidate related cache entries on mutations
      if (request.method !== 'GET' && response.status < 400) {
        await invalidateRelatedCache(url.pathname);
      }
      
      return response;
    } catch (error) {
      // For offline mutations, store in IndexedDB for later sync
      if (request.method !== 'GET') {
        await storeOfflineAction(request);
        return new Response(
          JSON.stringify({ offline: true, message: 'Action queued for sync' }),
          { 
            status: 202,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      throw error;
    }
  }
}

// Cache response helper
async function cacheResponse(request, response) {
  const cache = await caches.open(DYNAMIC_CACHE);
  await cache.put(request, response);
}

// Background fetch and cache
async function fetchAndCache(request) {
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      await cacheResponse(request, response.clone());
    }
  } catch (error) {
    // Ignore background fetch errors
  }
}

// Invalidate related cache entries
async function invalidateRelatedCache(pathname) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const keys = await cache.keys();
  
  const relatedKeys = keys.filter(key => {
    const url = new URL(key.url);
    return url.pathname.startsWith(pathname.split('/').slice(0, -1).join('/'));
  });

  await Promise.all(relatedKeys.map(key => cache.delete(key)));
}

// Store offline actions for later sync
async function storeOfflineAction(request) {
  if (!self.indexedDB) return;

  const db = await openDB();
  const transaction = db.transaction(['offline_actions'], 'readwrite');
  const store = transaction.objectStore('offline_actions');
  
  const action = {
    id: Date.now(),
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: await request.text(),
    timestamp: Date.now()
  };

  await store.add(action);
}

// Open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('task_management_offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offline_actions')) {
        db.createObjectStore('offline_actions', { keyPath: 'id' });
      }
    };
  });
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'offline-sync') {
    event.waitUntil(syncOfflineActions());
  }
});

// Sync offline actions when back online
async function syncOfflineActions() {
  if (!self.indexedDB) return;

  try {
    const db = await openDB();
    const transaction = db.transaction(['offline_actions'], 'readwrite');
    const store = transaction.objectStore('offline_actions');
    const actions = await store.getAll();

    for (const action of actions) {
      try {
        const response = await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        });

        if (response.ok) {
          await store.delete(action.id);
        }
      } catch (error) {
        // Keep action for next sync attempt
        console.log('Failed to sync action:', action.id);
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: data.tag || 'default',
    data: data.data,
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action) {
    // Handle action clicks
    handleNotificationAction(event.action, event.notification.data);
  } else {
    // Handle notification click
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || '/')
    );
  }
});

function handleNotificationAction(action, data) {
  switch (action) {
    case 'view':
      clients.openWindow(data?.url || '/');
      break;
    case 'dismiss':
      // Just close the notification
      break;
    default:
      clients.openWindow('/');
  }
}