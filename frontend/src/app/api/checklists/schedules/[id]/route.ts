import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// =====================================================
// 🗑️ API PARA EXCLUIR AGENDAMENTO ESPECÍFICO
// =====================================================

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const scheduleId = params.id

    if (!scheduleId) {
      return NextResponse.json({ 
        error: 'ID do agendamento não fornecido' 
      }, { status: 400 })
    }

    // Verificar se o agendamento existe e pertence ao usuário
    const { data: existingSchedule, error: scheduleError } = await supabase
      .from('checklist_schedules')
      .select('id, titulo, user_id')
      .eq('id', scheduleId)
      .eq('user_id', user.id)
      .single()

    if (scheduleError || !existingSchedule) {
      return NextResponse.json({ 
        error: 'Agendamento não encontrado' 
      }, { status: 404 })
    }

    // Excluir agendamento
    const { error: deleteError } = await supabase
      .from('checklist_schedules')
      .delete()
      .eq('id', scheduleId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Erro ao excluir agendamento:', deleteError)
      return NextResponse.json({ 
        error: 'Erro ao excluir agendamento' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Agendamento "${existingSchedule.titulo}" excluído com sucesso`
    })

  } catch (error) {
    console.error('Erro ao excluir agendamento:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
} 