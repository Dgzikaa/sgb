import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function PUT(request: NextRequest) {
  try {
    const { 
      receita_id, 
      produto_codigo, 
      produto_nome, 
      tipo_local, 
      rendimento_esperado, 
      tempo_preparo_min, 
      instrucoes, 
      insumos 
    } = await request.json()

    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 })
    }

    // Atualizar produto
    const { data: produto, error: produtoError } = await supabase
      .from('produtos')
      .update({
        codigo: produto_codigo,
        nome: produto_nome,
        tipo_local: tipo_local,
        rendimento: rendimento_esperado
      })
      .eq('id', receita_id)
      .select()
      .single()

    if (produtoError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao atualizar produto: ' + produtoError.message 
      }, { status: 500 })
    }

    // Remover receitas antigas
    const { error: deleteError } = await supabase
      .from('receitas')
      .delete()
      .eq('produto_id', receita_id)

    if (deleteError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao remover receitas antigas: ' + deleteError.message 
      }, { status: 500 })
    }

    // Inserir novas receitas
    const insumoChefe = insumos.find((i: any) => i.is_chefe)
    const receitasData = insumos.map((insumo: any) => ({
      produto_id: receita_id,
      insumo_id: insumo.insumo_id,
      quantidade_necessaria: insumo.quantidade_necessaria,
      insumo_chefe_id: insumoChefe?.insumo_id
    }))

    const { error: receitasError } = await supabase
      .from('receitas')
      .insert(receitasData)

    if (receitasError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao inserir receitas: ' + receitasError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Receita atualizada com sucesso',
      data: produto
    })

  } catch (error) {
    console.error('❌ Erro interno:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor: ' + String(error) 
    }, { status: 500 })
  }
} 