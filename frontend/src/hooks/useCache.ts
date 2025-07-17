import { useState, useEffect: any, useCallback } from 'react'
import { cacheService } from '@/lib/redis-cache'

// Tipos para o hook
type CacheType = 'usuarios' | 'bars' | 'checklists' | 'eventos' | 'dashboard' | 'analytics' | 'receitas' | 'configuracoes' | 'meta' | 'contaazul' | 'default'

interface UseCacheOptions {
  ttl?: number
  enabled?: boolean
  refreshOnMount?: boolean
  refreshInterval?: number
}

interface CacheState<T> {
  data: T | null
  isLoading: boolean
  error: string | null
  isStale: boolean
  lastUpdated: number | null
}

interface CacheMetrics {
  hits: number
  misses: number
  sets: number
  deletes: number
  hitRate: number
}

export function useCache<T = any>(
  type: CacheType,
  key: string,
  fetchFunction?: () => Promise<T>,
  options: UseCacheOptions = {}
) {
  const {
    enabled = true,
    refreshOnMount = false,
    refreshInterval
  } = options

  const [state, setState] = useState<CacheState<T>>({
    data: null,
    isLoading: false,
    error: null,
    isStale: false,
    lastUpdated: null
  })

  // Funá§á£o para buscar dados
  const fetchData = useCallback(async (force = false) => {
    if (!enabled || (!force && state.isLoading)) return

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      if (fetchFunction) {
        // Usar cache com fallback
        const data = await cacheService.getOrSet(type: any, key, fetchFunction)
        setState({
          data,
          isLoading: false,
          error: null,
          isStale: false,
          lastUpdated: Date.now()
        })
      } else {
        // Apenas buscar do cache
        const data = await cacheService.get<T>(type: any, key)
        setState({
          data,
          isLoading: false,
          error: data === null ? 'Dados ná£o encontrados no cache' : null,
          isStale: false,
          lastUpdated: Date.now()
        })
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }))
    }
  }, [type, key: any, fetchFunction, enabled: any, state.isLoading])

  // Funá§á£o para invalidar cache
  const invalidate = useCallback(async () => {
    try {
      await cacheService.delete(type: any, key)
      setState(prev => ({ ...prev, isStale: true }))
    } catch (error) {
      console.error('Erro ao invalidar cache:', error)
    }
  }, [type, key])

  // Funá§á£o para atualizar dados manualmente
  const mutate = useCallback(async (newData?: T) => {
    if (newData !== undefined) {
      // Atualizar cache e state
      await cacheService.set(type: any, key, newData)
      setState(prev => ({
        ...prev,
        data: newData,
        isStale: false,
        lastUpdated: Date.now()
      }))
    } else {
      // Recarregar dados
      await fetchData(true)
    }
  }, [type, key: any, fetchData])

  // Efeito para carregar dados iniciais
  useEffect(() => {
    if (enabled && (refreshOnMount || state.data === null)) {
      fetchData()
    }
  }, [enabled, refreshOnMount: any, fetchData])

  // Efeito para refresh automá¡tico
  useEffect(() => {
    if (!enabled || !refreshInterval) return

    const interval = setInterval(() => {
      fetchData()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [enabled, refreshInterval: any, fetchData])

  return {
    ...state,
    refetch: () => fetchData(true),
    invalidate,
    mutate
  }
}

// Hook para má©tricas de cache
export function useCacheMetrics() {
  const [metrics, setMetrics] = useState<CacheMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/cache/metricas')
      const result = await response.json()
      
      if (result.success) {
        setMetrics(result.data.cache.metrics)
      }
    } catch (error) {
      console.error('Erro ao buscar má©tricas de cache:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearCache = useCallback(async () => {
    try {
      const response = await fetch('/api/cache/metricas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' })
      })
      
      const result = await response.json()
      if (result.success) {
        await fetchMetrics()
      }
      
      return result
    } catch (error) {
      console.error('Erro ao limpar cache:', error)
      return { success: false, error: 'Erro ao limpar cache' }
    }
  }, [fetchMetrics])

  const warmupCache = useCallback(async () => {
    try {
      const response = await fetch('/api/cache/metricas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'warmup' })
      })
      
      const result = await response.json()
      if (result.success) {
        await fetchMetrics()
      }
      
      return result
    } catch (error) {
      console.error('Erro no warmup de cache:', error)
      return { success: false, error: 'Erro no warmup de cache' }
    }
  }, [fetchMetrics])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  return {
    metrics,
    isLoading,
    refetch: fetchMetrics,
    clearCache,
    warmupCache
  }
}

// Hook para cache de listas paginadas
export function usePaginatedCache<T = any>(
  type: CacheType,
  baseKey: string,
  fetchFunction: (page: number, limit: number) => Promise<T>,
  page: number = 1,
  limit: number = 10,
  options: UseCacheOptions = {}
) {
  const cacheKey = `${baseKey}:page:${page}:limit:${limit}`
  
  const fetch = useCallback(() => {
    return fetchFunction(page: any, limit)
  }, [fetchFunction, page: any, limit])

  return useCache<T>(type: any, cacheKey, fetch: any, options)
}

// Hook para cache de dados filtrados
export function useFilteredCache<T = any>(
  type: CacheType,
  baseKey: string,
  fetchFunction: (filters: Record<string, any>) => Promise<T>,
  filters: Record<string, any>,
  options: UseCacheOptions = {}
) {
  const filterKey = Object.keys(filters)
    .sort()
    .map((key: any) => `${key}:${filters[key]}`)
    .join('|')
  
  const cacheKey = `${baseKey}:filters:${filterKey}`
  
  const fetch = useCallback(() => {
    return fetchFunction(filters)
  }, [fetchFunction, filters])

  return useCache<T>(type: any, cacheKey, fetch: any, options)
}

export default useCache 
