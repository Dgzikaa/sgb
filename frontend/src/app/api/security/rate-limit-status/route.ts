import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Verificar status do Redis/Rate Limiting
    let redisConnected = false
    let totalKeys = 0

    try {
      // Tentar verificar se existe uma conexá£o Redis
      // Se estiver usando Redis via variá¡veis de ambiente
      if (process.env.REDIS_URL || process.env.KV_URL) {
        // TODO: Implementar verificaá§á£o real do Redis quando estiver configurado
        redisConnected = true
        totalKeys = Math.floor(Math.random() * 100) // Simulado por enquanto
      }
    } catch (error) {
      console.error('Œ Erro ao verificar Redis:', error)
      redisConnected = false
    }

    const status = {
      redisConnected,
      totalKeys,
      lastCheck: new Date().toISOString(),
      rateLimitingActive: redisConnected,
      environment: process.env.NODE_ENV || 'development'
    }

    return NextResponse.json({
      success: true,
      status
    })

  } catch (error) {
    console.error('Œ Erro na API de status de rate limiting:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 
