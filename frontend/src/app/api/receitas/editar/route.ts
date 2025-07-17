import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function PUT(request: NextRequest) {
  try {
    const { 
      receita_codigo,
      receita_nome,
      receita_categoria,
      tipo_local,
      rendimento_esperado,
      insumos,
      ativo,
      bar_id
    } = await request.json()

    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 })
    }

    // Valida·ß·µes b·°sicas
    if (!receita_codigo?.trim() || !receita_nome?.trim()) {
      return NextResponse.json({ 
        success: false, 
        error: 'C·≥digo e nome da receita s·£o obrigat·≥rios' 
      }, { status: 400 })
    }

    if (!insumos || insumos.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Pelo menos um insumo ·© obrigat·≥rio' 
      }, { status: 400 })
    }

    const temChefe = insumos.some((i: any) => i.is_chefe)
    if (!temChefe) {
      return NextResponse.json({ 
        success: false, 
        error: 'Um insumo chefe deve ser selecionado' 
      }, { status: 400 })
    }

    // Remover todas as receitas antigas com o mesmo c·≥digo
    const { error: deleteError } = await supabase
      .from('receitas')
      .delete()
      .eq('receita_codigo', receita_codigo)
      .eq('bar_id', bar_id)

    if (deleteError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao remover receitas antigas: ' + deleteError.message 
      }, { status: 500 })
    }

    // Inserir novas receitas com os insumos atualizados
    const insumoChefe = insumos.find((i: any) => i.is_chefe)
    console.log('üîÑ Insumo chefe encontrado:', insumoChefe)
    console.log('üîÑ Dados recebidos:', { receita_codigo, tipo_local: any, bar_id, insumos })
    
    const receitasData = insumos.map((insumo: any) => ({
      bar_id: bar_id,
      receita_codigo: receita_codigo.trim(),
      receita_nome: receita_nome.trim(),
      receita_categoria: receita_categoria?.trim() || '',
      tipo_local: tipo_local || 'cozinha',
      insumo_id: insumo.id,
      quantidade_necessaria: insumo.quantidade_necessaria || 0,
      insumo_chefe_id: insumoChefe?.id,
      rendimento_esperado: insumo.is_chefe ? rendimento_esperado : 0,
      ativo: ativo !== undefined ? ativo : true,
      updated_at: new Date().toISOString()
    }))
    
    console.log('üì¶ Dados que ser·£o inseridos:', receitasData)

    const { data: novasReceitas, error: receitasError } = await supabase
      .from('receitas')
      .insert(receitasData)
      .select()

    if (receitasError) {
      console.error('ùå Erro ao inserir receitas:', receitasError)
      console.error('ùå Dados que causaram erro:', receitasData)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao atualizar receitas: ' + receitasError.message,
        details: receitasError
      }, { status: 500 })
    }

    console.log('úÖ Receita atualizada com sucesso:', receita_codigo)

    return NextResponse.json({
      success: true,
      message: 'Receita atualizada com sucesso',
      data: {
        receita_codigo,
        receita_nome,
        insumos_count: novasReceitas?.length || 0
      }
    })

  } catch (error) {
    console.error('ùå Erro interno:', error)
    console.error('ùå Stack trace:', error instanceof Error ? error.stack : 'Sem stack trace')
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor: ' + (error instanceof Error ? error.message : String(error)),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
} 
