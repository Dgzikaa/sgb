import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const status = {
      redisConnected: false,
      totalKeys: 0,
      lastCheck: new Date().toISOString(),
      rateLimitingActive: false,
      environment: process.env.NODE_ENV || 'development',
      message: 'Rate limiting não configurado'
    }

    return NextResponse.json({
      success: true,
      status
    })

  } catch (error) {
    console.error('❌ Erro na API de status de rate limiting:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 
