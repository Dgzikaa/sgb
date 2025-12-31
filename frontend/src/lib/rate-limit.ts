/**
 * Rate Limiter simples baseado em memória
 * Para produção, considerar usar Redis ou Vercel KV
 */

interface RateLimitConfig {
  interval: number; // em milissegundos
  limit: number; // número máximo de requests
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Cache em memória (para desenvolvimento/produção leve)
// Em produção pesada, usar Redis ou Vercel KV
const cache = new Map<string, RateLimitEntry>();

// Limpar entradas expiradas periodicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.resetAt < now) {
      cache.delete(key);
    }
  }
}, 60000); // Limpar a cada 1 minuto

export function rateLimit(config: RateLimitConfig) {
  return async (identifier: string): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
  }> => {
    const now = Date.now();
    const key = identifier;
    
    let entry = cache.get(key);
    
    // Se não existe ou expirou, criar nova entrada
    if (!entry || entry.resetAt < now) {
      entry = {
        count: 0,
        resetAt: now + config.interval,
      };
    }
    
    // Incrementar contador
    entry.count++;
    cache.set(key, entry);
    
    const remaining = Math.max(0, config.limit - entry.count);
    const success = entry.count <= config.limit;
    
    return {
      success,
      limit: config.limit,
      remaining,
      reset: entry.resetAt,
    };
  };
}

// Configurações pré-definidas
export const rateLimiters = {
  // APIs públicas: 100 requests por minuto
  public: rateLimit({ interval: 60 * 1000, limit: 100 }),
  
  // APIs de autenticação: 10 tentativas por minuto
  auth: rateLimit({ interval: 60 * 1000, limit: 10 }),
  
  // APIs pesadas (relatórios): 30 requests por minuto
  heavy: rateLimit({ interval: 60 * 1000, limit: 30 }),
  
  // APIs de sync: 5 requests por minuto
  sync: rateLimit({ interval: 60 * 1000, limit: 5 }),
};

/**
 * Helper para extrair IP do request
 */
export function getClientIP(request: Request): string {
  // Vercel e Cloudflare headers
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // Fallback para headers do Vercel
  const vercelIP = request.headers.get('x-vercel-forwarded-for');
  if (vercelIP) {
    return vercelIP.split(',')[0].trim();
  }
  
  return 'unknown';
}

/**
 * Middleware helper para aplicar rate limiting
 */
export async function applyRateLimit(
  request: Request,
  limiter: ReturnType<typeof rateLimit>,
  identifier?: string
): Promise<{ allowed: boolean; headers: Record<string, string> }> {
  const id = identifier || getClientIP(request);
  const result = await limiter(id);
  
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };
  
  if (!result.success) {
    headers['Retry-After'] = Math.ceil((result.reset - Date.now()) / 1000).toString();
  }
  
  return {
    allowed: result.success,
    headers,
  };
}
