import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { authenticateUser, authErrorResponse } from '@/middleware/auth'

export const dynamic = 'force-dynamic'

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
    
    // Buscar checklists pendentes
    const { data: checklistsPendentes, error: pendentesError } = await supabase
      .from('checklist_execucoes')
      .select('id, concluido_em, status')
      .eq('bar_id', bar_id)
      .in('status', ['pendente', 'em_execucao'])
      .is('concluido_em', null)

    if (pendentesError) {
      console.error('Erro ao buscar checklists pendentes:', pendentesError)
      return NextResponse.json({ 
        error: 'Erro ao buscar checklists pendentes',
        total_pendentes: 0 
      }, { status: 500 })
    }

    // Contar todos como pendentes por simplicidade
    const totalChecklistsPendentes = checklistsPendentes?.length || 0
    const atrasadosCount = 0 // Simplificar por agora

    // Buscar checklists agendados para hoje
    const hoje = new Date().toISOString().split('T')[0]
    const { data: agendadosHoje, error: agendadosError } = await supabase
      .from('checklist_schedules')
      .select('id')
      .eq('bar_id', bar_id)
      .eq('ativo', true)
      .gte('proxima_execucao', hoje)
      .lt('proxima_execucao', `${hoje}T23:59:59`)

    return NextResponse.json({
      success: true,
      total_pendentes: totalChecklistsPendentes,
      detalhes: {
        pendentes_normais: totalChecklistsPendentes,
        atrasados: atrasadosCount,
        agendados_hoje: agendadosHoje?.length || 0,
        total: totalChecklistsPendentes
      }
    })

  } catch (error) {
    console.error('Erro na API checklists/pendentes:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      total_pendentes: 0 
    }, { status: 500 })
  }
} 