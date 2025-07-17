import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// For·ßar modo din·¢mico para essa rota (necess·°rio para usar request.url)
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  console.log('üîç [DEBUG] Verificando anos dispon·≠veis...')
  
  try {
    const { searchParams } = new URL(request.url)
    const barId = parseInt(searchParams.get('barId') || '3')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Buscar receitas por ano
    const { data: receitas } = await supabase
      .from('contaazul_receitas')
      .select('data_competencia, data_vencimento, data_pagamento, valor')
      .eq('bar_id', barId)
      .eq('ativo', true)
      .limit(100)

    // Buscar despesas por ano
    const { data: despesas } = await supabase
      .from('contaazul_despesas')
      .select('data_competencia, data_vencimento, data_pagamento, valor')
      .eq('bar_id', barId)
      .eq('ativo', true)
      .limit(100)

    // Processar anos das receitas
    const anosReceitas = new Map()
    receitas?.forEach(item => {
      const data = item.data_competencia || item.data_vencimento || item.data_pagamento
      if (data) {
        const ano = new Date(data).getFullYear()
        if (!anosReceitas.has(ano)) {
          anosReceitas.set(ano, { count: 0, valor_total: 0 })
        }
        const dados = anosReceitas.get(ano)
        dados.count++
        dados.valor_total += parseFloat(item.valor) || 0
      }
    })

    // Processar anos das despesas
    const anosDespesas = new Map()
    despesas?.forEach(item => {
      const data = item.data_competencia || item.data_vencimento || item.data_pagamento
      if (data) {
        const ano = new Date(data).getFullYear()
        if (!anosDespesas.has(ano)) {
          anosDespesas.set(ano, { count: 0, valor_total: 0 })
        }
        const dados = anosDespesas.get(ano)
        dados.count++
        dados.valor_total += parseFloat(item.valor) || 0
      }
    })

    // Converter para objeto
    const anosReceitasObj = Object.fromEntries(
      Array.from(anosReceitas.entries()).sort((a, b) => b[0] - a[0])
    )
    const anosDespesasObj = Object.fromEntries(
      Array.from(anosDespesas.entries()).sort((a, b) => b[0] - a[0])
    )

    // Resumo geral
    const resumo = {
      totalReceitas: receitas?.length || 0,
      totalDespesas: despesas?.length || 0,
      anosComDados: Array.from(new Set([
        ...Array.from(anosReceitas.keys()),
        ...Array.from(anosDespesas.keys())
      ])).sort((a, b) => b - a),
      exemploReceitas: receitas?.slice(0, 3) || [],
      exemploDespesas: despesas?.slice(0, 3) || []
    }

    console.log('úÖ [DEBUG] An·°lise conclu·≠da:', resumo)

    return NextResponse.json({
      success: true,
      barId,
      resumo,
      anosReceitas: anosReceitasObj,
      anosDespesas: anosDespesasObj
    })

  } catch (error) {
    console.error('ùå [DEBUG] Erro:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    }, { status: 500 })
  }
} 
