import { NextRequest, NextResponse } from 'next/server'
import { cacheService } from '../lib/redis-cache'

// Rotas que devem ser cacheadas automaticamente
const CACHEABLE_ROUTES = {
  '/api/usuarios': { type: 'usuarios' as const, ttl: 300 },
  '/api/bars': { type: 'bars' as const, ttl: 600 },
  '/api/checklists': { type: 'checklists' as const, ttl: 180 },
  '/api/eventos': { type: 'eventos' as const, ttl: 120 },
  '/api/dashboard': { type: 'dashboard' as const, ttl: 60 },
  '/api/analytics': { type: 'analytics' as const, ttl: 30 },
  '/api/receitas': { type: 'receitas' as const, ttl: 240 },
  '/api/configuracoes': { type: 'configuracoes' as const, ttl: 900 },
  '/api/meta': { type: 'meta' as const, ttl: 3600 },
  '/api/contaazul': { type: 'contaazul' as const, ttl: 600 }
} as const

// Rotas que invalidam cache quando hÃ¡ mutaÃ§Ã£o
const CACHE_INVALIDATION_MAP = {
  '/api/usuarios': ['usuarios'],
  '/api/bars': ['bars', 'dashboard'],
  '/api/checklists': ['checklists', 'dashboard'],
  '/api/eventos': ['eventos', 'dashboard'],
  '/api/receitas': ['receitas', 'dashboard'],
  '/api/configuracoes': ['configuracoes'],
  '/api/analytics': ['analytics'],
  '/api/meta': ['meta', 'dashboard'],
  '/api/contaazul': ['contaazul', 'dashboard']
} as const

interface CacheRequest {
  url: string
  method: string
  headers: Headers
  searchParams: URLSearchParams
}

interface CacheResponse {
  status: number
  data: any
  headers: Record<string, string>
  timestamp: number
}

export class CacheMiddleware {
  
  private generateCacheKey(request: CacheRequest): string {
    const { url, method, searchParams } = request
    const params = Object.fromEntries(searchParams.entries())
    const key = `${method}:${url}:${JSON.stringify(params)}`
    return btoa(key).replace(/[^a-zA-Z0-9]/g, '')
  }

  private shouldCache(request: NextRequest): boolean {
    const pathname = new URL(request.url).pathname
    
    // SÃ³ cachear mÃ©todos GET
    if (request.method !== 'GET') return false
    
    // Verificar se a rota estÃ¡ na lista de cacheÃ¡veis
    return Object.keys(CACHEABLE_ROUTES).some(route => 
      pathname.startsWith(route)
    )
  }

  private getCacheConfig(pathname: string) {
    for (const [route, config] of Object.entries(CACHEABLE_ROUTES)) {
      if (pathname.startsWith(route)) {
        return config
      }
    }
    return null
  }

  private shouldInvalidateCache(request: NextRequest): string[] {
    const pathname = new URL(request.url).pathname
    
    // Invalidar cache em mÃ©todos de mutaÃ§Ã£o
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      return []
    }

    for (const [route, types] of Object.entries(CACHE_INVALIDATION_MAP)) {
      if (pathname.startsWith(route)) {
        return [...types] // Converter para array mutÃ¡vel
      }
    }

