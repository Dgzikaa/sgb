const CACHE_NAME = 'zykor-gestao-v1'
const STATIC_CACHE = 'zykor-static-v1'

// Arquivos essenciais para gestão offline
const STATIC_FILES = [
  '/dashboard',
  '/operacoes/qr-scanner',
  '/logos/zykor-logo.png',
  '/manifest-zykor.json'
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

// Fetch event - Otimizado para gestão
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  
  // Para APIs de gestão, sempre buscar dados frescos
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache apenas se a resposta for bem-sucedida
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME)
              .then((cache) => cache.put(event.request, responseClone))
          }
          return response
        })
        .catch(() => {
          // Fallback para cache se offline
          return caches.match(event.request)
        })
    )
    return
  }

  // Para páginas administrativas, cache com network fallback
  if (url.pathname.includes('/dashboard') || 
      url.pathname.includes('/operacoes') || 
      url.pathname.includes('/configuracoes') ||
      url.pathname.includes('/relatorios')) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          return response || fetch(event.request)
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

// Push notifications para gestores
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    
    const options = {
      body: data.body || 'Nova notificação do SGB',
      icon: '/logos/logo_640x640.png',
      badge: '/logos/logo_640x640.png',
      tag: 'sgb-notification',
      actions: [
        {
          action: 'open-dashboard',
          title: 'Ver Dashboard'
        },
        {
          action: 'dismiss',
          title: 'Dispensar'
        }
      ],
      data: {
        url: data.url || '/dashboard'
      }
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'SGB', options)
    )
  }
})

// Notification click para gestores
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.action === 'open-dashboard') {
    event.waitUntil(
      self.clients.openWindow('/dashboard')
    )
  } else if (event.action === 'dismiss') {
    // Apenas fecha a notificação
  } else {
    // Click na notificação (sem action específica)
    const url = event.notification.data?.url || '/dashboard'
    event.waitUntil(
      self.clients.openWindow(url)
    )
  }
})
