import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 })
    }

    // Teste simples
    const { data, error } = await supabase
      .from('insumos')
      .insert({
        codigo: 'i0001',
        nome: 'Teste Amaretto',
        categoria: 'bar',
        unidade_medida: 'ml',
        bar_id: 1,
        ativo: true
      })
      .select()

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Teste OK',
      data: data
    })

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: String(error) 
    }, { status: 500 })
  }
} 