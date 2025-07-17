import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 })
    }

    // Usar funÃ§Ã£o do banco para gerar prÃ³ximo cÃ³digo
    const { data, error } = await supabase.rpc('get_proximo_codigo_insumo')

    if (error) {
      console.error('âŒ Erro ao buscar prÃ³ximo cÃ³digo:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao gerar cÃ³digo' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      codigo: data
    })

  } catch (error) {
    console.error('âŒ Erro interno:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
} 
