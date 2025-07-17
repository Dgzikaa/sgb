import { getSupabaseClient } from './supabase'

console.log('ðŸ”§ Usando cliente Supabase existente configurado')

// Interfaces para os dados
export interface VendasData {
  vendas_hoje: number
  vendas_semana: number
  total_pedidos: number
  ticket_medio: number
}

export interface ProdutoMaisVendido {
  produto: string
  grupo: string
  quantidade: number
  valor_total: number
}

export interface ClientesData {
  total_clientes_hoje: number
  novos_clientes: number
  clientes_recorrentes: number
}

// Funá§á£o para testar conexá£o
export async function testConnection(): Promise<boolean> {
  try {
    console.log('ðŸ§ª Testando conexá£o com Supabase...')
    console.log('ðŸ“ Projeto: iddtrhexgjbfhxebpklf.supabase.co')
    
    const supabase = await getSupabaseClient();
    if (!supabase) throw new Error('Erro ao conectar com banco');
    
    // Teste simples para verificar conectividade
    const { data, error, count } = await supabase
      .from('analitico')
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.error('Œ Erro ao testar Supabase:', error)
      return false
    }
    
    console.log('œ… Conexá£o com Supabase OK')
    console.log(`ðŸ“Š Total de registros na tabela 'analitico': ${count}`)
    return true
  } catch (error: any) {
    console.error('Œ Erro na conexá£o com Supabase:', error)
    return false
  }
}

// ðŸ† CONSULTA: Produto mais vendido usando Supabase
export async function getProdutoMaisVendido(periodo: 'hoje' | 'semana' | 'mes' = 'hoje'): Promise<ProdutoMaisVendido | null> {
    const supabase = await getSupabaseClient();
    if (!supabase) throw new Error('Erro ao conectar com banco');

  try {
    console.log(`ðŸ” Buscando produto mais vendido (${periodo})...`)
    
    const hoje = new Date().toISOString().split('T')[0]
    let query = supabase
      .from('analitico')
      .select('prd_desc, grp_desc, valorfinal, qtd, vd_dtgerencial')
      .not('prd_desc', 'is', null)
      .not('grp_desc', 'is', null)
      .gt('valorfinal', 0)
    
    // Aplicar filtro de data conforme perá­odo
    if (periodo === 'hoje') {
      // Primeiro tenta hoje
      query = query.eq('vd_dtgerencial', hoje)
      
      const { data: dadosHoje, error: errorHoje } = await query
      
      if (errorHoje) {
        console.error('Œ Erro vendas hoje:', errorHoje)
        throw errorHoje
      }
      
      // Se ná£o tem dados de hoje, buscar a data mais recente
      if (!dadosHoje || dadosHoje.length === 0) {
        console.log('š ï¸ Sem dados para hoje, buscando data mais recente...')
        
        // Buscar data mais recente com dados
        const { data: datasRecentes, error: errorDatas } = await supabase
          .from('analitico')
          .select('vd_dtgerencial')
          .not('vd_dtgerencial', 'is', null)
          .order('vd_dtgerencial', { ascending: false })
          .limit(1)
        
        if (errorDatas || !datasRecentes || datasRecentes.length === 0) {
          console.log('Œ Nenhuma data encontrada')
          return null
        }
        
        const dataRecente = datasRecentes[0].vd_dtgerencial
        console.log(`ðŸ“… Usando dados da data mais recente: ${dataRecente}`)
        
        query = supabase
          .from('analitico')
          .select('prd_desc, grp_desc, valorfinal, qtd, vd_dtgerencial')
          .eq('vd_dtgerencial', dataRecente)
          .not('prd_desc', 'is', null)
          .not('grp_desc', 'is', null)
          .gt('valorfinal', 0)
      }
    } else if (periodo === 'semana') {
      const semanaAtras = new Date()
      semanaAtras.setDate(semanaAtras.getDate() - 7)
      const dataInicio = semanaAtras.toISOString().split('T')[0]
      query = query.gte('vd_dtgerencial', dataInicio)
    } else if (periodo === 'mes') {
      const mesAtras = new Date()
      mesAtras.setDate(mesAtras.getDate() - 30)
      const dataInicio = mesAtras.toISOString().split('T')[0]
      query = query.gte('vd_dtgerencial', dataInicio)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Œ Erro na consulta Supabase:', error)
      throw error
    }
    
    if (!data || data.length === 0) {
      console.log('š ï¸ Nenhum dado encontrado na tabela analitico para o perá­odo')
      return null
    }
    
    console.log(`ðŸ“Š Registros encontrados: ${data.length}`)
    console.log(`ðŸ“… Perá­odo dos dados: ${data[0]?.vd_dtgerencial} a ${data[data.length-1]?.vd_dtgerencial}`)
    
    // Agrupar produtos e somar quantidades/valores
    const produtosAgrupados = data.reduce((acc: any, item: any) => {
      const produto = item.prd_desc || 'Produto Desconhecido'
      const grupo = item.grp_desc || 'Sem Categoria'
      const valor = parseFloat(item.valorfinal) || 0
      const quantidade = parseInt(item.qtd) || 1
      
      if (!acc[produto]) {
        acc[produto] = {
          produto,
          grupo,
          quantidade: 0,
          valor_total: 0
        }
      }
      
      acc[produto].quantidade += quantidade
      acc[produto].valor_total += valor
      
      return acc
    }, {})
    
    // Ordenar por quantidade (mais vendido)
    const produtosOrdenados = Object.values(produtosAgrupados)
      .sort((a: any, b: any) => b.quantidade - a.quantidade)
    
    console.log('ðŸ“Š Top 3 produtos por quantidade:', produtosOrdenados.slice(0, 3))
    
    return produtosOrdenados[0] as ProdutoMaisVendido || null
    
  } catch (error) {
    console.error('Œ Erro ao buscar produto mais vendido:', error)
    throw error
  }
}

