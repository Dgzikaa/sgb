import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📝 Criando nova receita:', body)

    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao conectar com banco' 
      }, { status: 500 })
    }

    // Validações básicas
    if (!body.receita_codigo?.trim() || !body.receita_nome?.trim()) {
      return NextResponse.json({ 
        success: false, 
        error: 'Código e nome da receita são obrigatórios' 
      }, { status: 400 })
    }

    if (!body.insumo_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Insumo é obrigatório' 
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
      ativo: body.ativo !== undefined ? body.ativo : true, // Por padrão, receitas ativas
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: receita, error: receitaError } = await supabase
      .from('receitas')
      .insert(receitaData)
      .select()
      .single()

    if (receitaError) {
      console.error('❌ Erro ao inserir receita:', receitaError)
      return NextResponse.json({
        success: false,
        error: 'Erro ao criar receita: ' + receitaError.message
      }, { status: 500 })
    }

    console.log('✅ Receita criada com sucesso:', receita.id)

    return NextResponse.json({
      success: true,
      message: 'Receita criada com sucesso!',
      data: receita
    })

  } catch (error) {
    console.error('❌ Erro interno na criação de receita:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor: ' + (error as Error).message
    }, { status: 500 })
  }
} 