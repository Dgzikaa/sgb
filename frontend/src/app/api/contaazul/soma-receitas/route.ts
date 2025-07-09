import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ano = parseInt(searchParams.get('ano') || new Date().getFullYear().toString())
    
    console.log(`🧮 Somando receitas do ano ${ano}...`)

    // Buscar todas as receitas do ano
    const { data: receitas, error } = await supabase
      .from('contaazul')
      .select('valor, tipo, data_competencia')
      .eq('tipo', 'receita')
      .gte('data_competencia', `${ano}-01-01`)
      .lte('data_competencia', `${ano}-12-31`)

    if (error) {
      console.error('❌ Erro ao buscar receitas:', error)
      return NextResponse.json({ 
        success: false,
        error: error.message
      }, { status: 500 })
    }

    const totalReceitas = (receitas || []).reduce((sum, item) => sum + (item.valor || 0), 0)
    const quantidadeRegistros = receitas?.length || 0

    console.log(`✅ Encontrado: ${quantidadeRegistros} receitas totalizando R$ ${totalReceitas}`)

    return NextResponse.json({
      success: true,
      ano,
      total_receitas: totalReceitas,
      quantidade_registros: quantidadeRegistros,
      receitas: receitas || []
    })

  } catch (error: any) {
    console.error('❌ Erro:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message
    }, { status: 500 })
  }
} 