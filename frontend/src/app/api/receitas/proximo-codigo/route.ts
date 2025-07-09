import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barId = parseInt(searchParams.get('bar_id') || '3')
    
    console.log(`🔢 Gerando próximo código para bar_id: ${barId}`)

    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao conectar com banco' 
      }, { status: 500 })
    }

    // Buscar o último código de receita do bar
    const { data: ultimaReceita, error } = await supabase
      .from('receitas')
      .select('receita_codigo')
      .eq('bar_id', barId)
      .like('receita_codigo', 'pc%')
      .order('receita_codigo', { ascending: false })
      .limit(1)

    if (error) {
      console.error('❌ Erro ao buscar último código:', error)
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar último código: ' + error.message
      }, { status: 500 })
    }

    let proximoCodigo = 'pc0001'

    if (ultimaReceita && ultimaReceita.length > 0) {
      const ultimoCodigo = ultimaReceita[0].receita_codigo
      const numeroStr = ultimoCodigo.replace('pc', '').padStart(4, '0')
      const numero = parseInt(numeroStr) + 1
      proximoCodigo = `pc${numero.toString().padStart(4, '0')}`
    }

    console.log(`✅ Próximo código gerado: ${proximoCodigo}`)

    return NextResponse.json({
      success: true,
      codigo: proximoCodigo
    })

  } catch (error) {
    console.error('❌ Erro interno ao gerar código:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor: ' + (error as Error).message
    }, { status: 500 })
  }
} 