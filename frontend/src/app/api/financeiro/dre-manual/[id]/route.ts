import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'

// DELETE: Excluir lançamento manual
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      )
    }

    console.log(`🗑️ [DRE-MANUAL-DELETE] Excluindo lançamento ID: ${id}`)

    // Verificar se o lançamento existe
    const { data: existing, error: checkError } = await supabase
      .from('dre_manual')
      .select('id, descricao')
      .eq('id', id)
      .single()

    if (checkError || !existing) {
      console.error('❌ [DRE-MANUAL-DELETE] Lançamento não encontrado:', checkError)
      return NextResponse.json(
        { error: 'Lançamento não encontrado' },
        { status: 404 }
      )
    }

    // Excluir o lançamento
    const { error: deleteError } = await supabase
      .from('dre_manual')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('❌ [DRE-MANUAL-DELETE] Erro ao excluir:', deleteError)
      return NextResponse.json(
        { error: 'Erro ao excluir lançamento', details: deleteError.message },
        { status: 500 }
      )
    }

    console.log(`✅ [DRE-MANUAL-DELETE] Lançamento excluído: ${existing.descricao}`)

    return NextResponse.json({
      success: true,
      message: 'Lançamento excluído com sucesso'
    })

  } catch (error) {
    console.error('❌ [DRE-MANUAL-DELETE] Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT: Editar lançamento manual
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { data_competencia, descricao, valor, categoria, categoria_macro, observacoes } = body

    // Validações básicas
    if (!data_competencia || !descricao || valor === undefined || !categoria || !categoria_macro) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: data_competencia, descricao, valor, categoria, categoria_macro' },
        { status: 400 }
      )
    }

    console.log(`✏️ [DRE-MANUAL-EDIT] Editando lançamento ID: ${id}`)

    // Verificar se o lançamento existe
    const { data: existing, error: checkError } = await supabase
      .from('dre_manual')
      .select('id')
      .eq('id', id)
      .single()

    if (checkError || !existing) {
      console.error('❌ [DRE-MANUAL-EDIT] Lançamento não encontrado:', checkError)
      return NextResponse.json(
        { error: 'Lançamento não encontrado' },
        { status: 404 }
      )
    }

    // Atualizar o lançamento
    const { data, error: updateError } = await supabase
      .from('dre_manual')
      .update({
        data_competencia,
        descricao,
        valor: parseFloat(valor),
        categoria,
        categoria_macro,
        observacoes: observacoes || null,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ [DRE-MANUAL-EDIT] Erro ao atualizar:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar lançamento', details: updateError.message },
        { status: 500 }
      )
    }

    console.log(`✅ [DRE-MANUAL-EDIT] Lançamento atualizado: ${descricao}`)

    return NextResponse.json({
      success: true,
      lancamento: data,
      message: 'Lançamento atualizado com sucesso'
    })

  } catch (error) {
    console.error('❌ [DRE-MANUAL-EDIT] Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
