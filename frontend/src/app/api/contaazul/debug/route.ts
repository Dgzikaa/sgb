import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ano = parseInt(searchParams.get('ano') || '2025')

    // Buscar amostra de dados para debug
    const { data: amostra, error } = await supabase
      .from('contaazul')
      .select('id, tipo, valor, data_competencia')
      .gte('data_competencia', `${ano}-01-01`)
      .lte('data_competencia', `${ano}-12-31`)
      .limit(20)

    if (error) {
      return NextResponse.json({ success: false, error: error.message })
    }

    // Contar tipos únicos
    const tiposUnicos = new Set((amostra || []).map(item => item.tipo))
    
    // Contar receitas vs despesas
    const receitas = (amostra || []).filter(item => item.tipo?.toLowerCase() === 'receita')
    const despesas = (amostra || []).filter(item => item.tipo?.toLowerCase() === 'despesa')
    const outros = (amostra || []).filter(item => 
      item.tipo?.toLowerCase() !== 'receita' && 
      item.tipo?.toLowerCase() !== 'despesa'
    )

    return NextResponse.json({
      success: true,
      ano,
      amostra_total: amostra?.length || 0,
      tipos_unicos: Array.from(tiposUnicos),
      contadores: {
        receitas: receitas.length,
        despesas: despesas.length,
        outros: outros.length
      },
      exemplos: {
        receitas: receitas.slice(0, 3),
        despesas: despesas.slice(0, 3),
        outros: outros.slice(0, 3)
      },
      amostra_completa: amostra
    })

  } catch (error: any) {
    return NextResponse.json({ 
      success: false,
      error: error.message
    }, { status: 500 })
  }
} 