// ðŸ’° CONSULTA: Vendas usando Supabase
export async function getVendasData(): Promise<VendasData> {
    const supabase = await getSupabaseClient();
    if (!supabase) throw new Error('Erro ao conectar com banco');

  try {
    console.log('ðŸ’° Buscando dados de vendas...')
    
    const hoje = new Date().toISOString().split('T')[0]
    const semanaAtras = new Date()
    semanaAtras.setDate(semanaAtras.getDate() - 7)
    const semanaData = semanaAtras.toISOString().split('T')[0]
    
    // Vendas de hoje - primeiro tenta hoje, sená£o usa data mais recente
    let { data: vendasHoje, error: errorHoje } = await supabase
      .from('analitico')
      .select('valorfinal, prd_desc, vd_dtgerencial, vd')
      .eq('vd_dtgerencial', hoje)
      .gt('valorfinal', 0)
    
    // Se ná£o tem dados de hoje, buscar data mais recente
    if ((!vendasHoje || vendasHoje.length === 0) && !errorHoje) {
      console.log('š ï¸ Sem vendas para hoje, buscando data mais recente...')
      
      const { data: dataRecente, error: errorData } = await supabase
        .from('analitico')
        .select('vd_dtgerencial')
        .not('vd_dtgerencial', 'is', null)
        .order('vd_dtgerencial', { ascending: false })
        .limit(1)
      
      if (!errorData && dataRecente && dataRecente.length > 0) {
        const dataUsar = dataRecente[0].vd_dtgerencial
        console.log(`ðŸ“… Usando vendas da data: ${dataUsar}`)
        
        const result = await supabase
          .from('analitico')
          .select('valorfinal, prd_desc, vd_dtgerencial, vd')
          .eq('vd_dtgerencial', dataUsar)
          .gt('valorfinal', 0)
        
        vendasHoje = result.data
        errorHoje = result.error
      }
    }
    
    // Vendas da semana
    const { data: vendasSemana, error: errorSemana } = await supabase
      .from('analitico')
      .select('valorfinal')
      .gte('vd_dtgerencial', semanaData)
      .gt('valorfinal', 0)
    
    if (errorHoje) {
      console.error('Œ Erro vendas hoje:', errorHoje)
      throw errorHoje
    }
    
    if (errorSemana) {
      console.error('Œ Erro vendas semana:', errorSemana)
      throw errorSemana
    }
    
    // Calcular estatá­sticas
    const valoresTotalHoje = vendasHoje?.reduce((sum: number, item: any) => sum + (parseFloat(item.valorfinal) || 0), 0) || 0
    const valoresTotalSemana = vendasSemana?.reduce((sum: number, item: any) => sum + (parseFloat(item.valorfinal) || 0), 0) || 0
    const totalPedidosHoje = vendasHoje?.length || 0
    
    // Calcular clientes áºnicos para ticket má©dio correto
    const clientesUnicos = new Set(vendasHoje?.map((item: any) => item.vd) || [])
    const totalClientesHoje = clientesUnicos.size || 1
    const ticketMedio = totalClientesHoje > 0 ? valoresTotalHoje / totalClientesHoje : 0
    
    console.log('ðŸ“Š Estatá­sticas calculadas:', {
      hoje: valoresTotalHoje,
      semana: valoresTotalSemana,
      pedidos: totalPedidosHoje,
      ticket: ticketMedio
    })
    
    return {
      vendas_hoje: valoresTotalHoje,
      vendas_semana: valoresTotalSemana,
      total_pedidos: totalPedidosHoje,
      ticket_medio: ticketMedio
    }
    
  } catch (error) {
    console.error('Œ Erro ao buscar dados de vendas:', error)
    throw error
  }
}

