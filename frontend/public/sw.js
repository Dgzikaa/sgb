// Service Worker para SGB_V2 PWA
const CACHE_NAME = 'sgb-v2-cache-v1.0.1'
const OFFLINE_URL = '/offline'

// Recursos críticos para cache
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

// Recursos estáticos para cache
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
  '/api/cache/metricas',
  '/api/financeiro/nibo/schedules',
  '/api/financeiro/nibo/stakeholders',
  '/api/financeiro/nibo/categorias',
  '/api/financeiro/nibo/centros-custo',
  '/api/financeiro/inter/pix',
  '/api/webhook-inter-banking'
]

// Instalar Service Worker
self.addEventListener('install', event => {
  console.log('🚀 SW: Instalando Service Worker...')
  
  event.waitUntil(
    (async () => {
      try {
        // Cache recursos críticos
        const coreCache = await caches.open(CACHE_NAME + '-core')
        await coreCache.addAll(CORE_CACHE_RESOURCES)
        console.log('✅ SW: Cache principal criado')

        // Cache recursos estáticos
        const staticCache = await caches.open(CACHE_NAME + '-static')
        await staticCache.addAll(STATIC_CACHE_RESOURCES)
        console.log('✅ SW: Cache estático criado')

        // Forçar ativação
        self.skipWaiting()
      } catch (error) {
        console.error('❌ SW: Erro durante instalação:', error)
      }
    })()
  )
})

// Ativar Service Worker
self.addEventListener('activate', event => {
  console.log('🔄 SW: Ativando Service Worker...')
  
  event.waitUntil(
    (async () => {
      try {
        // Limpar caches antigos
        const cacheNames = await caches.keys()
        const oldCaches = cacheNames.filter(name => 
          name.startsWith('sgb-v2-cache-') && name !== CACHE_NAME + '-core' && name !== CACHE_NAME + '-static'
        )
        
        await Promise.all(oldCaches.map(name => caches.delete(name)))
        console.log('🗑️ SW: Caches antigos removidos:', oldCaches.length)

        // Assumir controle de todas as abas
        self.clients.claim()
        console.log('✅ SW: Service Worker ativado')
      } catch (error) {
        console.error('❌ SW: Erro durante ativação:', error)
      }
    })()
  )
})

// Interceptar requisições
self.addEventListener('fetch', event => {
  // Só processar requisições HTTP/HTTPS
  if (!event.request.url.startsWith('http')) return

  event.respondWith(handleFetch(event.request))
})

// Estratégia principal de fetch
async function handleFetch(request) {
  const url = new URL(request.url)
  
  try {
    // 1. Páginas HTML - Cache First com Network Fallback
    if (request.destination === 'document') {
      return await handlePageRequest(request, url)
    }
    
    // 2. APIs - Network First com Cache Fallback
    if (url.pathname.startsWith('/api/')) {
      return await handleApiRequest(request, url)
    }
    
    // 3. Recursos estáticos - Cache First
    if (request.destination === 'image' || 
        request.destination === 'style' ||
        request.destination === 'script' ||
        url.pathname.startsWith('/_next/static/')) {
      return await handleStaticRequest(request)
    }
    
    // 4. Outras requisições - Network First
    return await handleNetworkFirst(request)
    
  } catch (error) {
    console.error('❌ SW: Erro no fetch:', error)
    return await handleOfflineFallback(request)
  }
}

// Gerenciar requisições de páginas
async function handlePageRequest(request, url) {
  const cache = await caches.open(CACHE_NAME + '-core')
  
  try {
    // Tentar buscar da rede primeiro
    const networkResponse = await fetch(request, { timeout: 3000 })
    
    if (networkResponse.ok) {
      // Cachear páginas importantes
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
      console.log('📱 SW: Servindo página do cache:', url.pathname)
      return cachedResponse
    }
    
    // Página offline como último recurso
    if (url.pathname !== '/offline') {
      return caches.match('/offline') || new Response('Offline', { status: 503 })
    }
    
    return new Response('Página não disponível offline', { status: 503 })
  }
}

