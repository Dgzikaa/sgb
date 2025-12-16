import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser, authErrorResponse } from '@/middleware/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Autenticar usuário
    const user = await authenticateUser(request)
    if (!user) {
      return authErrorResponse('Usuário não autenticado')
    }

    // Buscar bar_id do body ou header
    let barId: number | null = null
    
    try {
      const body = await request.json()
      if (body.bar_id) barId = body.bar_id
    } catch {
      // Se não tem body, tenta pegar do header
    }

    if (!barId) {
      const barIdHeader = request.headers.get('x-user-data')
      if (barIdHeader) {
        try {
          const parsed = JSON.parse(barIdHeader)
          if (parsed?.bar_id) barId = parseInt(String(parsed.bar_id))
        } catch {
          // Ignora erro
        }
      }
    }

    console.log(`🔄 Iniciando sync de estatísticas para bar_id: ${barId || 'todos'}`)

    // Chamar Edge Function de sync
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: 'Configuração do Supabase não encontrada' },
        { status: 500 }
      )
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/sync-cliente-estatisticas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`
      },
      body: JSON.stringify(barId ? { bar_id: barId } : {})
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('❌ Erro no sync:', result)
      return NextResponse.json(
        { error: result.error || 'Erro ao sincronizar', details: result },
        { status: response.status }
      )
    }

    console.log(`✅ Sync completo:`, result)

    return NextResponse.json({
      success: true,
      message: 'Sincronização concluída',
      ...result
    })

  } catch (error) {
    console.error('Erro na API de sync:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