// ðŸ‘¥ CONSULTA: Clientes usando Supabase
export async function getClientesData(): Promise<ClientesData> {
    const supabase = await getSupabaseClient();
    if (!supabase) throw new Error('Erro ao conectar com banco');

  try {
    console.log('ðŸ‘¥ Buscando dados de clientes...')
    
    const hoje = new Date().toISOString().split('T')[0]
    
    // Para clientes, vamos usar dados de vendas áºnicos por mesa (vd) - primeiro tenta hoje
    let { data: vendas, error } = await supabase
      .from('analitico')
      .select('vd_dtgerencial, vd, vd_mesadesc')
      .eq('vd_dtgerencial', hoje)
      .not('vd', 'is', null)
    
    // Se ná£o tem dados de hoje, buscar data mais recente (igual á s outras funá§áµes)
    if ((!vendas || vendas.length === 0) && !error) {
      console.log('š ï¸ Sem clientes para hoje, buscando data mais recente...')
      
      const { data: dataRecente, error: errorData } = await supabase
        .from('analitico')
        .select('vd_dtgerencial')
        .not('vd_dtgerencial', 'is', null)
        .order('vd_dtgerencial', { ascending: false })
        .limit(1)
      
      if (!errorData && dataRecente && dataRecente.length > 0) {
        const dataUsar = dataRecente[0].vd_dtgerencial
        console.log(`ðŸ“… Usando clientes da data: ${dataUsar}`)
        
        const result = await supabase
          .from('analitico')
          .select('vd_dtgerencial, vd, vd_mesadesc')
          .eq('vd_dtgerencial', dataUsar)
          .not('vd', 'is', null)
        
        vendas = result.data
        error = result.error
      }
    }
    
    if (error) {
      console.error('Œ Erro clientes:', error)
      throw error
    }
    
    // Contar mesas áºnicas (clientes áºnicos)
    const mesasUnicas = new Set(vendas?.map((item: any) => item.vd) || [])
    const clientesEstimados = mesasUnicas.size
    const novosClientes = Math.floor(clientesEstimados * 0.3)
    const recorrentes = clientesEstimados - novosClientes
    
    console.log('ðŸ‘¥ Clientes calculados baseado em mesas áºnicas:', {
      total: clientesEstimados,
      novos: novosClientes,
      recorrentes,
      dataUsada: vendas?.[0]?.vd_dtgerencial,
      totalRegistros: vendas?.length,
      mesasUnicas: Array.from(mesasUnicas).slice(0, 5) // mostrar primeiras 5 mesas
    })
    
    return {
      total_clientes_hoje: clientesEstimados,
      novos_clientes: novosClientes,
      clientes_recorrentes: recorrentes
    }
    
  } catch (error) {
    console.error('Œ Erro ao buscar dados de clientes:', error)
    throw error
  }
}

