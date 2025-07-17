import { NextRequest, NextResponse } from 'next/server';
import { redisClient } from './redis-client';

// Configuração de rate limiting por endpoint
const RATE_LIMITS: Record<string, { requests: number; window: number }> = {
  '/api/auth/login': { requests: 5, window: 300000 }, // 5 tentativas em 5 min
  '/api/usuarios': { requests: 10, window: 60000 },   // 10 requests por minuto
  '/api/uploads': { requests: 3, window: 60000 },     // 3 uploads por minuto
  '/api/contaazul': { requests: 20, window: 3600000 }, // 20 por hora (API externa)
  '/api/meta': { requests: 30, window: 3600000 },     // 30 por hora (API externa)
  'default': { requests: 100, window: 60000 }         // 100 requests por minuto padrão
};

// Discord webhook para notificações de segurança
const SECURITY_DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1393646423748116602/3zUhIrSKFHmq0zNRLf5AzrkSZNzTj7oYk6f45Tpj2LZWChtmGTKKTHxhfaNZigyLXN4y';

// Função para notificar Discord sobre rate limiting
async function notifyDiscordRateLimit(ip: string, endpoint: string, userAgent: string, requestsInWindow: number) {
  try {
    const message = {
      embeds: [{
        title: '⚡ Rate Limit Violation',
        description: `Tentativas excessivas detectadas`,
        color: 0xff9900, // Laranja para warnings
        fields: [
          {
            name: 'IP Address',
            value: ip,
            inline: true
          },
          {
            name: 'Endpoint',
            value: endpoint,
            inline: true
          },
          {
            name: 'Requests',
            value: `${requestsInWindow}/${RATE_LIMITS[endpoint]?.requests || RATE_LIMITS.default.requests}`,
            inline: true
          },
          {
            name: 'User Agent',
            value: userAgent.substring(0, 100) + (userAgent.length > 100 ? '...' : ''),
            inline: false
          }
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: '🛡️ SGB - Security System'
        }
      }]
    };

    await fetch(SECURITY_DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
  } catch (error) {
    console.error('❌ Erro ao enviar notificação Discord:', error);
  }
}

export function createRateLimiter(endpoint: string) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    try {
      // Identificar cliente (IP + User Agent)
      const forwarded = request.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      const clientId = `${ip}-${userAgent.slice(0, 50)}`;
      
      // Pegar configuração do endpoint
      const config = RATE_LIMITS[endpoint] || RATE_LIMITS.default;
      const key = `${endpoint}:${clientId}`;
      
      // Verificar rate limit usando Redis
      const rateLimitResult = await redisClient.rateLimit(key, config.requests, config.window);
      
      if (!rateLimitResult.success) {
        // Rate limit excedido - notificar Discord
        await notifyDiscordRateLimit(ip, endpoint, userAgent, rateLimitResult.count);
        console.warn(`⚡ Rate limit excedido - IP: ${ip}, Endpoint: ${endpoint}`);
        
        return NextResponse.json(
          { 
            error: 'Muitas tentativas. Tente novamente em alguns minutos.',
            retryAfter: Math.ceil(rateLimitResult.remainingTime / 1000)
          },
          { 
            status: 429,
            headers: {
              'Retry-After': Math.ceil(rateLimitResult.remainingTime / 1000).toString(),
              'X-RateLimit-Limit': config.requests.toString(),
              'X-RateLimit-Remaining': Math.max(0, config.requests - rateLimitResult.count).toString(),
              'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString()
            }
          }
        );
      }
      
      // Permitir requisição
      return null;
      
    } catch (error) {
      console.error('❌ Erro no rate limiter:', error);
      return null; // Em caso de erro, permitir (fail-safe)
    }
  };
}

// Helper para verificar status do Redis
export async function getRateLimitStatus(): Promise<{
  redisConnected: boolean;
  totalKeys: number;
}> {
  try {
    const isHealthy = await redisClient.healthCheck();
    const keys = await redisClient.getClient().keys('sgb_v2:rate_limit:*');
    
    return {
      redisConnected: isHealthy,
      totalKeys: keys.length
    };
  } catch (error) {
    console.error('❌ Erro ao verificar status rate limit:', error);
    return {
      redisConnected: false,
      totalKeys: 0
    };
  }
}

// Limpeza manual do Redis (se necessário)
export async function cleanupRateLimitCache(): Promise<void> {
  try {
    await redisClient.cleanup();
    console.log('✅ Cache de rate limit limpo');
  } catch (error) {
    console.error('❌ Erro ao limpar cache:', error);
  }
} 

