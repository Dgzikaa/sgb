import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutos de timeout

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { start_date, end_date } = body

    if (!start_date || !end_date) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros start_date e end_date são obrigatórios' },
        { status: 400 }
      )
    }

    console.log(`🚀 Iniciando sync retroativo do Getin: ${start_date} a ${end_date}`)

    // Chamar a Edge Function com os parâmetros de data
    const functionUrl = 'https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/getin-sync-continuous'
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ start_date, end_date })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Edge Function retornou erro ${response.status}: ${errorText}`)
    }

    const result = await response.json()
    
    console.log('✅ Sincronização Getin retroativa concluída:', result)

    return NextResponse.json({
      success: true,
      message: 'Sincronização retroativa do Getin executada com sucesso',
      timestamp: new Date().toISOString(),
      periodo: { start_date, end_date },
      stats: result.stats || null
    })

  } catch (error) {
    console.error('❌ Erro no sync retroativo Getin:', error)
    
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

// GET para informações
export async function GET() {
  return NextResponse.json({
    info: 'API de sincronização retroativa do Getin',
    usage: {
      method: 'POST',
      body: {
        start_date: 'YYYY-MM-DD (obrigatório)',
        end_date: 'YYYY-MM-DD (obrigatório)'
      }
    },
    example: {
      start_date: '2024-01-01',
      end_date: '2025-12-31'
    }
  })
}