// ðŸ“Š CONSULTA AVANá‡ADA: Dados de uma semana especá­fica
export async function getDadosSemana(dataInicio?: string): Promise<DadosSemana[]> {
    const supabase = await getSupabaseClient();
    if (!supabase) throw new Error('Erro ao conectar com banco');

  try {
    // Se ná£o informar data, usar a data mais recente disponá­vel como base
    let dataBase = dataInicio
    if (!dataBase) {
      const { data: dataRecente } = await supabase
        .from('analitico')
        .select('vd_dtgerencial')
        .not('vd_dtgerencial', 'is', null)
        .order('vd_dtgerencial', { ascending: false })
        .limit(1)
      
      dataBase = dataRecente?.[0]?.vd_dtgerencial || new Date().toISOString().split('T')[0]
      console.log('ðŸ“… Usando data mais recente disponá­vel:', dataBase)
    }
    
    console.log('ðŸ“Š Buscando dados da semana a partir de:', dataBase)
    
    // Calcular dias da semana (áºltimos 7 dias a partir da data base)
    const fimSemana = new Date(dataBase!)
    const diasSemana = []
    
    for (let i = 6; i >= 0; i--) {
      const data = new Date(fimSemana)
      data.setDate(fimSemana.getDate() - i)
      diasSemana.push(data.toISOString().split('T')[0])
    }

    const dadosPromises = diasSemana.map(async (data, index) => {
      // Mapear corretamente o dia da semana baseado na data real
      const diaNomeReal = new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long' })
      const diaNomeCapitalizado = diaNomeReal.charAt(0).toUpperCase() + diaNomeReal.slice(1)
      
      try {
        // Buscar dados de todas as fontes para cada dia
        const [periodoData, pagamentosData, symplaData] = await Promise.all([
          supabase.from('periodo').select('pessoas, vr_pagamentos, dt_gerencial').eq('dt_gerencial', data),
          supabase.from('pagamentos').select('liquido, dt_gerencial').eq('dt_gerencial', data),
          supabase.from('sympla_bilheteria').select('total_liquido, qtd_checkins_realizados, data_evento').eq('data_evento', data)
        ])

        // Calcular má©tricas do dia
        const faturamentoPagamentos = pagamentosData.data?.reduce((sum: number, item: any) => sum + parseFloat(item.liquido || '0'), 0) || 0
        const faturamentoSympla = symplaData.data?.reduce((sum: number, item: any) => sum + parseFloat(item.total_liquido || '0'), 0) || 0
        const faturamentoTotal = faturamentoPagamentos + faturamentoSympla

        const pessoasPeriodo = periodoData.data?.reduce((sum: number, item: any) => sum + parseInt(item.pessoas || '0'), 0) || 0
        const pessoasSympla = symplaData.data?.reduce((sum: number, item: any) => sum + parseInt(item.qtd_checkins_realizados || '0'), 0) || 0
        const clientesTotal = pessoasPeriodo + pessoasSympla

        return {
          dia: diaNomeCapitalizado,
          data,
          faturamento: faturamentoTotal,
          clientes: clientesTotal,
          ticketMedio: clientesTotal > 0 ? faturamentoTotal / clientesTotal : 0
        }
      } catch (error) {
        console.error(`Œ Erro ao buscar dados do dia ${data}:`, error)
        return {
          dia: diaNomeCapitalizado,
          data,
          faturamento: 0,
          clientes: 0,
          ticketMedio: 0
        }
      }
    })

    const resultados = await Promise.all(dadosPromises)
    
    console.log('ðŸ“Š Dados da semana processados:', resultados.length, 'dias')
    return resultados
    
  } catch (error) {
    console.error('Œ Erro ao buscar dados da semana:', error)
    throw error
  }
}

// ðŸ“ˆ CONSULTA AVANá‡ADA: Histá³rico de um dia da semana especá­fico
export async function getHistoricoDiaSemana(diaSemana: string, ultimasSemanas = 8): Promise<HistoricoDia[]> {
    const supabase = await getSupabaseClient();
    if (!supabase) throw new Error('Erro ao conectar com banco');

  try {
    console.log(`ðŸ“ˆ Buscando histá³rico de ${diaSemana} das áºltimas ${ultimasSemanas} semanas`)
    
    // Mapear dia da semana para á­ndice (0=domingo, 1=segunda, etc.)
    const diasSemanaMap: Record<string, number> = {
      'domingo': 0, 'segunda': 1, 'terca': 2, 'quarta': 3, 
      'quinta': 4, 'sexta': 5, 'sabado': 6
    }
    
    const diaSemanaIndex = diasSemanaMap[diaSemana.toLowerCase()]
    if (diaSemanaIndex === undefined) {
      throw new Error(`Dia da semana invá¡lido: ${diaSemana}`)
    }

    // Calcular data limite
    const hoje = new Date()
    const dataLimite = new Date(hoje)
    dataLimite.setDate(hoje.getDate() - (ultimasSemanas * 7))
    
    // Buscar dados histá³ricos
    const [pagamentosData, periodoData] = await Promise.all([
      supabase.from('pagamentos').select('dt_gerencial, liquido').gte('dt_gerencial', dataLimite.toISOString().split('T')[0]),
      supabase.from('periodo').select('dt_gerencial, pessoas').gte('dt_gerencial', dataLimite.toISOString().split('T')[0])
    ])

    // Filtrar apenas o dia da semana especá­fico e agrupar por data
    const dadosFiltratos: Record<string, any> = {}
    
    pagamentosData.data?.forEach((item: any) => {
      const data = new Date(item.dt_gerencial)
      if (data.getDay() === diaSemanaIndex) {
        const dataStr = item.dt_gerencial
        if (!dadosFiltratos[dataStr]) {
          dadosFiltratos[dataStr] = { data: dataStr, faturamento: 0, clientes: 0 }
        }
        dadosFiltratos[dataStr].faturamento += parseFloat(item.liquido || '0')
      }
    })

    periodoData.data?.forEach((item: any) => {
      const data = new Date(item.dt_gerencial)
      if (data.getDay() === diaSemanaIndex) {
        const dataStr = item.dt_gerencial
        if (!dadosFiltratos[dataStr]) {
          dadosFiltratos[dataStr] = { data: dataStr, faturamento: 0, clientes: 0 }
        }
        dadosFiltratos[dataStr].clientes += parseInt(item.pessoas || '0')
      }
    })

    // Calcular ticket má©dio e ordenar
    const resultados = Object.values(dadosFiltratos)
      .map((item: any) => ({
        ...item,
        ticketMedio: item.clientes > 0 ? item.faturamento / item.clientes : 0
      }))
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, ultimasSemanas)

    console.log(`ðŸ“ˆ Histá³rico de ${diaSemana}:`, resultados.length, 'registros encontrados')
    return resultados
    
  } catch (error) {
    console.error(`Œ Erro ao buscar histá³rico de ${diaSemana}:`, error)
    throw error
  }
}

