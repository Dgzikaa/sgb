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

﻿import { getSupabaseClient } from './supabase'

console.log('🔧 Usando cliente Supabase existente configurado')

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

// Interfaces para dados do Supabase
interface AnaliticoItem {
  prd_desc?: string
  grp_desc?: string
  valorfinal?: string
  qtd?: string
  vd_dtgerencial?: string
  vd?: string
  vd_mesadesc?: string
}

interface ProdutoAgrupado {
  produto: string
  grupo: string
  quantidade: number
  valor_total: number
}

interface VendaItem {
  valorfinal?: string
  prd_desc?: string
  vd_dtgerencial?: string
  vd?: string
}

interface ClienteItem {
  vd_dtgerencial?: string
  vd?: string
  vd_mesadesc?: string
}

interface DataRecente {
  vd_dtgerencial: string
}

// Função para testar conexão
export async function testConnection(): Promise<boolean> {
  try {
    console.log('🔮 Testando conexão com Supabase...')
    console.log('🔍 Projeto: iddtrhexgjbfhxebpklf.supabase.co')
    
    const supabase = await getSupabaseClient();
    if (!supabase) throw new Error('Erro ao conectar com banco');
    
    // Teste simples para verificar conectividade
    const { error, count } = await supabase
      .from('analitico')
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.error('❌ Erro ao testar Supabase:', error)
      return false
    }
    
    console.log('✅ Conexão com Supabase OK')
    console.log(`📊 Total de registros na tabela 'analitico': ${String(count ?? 0)}`)
    return true
  } catch (error) {
    console.error('❌ Erro na conexão com Supabase:', error)
    return false
  }
}

