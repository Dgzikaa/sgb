import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Logs apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 Trigger Getin Sync - Iniciado em:', new Date().toISOString())
    }
    
    // URL da Edge Function do Supabase (seguindo padrão do projeto)
    const functionUrl = 'https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/getin-sync-continuous'
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📡 Chamando Edge Function:', functionUrl)
    }
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Edge Function retornou erro ${response.status}: ${errorText}`)
    }

    const result = await response.json()
    
    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Sincronização Getin concluída:', result)
    }

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
