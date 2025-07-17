// Service Worker para SGB_V2 PWA
const CACHE_NAME = 'sgb-v2-cache-v1.0.1'
const OFFLINE_URL = '/offline'

// Recursos cr·≠ticos para cache
const CORE_CACHE_RESOURCES = [
  '/',
  '/home',
  '/login',
  '/offline',
  '/checklists',
  '/configuracoes',
  '/_next/static/css/app/globals.css',
  '/favicon.ico',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png'
]

// Recursos est·°ticos para cache
const STATIC_CACHE_RESOURCES = [
  '/site.webmanifest',
  '/apple-touch-icon.png',
  '/favicon-16x16.png',
  '/favicon-32x32.png'
]

// APIs que devem funcionar offline
const OFFLINE_FALLBACK_APIS = [
  '/api/bars',
  '/api/usuarios',
  '/api/checklists',
  '/api/cache/metricas'
]

// Instalar Service Worker
self.addEventListener('install', event => {
  console.log('üöÄ SW: Instalando Service Worker...')
  
  event.waitUntil(
    (async () => {
      try {
        // Cache recursos cr·≠ticos
        const coreCache = await caches.open(CACHE_NAME + '-core')
        await coreCache.addAll(CORE_CACHE_RESOURCES)
        console.log('úÖ SW: Cache principal criado')

        // Cache recursos est·°ticos
        const staticCache = await caches.open(CACHE_NAME + '-static')
        await staticCache.addAll(STATIC_CACHE_RESOURCES)
        console.log('úÖ SW: Cache est·°tico criado')

        // For·ßar ativa·ß·£o
        self.skipWaiting()
      } catch (error) {
        console.error('ùå SW: Erro durante instala·ß·£o:', error)
      }
    })()
  )
})

// Ativar Service Worker
self.addEventListener('activate', event => {
  console.log('üîÑ SW: Ativando Service Worker...')
  
  event.waitUntil(
    (async () => {
      try {
        // Limpar caches antigos
        const cacheNames = await caches.keys()
        const oldCaches = cacheNames.filter(name => 
          name.startsWith('sgb-v2-cache-') && name !== CACHE_NAME + '-core' && name !== CACHE_NAME + '-static'
        )
        
        await Promise.all(oldCaches.map(name => caches.delete(name)))
        console.log('üóëÔ∏è SW: Caches antigos removidos:', oldCaches.length)

        // Assumir controle de todas as abas
        self.clients.claim()
        console.log('úÖ SW: Service Worker ativado')
      } catch (error) {
        console.error('ùå SW: Erro durante ativa·ß·£o:', error)
      }
    })()
  )
})

// Interceptar requisi·ß·µes
self.addEventListener('fetch', event => {
  // S·≥ processar requisi·ß·µes HTTP/HTTPS
  if (!event.request.url.startsWith('http')) return

  event.respondWith(handleFetch(event.request))
})

// Estrat·©gia principal de fetch
async function handleFetch(request) {
  const url = new URL(request.url)
  
  try {
    // 1. P·°ginas HTML - Cache First com Network Fallback
    if (request.destination === 'document') {
      return await handlePageRequest(request, url)
    }
    
    // 2. APIs - Network First com Cache Fallback
    if (url.pathname.startsWith('/api/')) {
      return await handleApiRequest(request, url)
    }
    
    // 3. Recursos est·°ticos - Cache First
    if (request.destination === 'image' || 
        request.destination === 'style' ||
        request.destination === 'script' ||
        url.pathname.startsWith('/_next/static/')) {
      return await handleStaticRequest(request)
    }
    
    // 4. Outras requisi·ß·µes - Network First
    return await handleNetworkFirst(request)
    
  } catch (error) {
    console.error('ùå SW: Erro no fetch:', error)
    return await handleOfflineFallback(request)
  }
}

// Gerenciar requisi·ß·µes de p·°ginas
async function handlePageRequest(request, url) {
  const cache = await caches.open(CACHE_NAME + '-core')
  
  try {
    // Tentar buscar da rede primeiro
    const networkResponse = await fetch(request, { timeout: 3000 })
    
    if (networkResponse.ok) {
      // Cachear p·°ginas importantes
      if (isImportantPage(url.pathname)) {
        cache.put(request, networkResponse.clone())
      }
      return networkResponse
    }
    
    throw new Error('Network response not ok')
  } catch (error) {
    // Fallback para cache
    const cachedResponse = await cache.match(request)
    if (cachedResponse) {
      console.log('üì± SW: Servindo p·°gina do cache:', url.pathname)
      return cachedResponse
    }
    
    // P·°gina offline como ·∫ltimo recurso
    if (url.pathname !== '/offline') {
      return caches.match('/offline') || new Response('Offline', { status: 503 })
    }
    
    return new Response('P·°gina n·£o dispon·≠vel offline', { status: 503 })
  }
}

