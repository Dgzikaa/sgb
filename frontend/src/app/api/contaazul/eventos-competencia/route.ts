import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function createSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const barId = searchParams.get('bar_id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const tipo = searchParams.get('tipo') // 'receita', 'despesa' ou null para todos
    const dataInicial = searchParams.get('data_inicial')
    const dataFinal = searchParams.get('data_final')
    const mes = searchParams.get('mes')
    const ano = searchParams.get('ano')
    const categoriasFiltro = searchParams.get('categorias')
    
    console.log(`🔍 API Eventos: bar_id=${barId}, page=${page}, limit=${limit}, tipo=${tipo}, filtros=${JSON.stringify({dataInicial, dataFinal, mes, ano, categoriasFiltro})}`)
    
    if (!barId) {
      return NextResponse.json({ error: 'Bar ID é obrigatório' }, { status: 400 })
    }

    const supabase = createSupabaseClient()

    // Calcular offset para paginação
    const offset = (page - 1) * limit

    // Buscar eventos primeiro (com paginação)
    let query = supabase
      .from('contaazul_eventos_financeiros')
      .select(`
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
      .eq('bar_id', parseInt(barId))
      .not('data_competencia', 'is', null)
      .order('data_competencia', { ascending: false })

    // Filtrar por tipo se especificado
    if (tipo && (tipo === 'receita' || tipo === 'despesa')) {
      query = query.eq('tipo', tipo)
    }

    // Filtrar por data inicial
    if (dataInicial) {
      query = query.gte('data_competencia', dataInicial)
    }

    // Filtrar por data final
    if (dataFinal) {
      query = query.lte('data_competencia', dataFinal)
    }

    // Filtrar por mês
    if (mes) {
      const startOfMonth = ano ? `${ano}-${mes.padStart(2, '0')}-01` : `2024-${mes.padStart(2, '0')}-01`
      const endOfMonth = ano ? `${ano}-${mes.padStart(2, '0')}-31` : `2024-${mes.padStart(2, '0')}-31`
      query = query.gte('data_competencia', startOfMonth).lte('data_competencia', endOfMonth)
    }

    // Filtrar por ano
    if (ano && !mes) {
      query = query.gte('data_competencia', `${ano}-01-01`).lte('data_competencia', `${ano}-12-31`)
    }

    // Filtrar por categorias específicas
    if (categoriasFiltro) {
      const categoriasArray = categoriasFiltro.split(',').filter(Boolean)
      if (categoriasArray.length > 0) {
        query = query.in('categoria_id', categoriasArray)
      }
    }

    // Buscar dados com paginação
    const { data: eventos, error } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('❌ Erro ao buscar eventos:', error)
      return NextResponse.json({ error: 'Erro ao buscar eventos financeiros' }, { status: 500 })
    }

    console.log(`📊 Eventos paginados encontrados: ${eventos?.length || 0}`)

    // Buscar categorias separadamente
    const { data: categorias, error: categoriasError } = await supabase
      .from('contaazul_categorias')
      .select('id, nome')
      .eq('bar_id', parseInt(barId))

    if (categoriasError) {
      console.error('❌ Erro ao buscar categorias:', categoriasError)
      return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 })
    }

    console.log(`📋 Categorias encontradas: ${categorias?.length || 0}`)

    // Criar mapa de categorias para lookup rápido
    const mapaCategorias = categorias?.reduce((acc: any, categoria) => {
      acc[categoria.id] = categoria.nome
      return acc
    }, {}) || {}

    // 🚨 BUSCAR TODOS OS DADOS PARA TOTAIS CORRETOS - SEM LIMITAÇÃO DE PAGINAÇÃO
    console.log('🔢 Buscando TODOS os registros para calcular totais corretos...')
    
    let resumoQuery = supabase
      .from('contaazul_eventos_financeiros')
      .select('tipo, valor')
      .eq('bar_id', parseInt(barId))
      .not('data_competencia', 'is', null)

    // Aplicar os mesmos filtros que na consulta paginada
    if (tipo && (tipo === 'receita' || tipo === 'despesa')) {
      resumoQuery = resumoQuery.eq('tipo', tipo)
    }
    if (dataInicial) {
      resumoQuery = resumoQuery.gte('data_competencia', dataInicial)
    }
    if (dataFinal) {
      resumoQuery = resumoQuery.lte('data_competencia', dataFinal)
    }
    if (mes) {
      const startOfMonth = ano ? `${ano}-${mes.padStart(2, '0')}-01` : `2024-${mes.padStart(2, '0')}-01`
      const endOfMonth = ano ? `${ano}-${mes.padStart(2, '0')}-31` : `2024-${mes.padStart(2, '0')}-31`
      resumoQuery = resumoQuery.gte('data_competencia', startOfMonth).lte('data_competencia', endOfMonth)
    }
    if (ano && !mes) {
      resumoQuery = resumoQuery.gte('data_competencia', `${ano}-01-01`).lte('data_competencia', `${ano}-12-31`)
    }
    if (categoriasFiltro) {
      const categoriasArray = categoriasFiltro.split(',').filter(Boolean)
      if (categoriasArray.length > 0) {
        resumoQuery = resumoQuery.in('categoria_id', categoriasArray)
      }
    }

    // 🚨 CRÍTICO: Buscar TODOS os registros SEM .range() ou .limit()
    const { data: resumoData, error: resumoError } = await resumoQuery

    console.log(`💰 Total de registros para cálculo dos totais: ${resumoData?.length || 0}`)

    let resumo = {
      total_receitas: 0,
      total_despesas: 0,
      saldo_liquido: 0,
      total_lancamentos: 0
    }

    if (resumoData && !resumoError) {
      console.log('💰 Calculando totais a partir de', resumoData.length, 'registros...')
      
      resumo = resumoData.reduce((acc, evento) => {
        const valor = parseFloat(evento.valor || 0)
        if (evento.tipo === 'receita') {
          acc.total_receitas += valor
        } else if (evento.tipo === 'despesa') {
          acc.total_despesas += valor
        }
        acc.total_lancamentos++
        return acc
      }, resumo)
      
      resumo.saldo_liquido = resumo.total_receitas - resumo.total_despesas
      
      console.log('✅ Totais calculados corretamente:', {
        total_receitas: `R$ ${resumo.total_receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        total_despesas: `R$ ${resumo.total_despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
        saldo_liquido: `R$ ${resumo.saldo_liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        total_lancamentos: resumo.total_lancamentos
      })
    } else {
      console.error('❌ Erro ao calcular totais:', resumoError)
    }

    // Formatar dados para compatibilidade com interface existente
    const lancamentos = eventos?.map((evento: any) => ({
      id: evento.evento_id,
      descricao: evento.descricao || 'Sem descrição',
      valor: parseFloat(evento.valor || 0),
      categoria: mapaCategorias[evento.categoria_id] || 'Sem categoria',
      data_competencia: evento.data_competencia,
      data_vencimento: evento.data_vencimento,
      data_pagamento: evento.data_pagamento,
      tipo: evento.tipo === 'receita' ? 'Receita' : 'Despesa',
      cliente_fornecedor: evento.cliente_id || evento.fornecedor_id || 'N/A',
      documento: 'N/A' // Não temos documento na estrutura atual
    })) || []

    // Buscar total de registros para paginação - aplicar mesmos filtros
    let totalQuery = supabase
      .from('contaazul_eventos_financeiros')
      .select('evento_id', { count: 'exact', head: true })
      .eq('bar_id', parseInt(barId))
      .not('data_competencia', 'is', null)

    // Aplicar mesmo filtro de tipo se especificado
    if (tipo && (tipo === 'receita' || tipo === 'despesa')) {
      totalQuery = totalQuery.eq('tipo', tipo)
    }

    // Aplicar filtros de data no total
    if (dataInicial) {
      totalQuery = totalQuery.gte('data_competencia', dataInicial)
    }
    if (dataFinal) {
      totalQuery = totalQuery.lte('data_competencia', dataFinal)
    }
    if (mes) {
      const startOfMonth = ano ? `${ano}-${mes.padStart(2, '0')}-01` : `2024-${mes.padStart(2, '0')}-01`
      const endOfMonth = ano ? `${ano}-${mes.padStart(2, '0')}-31` : `2024-${mes.padStart(2, '0')}-31`
      totalQuery = totalQuery.gte('data_competencia', startOfMonth).lte('data_competencia', endOfMonth)
    }
    if (ano && !mes) {
      totalQuery = totalQuery.gte('data_competencia', `${ano}-01-01`).lte('data_competencia', `${ano}-12-31`)
    }
    if (categoriasFiltro) {
      const categoriasArray = categoriasFiltro.split(',').filter(Boolean)
      if (categoriasArray.length > 0) {
        totalQuery = totalQuery.in('categoria_id', categoriasArray)
      }
    }

    const { count: totalRegistros } = await totalQuery

    console.log(`✅ Eventos carregados: ${lancamentos.length} de ${totalRegistros || 0} total`)

    return NextResponse.json({
      success: true,
      lancamentos,
      resumo,
      total: totalRegistros || 0,
      page,
      limit,
      totalPages: Math.ceil((totalRegistros || 0) / limit)
    })

  } catch (error) {
    console.error('❌ Erro na API de eventos financeiros:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 