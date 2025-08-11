const CACHE_NAME = 'ordinario-card-v1'
const STATIC_CACHE = 'ordinario-static-v1'

// Arquivos para clientes (fidelidade)
const STATIC_FILES = [
  '/fidelidade',
  '/fidelidade/lista-espera',
  '/logos/ordinario-transparente.png',
  '/manifest-fidelidade.json'
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

// Fetch event - Otimizado para clientes
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  
  // Para cartões digitais, sempre buscar dados frescos
  if (url.pathname.includes('/cartao/') || url.pathname.includes('/api/fidelidade/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Se offline, tentar cache
          return caches.match(event.request)
        })
    )
    return
  }

  // Para páginas de fidelidade, cache first
  if (url.pathname.includes('/fidelidade')) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            // Buscar atualização em background
            fetch(event.request)
              .then((fetchResponse) => {
                if (fetchResponse.status === 200) {
                  caches.open(CACHE_NAME)
                    .then((cache) => cache.put(event.request, fetchResponse.clone()))
                }
              })
            return response
          }
          
          return fetch(event.request)
            .then((response) => {
              if (response.status === 200) {
                const responseClone = response.clone()
                caches.open(CACHE_NAME)
                  .then((cache) => cache.put(event.request, responseClone))
              }
              return response
            })
        })
    )
    return
  }

  // Para outros recursos, comportamento padrão
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  )
})

// Push notifications para clientes
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    
    const options = {
      body: data.body || 'Nova novidade no Ordinário Bar!',
      icon: '/logos/ordinario-transparente.png',
      badge: '/logos/ordinario-transparente.png',
      tag: 'ordinario-notification',
      actions: [
        {
          action: 'open-card',
          title: 'Ver Cartão'
        },
        {
          action: 'close',
          title: 'Fechar'
        }
      ],
      data: {
        url: data.url || '/fidelidade'
      }
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Ordinário Bar', options)
    )
  }
})

// Notification click para clientes
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.action === 'open-card') {
    event.waitUntil(
      clients.openWindow('/fidelidade')
    )
  } else if (event.action === 'close') {
    // Apenas fecha
  } else {
    // Click geral na notificação
    const url = event.notification.data?.url || '/fidelidade'
    event.waitUntil(
      clients.openWindow(url)
    )
  }
})
