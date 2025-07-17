import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('ðŸ“ Criando nova receita:', body)

    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao conectar com banco' 
      }, { status: 500 })
    }

    // Validaá§áµes bá¡sicas
    if (!body.receita_codigo?.trim() || !body.receita_nome?.trim()) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cá³digo e nome da receita sá£o obrigatá³rios' 
      }, { status: 400 })
    }

    if (!body.insumo_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Insumo á© obrigatá³rio' 
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
      ativo: body.ativo !== undefined ? body.ativo : true, // Por padrá£o, receitas ativas
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: receita, error: receitaError } = await supabase
      .from('receitas')
      .insert(receitaData)
      .select()
      .single()

    if (receitaError) {
      console.error('Œ Erro ao inserir receita:', receitaError)
      return NextResponse.json({
        success: false,
        error: 'Erro ao criar receita: ' + receitaError.message
      }, { status: 500 })
    }

    console.log('œ… Receita criada com sucesso:', receita.id)

    return NextResponse.json({
      success: true,
      message: 'Receita criada com sucesso!',
      data: receita
    })

  } catch (error) {
    console.error('Œ Erro interno na criaá§á£o de receita:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor: ' + (error as Error).message
    }, { status: 500 })
  }
} 
