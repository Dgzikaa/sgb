/**
 * Utilitários de cache para APIs do SGB
 * 
 * Uso no servidor (API routes):
 * - Adicionar headers de cache apropriados
 * - Suporte a revalidação inteligente
 */

/**
 * Headers de cache para diferentes tipos de resposta
 */
export const CacheHeaders = {
  /** Cache estático por 5 minutos + 10 min stale (dashboards) */
  dashboard: {
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    'CDN-Cache-Control': 'public, s-maxage=300',
    'Vercel-CDN-Cache-Control': 'public, s-maxage=300',
  },
  
  /** Cache curto de 1 minuto (relatórios em tempo real) */
  realtime: {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
    'CDN-Cache-Control': 'public, s-maxage=60',
    'Vercel-CDN-Cache-Control': 'public, s-maxage=60',
  },
  
  /** Cache longo de 1 hora (configurações, dados estáveis) */
  static: {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
    'CDN-Cache-Control': 'public, s-maxage=3600',
    'Vercel-CDN-Cache-Control': 'public, s-maxage=3600',
  },
  
  /** Sem cache (dados sensíveis, login) */
  noCache: {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
  
  /** Cache privado no browser apenas */
  private: {
    'Cache-Control': 'private, max-age=300',
  },
} as const;

/**
 * Criar resposta JSON com cache otimizado
 */
export function jsonWithCache(
  data: unknown,
  cacheType: keyof typeof CacheHeaders = 'dashboard',
  status: number = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CacheHeaders[cacheType],
    },
  });
}

/**
 * Criar resposta de erro (sem cache)
 */
export function errorResponse(
  message: string,
  status: number = 500
): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CacheHeaders.noCache,
    },
  });
}

/**
 * Cache key generator baseado em query params
 */
export function generateCacheKey(
  prefix: string,
  params: Record<string, string | number | boolean | undefined>
): string {
  const sortedKeys = Object.keys(params).sort();
  const values = sortedKeys
    .filter(k => params[k] !== undefined)
    .map(k => `${k}=${params[k]}`)
    .join('&');
  return `${prefix}:${values || 'default'}`;
}

/**
 * Medir tempo de execução de query
 */
export async function measureQuery<T>(
  queryFn: () => Promise<T>,
  label: string
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await queryFn();
  const duration = Math.round(performance.now() - start);
  
  if (duration > 1000) {
    console.warn(`⚠️ Query lenta [${label}]: ${duration}ms`);
  }
  
  return { result, duration };
}

/**
 * Retry com backoff exponencial
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Batching de requests similares
 */
class RequestBatcher<T> {
  private pending = new Map<string, Promise<T>>();
  private timeouts = new Map<string, NodeJS.Timeout>();
  
  async batch(
    key: string,
    fetcher: () => Promise<T>,
    dedupeWindow: number = 100
  ): Promise<T> {
    // Se já existe uma request pendente, retornar ela
    const existing = this.pending.get(key);
    if (existing) {
      return existing;
    }
    
    // Criar nova request
    const promise = fetcher().finally(() => {
      // Manter no cache por um curto período para dedupe
      const timeout = setTimeout(() => {
        this.pending.delete(key);
        this.timeouts.delete(key);
      }, dedupeWindow);
      
      this.timeouts.set(key, timeout);
    });
    
    this.pending.set(key, promise);
    return promise;
  }
  
  clear() {
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.pending.clear();
    this.timeouts.clear();
  }
}

export const requestBatcher = new RequestBatcher();

