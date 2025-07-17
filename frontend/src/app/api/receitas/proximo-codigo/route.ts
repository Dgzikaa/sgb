import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barId = parseInt(searchParams.get('bar_id') || '3')
    
    console.log(`Ã°Å¸â€Â¢ Gerando prÃ¡Â³ximo cÃ¡Â³digo para bar_id: ${barId}`)

    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao conectar com banco' 
      }, { status: 500 })
    }

    // Buscar o Ã¡Âºltimo cÃ¡Â³digo de receita do bar
    const { data: ultimaReceita, error } = await supabase
      .from('receitas')
      .select('receita_codigo')
      .eq('bar_id', barId)
      .like('receita_codigo', 'pc%')
      .order('receita_codigo', { ascending: false })
      .limit(1)

    if (error) {
      console.error('ÂÅ’ Erro ao buscar Ã¡Âºltimo cÃ¡Â³digo:', error)
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar Ã¡Âºltimo cÃ¡Â³digo: ' + error.message
      }, { status: 500 })
    }

    let proximoCodigo = 'pc0001'

    if (ultimaReceita && ultimaReceita.length > 0) {
      const ultimoCodigo = ultimaReceita[0].receita_codigo
      const numeroStr = ultimoCodigo.replace('pc', '').padStart(4, '0')
      const numero = parseInt(numeroStr) + 1
      proximoCodigo = `pc${numero.toString().padStart(4, '0')}`
    }

    console.log(`Å“â€¦ PrÃ¡Â³ximo cÃ¡Â³digo gerado: ${proximoCodigo}`)

    return NextResponse.json({
      success: true,
      codigo: proximoCodigo
    })

  } catch (error) {
    console.error('ÂÅ’ Erro interno ao gerar cÃ¡Â³digo:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor: ' + (error as Error).message
    }, { status: 500 })
  }
} 

