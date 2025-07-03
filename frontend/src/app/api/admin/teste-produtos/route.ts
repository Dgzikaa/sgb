import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 })
    }

    // Contar produtos total
    const { count: totalProdutos } = await supabase
      .from('produtos')
      .select('*', { count: 'exact', head: true })

    // Buscar alguns produtos de exemplo
    const { data: exemplosProdutos } = await supabase
      .from('produtos')
      .select('id, codigo, nome, tipo, bar_id')
      .limit(10)

    // Contar receitas
    const { count: totalReceitas } = await supabase
      .from('receitas')
      .select('*', { count: 'exact', head: true })

    // Contar insumos  
    const { count: totalInsumos } = await supabase
      .from('insumos')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      success: true,
      estatisticas: {
        total_produtos: totalProdutos,
        total_receitas: totalReceitas,
        total_insumos: totalInsumos,
        exemplos_produtos: exemplosProdutos
      }
    })

  } catch (error) {
    console.error('❌ Erro:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno: ' + String(error) 
    }, { status: 500 })
  }
} 