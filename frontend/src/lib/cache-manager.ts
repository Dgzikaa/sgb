// Sistema de cache moderno e inteligente

import { CACHE } from '@/utils/constants';

// Tipos
export interface CacheItem<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

export interface CacheConfig {
  defaultTTL?: number;
  maxSize?: number;
  enablePersistent?: boolean;
  namespace?: string;
}

export type CacheKey = string | (string | number)[];

// Classe principal do cache
export class CacheManager {
  private cache = new Map<string, CacheItem>();
  private config: Required<CacheConfig>;
  private namespace: string;

  constructor(config: CacheConfig = {}) {
    this.config = {
      defaultTTL: CACHE.DEFAULT_TTL,
      maxSize: 1000,
      enablePersistent: false,
      namespace: 'sgb-cache',
      ...config,
    };
    
    this.namespace = this.config.namespace;
    this.loadFromStorage();
  }

  // Gerar chave de cache
  private generateKey(key: CacheKey): string {
    if (Array.isArray(key)) {
      return `${this.namespace}:${key.join(':')}`;
    }
    return `${this.namespace}:${key}`;
  }

  // Verificar se item expirou
  private isExpired(item: CacheItem): boolean {
    return Date.now() > item.timestamp + item.ttl;
  }

  // Limpar itens expirados
  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.timestamp + item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Salvar no storage persistente
  private saveToStorage(): void {
    if (!this.config.enablePersistent || typeof window === 'undefined') return;

    try {
      const data = Array.from(this.cache.entries());
      localStorage.setItem(`${this.namespace}-data`, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }

  // Carregar do storage persistente
  private loadFromStorage(): void {
    if (!this.config.enablePersistent || typeof window === 'undefined') return;

    try {
      const data = localStorage.getItem(`${this.namespace}-data`);
      if (data) {
        const parsed = JSON.parse(data) as [string, CacheItem][];
        for (const [key, item] of parsed) {
          if (!this.isExpired(item)) {
            this.cache.set(key, item);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  // Definir item no cache
  set<T>(key: CacheKey, data: T, ttl?: number): void {
    this.cleanup();

    const cacheKey = this.generateKey(key);
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.config.defaultTTL,
      key: cacheKey,
    };

    // Verificar limite de tamanho
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(cacheKey, item);
    this.saveToStorage();
  }

  // Obter item do cache
  get<T>(key: CacheKey): T | null {
    this.cleanup();

    const cacheKey = this.generateKey(key);
    const item = this.cache.get(cacheKey) as CacheItem<T> | undefined;

    if (!item || this.isExpired(item)) {
      this.cache.delete(cacheKey);
      return null;
    }

    return item.data;
  }

  // Verificar se item existe
  has(key: CacheKey): boolean {
    return this.get(key) !== null;
  }

  // Remover item do cache
  delete(key: CacheKey): boolean {
    const cacheKey = this.generateKey(key);
    const deleted = this.cache.delete(cacheKey);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  // Limpar todo o cache
  clear(): void {
    this.cache.clear();
    if (this.config.enablePersistent && typeof window !== 'undefined') {
      localStorage.removeItem(`${this.namespace}-data`);
    }
  }

  // Obter estatísticas do cache
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    keys: string[];
  } {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: 0, // Implementar se necessário
      keys: Array.from(this.cache.keys()),
    };
  }

  // Invalidar cache por padrão
  invalidate(pattern: string): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        count++;
      }
    }
    if (count > 0) {
      this.saveToStorage();
    }
    return count;
  }
}

// Instância global do cache
export const globalCache = new CacheManager({
  defaultTTL: CACHE.DEFAULT_TTL,
  maxSize: 500,
  enablePersistent: true,
  namespace: 'sgb-global',
});

// Cache específico para API
export const apiCache = new CacheManager({
  defaultTTL: CACHE.SHORT_TTL,
  maxSize: 200,
  enablePersistent: false,
  namespace: 'sgb-api',
});

// Cache para dados de usuário
export const userCache = new CacheManager({
  defaultTTL: CACHE.LONG_TTL,
  maxSize: 50,
  enablePersistent: true,
  namespace: 'sgb-user',
});

// Hook para usar cache em componentes
export const useCache = () => {
  const get = <T>(key: CacheKey): T | null => {
    return globalCache.get<T>(key);
  };

  const set = <T>(key: CacheKey, data: T, ttl?: number): void => {
    globalCache.set(key, data, ttl);
  };

  const has = (key: CacheKey): boolean => {
    return globalCache.has(key);
  };

  const delete = (key: CacheKey): boolean => {
    return globalCache.delete(key);
  };

  const invalidate = (pattern: string): number => {
    return globalCache.invalidate(pattern);
  };

  return {
    get,
    set,
    has,
    delete,
    invalidate,
  };
};

// Função para cache de promises
export const cachePromise = <T>(
  key: CacheKey,
  promise: Promise<T>,
  ttl?: number,
): Promise<T> => {
  const cacheKey = `promise:${Array.isArray(key) ? key.join(':') : key}`;
  
  // Verificar se já existe no cache
  const cached = globalCache.get<T>(cacheKey);
  if (cached) {
    return Promise.resolve(cached);
  }

  // Executar promise e cachear resultado
  return promise.then(result => {
    globalCache.set(cacheKey, result, ttl);
    return result;
  });
};

// Função para cache com fallback
export const cacheWithFallback = async <T>(
  key: CacheKey,
  fetcher: () => Promise<T>,
  ttl?: number,
): Promise<T> => {
  // Tentar obter do cache primeiro
  const cached = globalCache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Se não estiver no cache, buscar e cachear
  try {
    const data = await fetcher();
    globalCache.set(key, data, ttl);
    return data;
  } catch (error) {
    // Em caso de erro, retornar dados em cache mesmo que expirados
    const expired = globalCache.get<T>(key);
    if (expired !== null) {
      return expired;
    }
    throw error;
  }
}; 