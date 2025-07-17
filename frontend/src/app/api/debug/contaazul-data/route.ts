import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const barId = searchParams.get('bar_id') || '3'

    console.log(`üîç [DEBUG] Verificando dados na tabela contaazul para bar_id: ${barId}`)

    // 1. Verificar se a tabela existe e tem dados
    const { data: allData, error: allError, count: totalCount } = await supabase
      .from('contaazul')
      .select('*', { count: 'exact' })
      .limit(5)

    if (allError) {
      console.error('ùå [DEBUG] Erro ao acessar tabela contaazul:', allError)
      return NextResponse.json({
        success: false,
        error: 'Erro ao acessar tabela contaazul',
        details: allError
      })
    }

    // 2. Verificar dados espec·≠ficos para o bar_id
    const { data: barData, error: barError, count: barCount } = await supabase
      .from('contaazul')
      .select('*', { count: 'exact' })
      .eq('bar_id', barId)
      .limit(5)

    // 3. Verificar todos os bar_ids dispon·≠veis
    const { data: distinctBars, error: distinctError } = await supabase
      .from('contaazul')
      .select('bar_id')
      .limit(100)

    const barIds = distinctBars ? [...new Set(distinctBars.map((item) => item.bar_id))] : []

    // 4. Verificar ·∫ltimas sincroniza·ß·µes
    const { data: recentData, error: recentError } = await supabase
      .from('contaazul')
      .select('id, bar_id, descricao, valor, sincronizado_em')
      .order('sincronizado_em', { ascending: false })
      .limit(10)

    return NextResponse.json({
      success: true,
      debug_info: {
        tabela_total: {
          registros: totalCount,
          amostra: allData,
          erro: allError
        },
        bar_especifico: {
          bar_id: barId,
          registros: barCount,
          amostra: barData,
          erro: barError
        },
        bar_ids_encontrados: barIds,
        ultimas_sincronizacoes: recentData,
        tabela_exists: !allError,
        query_params: {
          bar_id_solicitado: barId,
          bar_id_tipo: typeof barId
        }
      }
    })

  } catch (error) {
    console.error('ùå [DEBUG] Erro geral:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    }, { status: 500 })
  }
} 
