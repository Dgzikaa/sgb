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
    const barIdParam = searchParams.get('bar_id')
    
    if (!barIdParam) {
      return NextResponse.json(
        { error: 'bar_id é obrigatório' },
        { status: 400 }
      )
    }
    const barId = parseInt(barIdParam)

    console.log(`🏪 API Produtos: Filtrando por bar_id = ${barId}`)
    if (diaSemana) {
      console.log(`📅 API Produtos: Filtrando por dia da semana = ${diaSemana}`)
    }

    // Configurações de paginação e performance
    const pageSize = 1000
    const MAX_ITERATIONS = 50 // Reduzir para evitar loop infinito
    const MAX_PROCESSING_TIME = 20000 // 20 segundos
    const MAX_RECORDS = 50000 // Limite máximo de registros processados
    
    let page = 0
    let totalRegistros = 0
    let iterations = 0
    const startTime = Date.now()
    
    // Map para agregar produtos
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

    // Buscar dados com paginação
    while (iterations < MAX_ITERATIONS && totalRegistros < MAX_RECORDS) {
      const currentTime = Date.now()
      if (currentTime - startTime > MAX_PROCESSING_TIME) {
        console.log(`⏰ Timeout atingido após ${MAX_PROCESSING_TIME}ms`)
        break
      }

      if (totalRegistros >= MAX_RECORDS) {
        console.log(`📊 Limite de registros atingido: ${MAX_RECORDS}`)
        break
      }

      console.log(`📄 Página ${page + 1}: Buscando ${pageSize} registros (offset: ${page * pageSize})`)

      // Categorias que são compras/estoque, não vendas
      const categoriasExcluidas = ['Mercadorias- Compras', 'Insumos', 'Uso Interno']
      
      let query = supabase
        .from('contahub_analitico')
        .select('prd_desc, grp_desc, trn_dtgerencial, qtd, valorfinal, custo, bar_id')
        .not('prd_desc', 'is', null)
        .not('prd_desc', 'eq', '')
        .not('qtd', 'is', null)
        .not('valorfinal', 'is', null)
        .not('grp_desc', 'in', `(${categoriasExcluidas.map(c => `"${c}"`).join(',')})`)
        .order('id')
        .range(page * pageSize, (page + 1) * pageSize - 1)

      // Aplicar filtro de bar_id se fornecido
      if (barId && barId > 0) {
        query = query.eq('bar_id', barId)
      }

      // Aplicar filtro de dia da semana se fornecido
      if (diaSemana && diaSemana !== 'todos') {
        const diaSemanaNum = parseInt(diaSemana)
        if (!isNaN(diaSemanaNum)) {
          // Usar função SQL para extrair dia da semana
          query = query.filter('trn_dtgerencial', 'gte', '2025-01-01')
          // Nota: Vamos filtrar por dia da semana no processamento, pois o Supabase não tem função EXTRACT direta
        }
      }

      const { data, error } = await query

      if (error) {
        console.error('❌ Erro na consulta SQL:', error)
        throw error
      }

      if (!data || data.length === 0) {
        console.log(`✅ Página ${page + 1}: Nenhum registro encontrado, finalizando paginação`)
        break
      }

      console.log(`✅ Página ${page + 1}: ${data.length} registros retornados (total acumulado: ${totalRegistros + data.length})`)
      totalRegistros += data.length

      // Processar registros da página atual
      for (const registro of data) {
        // Filtrar por dia da semana se especificado
        if (diaSemana && diaSemana !== 'todos') {
          const diaSemanaNum = parseInt(diaSemana)
          if (!isNaN(diaSemanaNum)) {
            const data = new Date(registro.trn_dtgerencial + 'T12:00:00Z')
            const diaSemanaData = data.getUTCDay()
            
            if (diaSemanaData !== diaSemanaNum) {
              continue // Pular este registro
            }
          }
        }

        const produto = registro.prd_desc?.trim() || 'Produto não informado'
        const grupo = registro.grp_desc?.trim() || 'Sem grupo'
        const quantidade = parseFloat(registro.qtd) || 0
        const valorFinal = parseFloat(registro.valorfinal) || 0
        const custo = parseFloat(registro.custo) || 0
        const dataVenda = registro.trn_dtgerencial

        // Chave única para o produto (produto + grupo)
        const chave = `${produto}|${grupo}`

        if (produtosMap.has(chave)) {
          const produtoExistente = produtosMap.get(chave)!
          produtoExistente.quantidade += quantidade
          produtoExistente.valorTotal += valorFinal
          produtoExistente.custoTotal += custo
          produtoExistente.visitas += 1
          
          // Atualizar datas
          if (dataVenda > produtoExistente.ultimaVenda) {
            produtoExistente.ultimaVenda = dataVenda
          }
          if (dataVenda < produtoExistente.primeiraVenda) {
            produtoExistente.primeiraVenda = dataVenda
          }
        } else {
          produtosMap.set(chave, {
            produto,
            grupo,
            quantidade,
            valorTotal: valorFinal,
            custoTotal: custo,
            visitas: 1,
            ultimaVenda: dataVenda,
            primeiraVenda: dataVenda
          })
        }
      }

      page++
      iterations++

      // Se retornou menos que o pageSize, chegamos ao fim
      if (data.length < pageSize) {
        console.log(`✅ Página ${page}: Menos de ${pageSize} registros, finalizando paginação`)
        break
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

    console.log(`✅ API Produtos: ${produtosArray.length} no ranking • ${totalProdutos} únicos • ${totalRegistros} vendas`)

    return NextResponse.json({
      produtos: produtosArray,
      estatisticas: {
        totalProdutos,
        totalVendas,
        totalQuantidade,
        totalCusto,
        margemLucro,
        totalRegistros
      }
    })

  } catch (error) {
    console.error('❌ Erro na API de produtos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
