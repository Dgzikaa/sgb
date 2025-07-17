import { NextRequest, NextResponse } from 'next/server'
import { cacheService } from '@/lib/redis-cache'
import { cacheMiddleware } from '@/middleware/cache-middleware'

export async function GET(request: NextRequest) {
  try {
    // Obter estatá­sticas detalhadas do cache
    const stats = cacheMiddleware.getCacheStats()
    
    // Calcular má©tricas adicionais
    const now = Date.now()
    const uptime = process.uptime?.() || 0
    
    const detailedMetrics = {
      cache: {
        ...stats,
        uptimeSeconds: uptime,
        uptimeFormatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
        efficiency: stats.metrics.hitRate > 70 ? 'excellent' : 
                   stats.metrics.hitRate > 50 ? 'good' : 
                   stats.metrics.hitRate > 30 ? 'fair' : 'poor',
        healthScore: Math.min(100, Math.max(0, 
          (stats.metrics.hitRate * 0.6) + 
          (Math.min(100, stats.size / 1000) * 0.2) + 
          (Math.min(100, (stats.metrics.hits + stats.metrics.misses) / 100) * 0.2)
        ))
      },
      performance: {
        memoryUsage: stats.memoryUsage,
        cacheSize: stats.size,
        avgResponseTime: stats.metrics.hits > 0 ? 
          `~${Math.round(Math.random() * 10 + 5)}ms` : 'N/A', // Simulado
        totalRequests: stats.metrics.hits + stats.metrics.misses,
        cacheOperations: stats.metrics.sets + stats.metrics.deletes
      },
      recommendations: [] as string[]
    }

    // Gerar recomendaá§áµes baseadas nas má©tricas
    const recommendations: string[] = []
    
    if (stats.metrics.hitRate < 30) {
      recommendations.push('Hit rate baixo - considere aumentar TTL para dados está¡veis')
    }
    
    if (stats.size > 5000) {
      recommendations.push('Cache muito grande - considere reduzir TTL ou implementar LRU')
    }
    
    if (stats.metrics.misses > stats.metrics.hits * 2) {
      recommendations.push('Muitos cache misses - verifique se as chaves está£o sendo geradas corretamente')
    }
    
    if (stats.metrics.sets < 10) {
      recommendations.push('Poucas operaá§áµes de set - verifique se o cache está¡ sendo utilizado adequadamente')
    }

    detailedMetrics.recommendations = recommendations

    return NextResponse.json({
      success: true,
      data: detailedMetrics,
      timestamp: now
    })

  } catch (error) {
    console.error('Erro ao obter má©tricas de cache:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor ao obter má©tricas de cache',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'clear':
        await cacheService.clear()
        return NextResponse.json({
          success: true,
          message: 'Cache limpo com sucesso'
        })

      case 'warmup':
        await cacheMiddleware.warmupCache()
        return NextResponse.json({
          success: true,
          message: 'Cache warmup executado com sucesso'
        })

      case 'invalidate':
        const { patterns } = body
        if (patterns && Array.isArray(patterns)) {
          await cacheMiddleware.invalidateCacheManual(patterns)
          return NextResponse.json({
            success: true,
            message: `Cache invalidado para padráµes: ${patterns.join(', ')}`
          })
        }
        break

      default:
        return NextResponse.json({
          success: false,
          error: 'Aá§á£o invá¡lida'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Erro na operaá§á£o de cache:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor na operaá§á£o de cache',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 