// ðŸŽ¯ CONSULTA AVANá‡ADA: Comparaá§á£o de perá­odos
export async function getComparacaoPeriodos(periodo1: [string, string], periodo2: [string, string]): Promise<ComparacaoPeriodos> {
    const supabase = await getSupabaseClient();
    if (!supabase) throw new Error('Erro ao conectar com banco');

  try {
    console.log('ðŸŽ¯ Comparando perá­odos:', periodo1, 'vs', periodo2)
    
    const calcularPeriodo = async ([inicio, fim]: [string, string]) => {
      const supabase = await getSupabaseClient();
      if (!supabase) throw new Error('Erro ao conectar com banco');

      const [pagamentos, periodo, sympla] = await Promise.all([
        supabase.from('pagamentos').select('liquido, dt_gerencial').gte('dt_gerencial', inicio).lte('dt_gerencial', fim),
        supabase.from('periodo').select('pessoas, dt_gerencial').gte('dt_gerencial', inicio).lte('dt_gerencial', fim),
        supabase.from('sympla_bilheteria').select('total_liquido, qtd_checkins_realizados, data_evento').gte('data_evento', inicio).lte('data_evento', fim)
      ])

      const faturamentoPagamentos = pagamentos.data?.reduce((sum: number, item: any) => sum + parseFloat(item.liquido || '0'), 0) || 0
      const faturamentoSympla = sympla.data?.reduce((sum: number, item: any) => sum + parseFloat(item.total_liquido || '0'), 0) || 0
      const faturamentoTotal = faturamentoPagamentos + faturamentoSympla

      const pessoasPeriodo = periodo.data?.reduce((sum: number, item: any) => sum + parseInt(item.pessoas || '0'), 0) || 0
      const pessoasSympla = sympla.data?.reduce((sum: number, item: any) => sum + parseInt(item.qtd_checkins_realizados || '0'), 0) || 0
      const clientesTotal = pessoasPeriodo + pessoasSympla

      const diasUnicos = new Set([
        ...pagamentos.data?.map((item: any) => item.dt_gerencial) || [],
        ...periodo.data?.map((item: any) => item.dt_gerencial) || [],
        ...sympla.data?.map((item: any) => item.data_evento) || []
      ]).size

      return {
        faturamento: faturamentoTotal,
        clientes: clientesTotal,
        ticketMedio: clientesTotal > 0 ? faturamentoTotal / clientesTotal : 0,
        diasAtivos: diasUnicos
      }
    }

    const [dados1, dados2] = await Promise.all([
      calcularPeriodo(periodo1),
      calcularPeriodo(periodo2)
    ])

    const crescimentoFaturamento = (dados1?.faturamento || 0) > 0 ? (((dados2?.faturamento || 0) - (dados1?.faturamento || 0)) / (dados1?.faturamento || 0)) * 100 : 0
    const crescimentoClientes = (dados1?.clientes || 0) > 0 ? (((dados2?.clientes || 0) - (dados1?.clientes || 0)) / (dados1?.clientes || 0)) * 100 : 0
    const crescimentoTicket = (dados1?.ticketMedio || 0) > 0 ? (((dados2?.ticketMedio || 0) - (dados1?.ticketMedio || 0)) / (dados1?.ticketMedio || 0)) * 100 : 0

    return {
      periodo1: dados1 || { faturamento: 0, clientes: 0, ticketMedio: 0, diasAtivos: 0 },
      periodo2: dados2 || { faturamento: 0, clientes: 0, ticketMedio: 0, diasAtivos: 0 },
      crescimento: {
        faturamento: crescimentoFaturamento,
        clientes: crescimentoClientes,
        ticketMedio: crescimentoTicket
      }
    }
    
  } catch (error) {
    console.error('Œ Erro ao comparar perá­odos:', error)
    throw error
  }
}

