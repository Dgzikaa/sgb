import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Trigger Getin Sync - Iniciado em:', new Date().toISOString())
    
    // URL da Edge Function do Supabase
    const functionUrl = process.env.SUPABASE_FUNCTION_URL + '/getin-sync-continuous'
    
    if (!functionUrl || !process.env.SUPABASE_FUNCTION_URL) {
      throw new Error('SUPABASE_FUNCTION_URL não configurada')
    }

    console.log('📡 Chamando Edge Function:', functionUrl)
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Edge Function retornou erro ${response.status}: ${errorText}`)
    }

    const result = await response.json()
    
    console.log('✅ Sincronização Getin concluída:', result)

    return NextResponse.json({
      success: true,
      message: 'Sincronização Getin executada com sucesso',
      timestamp: new Date().toISOString(),
      stats: result.stats || null
    })

  } catch (error) {
    console.error('❌ Erro no trigger Getin sync:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Permitir POST também para flexibilidade
export async function POST(request: NextRequest) {
  return GET(request)
}
