import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const produto = searchParams.get('produto')
    const grupo = searchParams.get('grupo')
    const barId = parseInt(searchParams.get('bar_id') || '3')

    if (!produto) {
      return NextResponse.json(
        { error: 'Produto é obrigatório' },
        { status: 400 }
      )
    }

    console.log(`🔍 API Detalhes Produto: Buscando vendas de "${produto}" (grupo: ${grupo || 'todos'})`)

    // Buscar todas as vendas do produto específico
    let query = supabase
      .from('contahub_analitico')
      .select('prd_desc, grp_desc, trn_dtgerencial, qtd, valorfinal, custo, bar_id')
      .eq('prd_desc', produto)
      .eq('bar_id', barId)
      .order('trn_dtgerencial', { ascending: false })

    // Filtrar por grupo se especificado
    if (grupo && grupo !== 'todos') {
      query = query.eq('grp_desc', grupo)
    }

    const { data: vendasProduto, error } = await query

    if (error) {
      console.error('❌ Erro ao buscar vendas do produto:', error)
      throw error
    }

    if (!vendasProduto || vendasProduto.length === 0) {
      return NextResponse.json({
        produto: { nome: produto, grupo: grupo || 'Sem grupo' },
        vendas: [],
        estatisticas: {
          totalVendas: 0,
          quantidadeTotal: 0,
          valorTotal: 0,
          custoTotal: 0,
          margemLucro: 0
        },
        dia_destaque: 'Sem dados'
      })
    }

    console.log(`📊 Encontradas ${vendasProduto.length} vendas do produto "${produto}"`)

    // Filtrar vendas válidas (excluir terças-feiras após 15/04/2025)
    const ultimaTercaOperacional = new Date('2025-04-15T12:00:00Z')
    const vendasValidas = vendasProduto.filter(registro => {
      const data = new Date(registro.trn_dtgerencial + 'T12:00:00Z')
      const diaSemana = data.getUTCDay()
      
      // Excluir terças-feiras após 15/04/2025 (bar não abre mais às terças)
      if (diaSemana === 2 && data > ultimaTercaOperacional) {
        return false
      }
      
      return true
    })

    // Mapear vendas para o formato do frontend
    const vendas = vendasValidas.map(registro => {
      const quantidade = parseFloat(registro.qtd) || 0
      const valorFinal = parseFloat(registro.valorfinal) || 0
      const custo = parseFloat(registro.custo) || 0

      return {
        data: registro.trn_dtgerencial,
        quantidade,
        valorUnitario: quantidade > 0 ? valorFinal / quantidade : 0,
        valorTotal: valorFinal,
        custo,
        margem: valorFinal > 0 ? ((valorFinal - custo) / valorFinal) * 100 : 0
      }
    })

    // Calcular estatísticas
    const quantidadeTotal = vendas.reduce((sum, v) => sum + v.quantidade, 0)
    const valorTotal = vendas.reduce((sum, v) => sum + v.valorTotal, 0)
    const custoTotal = vendas.reduce((sum, v) => sum + v.custo, 0)
    const margemLucro = valorTotal > 0 ? ((valorTotal - custoTotal) / valorTotal) * 100 : 0

    // Calcular dia da semana mais frequente
    const diasSemanaCount = new Map<number, number>()
    const diasSemanaLabels = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

    vendasValidas.forEach(registro => {
      const data = new Date(registro.trn_dtgerencial + 'T12:00:00Z')
      const diaSemana = data.getUTCDay()
      diasSemanaCount.set(diaSemana, (diasSemanaCount.get(diaSemana) || 0) + 1)
    })

    let diaDestaque = 'Sem dados'
    if (diasSemanaCount.size > 0) {
      const diaComMaisVendas = Array.from(diasSemanaCount.entries())
        .sort((a, b) => b[1] - a[1])[0]
      diaDestaque = diasSemanaLabels[diaComMaisVendas[0]]
    }

    console.log(`✅ Produto "${produto}": ${vendas.length} vendas válidas, dia destaque: ${diaDestaque}`)

    return NextResponse.json({
      produto: {
        nome: produto,
        grupo: grupo || vendasValidas[0]?.grp_desc || 'Sem grupo'
      },
      vendas,
      estatisticas: {
        totalVendas: vendas.length,
        quantidadeTotal,
        valorTotal,
        custoTotal,
        margemLucro
      },
      dia_destaque: diaDestaque
    })

  } catch (error) {
    console.error('❌ Erro na API de detalhes do produto:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
