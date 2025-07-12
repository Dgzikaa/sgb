import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barId = searchParams.get('bar_id')
    
    if (!barId) {
      return NextResponse.json(
        { success: false, error: 'Bar ID é obrigatório' },
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

    // Buscar configurações existentes
    const { data: configs, error } = await supabase
      .from('webhook_configs')
      .select('*')
      .eq('bar_id', barId)
      .single()

    if (error) {
      console.error('❌ Erro ao buscar configurações:', error)
      // Se não encontrar, retornar configurações padrão
      return NextResponse.json({
        success: true,
        configuracoes: {
          sistema: '',
          contaazul: '',
          meta: '',
          checklists: '',
          contahub: '',
          vendas: '',
          reservas: ''
        }
      })
    }

    return NextResponse.json({
      success: true,
      configuracoes: configs.configuracoes || {}
    })

  } catch (error) {
    console.error('❌ Erro na API de configurações:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { bar_id, configuracoes } = await request.json()
    
    if (!bar_id || !configuracoes) {
      return NextResponse.json(
        { success: false, error: 'Bar ID e configurações são obrigatórios' },
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

    // Salvar configurações no banco
    const { data, error } = await supabase
      .from('webhook_configs')
      .upsert({
        bar_id,
        configuracoes
      }, {
        onConflict: 'bar_id'
      })

    if (error) {
      console.error('❌ Erro ao salvar configurações:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao salvar configurações' },
        { status: 500 }
      )
    }

    console.log('✅ Configurações de webhook salvas com sucesso:', { bar_id, configuracoes })
    return NextResponse.json({
      success: true,
      message: 'Configurações salvas com sucesso'
    })

  } catch (error) {
    console.error('❌ Erro na API de configurações:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 