import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const diaSemana = searchParams.get('dia_semana')
    const barId = parseInt(searchParams.get('bar_id') || '3')

    console.log(`🏪 API Produtos Otimizado: Filtrando por bar_id = ${barId}`)
    if (diaSemana) {
      console.log(`📅 API Produtos Otimizado: Filtrando por dia da semana = ${diaSemana}`)
    }

    // Usar a view otimizada em vez de processar 100k+ registros
    let query = supabase
      .from('view_produtos_agregados')
      .select('*')
      .eq('bar_id', barId)

    // Aplicar filtro de dia da semana se fornecido
    if (diaSemana && diaSemana !== 'todos') {
      const diaSemanaNum = parseInt(diaSemana)
      if (!isNaN(diaSemanaNum)) {
        query = query.eq('dia_semana', diaSemanaNum)
      }
    }

    const { data: produtosView, error } = await query

    if (error) {
      console.error('❌ Erro na consulta da view:', error)
      throw error
    }

    if (!produtosView || produtosView.length === 0) {
      return NextResponse.json({
        produtos: [],
        estatisticas: {
          totalProdutos: 0,
          totalVendas: 0,
          totalQuantidade: 0,
          totalCusto: 0,
          margemLucro: 0,
          totalRegistros: 0
        }
      })
    }

    console.log(`📊 View retornou ${produtosView.length} registros agregados`)

    // Agregar por produto (somar todos os dias da semana se não filtrado)
    const produtosMap = new Map<string, {
      produto: string
      grupo: string
      quantidade: number
      valorTotal: number
      custoTotal: number
      visitas: number
      ultimaVenda: string
      primeiraVenda: string
    }>()

    for (const registro of produtosView) {
      const chave = `${registro.produto}|${registro.grupo}`
      
      if (produtosMap.has(chave)) {
        const produtoExistente = produtosMap.get(chave)!
        produtoExistente.quantidade += parseFloat(registro.quantidade_total) || 0
        produtoExistente.valorTotal += parseFloat(registro.valor_total) || 0
        produtoExistente.custoTotal += parseFloat(registro.custo_total) || 0
        produtoExistente.visitas += parseInt(registro.total_vendas) || 0
        
        // Atualizar datas
        if (registro.ultima_venda > produtoExistente.ultimaVenda) {
          produtoExistente.ultimaVenda = registro.ultima_venda
        }
        if (registro.primeira_venda < produtoExistente.primeiraVenda) {
          produtoExistente.primeiraVenda = registro.primeira_venda
        }
      } else {
        produtosMap.set(chave, {
          produto: registro.produto,
          grupo: registro.grupo || 'Sem grupo',
          quantidade: parseFloat(registro.quantidade_total) || 0,
          valorTotal: parseFloat(registro.valor_total) || 0,
          custoTotal: parseFloat(registro.custo_total) || 0,
          visitas: parseInt(registro.total_vendas) || 0,
          ultimaVenda: registro.ultima_venda,
          primeiraVenda: registro.primeira_venda
        })
      }
    }

    // Converter Map para Array e ordenar por valor total
    const produtosArray = Array.from(produtosMap.values())
      .sort((a, b) => b.valorTotal - a.valorTotal)
      .slice(0, 100) // Top 100 produtos

    // Calcular estatísticas
    const totalProdutos = produtosMap.size
    const totalVendas = produtosArray.reduce((sum, p) => sum + p.valorTotal, 0)
    const totalQuantidade = produtosArray.reduce((sum, p) => sum + p.quantidade, 0)
    const totalCusto = produtosArray.reduce((sum, p) => sum + p.custoTotal, 0)
    const margemLucro = totalVendas > 0 ? ((totalVendas - totalCusto) / totalVendas) * 100 : 0

    console.log(`✅ API Produtos Otimizado: ${produtosArray.length} no ranking • ${totalProdutos} únicos • ${produtosView.length} registros da view`)

    return NextResponse.json({
      produtos: produtosArray,
      estatisticas: {
        totalProdutos,
        totalVendas,
        totalQuantidade,
        totalCusto,
        margemLucro,
        totalRegistros: produtosView.length
      }
    })

  } catch (error) {
    console.error('❌ Erro na API de produtos otimizada:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