// Gerenciar requisi·ß·µes de API
async function handleApiRequest(request, url) {
  const cache = await caches.open(CACHE_NAME + '-api')
  
  try {
    // Network First para APIs
    const networkResponse = await fetch(request, { timeout: 5000 })
    
    if (networkResponse.ok) {
      // Cachear apenas respostas GET bem-sucedidas
      if (request.method === 'GET') {
        cache.put(request, networkResponse.clone())
      }
      return networkResponse
    }
    
    throw new Error('API response not ok')
  } catch (error) {
    // Fallback para cache apenas para APIs espec·≠ficas
    if (request.method === 'GET' && isOfflineCompatibleApi(url.pathname)) {
      const cachedResponse = await cache.match(request)
      if (cachedResponse) {
        console.log('üì° SW: Servindo API do cache:', url.pathname)
        
        // Adicionar header indicando que ·© cache
        const headers = new Headers(cachedResponse.headers)
        headers.set('X-SW-Cache', 'true')
        headers.set('X-SW-Timestamp', Date.now())
        
        return new Response(cachedResponse.body, {
          status: cachedResponse.status,
          statusText: cachedResponse.statusText,
          headers: headers
        })
      }
    }
    
    // Retornar erro estruturado para APIs
    return new Response(JSON.stringify({
      success: false,
      error: 'Funcionalidade n·£o dispon·≠vel offline',
      offline: true,
      timestamp: Date.now()
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Gerenciar recursos est·°ticos
async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAME + '-static')
  
  // Cache First para recursos est·°ticos
  const cachedResponse = await cache.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    // Fallback para recursos cr·≠ticos
    return await handleOfflineFallback(request)
  }
}

// Network First padr·£o
async function handleNetworkFirst(request) {
  try {
    const networkResponse = await fetch(request, { timeout: 5000 })
    return networkResponse
  } catch (error) {
    const cache = await caches.open(CACHE_NAME + '-core')
    const cachedResponse = await cache.match(request)
    return cachedResponse || await handleOfflineFallback(request)
  }
}

// Fallback offline
async function handleOfflineFallback(request) {
  if (request.destination === 'document') {
    try {
      const cachedOffline = await caches.match('/offline')
      if (cachedOffline) {
        return cachedOffline
      }
      
      // Fallback para uma p·°gina offline b·°sica
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>SGB - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>üîå Voc·™ est·° offline</h1>
          <p>Reconecte-se ·† internet para continuar usando o SGB.</p>
        </body>
        </html>
      `, {
        status: 503,
        headers: { 'Content-Type': 'text/html' }
      })
    } catch (error) {
      console.error('ùå SW: Erro no fallback offline:', error)
      return new Response('Offline', { 
        status: 503,
        headers: { 'Content-Type': 'text/plain' }
      })
    }
  }
  
  return new Response('Offline', { 
    status: 503,
    headers: { 'Content-Type': 'text/plain' }
  })
}

// Verificar se ·© p·°gina importante para cache
function isImportantPage(pathname) {
  const importantPages = [
    '/',
    '/home',
    '/checklists',
    '/configuracoes',
    '/operacoes',
    '/visao-geral',
    '/minha-conta'
  ]
  
  return importantPages.some(page => 
    pathname === page || pathname.startsWith(page + '/')
  )
}

// Verificar se API ·© compat·≠vel com offline
function isOfflineCompatibleApi(pathname) {
  return OFFLINE_FALLBACK_APIS.some(api => pathname.startsWith(api))
}

// Background Sync para a·ß·µes quando online
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('üîÑ SW: Executando background sync...')
    event.waitUntil(handleBackgroundSync())
  }
})

// Gerenciar sincroniza·ß·£o em background
async function handleBackgroundSync() {
  try {
    // Buscar a·ß·µes pendentes do IndexedDB
    const pendingActions = await getPendingActions()
    
    for (const action of pendingActions) {
      try {
        await executeAction(action)
        await removePendingAction(action.id)
        console.log('úÖ SW: A·ß·£o sincronizada:', action.type)
      } catch (error) {
        console.error('ùå SW: Erro ao sincronizar:', action.type, error)
      }
    }
  } catch (error) {
    console.error('ùå SW: Erro no background sync:', error)
  }
}

// Simular fun·ß·µes de IndexedDB (implementa·ß·£o completa seria mais complexa)
async function getPendingActions() {
  // Aqui seria implementada a l·≥gica para buscar do IndexedDB
  return []
}

async function executeAction(action) {
  // Executar a·ß·£o quando online
  return fetch(action.url, action.options)
}

async function removePendingAction(id) {
  // Remover a·ß·£o do IndexedDB
  return true
}

// Push Notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Nova notifica·ß·£o do SGB',
    icon: '/android-chrome-192x192.png',
    badge: '/favicon-16x16.png',
    vibrate: [100, 50, 100],
    data: {
      url: '/',
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir App',
        icon: '/android-chrome-192x192.png'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('SGB - Sistema de Gest·£o', options)
  )
})

// Gerenciar cliques em notifica·ß·µes
self.addEventListener('notificationclick', event => {
  event.notification.close()

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || '/')
    )
  }
})

// Detectar mudan·ßas de conectividade
self.addEventListener('online', () => {
  console.log('üåê SW: Conex·£o online detectada')
  // Trigger background sync
  self.registration.sync.register('background-sync')
})

self.addEventListener('offline', () => {
  console.log('üì± SW: Modo offline detectado')
})

// Log de instala·ß·£o completa
console.log('üöÄ SGB_V2 Service Worker carregado - v1.0.1') 