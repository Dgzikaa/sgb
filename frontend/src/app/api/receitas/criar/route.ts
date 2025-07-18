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
import { getSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Ã°Å¸â€œÂ Criando nova receita:', body)

    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao conectar com banco' 
      }, { status: 500 })
    }

    // ValidaÃ¡Â§Ã¡Âµes bÃ¡Â¡sicas
    if (!body.receita_codigo?.trim() || !body.receita_nome?.trim()) {
      return NextResponse.json({ 
        success: false, 
        error: 'CÃ¡Â³digo e nome da receita sÃ¡Â£o obrigatÃ¡Â³rios' 
      }, { status: 400 })
    }

    if (!body.insumo_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Insumo Ã¡Â© obrigatÃ¡Â³rio' 
      }, { status: 400 })
    }

    // Inserir receita na nova estrutura
    const receitaData = {
      bar_id: body.bar_id,
      receita_codigo: body.receita_codigo.trim(),
      receita_nome: body.receita_nome.trim(),
      receita_categoria: body.receita_categoria?.trim() || '',
      insumo_id: body.insumo_id,
      quantidade_necessaria: body.quantidade_necessaria || 0,
      insumo_chefe_id: body.insumo_chefe_id,
      rendimento_esperado: body.rendimento_esperado || 0,
      ativo: body.ativo !== undefined ? body.ativo : true, // Por padrÃ¡Â£o, receitas ativas
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: receita, error: receitaError } = await supabase
      .from('receitas')
      .insert(receitaData)
      .select()
      .single()

    if (receitaError) {
      console.error('ÂÅ’ Erro ao inserir receita:', receitaError)
      return NextResponse.json({
        success: false,
        error: 'Erro ao criar receita: ' + receitaError.message
      }, { status: 500 })
    }

    console.log('Å“â€¦ Receita criada com sucesso:', receita.id)

    return NextResponse.json({
      success: true,
      message: 'Receita criada com sucesso!',
      data: receita
    })

  } catch (error) {
    console.error('ÂÅ’ Erro interno na criaÃ¡Â§Ã¡Â£o de receita:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor: ' + (error as Error).message
    }, { status: 500 })
  }
} 