// Gerenciar requisições de API
async function handleApiRequest(request, url) {
  const cache = await caches.open(CACHE_NAME + '-api')
  
  try {
    // Network First para APIs
    const networkResponse = await fetch(request, { timeout: 10000 })
    
    if (networkResponse.ok) {
      // Cachear apenas respostas GET bem-sucedidas
      if (request.method === 'GET') {
        cache.put(request, networkResponse.clone())
      }
      return networkResponse
    }
    
    throw new Error('API response not ok')
  } catch (error) {
    console.log('❌ SW: Erro na API:', url.pathname, error.message)
    
    // Fallback para cache apenas para APIs específicas e GET
    if (request.method === 'GET' && isOfflineCompatibleApi(url.pathname)) {
      const cachedResponse = await cache.match(request)
      if (cachedResponse) {
        console.log('📡 SW: Servindo API do cache:', url.pathname)
        
        // Adicionar header indicando que é cache
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
    
    // Para APIs que não são compatíveis com offline, deixar passar
    if (!isOfflineCompatibleApi(url.pathname)) {
      console.log('🌐 SW: API não compatível com offline, tentando rede:', url.pathname)
      throw error // Re-throw para deixar o erro original passar
    }
    
    // Retornar erro estruturado apenas para APIs compatíveis com offline
    return new Response(JSON.stringify({
      success: false,
      error: 'Funcionalidade não disponível offline',
      offline: true,
      timestamp: Date.now()
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Gerenciar recursos estáticos
async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAME + '-static')
  
  // Cache First para recursos estáticos
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
    // Fallback para recursos críticos
    return await handleOfflineFallback(request)
  }
}

// Network First padrão
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
      
      // Fallback para uma página offline básica
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>SGB - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>🔌 Você está offline</h1>
          <p>Reconecte-se à internet para continuar usando o SGB.</p>
        </body>
        </html>
      `, {
        status: 503,
        headers: { 'Content-Type': 'text/html' }
      })
    } catch (error) {
      console.error('❌ SW: Erro no fallback offline:', error)
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

// Verificar se é página importante para cache
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

// Verificar se API é compatível com offline
function isOfflineCompatibleApi(pathname) {
  return OFFLINE_FALLBACK_APIS.some(api => pathname.startsWith(api))
}

// Background Sync para ações quando online
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('🔄 SW: Executando background sync...')
    event.waitUntil(handleBackgroundSync())
  }
})

// Gerenciar sincronização em background
async function handleBackgroundSync() {
  try {
    // Buscar ações pendentes do IndexedDB
    const pendingActions = await getPendingActions()
    
    for (const action of pendingActions) {
      try {
        await executeAction(action)
        await removePendingAction(action.id)
        console.log('✅ SW: Ação sincronizada:', action.type)
      } catch (error) {
        console.error('❌ SW: Erro ao sincronizar:', action.type, error)
      }
    }
  } catch (error) {
    console.error('❌ SW: Erro no background sync:', error)
  }
}

// Simular funções de IndexedDB (implementação completa seria mais complexa)
async function getPendingActions() {
  // Aqui seria implementada a lógica para buscar do IndexedDB
  return []
}

async function executeAction(action) {
  // Executar ação quando online
  return fetch(action.url, action.options)
}

async function removePendingAction(id) {
  // Remover ação do IndexedDB
  return true
}

// Push Notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação do SGB',
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
    self.registration.showNotification('SGB - Sistema de Gestão', options)
  )
})

// Gerenciar cliques em notificações
self.addEventListener('notificationclick', event => {
  event.notification.close()

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || '/')
    )
  }
})

// Detectar mudanças de conectividade
self.addEventListener('online', () => {
  console.log('🌐 SW: Conexão online detectada')
  // Trigger background sync
  self.registration.sync.register('background-sync')
})

self.addEventListener('offline', () => {
  console.log('📱 SW: Modo offline detectado')
})

// Log de instalação completa
console.log('🚀 SGB_V2 Service Worker carregado - v1.0.1') 