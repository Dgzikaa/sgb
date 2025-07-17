import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barId = parseInt(searchParams.get('bar_id') || '3')
    
    console.log(`ðŸ”¢ Gerando prá³ximo cá³digo para bar_id: ${barId}`)

    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao conectar com banco' 
      }, { status: 500 })
    }

    // Buscar o áºltimo cá³digo de receita do bar
    const { data: ultimaReceita, error } = await supabase
      .from('receitas')
      .select('receita_codigo')
      .eq('bar_id', barId)
      .like('receita_codigo', 'pc%')
      .order('receita_codigo', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Œ Erro ao buscar áºltimo cá³digo:', error)
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar áºltimo cá³digo: ' + error.message
      }, { status: 500 })
    }

    let proximoCodigo = 'pc0001'

    if (ultimaReceita && ultimaReceita.length > 0) {
      const ultimoCodigo = ultimaReceita[0].receita_codigo
      const numeroStr = ultimoCodigo.replace('pc', '').padStart(4, '0')
      const numero = parseInt(numeroStr) + 1
      proximoCodigo = `pc${numero.toString().padStart(4, '0')}`
    }

    console.log(`œ… Prá³ximo cá³digo gerado: ${proximoCodigo}`)

    return NextResponse.json({
      success: true,
      codigo: proximoCodigo
    })

  } catch (error) {
    console.error('Œ Erro interno ao gerar cá³digo:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor: ' + (error as Error).message
    }, { status: 500 })
  }
} 