// ðŸ† CONSULTA AVANá‡ADA: Top produtos e aná¡lises
export async function getAnaliseCompleta(periodo: 'hoje' | 'semana' | 'mes' = 'semana'): Promise<AnaliseCompleta> {
    const supabase = await getSupabaseClient();
    if (!supabase) throw new Error('Erro ao conectar com banco');

  try {
    console.log('ðŸ† Fazendo aná¡lise completa para perá­odo:', periodo)
    
    let dataInicio = ''
    const hoje = new Date().toISOString().split('T')[0]
    
    switch (periodo) {
      case 'hoje':
        dataInicio = hoje
        break
      case 'semana':
        const semanaAtras = new Date()
        semanaAtras.setDate(semanaAtras.getDate() - 7)
        dataInicio = semanaAtras.toISOString().split('T')[0]
        break
      case 'mes':
        const mesAtras = new Date()
        mesAtras.setMonth(mesAtras.getMonth() - 1)
        dataInicio = mesAtras.toISOString().split('T')[0]
        break
    }

    // Buscar dados bá¡sicos
    const [vendasData, clientesData, produtoTop] = await Promise.all([
      getVendasData(),
      getClientesData(), 
      getProdutoMaisVendido(periodo)
    ])

    // Buscar dados da semana para comparaá§á£o (usa data mais recente automaticamente)
    const dadosSemana = await getDadosSemana()
    
    // Encontrar melhor dia da semana
    const melhorDia = dadosSemana.reduce((melhor, dia) => 
      dia.faturamento > melhor.faturamento ? dia : melhor
    )

    // Calcular má©dias
    const mediaFaturamento = dadosSemana.reduce((sum, dia) => sum + dia.faturamento, 0) / dadosSemana.length
    const mediaClientes = dadosSemana.reduce((sum, dia) => sum + dia.clientes, 0) / dadosSemana.length

    return {
      vendas: vendasData,
      clientes: clientesData,
      produtoMaisVendido: produtoTop,
      melhorDiaSemana: melhorDia,
      dadosSemana,
      medias: {
        faturamento: mediaFaturamento,
        clientes: mediaClientes,
        ticketMedio: mediaClientes > 0 ? mediaFaturamento / mediaClientes : 0
      },
      insights: {
        performanceSemana: melhorDia.faturamento / mediaFaturamento,
        consistencia: dadosSemana.filter((dia: any) => dia.faturamento > mediaFaturamento * 0.8).length / 7,
        crescimento: vendasData ? vendasData.vendas_hoje / vendasData.vendas_semana : 0
      }
    }
    
  } catch (error) {
    console.error('Œ Erro na aná¡lise completa:', error)
    throw error
  }
}

// ðŸª TIPOS PARA AS NOVAS FUNá‡á•ES
export interface DadosSemana {
  dia: string
  data: string
  faturamento: number
  clientes: number
  ticketMedio: number
}

export interface HistoricoDia {
  data: string
  faturamento: number
  clientes: number
  ticketMedio: number
}

export interface ComparacaoPeriodos {
  periodo1: {
    faturamento: number
    clientes: number
    ticketMedio: number
    diasAtivos: number
  }
  periodo2: {
    faturamento: number
    clientes: number
    ticketMedio: number
    diasAtivos: number
  }
  crescimento: {
    faturamento: number
    clientes: number
    ticketMedio: number
  }
}

export interface AnaliseCompleta {
  vendas: VendasData
  clientes: ClientesData
  produtoMaisVendido: ProdutoMaisVendido | null
  melhorDiaSemana: DadosSemana
  dadosSemana: DadosSemana[]
  medias: {
    faturamento: number
    clientes: number
    ticketMedio: number
  }
  insights: {
    performanceSemana: number
    consistencia: number
    crescimento: number
  }
} 
