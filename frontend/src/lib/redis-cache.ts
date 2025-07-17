import { getSupabaseClient } from './supabase'

// Configuraá§áµes de cache por tipo
const CACHE_CONFIGS = {
  usuarios: { ttl: 300 }, // 5 minutos
  bars: { ttl: 600 }, // 10 minutos  
  checklists: { ttl: 180 }, // 3 minutos
  eventos: { ttl: 120 }, // 2 minutos
  dashboard: { ttl: 60 }, // 1 minuto
  analytics: { ttl: 30 }, // 30 segundos
  receitas: { ttl: 240 }, // 4 minutos
  configuracoes: { ttl: 900 }, // 15 minutos
  meta: { ttl: 3600 }, // 1 hora
  contaazul: { ttl: 600 }, // 10 minutos
  default: { ttl: 300 } // 5 minutos padrá£o
} as const

type CacheType = keyof typeof CACHE_CONFIGS

interface CacheItem<T = any> {
  data: T
  timestamp: number
  ttl: number
  key: string
}

interface CacheMetrics {
  hits: number
  misses: number
  sets: number
  deletes: number
  hitRate: number
}

class RedisCacheService {
  private memoryCache = new Map<string, CacheItem>()
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    hitRate: 0
  }

  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Limpeza automá¡tica a cada 5 minutos
    this.startCleanup()
  }

  private startCleanup() {
    if (this.cleanupInterval) return
    
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000) // 5 minutos
  }

  private cleanup() {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, item] of this.memoryCache.entries()) {
      if (now - item.timestamp > item.ttl * 1000) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => {
      this.memoryCache.delete(key)
    })

    console.log(`Cache cleanup: removidas ${keysToDelete.length} entradas expiradas`)
  }

  private generateKey(type: CacheType, identifier: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : ''
    return `${type}:${identifier}:${btoa(paramString)}`
  }

  private getTTL(type: CacheType): number {
    return CACHE_CONFIGS[type]?.ttl || CACHE_CONFIGS.default.ttl
  }

  private updateMetrics() {
    const total = this.metrics.hits + this.metrics.misses
    this.metrics.hitRate = total > 0 ? (this.metrics.hits / total) * 100 : 0
  }

  async get<T = any>(type: CacheType, identifier: string, params?: Record<string, any>): Promise<T | null> {
    const key = this.generateKey(type, identifier, params)
    const item = this.memoryCache.get(key)

    if (!item) {
      this.metrics.misses++
      this.updateMetrics()
      return null
    }

    const now = Date.now()
    if (now - item.timestamp > item.ttl * 1000) {
      this.memoryCache.delete(key)
      this.metrics.misses++
      this.updateMetrics()
      return null
    }

    this.metrics.hits++
    this.updateMetrics()
    return item.data as T
  }

  async set<T = any>(type: CacheType, identifier: string, data: T, params?: Record<string, any>): Promise<void> {
    const key = this.generateKey(type, identifier, params)
    const ttl = this.getTTL(type)

    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      key
    }

    this.memoryCache.set(key, item)
    this.metrics.sets++
    this.updateMetrics()

    // Log para debugging
    console.log(`Cache SET: ${key} (TTL: ${ttl}s)`)
  }

  async delete(type: CacheType, identifier: string, params?: Record<string, any>): Promise<void> {
    const key = this.generateKey(type, identifier, params)
    const deleted = this.memoryCache.delete(key)
    
    if (deleted) {
      this.metrics.deletes++
      this.updateMetrics()
      console.log(`Cache DELETE: ${key}`)
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keysToDelete: string[] = []
    
    for (const [key] of this.memoryCache.entries()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => {
      this.memoryCache.delete(key)
    })

    this.metrics.deletes += keysToDelete.length
    this.updateMetrics()
    
    console.log(`Cache INVALIDATE: ${keysToDelete.length} chaves removidas com padrá£o '${pattern}'`)
  }

  async invalidateByType(type: CacheType): Promise<void> {
    const keysToDelete: string[] = []
    
    for (const [key] of this.memoryCache.entries()) {
      if (key.startsWith(`${type}:`)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => {
      this.memoryCache.delete(key)
    })

    this.metrics.deletes += keysToDelete.length
    this.updateMetrics()
    
    console.log(`Cache INVALIDATE TYPE: ${keysToDelete.length} chaves removidas do tipo '${type}'`)
  }

  async clear(): Promise<void> {
    const size = this.memoryCache.size
    this.memoryCache.clear()
    this.metrics.deletes += size
    this.updateMetrics()
    
    console.log(`Cache CLEAR: ${size} entradas removidas`)
  }

  getMetrics(): CacheMetrics {
    return { ...this.metrics }
  }

  getStats() {
    return {
      size: this.memoryCache.size,
      metrics: this.getMetrics(),
      memoryUsage: process.memoryUsage?.() || null
    }
  }

  // Helper para cache com funá§á£o de fallback
  async getOrSet<T = any>(
    type: CacheType,
    identifier: string,
    fetchFunction: () => Promise<T>,
    params?: Record<string, any>
  ): Promise<T> {
    // Tenta buscar no cache primeiro
    const cached = await this.get<T>(type, identifier, params)
    if (cached !== null) {
      return cached
    }

    // Se ná£o encontrou, executa a funá§á£o e armazena
    try {
      const data = await fetchFunction()
      await this.set(type, identifier, data, params)
      return data
    } catch (error) {
      console.error(`Erro ao buscar dados para cache ${type}:${identifier}:`, error)
      throw error
    }
  }

  // Má©todo para prá©-aquecer cache crá­tico
  async warmup(): Promise<void> {
    try {
      console.log('Iniciando warmup do cache...')

      const supabase = await getSupabaseClient()

      // Cache de configuraá§áµes crá­ticas
      const { data: bars } = await supabase.from('bars').select('*').eq('ativo', true)
      if (bars) {
        await this.set('bars', 'active', bars)
      }

      // Cache de usuá¡rios ativos
      const { data: usuarios } = await supabase.from('usuarios').select('*').eq('ativo', true)
      if (usuarios) {
        await this.set('usuarios', 'active', usuarios)
      }

      console.log('Cache warmup concluá­do')
    } catch (error) {
      console.error('Erro durante cache warmup:', error)
    }
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.clear()
  }
}

// Instá¢ncia singleton
export const cacheService = new RedisCacheService()

// Hook para facilitar uso no frontend
export function useCache() {
  return {
    get: cacheService.get.bind(cacheService),
    set: cacheService.set.bind(cacheService),
    delete: cacheService.delete.bind(cacheService),
    invalidatePattern: cacheService.invalidatePattern.bind(cacheService),
    invalidateByType: cacheService.invalidateByType.bind(cacheService),
    getOrSet: cacheService.getOrSet.bind(cacheService),
    getStats: cacheService.getStats.bind(cacheService),
    clear: cacheService.clear.bind(cacheService)
  }
}

// Utilitá¡rios para cache de queries especá­ficas
export const cacheUtils = {
  // Cache para listas paginadas
  async getPagedData<T>(
    type: CacheType,
    baseKey: string,
    page: number,
    limit: number,
    fetchFunction: () => Promise<T>
  ): Promise<T> {
    return cacheService.getOrSet(
      type,
      baseKey,
      fetchFunction,
      { page, limit }
    )
  },

  // Cache para dados filtrados
  async getFilteredData<T>(
    type: CacheType,
    baseKey: string,
    filters: Record<string, any>,
    fetchFunction: () => Promise<T>
  ): Promise<T> {
    return cacheService.getOrSet(
      type,
      baseKey,
      fetchFunction,
      { filters }
    )
  },

  // Cache para dados de usuá¡rio especá­fico
  async getUserData<T>(
    type: CacheType,
    userId: string,
    dataType: string,
    fetchFunction: () => Promise<T>
  ): Promise<T> {
    return cacheService.getOrSet(
      type,
      `user:${userId}:${dataType}`,
      fetchFunction
    )
  }
}

export default cacheService 
