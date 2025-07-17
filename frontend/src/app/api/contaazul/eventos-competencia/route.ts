import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function createSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Funá§á£o para buscar TODOS os dados com paginaá§á£o automá¡tica
async function buscarTodosRegistros(query: any, chunkSize = 1000) {
  let todosRegistros: any[] = []
  let offset = 0
  let hasMore = true

  while (hasMore) {
    const { data: chunk, error } = await query
      .range(offset, offset + chunkSize - 1)

    if (error) {
      console.error('Œ Erro na paginaá§á£o automá¡tica:', error)
      break
    }

    if (!chunk || chunk.length === 0) {
      hasMore = false
      break
    }

    todosRegistros = todosRegistros.concat(chunk)
    console.log(`ðŸ“¦ Chunk ${Math.floor(offset/chunkSize) + 1}: ${chunk.length} registros (total: ${todosRegistros.length})`)
    
    // Se retornou menos que o chunk size, chegamos ao fim
    if (chunk.length < chunkSize) {
      hasMore = false
    } else {
      offset += chunkSize
    }
  }

  return todosRegistros
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const barId = searchParams.get('bar_id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const tipo = searchParams.get('tipo') // 'receita', 'despesa' ou null para todos
    const dataInicial = searchParams.get('data_inicial')
    const dataFinal = searchParams.get('data_final')
    const mes = searchParams.get('mes')
    const ano = searchParams.get('ano')
    const categoriasFiltro = searchParams.get('categorias')
    
    // Novos pará¢metros para ordenaá§á£o
    const sortField = searchParams.get('sort_field') || 'data_competencia'
    const sortDirection = searchParams.get('sort_direction') || 'desc'
    
    console.log(`ðŸ” API Eventos: bar_id=${barId}, page=${page}, limit=${limit}, tipo=${tipo}, sort=${sortField}:${sortDirection}`)
    console.log(`ðŸ” Filtros: ${JSON.stringify({dataInicial, dataFinal, mes, ano, categoriasFiltro})}`)
    
    if (!barId) {
      return NextResponse.json({ error: 'Bar ID á© obrigatá³rio' }, { status: 400 })
    }

    const supabase = createSupabaseClient()

    // Calcular offset para paginaá§á£o
    const offset = (page - 1) * limit

    // Funá§á£o para criar query base com filtros
    const criarQueryComFiltros = (selectFields: string) => {
      let query = supabase
        .from('contaazul_eventos_financeiros')
        .select(selectFields)
        .eq('bar_id', parseInt(barId))
        .not('data_competencia', 'is', null)

      // Aplicar filtros
      if (tipo && (tipo === 'receita' || tipo === 'despesa')) {
        query = query.eq('tipo', tipo)
      }
      if (dataInicial) {
        query = query.gte('data_competencia', dataInicial)
      }
      if (dataFinal) {
        query = query.lte('data_competencia', dataFinal)
      }
      if (mes) {
        const startOfMonth = ano ? `${ano}-${mes.padStart(2, '0')}-01` : `2024-${mes.padStart(2, '0')}-01`
        const endOfMonth = ano ? `${ano}-${mes.padStart(2, '0')}-31` : `2024-${mes.padStart(2, '0')}-31`
        query = query.gte('data_competencia', startOfMonth).lte('data_competencia', endOfMonth)
      }
      if (ano && !mes) {
        query = query.gte('data_competencia', `${ano}-01-01`).lte('data_competencia', `${ano}-12-31`)
      }
      if (categoriasFiltro) {
        const categoriasArray = categoriasFiltro.split(',').filter(Boolean)
        if (categoriasArray.length > 0) {
          query = query.in('categoria_id', categoriasArray)
        }
      }

      return query
    }

    // ðŸš¨ BUSCAR TODOS OS DADOS PARA CáLCULO CORRETO DOS TOTAIS
    console.log('ðŸ”¢ Buscando TODOS os registros para calcular totais corretos (sem limite de 1000)...')
    
    const queryResumo = criarQueryComFiltros('tipo, valor')
    const resumoData = await buscarTodosRegistros(queryResumo)
    
    console.log(`ðŸ’° Total de registros encontrados para cá¡lculo: ${resumoData.length}`)

    // Calcular resumo com TODOS os dados
    let resumo = {
      total_receitas: 0,
      total_despesas: 0,
      saldo_liquido: 0,
      total_lancamentos: 0
    }

    if (resumoData && resumoData.length > 0) {
      console.log('ðŸ’° Calculando totais a partir de', resumoData.length, 'registros...')
      
      // Debug: contar tipos de registros
      const tiposCount = resumoData.reduce((acc: any, evento: any) => {
        acc[evento.tipo] = (acc[evento.tipo] || 0) + 1
        return acc
      }, {})
      console.log('ðŸ“Š Tipos de registros encontrados:', tiposCount)
      
      // Debug: primeiros 5 registros de cada tipo
      const receitas = resumoData.filter((e: any) => e.tipo === 'receita').slice(0, 5)
      const despesas = resumoData.filter((e: any) => e.tipo === 'despesa').slice(0, 5)
      console.log('ðŸ’š Primeiras 5 receitas:', receitas.map((r: any) => ({ tipo: r.tipo, valor: r.valor })))
      console.log('¤ï¸ Primeiras 5 despesas:', despesas.map((d: any) => ({ tipo: d.tipo, valor: d.valor })))
      
      resumo = resumoData.reduce((acc, evento) => {
        const valor = parseFloat(evento.valor || 0)
        
        if (evento.tipo === 'receita') {
          acc.total_receitas += valor
        } else if (evento.tipo === 'despesa') {
          acc.total_despesas += valor
        } else {
          console.warn(`š ï¸ Tipo ná£o reconhecido: ${evento.tipo}`)
        }
        acc.total_lancamentos++
        return acc
      }, resumo)
      
      resumo.saldo_liquido = resumo.total_receitas - resumo.total_despesas
      
      console.log('œ… Totais calculados corretamente:', {
        total_receitas: `R$ ${resumo.total_receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        total_despesas: `R$ ${resumo.total_despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
        saldo_liquido: `R$ ${resumo.saldo_liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        total_lancamentos: resumo.total_lancamentos
      })
      
      // Debug final: comparar com contagem manual
      const receitasManual = resumoData.filter((e: any) => e.tipo === 'receita').reduce((sum: number, e: any) => sum + parseFloat(e.valor || 0), 0)
      const despesasManual = resumoData.filter((e: any) => e.tipo === 'despesa').reduce((sum: number, e: any) => sum + parseFloat(e.valor || 0), 0)
      
      console.log('ðŸ” Verificaá§á£o manual:')
      console.log(`   Receitas: R$ ${receitasManual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
      console.log(`   Despesas: R$ ${despesasManual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
      console.log(`   Diferená§a receitas: ${Math.abs(resumo.total_receitas - receitasManual) < 0.01 ? 'œ… OK' : 'Œ ERRO'}`)
      console.log(`   Diferená§a despesas: ${Math.abs(resumo.total_despesas - despesasManual) < 0.01 ? 'œ… OK' : 'Œ ERRO'}`)
      
    } else {
      console.log('š ï¸ Nenhum dado encontrado para cá¡lculo dos totais')
    }

    // Buscar dados paginados com ordenaá§á£o correta na API
    let query = criarQueryComFiltros(`
      evento_id,
      tipo,
      descricao,
      valor,
      data_competencia,
      data_vencimento,
      data_pagamento,
      status,
      cliente_id,
      fornecedor_id,
      created_at,
      categoria_id
    `)

    // Aplicar ordenaá§á£o na API
    const ascending = sortDirection === 'asc'
    
    // Mapear campos de ordenaá§á£o
    const sortFieldMap: { [key: string]: string } = {
      'data_competencia': 'data_competencia',
      'descricao': 'descricao',
      'valor': 'valor',
      'categoria': 'categoria_id', // Será¡ ordenado pelo ID da categoria
      'tipo': 'tipo'
    }
    
    const dbSortField = sortFieldMap[sortField] || 'data_competencia'
    query = query.order(dbSortField, { ascending })
    
    // Se ordenaá§á£o á© por categoria, precisamos de ordenaá§á£o adicional
    if (sortField === 'categoria') {
      query = query.order('data_competencia', { ascending: false }) // Ordenaá§á£o secundá¡ria
    }

    // Buscar dados paginados
    const { data: eventos, error } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Œ Erro ao buscar eventos:', error)
      return NextResponse.json({ error: 'Erro ao buscar eventos financeiros' }, { status: 500 })
    }

    console.log(`ðŸ“Š Eventos paginados encontrados: ${eventos?.length || 0}`)

    // Buscar categorias separadamente
    const { data: categorias, error: categoriasError } = await supabase
      .from('contaazul_categorias')
      .select('id, nome')
      .eq('bar_id', parseInt(barId))

    if (categoriasError) {
      console.error('Œ Erro ao buscar categorias:', categoriasError)
      return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 })
    }

    console.log(`ðŸ“‹ Categorias encontradas: ${categorias?.length || 0}`)

    // Criar mapa de categorias para lookup rá¡pido
    const mapaCategorias = categorias?.reduce((acc: any, categoria) => {
      acc[categoria.id] = categoria.nome
      return acc
    }, {}) || {}

    // Formatar dados para compatibilidade com interface existente
    const lancamentos = eventos?.map((evento: any) => ({
      id: evento.evento_id,
      descricao: evento.descricao || 'Sem descriá§á£o',
      valor: parseFloat(evento.valor || 0),
      categoria: mapaCategorias[evento.categoria_id] || 'Sem categoria',
      data_competencia: evento.data_competencia,
      data_vencimento: evento.data_vencimento,
      data_pagamento: evento.data_pagamento,
      tipo: evento.tipo === 'receita' ? 'Receita' : 'Despesa',
      cliente_fornecedor: evento.cliente_id || evento.fornecedor_id || 'N/A',
      documento: 'N/A' // Ná£o temos documento na estrutura atual
    })) || []

    // Total de registros para paginaá§á£o (usar o total já¡ calculado)
    const totalRegistros = resumo.total_lancamentos

    console.log(`œ… Eventos carregados: ${lancamentos.length} de ${totalRegistros} total`)

    return NextResponse.json({
      success: true,
      lancamentos,
      resumo,
      total: totalRegistros,
      page,
      limit,
      totalPages: Math.ceil(totalRegistros / limit)
    })

  } catch (error) {
    console.error('Œ Erro na API de eventos financeiros:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 
