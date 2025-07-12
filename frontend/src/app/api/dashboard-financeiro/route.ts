import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function createSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barId = searchParams.get('barId')
    
    if (!barId) {
      return NextResponse.json({ error: 'Bar ID é obrigatório' }, { status: 400 })
    }

    const supabase = createSupabaseClient()

    console.log(`💰 BUSCANDO DADOS FINANCEIROS PARA BAR ${barId}`)

    // 1. RESUMO GERAL
    const { data: resumoReceitas, error: errorResumoReceitas } = await supabase
      .from('contaazul_receitas')
      .select('valor')
      .eq('bar_id', parseInt(barId))

    const { data: resumoDespesas, error: errorResumoDespesas } = await supabase
      .from('contaazul_despesas')
      .select('valor')
      .eq('bar_id', parseInt(barId))

    // 2. RECEITAS POR CATEGORIA
    const { data: receitasPorCategoria, error: errorReceitasCat } = await supabase
      .from('contaazul_receitas')
      .select(`
        valor,
        contaazul_categorias!inner(nome, tipo)
      `)
      .eq('bar_id', parseInt(barId))
      .not('categoria_id', 'is', null)

    // 3. DESPESAS POR CATEGORIA
    const { data: despesasPorCategoria, error: errorDespesasCat } = await supabase
      .from('contaazul_despesas')
      .select(`
        valor,
        contaazul_categorias!inner(nome, tipo)
      `)
      .eq('bar_id', parseInt(barId))
      .not('categoria_id', 'is', null)

    // 4. TRANSAÇÕES RECENTES
    const { data: receitasRecentes } = await supabase
      .from('contaazul_receitas')
      .select(`
        receita_id,
        descricao,
        valor,
        data_vencimento,
        status,
        contaazul_categorias!inner(nome)
      `)
      .eq('bar_id', parseInt(barId))
      .not('categoria_id', 'is', null)
      .order('data_vencimento', { ascending: false })
      .limit(10)

    const { data: despesasRecentes } = await supabase
      .from('contaazul_despesas')
      .select(`
        despesa_id,
        descricao,
        valor,
        data_vencimento,
        status,
        contaazul_categorias!inner(nome)
      `)
      .eq('bar_id', parseInt(barId))
      .not('categoria_id', 'is', null)
      .order('data_vencimento', { ascending: false })
      .limit(10)

    // 5. CALCULAR TOTAIS
    const totalReceitas = resumoReceitas?.reduce((sum, r) => sum + (parseFloat(r.valor) || 0), 0) || 0
    const totalDespesas = resumoDespesas?.reduce((sum, d) => sum + (parseFloat(d.valor) || 0), 0) || 0
    const saldoLiquido = totalReceitas - totalDespesas

    // 6. AGRUPAR RECEITAS POR CATEGORIA
    const receitasAgrupadas = receitasPorCategoria?.reduce((acc: any, receita: any) => {
      const categoriaNome = receita.contaazul_categorias.nome
      const valor = parseFloat(receita.valor) || 0
      
      if (!acc[categoriaNome]) {
        acc[categoriaNome] = {
          categoria: categoriaNome,
          total: 0,
          tipo: receita.contaazul_categorias.tipo
        }
      }
      acc[categoriaNome].total += valor
      return acc
    }, {}) || {}

    // 7. AGRUPAR DESPESAS POR CATEGORIA
    const despesasAgrupadas = despesasPorCategoria?.reduce((acc: any, despesa: any) => {
      const categoriaNome = despesa.contaazul_categorias.nome
      const valor = parseFloat(despesa.valor) || 0
      
      if (!acc[categoriaNome]) {
        acc[categoriaNome] = {
          categoria: categoriaNome,
          total: 0,
          tipo: despesa.contaazul_categorias.tipo
        }
      }
      acc[categoriaNome].total += valor
      return acc
    }, {}) || {}

    // 8. TRANSFORMAR EM ARRAYS E ORDENAR
    const topReceitas = Object.values(receitasAgrupadas)
      .sort((a: any, b: any) => b.total - a.total)
      .slice(0, 10)

    const topDespesas = Object.values(despesasAgrupadas)
      .sort((a: any, b: any) => b.total - a.total)
      .slice(0, 10)

    // 9. TRANSAÇÕES RECENTES COMBINADAS
    const transacoesRecentes = [
      ...(receitasRecentes?.map((r: any) => ({
        id: r.receita_id,
        tipo: 'receita',
        descricao: r.descricao,
        valor: parseFloat(r.valor) || 0,
        data: r.data_vencimento,
        status: r.status,
        categoria: r.contaazul_categorias.nome
      })) || []),
      ...(despesasRecentes?.map((d: any) => ({
        id: d.despesa_id,
        tipo: 'despesa',
        descricao: d.descricao,
        valor: parseFloat(d.valor) || 0,
        data: d.data_vencimento,
        status: d.status,
        categoria: d.contaazul_categorias.nome
      })) || [])
    ].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).slice(0, 20)

    const resultado = {
      timestamp: new Date().toISOString(),
      barId: parseInt(barId),
      resumo: {
        total_receitas: totalReceitas,
        total_despesas: totalDespesas,
        saldo_liquido: saldoLiquido,
        total_transacoes: (resumoReceitas?.length || 0) + (resumoDespesas?.length || 0)
      },
      receitas_por_categoria: topReceitas,
      despesas_por_categoria: topDespesas,
      transacoes_recentes: transacoesRecentes,
      estatisticas: {
        categorias_com_receitas: Object.keys(receitasAgrupadas).length,
        categorias_com_despesas: Object.keys(despesasAgrupadas).length,
        receitas_categorizadas: receitasPorCategoria?.length || 0,
        despesas_categorizadas: despesasPorCategoria?.length || 0
      }
    }

    console.log(`💰 Dados financeiros carregados:`)
    console.log(`   📈 Receitas: R$ ${totalReceitas.toFixed(2)}`)
    console.log(`   📉 Despesas: R$ ${totalDespesas.toFixed(2)}`)
    console.log(`   💰 Saldo: R$ ${saldoLiquido.toFixed(2)}`)

    return NextResponse.json(resultado)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ Erro ao buscar dados financeiros:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar dados financeiros: ' + errorMessage },
      { status: 500 }
    )
  }
} 