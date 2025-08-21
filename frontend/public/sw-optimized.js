// ✅ Service Worker Otimizado para Zykor
// Cache estratégico para performance máxima em produção

const CACHE_NAME = 'zykor-v2.0.0';
const STATIC_CACHE = 'zykor-static-v2.0.0';
const API_CACHE = 'zykor-api-v2.0.0';
const IMAGE_CACHE = 'zykor-images-v2.0.0';

// ✅ Recursos para cache imediato (críticos)
const CRITICAL_RESOURCES = [
  '/',
  '/home',
  '/login',
  '/manifest.json',
  '/favicon.ico',
  '/_next/static/css/app/layout.css',
  '/_next/static/chunks/webpack.js',
  '/_next/static/chunks/main.js',
];

// ✅ APIs para cache (dados não críticos)
const CACHEABLE_APIS = [
  '/api/configuracoes/badges',
  '/api/configuracoes/notifications',
  '/api/health',
  '/api/usuarios/me',
];

// ✅ Recursos para cache sob demanda
const ON_DEMAND_CACHE = [
  '/visao-geral',
  '/configuracoes',
  '/estrategico',
  '/operacional',
];

// ✅ Install: Cache recursos críticos
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache estático crítico
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(CRITICAL_RESOURCES);
      }),
      // Cache de imagens
      caches.open(IMAGE_CACHE),
      // Cache de API
      caches.open(API_CACHE),
    ]).then(() => {
      console.log('[SW] Critical resources cached');
      return self.skipWaiting();
    })
  );
});

// ✅ Activate: Limpar caches antigos
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== CACHE_NAME &&
            cacheName !== STATIC_CACHE &&
            cacheName !== API_CACHE &&
            cacheName !== IMAGE_CACHE
          ) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service worker activated');
      return self.clients.claim();
    })
  );
});

// ✅ Fetch: Estratégias de cache inteligentes
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ✅ Estratégia para APIs
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // ✅ Estratégia para imagens
  if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request));
    return;
  }

  // ✅ Estratégia para recursos estáticos
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    url.pathname.startsWith('/_next/static/')
  ) {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // ✅ Estratégia para páginas
  if (request.mode === 'navigate') {
    event.respondWith(handlePageRequest(request));
    return;
  }
});

// ✅ Cache-first para recursos estáticos (performance máxima)
async function handleStaticRequest(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Static resource failed:', error);
    return new Response('Resource unavailable', { status: 503 });
  }
}

// ✅ Network-first para APIs (dados sempre frescos)
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Tentar network primeiro
    const response = await fetch(request);
    
    // Cache apenas GETs bem-sucedidos de APIs específicas
    if (
      response.ok && 
      request.method === 'GET' &&
      CACHEABLE_APIS.some(api => url.pathname.startsWith(api))
    ) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Fallback para cache se network falhar
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Serving API from cache:', url.pathname);
      return cachedResponse;
    }
    
    // Resposta offline para APIs críticas
    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({
        status: 'offline',
        timestamp: Date.now()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    throw error;
  }
}

// ✅ Cache-first para imagens (economia de banda)
async function handleImageRequest(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(IMAGE_CACHE);
      // Limitar cache de imagens (máx 50MB)
      const cacheSize = await getCacheSize(IMAGE_CACHE);
      if (cacheSize < 50 * 1024 * 1024) {
        cache.put(request, response.clone());
      }
    }
    return response;
  } catch (error) {
    // Imagem placeholder offline
    return new Response(
      '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#f3f4f6"/><text x="100" y="100" text-anchor="middle" fill="#9ca3af">Offline</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
}

// ✅ Network-first para páginas (conteúdo sempre atualizado)
async function handlePageRequest(request) {
  try {
    const response = await fetch(request);
    
    // Cache páginas bem-sucedidas
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Fallback para cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Página offline padrão
    return caches.match('/') || new Response('Offline', { status: 503 });
  }
}

// ✅ Utilitário para calcular tamanho do cache
async function getCacheSize(cacheName) {
  const cache = await caches.open(cacheName);
  const requests = await cache.keys();
  let size = 0;
  
  for (const request of requests) {
    const response = await cache.match(request);
    if (response) {
      const blob = await response.blob();
      size += blob.size;
    }
  }
  
  return size;
}

// ✅ Limpeza automática de cache (evitar crescimento excessivo)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAN_CACHE') {
    cleanOldCaches();
  }
});

async function cleanOldCaches() {
  const cacheNames = await caches.keys();
  const oldCaches = cacheNames.filter(name => 
    name.includes('zykor') && 
    !name.includes('v2.0.0')
  );
  
  await Promise.all(oldCaches.map(name => caches.delete(name)));
  console.log('[SW] Cleaned old caches:', oldCaches);
}

console.log('[SW] Zykor Service Worker loaded successfully');
