import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const diaSemana = searchParams.get('dia_semana')
    const grupo = searchParams.get('grupo')
    const barId = parseInt(searchParams.get('bar_id') || '3')



    // Usar view materializada - SEM PAGINAÇÃO!
    let query = supabase
      .from('view_top_produtos')
      .select('*')
      .eq('bar_id', barId)
      .order('valor_total', { ascending: false })
      .limit(100) // Top 100 direto

    const { data: produtosMaterializados, error } = await query

    if (error) {
      console.error('❌ Erro na view materializada:', error)
      throw error
    }

    if (!produtosMaterializados || produtosMaterializados.length === 0) {
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



    // Função para calcular dia destaque
    const calcularDiaDestaque = (vendasPorDia: any[]) => {
      if (!vendasPorDia || vendasPorDia.length === 0) return 'Sem dados'
      
      const diasSemanaLabels = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
      
      // Encontrar o dia com mais vendas
      const diaComMaisVendas = vendasPorDia.reduce((max, dia) => 
        dia.vendas > max.vendas ? dia : max
      )
      
      return diasSemanaLabels[diaComMaisVendas.dia_semana] || 'Sem dados'
    }

    // Processar dados da view materializada
    let produtosFiltrados: any[] = []

    // Aplicar filtro de dia da semana se necessário
    if (diaSemana && diaSemana !== 'todos') {
      const diaSemanaNum = parseInt(diaSemana)
      if (!isNaN(diaSemanaNum)) {
        produtosFiltrados = produtosMaterializados.map(produto => {
          const vendasPorDia = produto.vendas_por_dia || []
          const vendaDia = vendasPorDia.find((v: any) => v.dia_semana === diaSemanaNum)
          
          if (!vendaDia) {
            return null // Produto não tem vendas neste dia
          }
          
          // Quando filtrado por dia, o dia destaque é sempre o dia filtrado
          const diasSemanaLabels = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
          const diaDestaqueFiltrado = diasSemanaLabels[diaSemanaNum] || 'Sem dados'
          
          return {
            produto: produto.produto,
            grupo: produto.grupo,
            quantidade: vendaDia.quantidade,
            valorTotal: vendaDia.valor,
            custoTotal: vendaDia.custo,
            visitas: vendaDia.vendas,
            ultimaVenda: produto.ultima_venda,
            primeiraVenda: produto.primeira_venda,
            diaDestaque: diaDestaqueFiltrado
          }
        }).filter(p => p !== null)
        .sort((a, b) => b.valorTotal - a.valorTotal)
        .slice(0, 100)
      }
    } else {
      // Usar dados agregados totais
      produtosFiltrados = produtosMaterializados.map(produto => ({
        produto: produto.produto,
        grupo: produto.grupo,
        quantidade: produto.quantidade_total,
        valorTotal: produto.valor_total,
        custoTotal: produto.custo_total,
        visitas: produto.total_vendas,
        ultimaVenda: produto.ultima_venda,
        primeiraVenda: produto.primeira_venda,
        diaDestaque: calcularDiaDestaque(produto.vendas_por_dia)
      }))
    }

    // Aplicar filtro de grupo se necessário
    if (grupo && grupo !== 'todos') {
      produtosFiltrados = produtosFiltrados.filter((produto: any) => 
        produto.grupo.toLowerCase().includes(grupo.toLowerCase())
      )
    }

    // Calcular estatísticas
    const totalProdutos = produtosFiltrados.length
    const totalVendas = produtosFiltrados.reduce((sum, p: any) => sum + p.valorTotal, 0)
    const totalQuantidade = produtosFiltrados.reduce((sum, p: any) => sum + p.quantidade, 0)
    const totalCusto = produtosFiltrados.reduce((sum, p: any) => sum + p.custoTotal, 0)
    const margemLucro = totalVendas > 0 ? ((totalVendas - totalCusto) / totalVendas) * 100 : 0



    return NextResponse.json({
      produtos: produtosFiltrados,
      estatisticas: {
        totalProdutos,
        totalVendas,
        totalQuantidade,
        totalCusto,
        margemLucro,
        totalRegistros: produtosMaterializados.length
      }
    })

  } catch (error) {
    console.error('❌ Erro na API de produtos FINAL:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
