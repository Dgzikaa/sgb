import type {
  SupabaseResponse,
  SupabaseError,
  ApiResponse,
  User,
  UserInfo,
  Bar,
  Checklist,
  ChecklistItem,
  Event,
  Notification,
  DashboardData,
  AIAgentConfig,
  AgentStatus
} from '@/types/global'

﻿import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function createSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// FunÃ¡Â§Ã¡Â£o para buscar TODOS os dados com paginaÃ¡Â§Ã¡Â£o automÃ¡Â¡tica
async function buscarTodosRegistros(query: unknown, chunkSize = 1000) {
  let todosRegistros: unknown[] = []
  let offset = 0
  let hasMore = true

  while (hasMore) {
    const { data: chunk, error } = await query
      .range(offset, offset + chunkSize - 1)

    if (error) {
      console.error('ÂÅ’ Erro na paginaÃ¡Â§Ã¡Â£o automÃ¡Â¡tica:', error)
      break
    }

    if (!chunk || chunk.length === 0) {
      hasMore = false
      break
    }

    todosRegistros = todosRegistros.concat(chunk)
    console.log(`Ã°Å¸â€œÂ¦ Chunk ${Math.floor(offset/chunkSize) + 1}: ${chunk.length} registros (total: ${todosRegistros.length})`)
    
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
    
    // Novos parÃ¡Â¢metros para ordenaÃ¡Â§Ã¡Â£o
    const sortField = searchParams.get('sort_field') || 'data_competencia'
    const sortDirection = searchParams.get('sort_direction') || 'desc'
    
    console.log(`Ã°Å¸â€Â API Eventos: bar_id=${barId}, page=${page}, limit=${limit}, tipo=${tipo}, sort=${sortField}:${sortDirection}`)
    console.log(`Ã°Å¸â€Â Filtros: ${JSON.stringify({dataInicial, dataFinal, mes, ano, categoriasFiltro})}`)
    
    if (!barId) {
      return NextResponse.json({ error: 'Bar ID Ã¡Â© obrigatÃ¡Â³rio' }, { status: 400 })
    }

    const supabase = createSupabaseClient()

    // Calcular offset para paginaÃ¡Â§Ã¡Â£o
    const offset = (page - 1) * limit

    // FunÃ¡Â§Ã¡Â£o para criar query base com filtros
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

    // Ã°Å¸Å¡Â¨ BUSCAR TODOS OS DADOS PARA CÃ¡ÂLCULO CORRETO DOS TOTAIS
    console.log('Ã°Å¸â€Â¢ Buscando TODOS os registros para calcular totais corretos (sem limite de 1000)...')
    
    const queryResumo = criarQueryComFiltros('tipo, valor')
    const resumoData = await buscarTodosRegistros(queryResumo)
    
    console.log(`Ã°Å¸â€™Â° Total de registros encontrados para cÃ¡Â¡lculo: ${resumoData.length}`)

    // Calcular resumo com TODOS os dados
    let resumo = {
      total_receitas: 0,
      total_despesas: 0,
      saldo_liquido: 0,
      total_lancamentos: 0
    }

    if (resumoData && resumoData.length > 0) {
      console.log('Ã°Å¸â€™Â° Calculando totais a partir de', resumoData.length, 'registros...')
      
      // Debug: contar tipos de registros
      const tiposCount = resumoData.reduce((acc: unknown, evento: unknown) => {
        acc[evento.tipo] = (acc[evento.tipo] || 0) + 1
        return acc
      }, {})
      console.log('Ã°Å¸â€œÅ  Tipos de registros encontrados:', tiposCount)
      
      // Debug: primeiros 5 registros de cada tipo
      const receitas = resumoData.filter((e: unknown) => e.tipo === 'receita').slice(0, 5)
      const despesas = resumoData.filter((e: unknown) => e.tipo === 'despesa').slice(0, 5)
      console.log('Ã°Å¸â€™Å¡ Primeiras 5 receitas:', receitas.map((r) => ({ tipo: r.tipo, valor: r.valor })))
      console.log('ÂÂ¤Ã¯Â¸Â Primeiras 5 despesas:', despesas.map((d) => ({ tipo: d.tipo, valor: d.valor })))
      
      resumo = resumoData.reduce((acc: unknown, evento: unknown) => {
        const valor = parseFloat(evento.valor || 0)
        
        if (evento.tipo === 'receita') {
          acc.total_receitas += valor
        } else if (evento.tipo === 'despesa') {
          acc.total_despesas += valor
        } else {
          console.warn(`Å¡Â Ã¯Â¸Â Tipo nÃ¡Â£o reconhecido: ${evento.tipo}`)
        }
        acc.total_lancamentos++
        return acc
      }, resumo)
      
      resumo.saldo_liquido = resumo.total_receitas - resumo.total_despesas
      
      console.log('Å“â€¦ Totais calculados corretamente:', {
        total_receitas: `R$ ${resumo.total_receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        total_despesas: `R$ ${resumo.total_despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
        saldo_liquido: `R$ ${resumo.saldo_liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        total_lancamentos: resumo.total_lancamentos
      })
      
      // Debug final: comparar com contagem manual
      const receitasManual = resumoData.filter((e: unknown) => e.tipo === 'receita').reduce((sum: number, e: unknown) => sum + parseFloat(e.valor || 0), 0)
      const despesasManual = resumoData.filter((e: unknown) => e.tipo === 'despesa').reduce((sum: number, e: unknown) => sum + parseFloat(e.valor || 0), 0)
      
      console.log('Ã°Å¸â€Â VerificaÃ¡Â§Ã¡Â£o manual:')
      console.log(`   Receitas: R$ ${receitasManual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
      console.log(`   Despesas: R$ ${despesasManual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
      console.log(`   DiferenÃ¡Â§a receitas: ${Math.abs(resumo.total_receitas - receitasManual) < 0.01 ? 'Å“â€¦ OK' : 'ÂÅ’ ERRO'}`)
      console.log(`   DiferenÃ¡Â§a despesas: ${Math.abs(resumo.total_despesas - despesasManual) < 0.01 ? 'Å“â€¦ OK' : 'ÂÅ’ ERRO'}`)
      
    } else {
      console.log('Å¡Â Ã¯Â¸Â Nenhum dado encontrado para cÃ¡Â¡lculo dos totais')
    }

    // Buscar dados paginados com ordenaÃ¡Â§Ã¡Â£o correta na API
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

    // Aplicar ordenaÃ¡Â§Ã¡Â£o na API
    const ascending = sortDirection === 'asc'
    
    // Mapear campos de ordenaÃ¡Â§Ã¡Â£o
    const sortFieldMap: { [key: string]: string } = {
      'data_competencia': 'data_competencia',
      'descricao': 'descricao',
      'valor': 'valor',
      'categoria': 'categoria_id', // SerÃ¡Â¡ ordenado pelo ID da categoria
      'tipo': 'tipo'
    }
    
    const dbSortField = sortFieldMap[sortField] || 'data_competencia'
    query = query.order(dbSortField, { ascending })
    
    // Se ordenaÃ¡Â§Ã¡Â£o Ã¡Â© por categoria, precisamos de ordenaÃ¡Â§Ã¡Â£o adicional
    if (sortField === 'categoria') {
      query = query.order('data_competencia', { ascending: false }) // OrdenaÃ¡Â§Ã¡Â£o secundÃ¡Â¡ria
    }

    // Buscar dados paginados
    const { data: eventos, error } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('ÂÅ’ Erro ao buscar eventos:', error)
      return NextResponse.json({ error: 'Erro ao buscar eventos financeiros' }, { status: 500 })
    }

    console.log(`Ã°Å¸â€œÅ  Eventos paginados encontrados: ${eventos?.length || 0}`)

    // Buscar categorias separadamente
    const { data: categorias, error: categoriasError } = await supabase
      .from('contaazul_categorias')
      .select('id, nome')
      .eq('bar_id', parseInt(barId))

    if (categoriasError) {
      console.error('ÂÅ’ Erro ao buscar categorias:', categoriasError)
      return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 })
    }

    console.log(`Ã°Å¸â€œâ€¹ Categorias encontradas: ${categorias?.length || 0}`)

    // Criar mapa de categorias para lookup rÃ¡Â¡pido
    const mapaCategorias = categorias?.reduce((acc: unknown, categoria: unknown) => {
      acc[categoria.id] = categoria.nome
      return acc
    }, {}) || {}

    // Formatar dados para compatibilidade com interface existente
    const lancamentos = eventos?.map((evento: unknown) => ({
      id: evento.evento_id,
      descricao: evento.descricao || 'Sem descriÃ¡Â§Ã¡Â£o',
      valor: parseFloat(evento.valor || 0),
      categoria: mapaCategorias[evento.categoria_id] || 'Sem categoria',
      data_competencia: evento.data_competencia,
      data_vencimento: evento.data_vencimento,
      data_pagamento: evento.data_pagamento,
      tipo: evento.tipo === 'receita' ? 'Receita' : 'Despesa',
      cliente_fornecedor: evento.cliente_id || evento.fornecedor_id || 'N/A',
      documento: 'N/A' // NÃ¡Â£o temos documento na estrutura atual
    })) || []

    // Total de registros para paginaÃ¡Â§Ã¡Â£o (usar o total jÃ¡Â¡ calculado)
    const totalRegistros = resumo.total_lancamentos

    console.log(`Å“â€¦ Eventos carregados: ${lancamentos.length} de ${totalRegistros} total`)

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
    console.error('ÂÅ’ Erro na API de eventos financeiros:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 