    return []
  }

  async handleRequest(request: NextRequest): Promise<NextResponse | null> {
    const pathname = new URL(request.url).pathname
    
    // Processar invalidaÃ§Ã£o de cache para mÃ©todos de mutaÃ§Ã£o
    const typesToInvalidate = this.shouldInvalidateCache(request)
    if (typesToInvalidate.length > 0) {
      // NÃ£o bloqueamos a request, apenas agendamos a invalidaÃ§Ã£o
      this.invalidateCache(typesToInvalidate)
    }

    // Verificar se deve cachear (apenas GET)
    if (!this.shouldCache(request)) {
      return null // Continuar com o processamento normal
    }

    const cacheConfig = this.getCacheConfig(pathname)
    if (!cacheConfig) {
      return null
    }

    const cacheRequest: CacheRequest = {
      url: pathname,
      method: request.method,
      headers: request.headers,
      searchParams: new URL(request.url).searchParams
    }

    const cacheKey = this.generateCacheKey(cacheRequest)

    try {
      // Tentar buscar no cache
      const cached = await cacheService.get<CacheResponse>(
        cacheConfig.type,
        cacheKey
      )

      if (cached) {
        console.log(`Cache HIT: ${pathname}`)
        
        // Retornar resposta cacheada
        const response = NextResponse.json(cached.data, {
          status: cached.status,
          headers: {
            ...cached.headers,
            'X-Cache': 'HIT',
            'X-Cache-Timestamp': cached.timestamp.toString()
          }
        })

        return response
      }

      console.log(`Cache MISS: ${pathname}`)
      return null // Continuar com processamento normal

    } catch (error) {
      console.error('Erro ao acessar cache:', error)
      return null // Em caso de erro, continuar normalmente
    }
  }

  async handleResponse(
    request: NextRequest, 
    response: NextResponse
  ): Promise<NextResponse> {
    const pathname = new URL(request.url).pathname

    // SÃ³ processar respostas de GET que devem ser cacheadas
    if (!this.shouldCache(request)) {
      return response
    }

    const cacheConfig = this.getCacheConfig(pathname)
    if (!cacheConfig) {
      return response
    }

    // SÃ³ cachear respostas de sucesso
    if (!response.ok) {
      return response
    }

    try {
      const responseData = await response.clone().json()
      
      const cacheRequest: CacheRequest = {
        url: pathname,
        method: request.method,
        headers: request.headers,
        searchParams: new URL(request.url).searchParams
      }

      const cacheKey = this.generateCacheKey(cacheRequest)

      const cacheResponse: CacheResponse = {
        status: response.status,
        data: responseData,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: Date.now()
      }

      // Armazenar no cache
      await cacheService.set(
        cacheConfig.type,
        cacheKey,
        cacheResponse
      )

      console.log(`Cache SET: ${pathname}`)

      // Adicionar headers de cache
      const newResponse = NextResponse.json(responseData, {
        status: response.status,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          'X-Cache': 'MISS',
          'X-Cache-TTL': cacheConfig.ttl.toString()
        }
      })

      return newResponse

    } catch (error) {
      console.error('Erro ao cachear resposta:', error)
      return response
    }
  }

  private async invalidateCache(types: string[]): Promise<void> {
    try {
      for (const type of types) {
        await cacheService.invalidateByType(type as any)
      }
      console.log(`Cache invalidado para tipos: ${types.join(', ')}`)
    } catch (error) {
      console.error('Erro ao invalidar cache:', error)
    }
  }

  // MÃ©todo para invalidaÃ§Ã£o manual
  async invalidateCacheManual(patterns: string[]): Promise<void> {
    try {
      for (const pattern of patterns) {
        await cacheService.invalidatePattern(pattern)
      }
    } catch (error) {
      console.error('Erro na invalidaÃ§Ã£o manual:', error)
    }
  }

  // MÃ©todo para warmup de cache
  async warmupCache(): Promise<void> {
    try {
      await cacheService.warmup()
    } catch (error) {
      console.error('Erro no warmup de cache:', error)
    }
  }

  // MÃ©tricas de cache
  getCacheStats() {
    return cacheService.getStats()
  }
}

// InstÃ¢ncia singleton
export const cacheMiddleware = new CacheMiddleware()

// FunÃ§Ãµes utilitÃ¡rias para uso em API routes
export async function withCache<T>(
  cacheType: keyof typeof CACHEABLE_ROUTES,
  identifier: string,
  fetchFunction: () => Promise<T>,
  options?: { ttl?: number }
): Promise<T> {
  return cacheService.getOrSet(
    CACHEABLE_ROUTES[cacheType]?.type || 'default',
    identifier,
    fetchFunction
  )
}

export async function invalidateApiCache(apiPath: string): Promise<void> {
  const types = CACHE_INVALIDATION_MAP[apiPath as keyof typeof CACHE_INVALIDATION_MAP]
  if (types) {
    for (const type of types) {
      await cacheService.invalidateByType(type as any)
    }
  }
}

export async function getCacheMetrics() {
  return cacheService.getStats()
}

export default cacheMiddleware 
