import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Buscando lançamentos ContaAzul...')

    // Parâmetros da requisição
    const { searchParams } = new URL(request.url)
    const periodo = searchParams.get('periodo') || 'todo'
    const ano = parseInt(searchParams.get('ano') || new Date().getFullYear().toString())
    const mes = parseInt(searchParams.get('mes') || (new Date().getMonth() + 1).toString())
    const limite = parseInt(searchParams.get('limite') || '10')
    const pagina = parseInt(searchParams.get('pagina') || '1')
    const barId = parseInt(searchParams.get('bar_id') || '3')
    
    // Parâmetros de ordenação
    const ordenarPor = searchParams.get('ordenar_por') || 'data_competencia'
    const direcaoOrdenacao = searchParams.get('direcao') || 'desc'

    console.log(`🎯 Parâmetros: período=${periodo}, ano=${ano}, mes=${mes}, limite=${limite}, pagina=${pagina}, bar_id=${barId}`)
    console.log(`📊 Ordenação: campo=${ordenarPor}, direção=${direcaoOrdenacao}`)

    // Calcular filtros de data
    let dataInicio: string
    let dataFim: string

    if (periodo === 'todo') {
      dataInicio = '2020-01-01'
      dataFim = '2099-12-31'
    } else if (periodo === 'mes') {
      dataInicio = `${ano}-${mes.toString().padStart(2, '0')}-01`
      const ultimoDiaMes = new Date(ano, mes, 0).getDate()
      dataFim = `${ano}-${mes.toString().padStart(2, '0')}-${ultimoDiaMes.toString().padStart(2, '0')}`
    } else if (periodo === 'ano') {
      dataInicio = `${ano}-01-01`
      dataFim = `${ano}-12-31`
    } else {
      dataInicio = '2020-01-01'
      dataFim = '2099-12-31'
    }

    console.log(`📅 Período filtrado: ${dataInicio} até ${dataFim}`)

    // Teste 1: Verificar se conseguimos conectar no Supabase
    console.log('🔍 Teste 1: Verificando conexão com Supabase...')
    const { data: testData, error: testError } = await supabase
      .from('contaazul')
      .select('id')
      .eq('bar_id', barId)
      .limit(1)

    if (testError) {
      console.error('❌ Erro na conexão com Supabase:', testError)
      return NextResponse.json({ 
        success: false,
        error: 'Erro na conexão com o banco de dados',
        details: testError.message,
        lancamentos: [],
        resumo: { total_receitas: 0, total_despesas: 0, saldo_liquido: 0, total_lancamentos: 0 }
      }, { status: 500 })
    }

    console.log('✅ Teste 1: Conexão OK, dados encontrados:', testData?.length || 0)

    // Teste 2: Buscar dados básicos
    console.log('🔍 Teste 2: Buscando dados básicos...')
    const offset = (pagina - 1) * limite
    
    // Mapear campos para ordenação
    const camposMapeados: { [key: string]: string } = {
      'descricao': 'descricao',
      'valor': 'valor',
      'categoria': 'categoria',
      'data_competencia': 'data_competencia',
      'tipo': 'tipo',
      'cliente_fornecedor': 'cliente_fornecedor'
    }
    
    const campoOrdenacao = camposMapeados[ordenarPor] || 'data_competencia'
    const ascending = direcaoOrdenacao === 'asc'
    
    console.log(`📊 Aplicando ordenação: ${campoOrdenacao} (${ascending ? 'crescente' : 'decrescente'})`)
    
    const { data: lancamentos, error: queryError, count } = await supabase
      .from('contaazul')
      .select('*', { count: 'exact' })
      .eq('bar_id', barId)
      .gte('data_competencia', dataInicio)
      .lte('data_competencia', dataFim)
      .order(campoOrdenacao, { ascending })
      .range(offset, offset + limite - 1)

    if (queryError) {
      console.error('❌ Erro na consulta:', queryError)
      return NextResponse.json({ 
        success: false,
        error: 'Erro na consulta de dados',
        details: queryError.message,
        lancamentos: [],
        resumo: { total_receitas: 0, total_despesas: 0, saldo_liquido: 0, total_lancamentos: 0 }
      }, { status: 500 })
    }

    console.log('✅ Teste 2: Dados encontrados:', lancamentos?.length || 0)

    // Teste 3: Calcular totais usando agregação SQL direta
    console.log('🔍 Teste 3: Calculando totais com SQL agregado...')
    
    // Usar RPC ou consulta agregada para garantir que pegamos todos os dados
    const { data: totaisAgregados, error: errorAgregados } = await supabase
      .rpc('calcular_totais_contaazul', {
        p_bar_id: barId,
        p_data_inicio: dataInicio,
        p_data_fim: dataFim
      })

    let totalReceitas = 0
    let totalDespesas = 0

    if (errorAgregados) {
      console.log('⚠️ RPC não disponível, usando paginação múltipla...')
      
      // Função para buscar todos os dados com paginação
      const buscarTodosDados = async (tipo: string) => {
        let todosDados: any[] = []
        let pagina = 0
        const limitePorPagina = 1000 // Limite do Supabase
        let temMaisDados = true
        
        while (temMaisDados) {
          const inicio = pagina * limitePorPagina
          const fim = inicio + limitePorPagina - 1
          
          console.log(`🔍 Buscando ${tipo} - página ${pagina + 1} (registros ${inicio}-${fim})`)
          
          const { data, error } = await supabase
            .from('contaazul')
            .select('valor')
            .eq('bar_id', barId)
            .eq('tipo', tipo)
            .gte('data_competencia', dataInicio)
            .lte('data_competencia', dataFim)
            .range(inicio, fim)
          
          if (error) {
            console.error(`❌ Erro ao buscar ${tipo} página ${pagina + 1}:`, error)
            break
          }
          
          if (data && data.length > 0) {
            todosDados = todosDados.concat(data)
            console.log(`✅ ${tipo} página ${pagina + 1}: ${data.length} registros`)
            
            // Se retornou menos que o limite, chegou ao fim
            if (data.length < limitePorPagina) {
              temMaisDados = false
            } else {
              pagina++
            }
          } else {
            temMaisDados = false
          }
        }
        
        return todosDados
      }
      
      // Buscar todas as receitas
      const receitasData = await buscarTodosDados('receita')
      totalReceitas = receitasData.reduce((sum, item) => sum + Math.abs(parseFloat(item.valor) || 0), 0)
      console.log(`💰 TOTAL Receitas: R$ ${totalReceitas} (${receitasData.length} registros)`)
      
      // Buscar todas as despesas
      const despesasData = await buscarTodosDados('despesa')
      totalDespesas = despesasData.reduce((sum, item) => sum + Math.abs(parseFloat(item.valor) || 0), 0)
      console.log(`💰 TOTAL Despesas: R$ ${totalDespesas} (${despesasData.length} registros)`)
    } else if (totaisAgregados && totaisAgregados.length > 0) {
      const resultado = totaisAgregados[0]
      totalReceitas = resultado.total_receitas || 0
      totalDespesas = resultado.total_despesas || 0
      console.log(`💰 Totais via RPC - Receitas: R$ ${totalReceitas}, Despesas: R$ ${totalDespesas}`)
    }

    const saldoLiquido = totalReceitas - totalDespesas

    console.log(`💰 Total receitas: R$ ${totalReceitas}`)
    console.log(`💰 Total despesas: R$ ${totalDespesas}`)
    console.log(`💰 Saldo líquido: R$ ${saldoLiquido}`)

    // Teste 4: Processar dados completos
    console.log('🔍 Teste 4: Processando dados...')
    const lancamentosProcessados = (lancamentos || []).map(item => ({
      id: item.id,
      descricao: item.descricao || 'Sem descrição',
      valor: parseFloat(item.valor) || 0,
      categoria: item.categoria || 'Não categorizado',
      centro_custo: item.centro_custo || 'N/A',
      data_competencia: item.data_competencia,
      tipo: item.tipo || (parseFloat(item.valor) > 0 ? 'receita' : 'despesa'),
      cliente_fornecedor: item.cliente_fornecedor || 'N/A',
      documento: item.documento || 'N/A',
      condicao_pagamento: item.forma_pagamento || 'N/A',
      data_vencimento: item.data_vencimento,
      data_pagamento: item.data_vencimento, // Usando data_vencimento como fallback
      observacoes: item.observacoes || 'N/A',
      created_at: item.sincronizado_em
    }))

    console.log('✅ Teste 4: Dados processados:', lancamentosProcessados.length)

    // Teste 5: Buscar última sincronização
    console.log('🔍 Teste 5: Buscando última sincronização...')
    const { data: ultimaSinc } = await supabase
      .from('contaazul')
      .select('sincronizado_em')
      .eq('bar_id', barId)
      .order('sincronizado_em', { ascending: false })
      .limit(1)

    console.log('✅ Teste 5: Última sincronização:', ultimaSinc?.[0]?.sincronizado_em || 'Não encontrada')

    // Resposta completa
    return NextResponse.json({
      success: true,
      lancamentos: lancamentosProcessados,
      resumo: {
        total_receitas: totalReceitas,
        total_despesas: totalDespesas,
        saldo_liquido: saldoLiquido,
        total_lancamentos: count || 0,
        ultima_sincronizacao: ultimaSinc?.[0]?.sincronizado_em || null,
        periodo_analisado: {
          inicio: dataInicio,
          fim: dataFim,
          tipo: periodo
        }
      },
      paginacao: {
        pagina_atual: pagina,
        total_paginas: Math.ceil((count || 0) / limite),
        limite,
        total_registros: count || 0
      },
      filtros: {
        periodo,
        ano,
        mes,
        bar_id: barId,
        data_inicio: dataInicio,
        data_fim: dataFim
      },
      ordenacao: {
        campo: ordenarPor,
        direcao: direcaoOrdenacao
      },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Erro geral na API:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor',
      details: error.message,
      lancamentos: [],
      resumo: {
        total_receitas: 0,
        total_despesas: 0,
        saldo_liquido: 0,
        total_lancamentos: 0
      }
    }, { status: 500 })
  }
} 