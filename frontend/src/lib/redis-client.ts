import Redis, { Cluster } from 'ioredis';

// Configuração do Redis
const REDIS_CONFIG = {
  // Configuração para desenvolvimento local
  development: {
    host: 'localhost',
    port: 6379,
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    lazyConnect: true,
    keyPrefix: 'sgb_v2:',
    connectTimeout: 10000,
    commandTimeout: 5000,
  },
  
  // Configuração para produção com clustering
  production: {
    enableAutoPipelining: true,
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    lazyConnect: true,
    keyPrefix: 'sgb_v2:',
    connectTimeout: 10000,
    commandTimeout: 5000,
    // Configuração para Redis Cluster (se usando)
    enableReadyCheck: true,
    enableOfflineQueue: false,
  }
};

// Cliente Redis singleton
class RedisClient {
  private static instance: RedisClient;
  private client: Redis | Cluster;
  private cluster?: Cluster;
  private isConnected = false;
  private useCluster = false;

  private constructor() {
    const env = process.env.NODE_ENV || 'development';
    const config = REDIS_CONFIG[env as keyof typeof REDIS_CONFIG] || REDIS_CONFIG.development;

    // Verificar se deve usar cluster
    this.useCluster = process.env.REDIS_CLUSTER_ENABLED === 'true';
    
    if (this.useCluster && process.env.REDIS_CLUSTER_NODES) {
      // Configurar Redis Cluster
      const clusterNodes = process.env.REDIS_CLUSTER_NODES.split(',').map((node: any) => {
        const [host, port] = node.split(':');
        return { host, port: parseInt(port) };
      });

      this.cluster = new Cluster(clusterNodes, {
        redisOptions: config,
        enableOfflineQueue: false,
      });

      this.client = this.cluster;
    } else {
      // Configurar Redis standalone
      const redisUrl = process.env.REDIS_URL;
      
      if (redisUrl) {
        this.client = new Redis(redisUrl, config);
      } else {
        this.client = new Redis(config);
      }
    }

    this.setupEventListeners();
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  private setupEventListeners() {
    this.client.on('connect', () => {
      console.log('✅ Redis conectado');
      this.isConnected = true;
    });

    this.client.on('error', (error) => {
      console.error('❌ Redis erro:', error);
      this.isConnected = false;
    });

    this.client.on('close', () => {
      console.log('🔌 Redis desconectado');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      console.log('🔄 Redis reconectando...');
    });

    if (this.useCluster && this.cluster) {
      this.cluster.on('node error', (error, node) => {
        console.error(`❌ Redis cluster node erro (${node.options.host}:${node.options.port}):`, error);
      });
    }
  }

  public async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      await this.client.connect();
      console.log('✅ Redis client conectado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao conectar Redis:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) return;

    try {
      await this.client.disconnect();
      console.log('✅ Redis client desconectado');
    } catch (error) {
      console.error('❌ Erro ao desconectar Redis:', error);
    }
  }

  public getClient(): Redis | Cluster {
    return this.client;
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('❌ Redis health check falhou:', error);
      return false;
    }
  }

  // Métodos específicos para rate limiting
  public async rateLimit(key: string, limit: number, windowMs: number): Promise<{
    success: boolean;
    count: number;
    remainingTime: number;
    resetTime: number;
  }> {
    const pipeline = this.client.pipeline();
    const now = Date.now();
    const window = Math.floor(now / windowMs);
    const rateLimitKey = `rate_limit:${key}:${window}`;

    try {
      // Usar pipeline para operações atômicas
      pipeline.incr(rateLimitKey);
      pipeline.expire(rateLimitKey, Math.ceil(windowMs / 1000));
      
      const results = await pipeline.exec();
      
      if (!results || results.length === 0) {
        throw new Error('Redis pipeline falhou');
      }

      const [incrResult, expireResult] = results;
      
      if (incrResult[0] || expireResult[0]) {
        throw new Error('Erro nas operações Redis');
      }

      const count = incrResult[1] as number;
      const resetTime = (window + 1) * windowMs;
      const remainingTime = resetTime - now;

      return {
        success: count <= limit,
        count,
        remainingTime,
        resetTime
      };
    } catch (error) {
      console.error('❌ Erro no rate limiting:', error);
      // Fallback: permitir em caso de erro Redis
      return {
        success: true,
        count: 1,
        remainingTime: windowMs,
        resetTime: now + windowMs
      };
    }
  }

  // Métodos para cache geral
  public async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    try {
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      console.error('❌ Erro ao definir cache:', error);
      return false;
    }
  }

  public async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      console.error('❌ Erro ao obter cache:', error);
      return null;
    }
  }

  public async del(key: string): Promise<boolean> {
    try {
      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      console.error('❌ Erro ao deletar cache:', error);
      return false;
    }
  }

  public async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('❌ Erro ao verificar existência:', error);
      return false;
    }
  }

  // Método para limpeza de chaves expiradas
  public async cleanup(): Promise<void> {
    try {
      const keys = await this.client.keys('rate_limit:*');
      if (keys.length > 0) {
        const pipeline = this.client.pipeline();
        keys.forEach(key => pipeline.del(key));
        await pipeline.exec();
        console.log(`🧹 Limpeza Redis: ${keys.length} chaves removidas`);
      }
    } catch (error) {
      console.error('❌ Erro na limpeza Redis:', error);
    }
  }
}

// Export singleton instance
export const redisClient = RedisClient.getInstance();

// Helper functions
export async function initializeRedis(): Promise<void> {
  await redisClient.connect();
}

export async function cleanupRedis(): Promise<void> {
  await redisClient.disconnect();
}

export async function isRedisHealthy(): Promise<boolean> {
  return redisClient.healthCheck();
} 
