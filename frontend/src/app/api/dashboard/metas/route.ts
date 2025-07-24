import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

// GET - Buscar metas de um bar do banco de dados
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bar_id = searchParams.get('bar_id')

    if (!bar_id) {
      return NextResponse.json(
        { success: false, error: 'bar_id é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Erro ao conectar com banco' },
        { status: 500 }
      )
    }

    // Buscar metas do bar no banco
    const { data: metasBar, error } = await supabase
      .from('metas_negocio')
      .select('*')
      .eq('bar_id', parseInt(bar_id))

    if (error) {
      console.error('❌ Erro ao buscar metas:', error)
      
      // Se não encontrou metas para o bar, retornar estrutura vazia
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          data: null,
          message: 'Nenhuma meta encontrada para este bar'
        })
      }

      return NextResponse.json(
        { success: false, error: 'Erro ao buscar metas do banco' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: metasBar,
      message: 'Metas carregadas com sucesso'
    })

  } catch (error) {
    console.error('Erro ao buscar metas:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Salvar/atualizar metas de um bar no banco de dados
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.bar_id) {
      return NextResponse.json(
        { success: false, error: 'bar_id é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Erro ao conectar com banco' },
        { status: 500 }
      )
    }

    // Tentar inserir ou atualizar metas
    const { data, error } = await supabase
      .from('metas_negocio')
      .upsert([{
        bar_id: body.bar_id,
        ...body
      }])
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao salvar metas:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao salvar metas no banco' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Metas salvas com sucesso'
    })

  } catch (error) {
    console.error('Erro ao salvar metas:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 
