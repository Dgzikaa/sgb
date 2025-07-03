// Service Worker TEMPORARIAMENTE DESABILITADO para debugging
// Remover este comentário quando os erros de webpack forem resolvidos

console.log('🚫 Service Worker: Temporariamente desabilitado para debugging');

// Remover registros existentes
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
      console.log('🗑️ Service Worker: Unregistered existing worker');
    }
  });
}

// Cache limpo - não registrar novo service worker
self.addEventListener('install', (event) => {
  console.log('🚫 Service Worker: Install event ignored (debugging mode)');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('🚫 Service Worker: Activate event ignored (debugging mode)');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('🗑️ Service Worker: Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );
  
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Durante debugging, não interceptar requests - deixar passar direto
  return;
});

// Service Worker para SGB Dashboard PWA
const CACHE_NAME = 'sgb-dashboard-v1.0.0';
const STATIC_CACHE = 'sgb-static-v1.0.0';
const DATA_CACHE = 'sgb-data-v1.0.0';

// Arquivos estáticos para cache
const STATIC_FILES = [
  '/favicon.ico'
];

// URLs de dados para cache
const DATA_URLS = [
  '/api/dashboard-data',
  '/api/garcons-data',
  '/api/produtos-data',
  '/api/diario-data'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('📦 Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      }),
      caches.open(DATA_CACHE).then((cache) => {
        console.log('📊 Service Worker: Preparing data cache');
        return Promise.resolve();
      })
    ])
  );
  
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DATA_CACHE) {
            console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle API requests (data)
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase.co')) {
    event.respondWith(
      caches.open(DATA_CACHE).then((cache) => {
        return fetch(request)
          .then((response) => {
            // Cache successful responses
            if (response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => {
            // Return cached data if network fails
            console.log('📱 Service Worker: Serving cached data for:', url.pathname);
            return cache.match(request);
          });
      })
    );
    return;
  }
  
  // Handle static files
  if (STATIC_FILES.includes(url.pathname) || url.pathname.startsWith('/_next/')) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          console.log('📦 Service Worker: Serving cached static file:', url.pathname);
          return response;
        }
        
        return fetch(request).then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }
  
  // Default: network first, cache fallback
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});

// Background sync for data updates
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-data') {
    console.log('🔄 Service Worker: Background sync triggered');
    event.waitUntil(syncDashboardData());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    console.log('🔔 Service Worker: Push notification received:', data);
    
    const options = {
      body: data.body || 'Novos dados disponíveis no dashboard',
      icon: '/android-chrome-192x192.png',
      badge: '/android-chrome-192x192.png',
      tag: 'sgb-notification',
      data: data.url || '/dashboard',
      actions: [
        {
          action: 'open',
          title: 'Abrir Dashboard'
        },
        {
          action: 'close',
          title: 'Fechar'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'SGB Dashboard', options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    const url = event.notification.data || '/dashboard';
    event.waitUntil(
      clients.openWindow(url)
    );
  }
});

// Helper function to sync dashboard data
async function syncDashboardData() {
  try {
    const cache = await caches.open(DATA_CACHE);
    
    // Update cached data
    for (const url of DATA_URLS) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response.clone());
          console.log('✅ Service Worker: Updated cache for:', url);
        }
      } catch (error) {
        console.log('❌ Service Worker: Failed to update cache for:', url, error);
      }
    }
    
    // Notify clients about data update
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'DATA_UPDATED',
        timestamp: new Date().toISOString()
      });
    });
    
  } catch (error) {
    console.error('❌ Service Worker: Sync failed:', error);
  }
}

// Service Worker - Limpeza e Desregistro
console.log('🧹 Service Worker: Limpando caches e desregistrando...');

// Limpar todos os caches
self.addEventListener('install', (event) => {
  console.log('🗑️ SW: Install - limpando caches');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('🗑️ SW: Deletando cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );
  self.skipWaiting();
});

// Ativar e limpar
self.addEventListener('activate', (event) => {
  console.log('✅ SW: Activate - assumindo controle');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('🗑️ SW: Deletando cache na ativação:', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );
  self.clients.claim();
});

// Não interceptar nenhuma requisição - deixar passar direto
self.addEventListener('fetch', (event) => {
  // Não fazer nada - deixar requisições passarem normalmente
  return;
}); 