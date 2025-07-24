import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 })
    }

    // Usar função do banco para gerar próximo código
    const { data, error } = await supabase.rpc('get_proximo_codigo_insumo')

    if (error) {
      console.error('❌ Erro ao buscar próximo código:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao gerar código' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      codigo: data
    })

  } catch (error) {
    console.error('❌ Erro interno:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
} 
