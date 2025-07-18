import type {
  SupabaseResponse,
  SupabaseError,
  ApiResponse,
  User,
  UserInfo,
  Bar,
  Checklist,
  ChecklistItem,
  Event,
  Notification,
  DashboardData,
  AIAgentConfig,
  AgentStatus
} from '@/types/global'

﻿import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// =====================================================
// ÃÂ°ÃÂ¸Ã¢â¬ÅÃ¢â¬Â¦ API PARA GERENCIAR AGENDAMENTOS DE CHECKLISTS
// =====================================================

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verificar autenticaÃÂ¡ÃÂ§ÃÂ¡ÃÂ£o
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'NÃÂ¡ÃÂ£o autorizado' }, { status: 401 })
    }

    const scheduleData = await req.json()

    if (!scheduleData.checklistId || !scheduleData.frequencia || !scheduleData.horario) {
      return NextResponse.json({ 
        error: 'Dados obrigatÃÂ¡ÃÂ³rios nÃÂ¡ÃÂ£o fornecidos' 
      }, { status: 400 })
    }

    // Verificar se o checklist existe e pertence ao usuÃÂ¡ÃÂ¡rio
    const { data: checklist, error: checklistError } = await supabase
      .from('checklists')
      .select('id, titulo, user_id')
      .eq('id', scheduleData.checklistId)
      .eq('user_id', user.id)
      .single()

    if (checklistError || !checklist) {
      return NextResponse.json({ 
        error: 'Checklist nÃÂ¡ÃÂ£o encontrado' 
      }, { status: 404 })
    }

    // Preparar dados para inserÃÂ¡ÃÂ§ÃÂ¡ÃÂ£o
    const scheduleToInsert = {
      checklist_id: scheduleData.checklistId,
      titulo: scheduleData.titulo,
      frequencia: scheduleData.frequencia,
      horario: scheduleData.horario,
      dias_semana: scheduleData.diasSemana || null,
      dia_mes: scheduleData.diaMes || null,
      ativo: scheduleData.ativo ?? true,
      notificacoes: scheduleData.notificacoes ?? true,
      responsaveis: scheduleData.responsaveis || [],
      observacoes: scheduleData.observacoes || null,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Inserir agendamento
    const { data: insertedSchedule, error: insertError } = await supabase
      .from('checklist_schedules')
      .insert(scheduleToInsert)
      .select()
      .single()

    if (insertError) {
      console.error('Erro ao inserir agendamento:', insertError)
      return NextResponse.json({ 
        error: 'Erro ao criar agendamento' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Agendamento criado com sucesso',
      schedule: insertedSchedule
    })

  } catch (error) {
    console.error('Erro ao criar agendamento:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verificar autenticaÃÂ¡ÃÂ§ÃÂ¡ÃÂ£o
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'NÃÂ¡ÃÂ£o autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const checklistId = searchParams.get('checklistId')

    let query = supabase
      .from('checklist_schedules')
      .select(`
        *,
        checklist:checklists(id, titulo, categoria)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (checklistId) {
      query = query.eq('checklist_id', checklistId)
    }

    const { data: schedules, error: schedulesError } = await query

    if (schedulesError) {
      console.error('Erro ao buscar agendamentos:', schedulesError)
      return NextResponse.json({ 
        error: 'Erro ao buscar agendamentos' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      schedules: schedules || []
    })

  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verificar autenticaÃÂ¡ÃÂ§ÃÂ¡ÃÂ£o
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'NÃÂ¡ÃÂ£o autorizado' }, { status: 401 })
    }

    const scheduleData = await req.json()

    if (!scheduleData.id) {
      return NextResponse.json({ 
        error: 'ID do agendamento nÃÂ¡ÃÂ£o fornecido' 
      }, { status: 400 })
    }

    // Verificar se o agendamento existe e pertence ao usuÃÂ¡ÃÂ¡rio
    const { data: existingSchedule, error: scheduleError } = await supabase
      .from('checklist_schedules')
      .select('id, user_id')
      .eq('id', scheduleData.id)
      .eq('user_id', user.id)
      .single()

    if (scheduleError || !existingSchedule) {
      return NextResponse.json({ 
        error: 'Agendamento nÃÂ¡ÃÂ£o encontrado' 
      }, { status: 404 })
    }

    // Preparar dados para atualizaÃÂ¡ÃÂ§ÃÂ¡ÃÂ£o
    const scheduleToUpdate = {
      titulo: scheduleData.titulo,
      frequencia: scheduleData.frequencia,
      horario: scheduleData.horario,
      dias_semana: scheduleData.diasSemana || null,
      dia_mes: scheduleData.diaMes || null,
      ativo: scheduleData.ativo ?? true,
      notificacoes: scheduleData.notificacoes ?? true,
      responsaveis: scheduleData.responsaveis || [],
      observacoes: scheduleData.observacoes || null,
      updated_at: new Date().toISOString()
    }

    // Atualizar agendamento
    const { data: updatedSchedule, error: updateError } = await supabase
      .from('checklist_schedules')
      .update(scheduleToUpdate)
      .eq('id', scheduleData.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar agendamento:', updateError)
      return NextResponse.json({ 
        error: 'Erro ao atualizar agendamento' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Agendamento atualizado com sucesso',
      schedule: updatedSchedule
    })

  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
} 
