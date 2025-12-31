/**
 * Rate Limiting Middleware
 * Implementação simples de rate limiting usando Map em memória
 * Para produção em escala, usar Redis ou Vercel KV
 */

interface RateLimitConfig {
  interval: number // ms
  maxRequests: number
}

interface RateLimitEntry {
  count: number
  timestamp: number
}

// Store em memória (resetado em cada deploy/restart)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Limpar entries antigos a cada 5 minutos
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.timestamp > 60000) { // 1 minuto
      rateLimitStore.delete(key)
    }
  }
}, 300000) // 5 minutos

// Configurações padrão por tipo de rota
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  // Rotas públicas - mais restritivas
  public: { interval: 60000, maxRequests: 30 }, // 30 req/min
  
  // Rotas de autenticação - muito restritivas
  auth: { interval: 60000, maxRequests: 10 }, // 10 req/min
  login: { interval: 60000, maxRequests: 5 }, // 5 tentativas/min
  
  // Rotas autenticadas - mais permissivas
  authenticated: { interval: 60000, maxRequests: 100 }, // 100 req/min
  
  // Rotas de API interna
  api: { interval: 60000, maxRequests: 200 }, // 200 req/min
  
  // Rotas de webhook/cron - sem limite prático
  internal: { interval: 60000, maxRequests: 1000 }, // 1000 req/min
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  reset: number // timestamp quando o limite reseta
  limit: number
}

/**
 * Verifica se uma requisição está dentro do rate limit
 */
export function checkRateLimit(
  identifier: string, // IP ou userId
  configKey: keyof typeof RATE_LIMIT_CONFIGS = 'api'
): RateLimitResult {
  const config = RATE_LIMIT_CONFIGS[configKey]
  const key = `${configKey}:${identifier}`
  const now = Date.now()
  
  const entry = rateLimitStore.get(key)
  
  // Se não existe entrada ou expirou, criar nova
  if (!entry || now - entry.timestamp > config.interval) {
    rateLimitStore.set(key, { count: 1, timestamp: now })
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      reset: now + config.interval,
      limit: config.maxRequests
    }
  }
  
  // Incrementar contador
  entry.count++
  
  // Verificar se excedeu
  if (entry.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      reset: entry.timestamp + config.interval,
      limit: config.maxRequests
    }
  }
  
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    reset: entry.timestamp + config.interval,
    limit: config.maxRequests
  }
}

/**
 * Extrai o IP do cliente da requisição
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return headers.get('x-real-ip') || 'unknown'
}

/**
 * Determina o tipo de rate limit baseado no path
 */
export function getRateLimitType(pathname: string): keyof typeof RATE_LIMIT_CONFIGS {
  if (pathname.includes('/api/auth/login')) return 'login'
  if (pathname.includes('/api/auth')) return 'auth'
  if (pathname.includes('/api/cron')) return 'internal'
  if (pathname.includes('/api/health')) return 'public'
  if (pathname.includes('/api/')) return 'api'
  return 'public'
}

/**
 * Headers de rate limit para incluir na resposta
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
    'Retry-After': result.allowed ? '' : Math.ceil((result.reset - Date.now()) / 1000).toString()
  }
}