// 📊 CONSULTA: Produto mais vendido usando Supabase
export async function getProdutoMaisVendido(periodo: 'hoje' | 'semana' | 'mes' = 'hoje'): Promise<ProdutoMaisVendido | null> {
    const supabase = await getSupabaseClient();
    if (!supabase) throw new Error('Erro ao conectar com banco');

  try {
    console.log(`🔍 Buscando produto mais vendido (${periodo})...`)
    
    const hoje = new Date().toISOString().split('T')[0]
    let query = supabase
      .from('analitico')
      .select('prd_desc, grp_desc, valorfinal, qtd, vd_dtgerencial')
      .not('prd_desc', 'is', null)
      .not('grp_desc', 'is', null)
      .gt('valorfinal', 0)
    
    // Aplicar filtro de data conforme período
    if (periodo === 'hoje') {
      // Primeiro tenta hoje
      query = query.eq('vd_dtgerencial', hoje)
      
      const { data: dadosHoje, error: errorHoje } = await query
      
      if (errorHoje) {
        console.error('❌ Erro vendas hoje:', errorHoje)
        throw errorHoje
      }
      
      // Se não tem dados de hoje, buscar a data mais recente
      if (!dadosHoje || dadosHoje.length === 0) {
        console.log('🤔 Sem dados para hoje, buscando data mais recente...')
        
        // Buscar data mais recente com dados
        const { data: datasRecentes, error: errorDatas } = await supabase
          .from('analitico')
          .select('vd_dtgerencial')
          .not('vd_dtgerencial', 'is', null)
          .order('vd_dtgerencial', { ascending: false })
          .limit(1)
        
        if (errorDatas || !datasRecentes || datasRecentes.length === 0) {
          console.log('❌ Nenhuma data encontrada')
          return null
        }
        
        const dataRecenteTyped = datasRecentes as DataRecente[];
        const dataRecente = dataRecenteTyped[0]?.vd_dtgerencial;
        console.log(`📅 Usando dados da data mais recente: ${dataRecente ?? ''}`)
        
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
      console.error('❌ Erro na consulta Supabase:', error)
      throw error
    }
    
    if (!data || data.length === 0) {
      console.log('🤔 Nenhum dado encontrado na tabela analitico para o período')
      return null
    }
    
    const dataTyped: AnaliticoItem[] = data as AnaliticoItem[];
    console.log(`📊 Registros encontrados: ${String(dataTyped.length)}`)
    const primeiroItem = dataTyped[0]?.vd_dtgerencial ?? '';
    const ultimoItem = dataTyped[dataTyped.length-1]?.vd_dtgerencial ?? '';
    console.log(`📅 Período dos dados: ${primeiroItem} a ${ultimoItem}`)
    
    // Agrupar produtos e somar quantidades/valores
    const produtosAgrupados: Record<string, ProdutoAgrupado> = dataTyped.reduce((acc: Record<string, ProdutoAgrupado>, item: AnaliticoItem) => {
      const produto = item.prd_desc || 'Produto Desconhecido'
      const grupo = item.grp_desc || 'Sem Categoria'
      const valor = parseFloat(item.valorfinal || '0') || 0
      const quantidade = parseInt(item.qtd || '1') || 1
      
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
    }, {} as Record<string, ProdutoAgrupado>)
    
    // Ordenar por quantidade (mais vendido)
    const produtosOrdenados = Object.values(produtosAgrupados)
      .sort((a: ProdutoAgrupado, b: ProdutoAgrupado) => b.quantidade - a.quantidade)
    
    console.log('📊 Top 3 produtos por quantidade:', produtosOrdenados.slice(0, 3))
    
    return produtosOrdenados[0] || null
    
  } catch (error) {
    console.error('❌ Erro ao buscar produto mais vendido:', error)
    throw error
  }
}

// 💰 CONSULTA: Vendas usando Supabase
export async function getVendasData(): Promise<VendasData> {
    const supabase = await getSupabaseClient();
    if (!supabase) throw new Error('Erro ao conectar com banco');

  try {
    console.log('💰 Buscando dados de vendas...')
    
    const hoje = new Date().toISOString().split('T')[0]
    const semanaAtras = new Date()
    semanaAtras.setDate(semanaAtras.getDate() - 7)
    const semanaData = semanaAtras.toISOString().split('T')[0]
    
    // Vendas de hoje - primeiro tenta hoje, senão usa data mais recente
    let { data: vendasHoje, error: errorHoje } = await supabase
      .from('analitico')
      .select('valorfinal, prd_desc, vd_dtgerencial, vd')
      .eq('vd_dtgerencial', hoje)
      .gt('valorfinal', 0)
    
    // Se não tem dados de hoje, buscar data mais recente
    if ((!vendasHoje || vendasHoje.length === 0) && !errorHoje) {
      console.log('🤔 Sem vendas para hoje, buscando data mais recente...')
      
      const { data: dataRecente, error: errorData } = await supabase
        .from('analitico')
        .select('vd_dtgerencial')
        .not('vd_dtgerencial', 'is', null)
        .order('vd_dtgerencial', { ascending: false })
        .limit(1)
      
      if (!errorData && dataRecente && dataRecente.length > 0) {
        const dataRecenteTyped = dataRecente as DataRecente[];
        const dataUsar = dataRecenteTyped[0].vd_dtgerencial
        console.log(`📅 Usando vendas da data: ${dataUsar ?? ''}`)
        
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
      console.error('❌ Erro vendas hoje:', errorHoje)
      throw errorHoje
    }
    
    if (errorSemana) {
      console.error('❌ Erro vendas semana:', errorSemana)
      throw errorSemana
    }
    
    const vendasHojeTyped: VendaItem[] = vendasHoje as VendaItem[] || [];
    const vendasSemanaTyped: VendaItem[] = vendasSemana as VendaItem[] || [];
    
    // Calcular estatísticas
    const valoresTotalHoje = vendasHojeTyped.reduce((sum: number, item: VendaItem) => sum + (parseFloat(item.valorfinal || '0') || 0), 0)
    const valoresTotalSemana = vendasSemanaTyped.reduce((sum: number, item: VendaItem) => sum + (parseFloat(item.valorfinal || '0') || 0), 0)
    const totalPedidosHoje = vendasHojeTyped.length
    
    // Calcular clientes únicos para ticket médio correto
    const clientesUnicos = new Set(vendasHojeTyped.map((item: VendaItem) => item.vd || '').filter(vd => vd !== ''))
    const totalClientesHoje = clientesUnicos.size || 1
    const ticketMedio = totalClientesHoje > 0 ? valoresTotalHoje / totalClientesHoje : 0
    
    console.log('📊 Estatísticas calculadas:', {
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
    console.error('❌ Erro ao buscar dados de vendas:', error)
    throw error
  }
}

// 👥 CONSULTA: Clientes usando Supabase
export async function getClientesData(): Promise<ClientesData> {
    const supabase = await getSupabaseClient();
    if (!supabase) throw new Error('Erro ao conectar com banco');

  try {
    console.log('👥 Buscando dados de clientes...')
    
    const hoje = new Date().toISOString().split('T')[0]
    
    // Para clientes, vamos usar dados de vendas únicos por mesa (vd) - primeiro tenta hoje
    let { data: vendas, error } = await supabase
      .from('analitico')
      .select('vd_dtgerencial, vd, vd_mesadesc')
      .eq('vd_dtgerencial', hoje)
      .not('vd', 'is', null)
    
    // Se não tem dados de hoje, buscar data mais recente (igual às outras funções)
    if ((!vendas || vendas.length === 0) && !error) {
      console.log('🤔 Sem clientes para hoje, buscando data mais recente...')
      
      const { data: dataRecente, error: errorData } = await supabase
        .from('analitico')
        .select('vd_dtgerencial')
        .not('vd_dtgerencial', 'is', null)
        .order('vd_dtgerencial', { ascending: false })
        .limit(1)
      
      if (!errorData && dataRecente && dataRecente.length > 0) {
        const dataRecenteTyped = dataRecente as DataRecente[];
        const dataUsar = dataRecenteTyped[0].vd_dtgerencial
        console.log(`📅 Usando clientes da data: ${dataUsar ?? ''}`)
        
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
      console.error('❌ Erro clientes:', error)
      throw error
    }
    
    const vendasTyped: ClienteItem[] = vendas as ClienteItem[] || [];
    
    // Contar mesas únicas (clientes únicos)
    const mesasUnicas = new Set(vendasTyped.map((item: ClienteItem) => item.vd || '').filter(vd => vd !== ''))
    const clientesEstimados = mesasUnicas.size
    const novosClientes = Math.floor(clientesEstimados * 0.3)
    const recorrentes = clientesEstimados - novosClientes
    
    console.log('👥 Clientes calculados baseado em mesas únicas:', {
      total: clientesEstimados,
      novos: novosClientes,
      recorrentes,
      dataUsada: vendasTyped[0]?.vd_dtgerencial ?? '',
      totalRegistros: vendasTyped.length,
      mesasUnicas: Array.from(mesasUnicas).slice(0, 5) // mostrar primeiras 5 mesas
    })
    
    return {
      total_clientes_hoje: clientesEstimados,
      novos_clientes: novosClientes,
      clientes_recorrentes: recorrentes
    }
    
  } catch (error) {
    console.error('❌ Erro ao buscar dados de clientes:', error)
    throw error
  }
}

// 📊 CONSULTA AVANÇADA: Dados de uma semana específica
export async function getDadosSemana(dataInicio?: string): Promise<DadosSemana[]> {
    const supabase = await getSupabaseClient();
    if (!supabase) throw new Error('Erro ao conectar com banco');

  try {
    // Se não informar data, usar a data mais recente disponível como base
    let dataBase = dataInicio
    if (!dataBase) {
      const { data: dataRecente } = await supabase
        .from('analitico')
        .select('vd_dtgerencial')
        .not('vd_dtgerencial', 'is', null)
        .order('vd_dtgerencial', { ascending: false })
        .limit(1)
      
      if (dataRecente && dataRecente.length > 0) {
        const dataRecenteTyped = dataRecente as DataRecente[];
        dataBase = dataRecenteTyped[0].vd_dtgerencial
      } else {
        throw new Error('Nenhuma data encontrada')
      }
    }
    
    // Calcular 7 dias a partir da data base
    const dataBaseObj = new Date(dataBase)
    const datasSemana: string[] = []
    
    for (let i = 0; i < 7; i++) {
      const data = new Date(dataBaseObj)
      data.setDate(data.getDate() - i)
      datasSemana.unshift(data.toISOString().split('T')[0])
    }
    
    // Buscar dados para cada dia da semana
    const dadosSemana: DadosSemana[] = []
    
    for (const data of datasSemana) {
      const { data: vendasDia } = await supabase
        .from('analitico')
        .select('valorfinal, vd')
        .eq('vd_dtgerencial', data)
        .gt('valorfinal', 0)
      
      const { data: clientesDia } = await supabase
        .from('analitico')
        .select('vd')
        .eq('vd_dtgerencial', data)
        .not('vd', 'is', null)
      
      const vendasDiaTyped: VendaItem[] = vendasDia as VendaItem[] || [];
      const clientesDiaTyped: ClienteItem[] = clientesDia as ClienteItem[] || [];
      
      const faturamento = vendasDiaTyped.reduce((sum: number, item: VendaItem) => sum + (parseFloat(item.valorfinal || '0') || 0), 0)
      const clientesUnicos = new Set(clientesDiaTyped.map((item: ClienteItem) => item.vd || '').filter(vd => vd !== ''))
      const clientes = clientesUnicos.size
      const ticketMedio = clientes > 0 ? faturamento / clientes : 0
      
      const diaSemana = new Date(data).toLocaleDateString('pt-BR', { weekday: 'long' })
      
      dadosSemana.push({
        dia: diaSemana,
        data,
        faturamento,
        clientes,
        ticketMedio
      })
    }
    
    return dadosSemana
    
  } catch (error) {
    console.error('❌ Erro ao buscar dados da semana:', error)
    throw error
  }
}

// 📈 CONSULTA: Histórico por dia da semana
export async function getHistoricoDiaSemana(diaSemana: string, ultimasSemanas = 8): Promise<HistoricoDia[]> {
    const supabase = await getSupabaseClient();
    if (!supabase) throw new Error('Erro ao conectar com banco');

  try {
    // Mapear nome do dia para número (0 = domingo, 1 = segunda, etc.)
    const diasMap: Record<string, number> = {
      'domingo': 0, 'segunda-feira': 1, 'terça-feira': 2, 'quarta-feira': 3,
      'quinta-feira': 4, 'sexta-feira': 5, 'sábado': 6
    }
    
    const diaNumero = diasMap[diaSemana.toLowerCase()]
    if (diaNumero === undefined) {
      throw new Error(`Dia da semana inválido: ${diaSemana}`)
    }
    
    // Buscar dados das últimas X semanas para este dia da semana
    const { data: vendas } = await supabase
      .from('analitico')
      .select('vd_dtgerencial, valorfinal, vd')
      .not('vd_dtgerencial', 'is', null)
      .order('vd_dtgerencial', { ascending: false })
      .limit(1000) // Limitar para performance
    
    if (!vendas) return []
    
    const vendasTyped: VendaItem[] = vendas as VendaItem[] || [];
    
    // Agrupar por data e calcular estatísticas
    const dadosPorData: Record<string, { faturamento: number; clientes: Set<string> }> = {}
    
    vendasTyped.forEach((item: VendaItem) => {
      if (!item.vd_dtgerencial) return
      
      const data = item.vd_dtgerencial
      const dataObj = new Date(data)
      
      // Verificar se é o dia da semana desejado
      if (dataObj.getDay() === diaNumero) {
        if (!dadosPorData[data]) {
          dadosPorData[data] = { faturamento: 0, clientes: new Set() }
        }
        
        dadosPorData[data].faturamento += parseFloat(item.valorfinal || '0') || 0
        if (item.vd) dadosPorData[data].clientes.add(item.vd)
      }
    })
    
    // Converter para array e ordenar por data
    const historico = Object.entries(dadosPorData)
      .map(([data, dados]) => ({
        data,
        faturamento: dados.faturamento,
        clientes: dados.clientes.size,
        ticketMedio: dados.clientes.size > 0 ? dados.faturamento / dados.clientes.size : 0
      }))
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, ultimasSemanas)
    
    return historico
    
  } catch (error) {
    console.error('❌ Erro ao buscar histórico do dia da semana:', error)
    throw error
  }
}

// 📊 CONSULTA: Comparação entre dois períodos
export async function getComparacaoPeriodos(periodo1: [string, string], periodo2: [string, string]): Promise<ComparacaoPeriodos> {
    const supabase = await getSupabaseClient();
    if (!supabase) throw new Error('Erro ao conectar com banco');

  try {
    const calcularPeriodo = async ([inicio, fim]: [string, string]) => {
      const { data: vendas } = await supabase
        .from('analitico')
        .select('valorfinal, vd, vd_dtgerencial')
        .gte('vd_dtgerencial', inicio)
        .lte('vd_dtgerencial', fim)
        .gt('valorfinal', 0)
      
             const { data: clientesData } = await supabase
         .from('analitico')
         .select('vd, vd_dtgerencial')
         .gte('vd_dtgerencial', inicio)
         .lte('vd_dtgerencial', fim)
         .not('vd', 'is', null)
       
       const vendasTyped: VendaItem[] = vendas as VendaItem[] || [];
       const clientesTyped: ClienteItem[] = clientesData as ClienteItem[] || [];
       
       const faturamento = vendasTyped.reduce((sum: number, item: VendaItem) => sum + (parseFloat(item.valorfinal || '0') || 0), 0)
       const clientesUnicos = new Set(clientesTyped.map((item: ClienteItem) => item.vd || '').filter(vd => vd !== ''))
       const totalClientes = clientesUnicos.size
       const ticketMedio = totalClientes > 0 ? faturamento / totalClientes : 0
      
      // Calcular dias ativos (datas únicas com vendas)
      const datasUnicas = new Set(vendasTyped.map((item: VendaItem) => item.vd_dtgerencial || '').filter(data => data !== ''))
      const diasAtivos = datasUnicas.size
      
             return { faturamento, clientes: totalClientes, ticketMedio, diasAtivos }
    }
    
    const [dados1, dados2] = await Promise.all([
      calcularPeriodo(periodo1),
      calcularPeriodo(periodo2)
    ])
    
    // Calcular crescimento percentual
    const crescimento = {
      faturamento: dados1.faturamento > 0 ? ((dados2.faturamento - dados1.faturamento) / dados1.faturamento) * 100 : 0,
      clientes: dados1.clientes > 0 ? ((dados2.clientes - dados1.clientes) / dados1.clientes) * 100 : 0,
      ticketMedio: dados1.ticketMedio > 0 ? ((dados2.ticketMedio - dados1.ticketMedio) / dados1.ticketMedio) * 100 : 0
    }
    
    return {
      periodo1: dados1,
      periodo2: dados2,
      crescimento
    }
    
  } catch (error) {
    console.error('❌ Erro ao comparar períodos:', error)
    throw error
  }
}

// 📊 CONSULTA: Análise completa
export async function getAnaliseCompleta(periodo: 'hoje' | 'semana' | 'mes' = 'semana'): Promise<AnaliseCompleta> {
    const supabase = await getSupabaseClient();
    if (!supabase) throw new Error('Erro ao conectar com banco');

  try {
    // Buscar dados básicos
    const [vendas, clientes, produtoMaisVendido] = await Promise.all([
      getVendasData(),
      getClientesData(),
      getProdutoMaisVendido(periodo)
    ])
    
    // Buscar dados da semana
    const dadosSemana = await getDadosSemana()
    
    // Calcular médias
    const medias = {
      faturamento: dadosSemana.reduce((sum, dia) => sum + dia.faturamento, 0) / dadosSemana.length,
      clientes: dadosSemana.reduce((sum, dia) => sum + dia.clientes, 0) / dadosSemana.length,
      ticketMedio: dadosSemana.reduce((sum, dia) => sum + dia.ticketMedio, 0) / dadosSemana.length
    }
    
    // Encontrar melhor dia da semana
    const melhorDiaSemana = dadosSemana.reduce((melhor, atual) => 
      atual.faturamento > melhor.faturamento ? atual : melhor
    )
    
    // Calcular insights
    const insights = {
      performanceSemana: (vendas.vendas_hoje / medias.faturamento) * 100,
      consistencia: (Math.min(...dadosSemana.map(d => d.faturamento)) / Math.max(...dadosSemana.map(d => d.faturamento))) * 100,
      crescimento: ((vendas.vendas_hoje - medias.faturamento) / medias.faturamento) * 100
    }
    
    return {
      vendas,
      clientes,
      produtoMaisVendido,
      melhorDiaSemana,
      dadosSemana,
      medias,
      insights
    }
    
  } catch (error) {
    console.error('❌ Erro ao gerar análise completa:', error)
    throw error
  }
}

// Interfaces para dados de saída
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

