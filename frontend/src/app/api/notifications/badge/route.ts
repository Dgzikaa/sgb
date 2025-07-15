import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { authenticateUser, authErrorResponse } from '@/middleware/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return authErrorResponse('Usuário não autenticado')
    }

    const body = await request.json()
    const { bar_id, user_id } = body

    if (!bar_id || !user_id) {
      return NextResponse.json(
        { error: 'bar_id e user_id são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = await getAdminClient()
    
    // Buscar notificações pendentes
    const { data: notificacoesPendentes, error: notificacoesError } = await supabase
      .from('notificacoes')
      .select('id, tipo, status')
      .eq('bar_id', bar_id)
      .eq('lida', false)

    if (notificacoesError) {
      console.error('Erro ao buscar notificações:', notificacoesError)
      return NextResponse.json({ 
        success: true,
        notifications_count: 0 
      })
    }

    const totalNotificacoes = notificacoesPendentes?.length || 0

    return NextResponse.json({
      success: true,
      notifications_count: totalNotificacoes,
      detalhes: {
        total: totalNotificacoes
      }
    })

  } catch (error) {
    console.error('Erro na API notifications/badge:', error)
    return NextResponse.json({ 
      success: true,
      notifications_count: 0 
    })
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
} 