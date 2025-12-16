'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  /** Tempo de vida do cache em segundos (padrão: 5 minutos) */
  ttl?: number;
  /** Se deve usar localStorage para persistência (padrão: true) */
  persistent?: boolean;
  /** Atualizar cache automaticamente quando expirar (padrão: false) */
  autoRefresh?: boolean;
  /** Intervalo de refresh automático em segundos (padrão: igual ao TTL) */
  refreshInterval?: number;
}

const DEFAULT_OPTIONS: Required<CacheOptions> = {
  ttl: 300, // 5 minutos
  persistent: true,
  autoRefresh: false,
  refreshInterval: 300,
};

// Cache em memória global (compartilhado entre instâncias)
const memoryCache = new Map<string, CacheEntry<unknown>>();

/**
 * Hook de cache para otimizar fetches de dados frequentes.
 * 
 * @example
 * const { data, loading, error, refresh } = useDataCache(
 *   'eventos-dashboard',
 *   () => fetch('/api/eventos').then(r => r.json()),
 *   { ttl: 120 } // 2 minutos
 * );
 */
export function useDataCache<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const fetcherRef = useRef(fetcher);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Manter referência atualizada do fetcher
  fetcherRef.current = fetcher;

  // Gerar key única para localStorage
  const storageKey = `sgb_cache_${cacheKey}`;

  // Verificar se cache é válido
  const isCacheValid = useCallback((entry: CacheEntry<T> | null): boolean => {
    if (!entry) return false;
    return Date.now() < entry.expiresAt;
  }, []);

  // Buscar do cache
  const getFromCache = useCallback((): CacheEntry<T> | null => {
    // Primeiro verificar memória (mais rápido)
    const memEntry = memoryCache.get(cacheKey) as CacheEntry<T> | undefined;
    if (memEntry && isCacheValid(memEntry)) {
      return memEntry;
    }

    // Se não encontrar na memória, verificar localStorage
    if (opts.persistent && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const entry = JSON.parse(stored) as CacheEntry<T>;
          if (isCacheValid(entry)) {
            // Atualizar cache de memória
            memoryCache.set(cacheKey, entry);
            return entry;
          } else {
            // Limpar cache expirado
            localStorage.removeItem(storageKey);
          }
        }
      } catch {
        localStorage.removeItem(storageKey);
      }
    }

    return null;
  }, [cacheKey, storageKey, opts.persistent, isCacheValid]);

  // Salvar no cache
  const saveToCache = useCallback((value: T) => {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: now,
      expiresAt: now + (opts.ttl * 1000),
    };

    // Salvar em memória
    memoryCache.set(cacheKey, entry);

    // Salvar em localStorage
    if (opts.persistent && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(entry));
      } catch (e) {
        // localStorage cheio ou desabilitado
        console.warn(`Cache: Erro ao salvar em localStorage para ${cacheKey}:`, e);
      }
    }

    setLastUpdated(new Date(now));
  }, [cacheKey, storageKey, opts.ttl, opts.persistent]);

  // Fetch de dados (forçado ou via cache)
  const fetchData = useCallback(async (force: boolean = false): Promise<T | null> => {
    // Se não forçar, verificar cache primeiro
    if (!force) {
      const cached = getFromCache();
      if (cached) {
        setData(cached.data);
        setLastUpdated(new Date(cached.timestamp));
        setLoading(false);
        return cached.data;
      }
    }

    // Fazer fetch
    setLoading(true);
    setError(null);

    try {
      const result = await fetcherRef.current();
      saveToCache(result);
      setData(result);
      return result;
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Erro ao buscar dados');
      setError(err);
      
      // Se falhar, retornar dados do cache mesmo expirado (fallback)
      const fallback = memoryCache.get(cacheKey) as CacheEntry<T> | undefined;
      if (fallback) {
        setData(fallback.data);
        return fallback.data;
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [getFromCache, saveToCache, cacheKey]);

  // Refresh forçado
  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // Limpar cache
  const clearCache = useCallback(() => {
    memoryCache.delete(cacheKey);
    if (opts.persistent && typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
    }
    setData(null);
    setLastUpdated(null);
  }, [cacheKey, storageKey, opts.persistent]);

  // Prefetch (para usar em hover, etc)
  const prefetch = useCallback(() => {
    const cached = getFromCache();
    if (!cached) {
      // Fetch silencioso em background
      fetcherRef.current()
        .then(result => saveToCache(result))
        .catch(() => {}); // Ignorar erros silenciosos
    }
  }, [getFromCache, saveToCache]);

  // Efeito inicial - buscar dados
  useEffect(() => {
    fetchData(false);
  }, [cacheKey]); // Re-fetch quando key muda

  // Auto refresh
  useEffect(() => {
    if (opts.autoRefresh && opts.refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchData(true);
      }, opts.refreshInterval * 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [opts.autoRefresh, opts.refreshInterval, fetchData]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh,
    clearCache,
    prefetch,
    /** Tempo restante do cache em segundos */
    timeToExpire: lastUpdated 
      ? Math.max(0, Math.floor((lastUpdated.getTime() + opts.ttl * 1000 - Date.now()) / 1000))
      : 0,
    /** Se os dados vieram do cache */
    isFromCache: !loading && data !== null && !error,
  };
}

/**
 * Hook especializado para cache de dashboards (TTL maior)
 */
export function useDashboardCache<T>(
  cacheKey: string,
  fetcher: () => Promise<T>
) {
  return useDataCache(cacheKey, fetcher, {
    ttl: 300, // 5 minutos
    persistent: true,
    autoRefresh: true,
    refreshInterval: 300,
  });
}

/**
 * Hook especializado para cache de relatórios (TTL menor, mais precisão)
 */
export function useReportCache<T>(
  cacheKey: string,
  fetcher: () => Promise<T>
) {
  return useDataCache(cacheKey, fetcher, {
    ttl: 60, // 1 minuto
    persistent: false,
    autoRefresh: false,
  });
}

/**
 * Hook especializado para cache de configurações (TTL muito maior)
 */
export function useConfigCache<T>(
  cacheKey: string,
  fetcher: () => Promise<T>
) {
  return useDataCache(cacheKey, fetcher, {
    ttl: 3600, // 1 hora
    persistent: true,
    autoRefresh: false,
  });
}

/**
 * Limpar todo o cache do SGB
 */
export function clearAllSGBCache() {
  // Limpar memória
  memoryCache.clear();
  
  // Limpar localStorage
  if (typeof window !== 'undefined') {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('sgb_cache_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
}

/**
 * Prefetch múltiplas keys de uma vez
 */
export function prefetchMultiple(
  entries: Array<{ key: string; fetcher: () => Promise<unknown> }>
) {
  entries.forEach(({ key, fetcher }) => {
    // Verificar se já existe no cache
    const existing = memoryCache.get(key);
    if (!existing || Date.now() >= existing.expiresAt) {
      // Fetch silencioso
      fetcher()
        .then(data => {
          const entry: CacheEntry<unknown> = {
            data,
            timestamp: Date.now(),
            expiresAt: Date.now() + 300000, // 5 minutos padrão
          };
          memoryCache.set(key, entry);
        })
        .catch(() => {});
    }
  });
}

