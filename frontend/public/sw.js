const CACHE_NAME = 'ordinario-card-v1'
const STATIC_CACHE = 'static-v1'

// Arquivos para cache offline
const STATIC_FILES = [
  '/',
  '/manifest.json'
]

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_FILES))
      .then(() => self.skipWaiting())
  )
})

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch event
self.addEventListener('fetch', (event) => {
  // Para cartões, sempre buscar online primeiro
  if (event.request.url.includes('/cartao/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    )
    return
  }

  // Para outros recursos, cache first
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response
        }
        return fetch(event.request)
          .then((response) => {
            if (response.status === 200 && event.request.method === 'GET') {
              const responseClone = response.clone()
              caches.open(CACHE_NAME)
                .then((cache) => cache.put(event.request, responseClone))
            }
            return response
          })
      })
  )
})

// Push notifications (futuro)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    
    const options = {
      body: data.body || 'Nova notificação do Ordinário Bar',
      icon: '/logos/ordinario-transparente.png',
      badge: '/logos/ordinario-transparente.png',
      tag: 'ordinario-notification',
      actions: [
        {
          action: 'open',
          title: 'Abrir App'
        },
        {
          action: 'close',
          title: 'Fechar'
        }
      ]
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Ordinário Bar', options)
    )
  }
})

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})