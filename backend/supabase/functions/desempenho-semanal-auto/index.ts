import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔄 Iniciando automação semanal de desempenho...')

    // Inicializar cliente Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Obter data atual e calcular semana
    const hoje = new Date()
    const anoAtual = hoje.getFullYear()
    const semanaAtual = getWeekNumber(hoje)
    
    console.log(`📅 Processando: Ano ${anoAtual}, Semana ${semanaAtual}`)

    // Buscar bares ativos
    const { data: bares, error: baresError } = await supabase
      .from('bars')
      .select('id, nome')
      .eq('ativo', true)

    if (baresError || !bares?.length) {
      console.log('❌ Nenhum bar ativo encontrado')
      return new Response(
        JSON.stringify({ success: false, error: 'Nenhum bar ativo' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`🏪 Processando ${bares.length} bar(es) ativo(s)`)

    const resultados = []

    for (const bar of bares) {
      console.log(`\n🏪 Processando bar: ${bar.nome} (ID: ${bar.id})`)

      try {
        // ============================================
        // 🔄 PRIMEIRO: Recalcular a semana ANTERIOR (que acabou de terminar)
        // Isso garante que a semana que terminou ontem (domingo) tenha dados finais corretos
        // ============================================
        const semanaAnterior = semanaAtual === 1 ? 52 : semanaAtual - 1
        const anoSemanaAnterior = semanaAtual === 1 ? anoAtual - 1 : anoAtual
        
        console.log(`🔙 Recalculando semana anterior: ${semanaAnterior}/${anoSemanaAnterior}`)
        
        const { data: semanaAnteriorExiste } = await supabase
          .from('desempenho_semanal')
          .select('id')
          .eq('bar_id', bar.id)
          .eq('ano', anoSemanaAnterior)
          .eq('numero_semana', semanaAnterior)
          .single()

        if (semanaAnteriorExiste) {
          try {
            await recalcularDesempenhoSemana(supabase, bar.id, anoSemanaAnterior, semanaAnterior)
            console.log(`✅ Semana anterior ${semanaAnterior} recalculada com dados finais!`)
          } catch (errAnterior) {
            console.error(`⚠️ Erro ao recalcular semana anterior:`, errAnterior)
          }
        }

        // ============================================
        // 🆕 SEGUNDO: Criar/processar a semana ATUAL (que está começando)
        // ============================================
        
        // 1. Verificar se semana atual já existe
        const { data: semanaExistente } = await supabase
          .from('desempenho_semanal')
          .select('*')
          .eq('bar_id', bar.id)
          .eq('ano', anoAtual)
          .eq('numero_semana', semanaAtual)
          .single()

        // 2. Criar semana se não existir
        if (!semanaExistente) {
          await criarSemanaSeNaoExistir(supabase, bar.id, anoAtual, semanaAtual)
          console.log(`✅ Semana ${semanaAtual} criada para ${bar.nome}`)
        } else {
          console.log(`📊 Semana ${semanaAtual} já existe para ${bar.nome}`)
        }

        // 3. Recalcular dados da semana atual
        const resultadoRecalculo = await recalcularDesempenhoSemana(
          supabase, 
          bar.id, 
          anoAtual, 
          semanaAtual
        )

        resultados.push({
          bar_id: bar.id,
          bar_nome: bar.nome,
          semana: semanaAtual,
          semana_anterior: semanaAnterior,
          ano: anoAtual,
          sucesso: true,
          dados: resultadoRecalculo
        })

        console.log(`✅ Automação concluída para ${bar.nome}`)

      } catch (barError) {
        console.error(`❌ Erro ao processar bar ${bar.nome}:`, barError)
        resultados.push({
          bar_id: bar.id,
          bar_nome: bar.nome,
          semana: semanaAtual,
          ano: anoAtual,
          sucesso: false,
          erro: barError.message
        })
      }
    }

    console.log(`\n🎉 Automação semanal concluída!`)
    console.log(`📊 Processados: ${resultados.length} bar(es)`)
    console.log(`✅ Sucessos: ${resultados.filter(r => r.sucesso).length}`)
    console.log(`❌ Erros: ${resultados.filter(r => !r.sucesso).length}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Automação semanal concluída',
        semana_processada: semanaAtual,
        ano: anoAtual,
        resultados,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Erro na automação semanal:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Função para obter número da semana (padrão ISO - segunda a domingo)
function getWeekNumber(date: Date): number {
  // Clonar data para não modificar original
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  // Ajustar para segunda-feira
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  // Obter primeiro dia do ano
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  // Calcular número da semana
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return weekNo
}

// Função para obter datas de início e fim da semana (segunda a domingo)
function getWeekDates(year: number, weekNumber: number) {
  // Encontrar a primeira segunda-feira da primeira semana ISO do ano
  const jan4 = new Date(year, 0, 4) // 4 de janeiro sempre está na primeira semana ISO
  const jan4Day = jan4.getDay() || 7 // Domingo = 7
  const firstMonday = new Date(jan4)
  firstMonday.setDate(jan4.getDate() - jan4Day + 1) // Volta para a primeira segunda-feira
  
  // Calcular início da semana desejada (segunda-feira)
  const startDate = new Date(firstMonday)
  startDate.setDate(firstMonday.getDate() + (weekNumber - 1) * 7)
  
  // Fim da semana (domingo)
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 6)
  
  return {
    inicio: startDate.toISOString().split('T')[0],
    fim: endDate.toISOString().split('T')[0]
  }
}

// Função para criar semana se não existir
async function criarSemanaSeNaoExistir(supabase: any, barId: number, ano: number, numeroSemana: number) {
  const datas = getWeekDates(ano, numeroSemana)
  
  const { error } = await supabase
    .from('desempenho_semanal')
    .insert({
      bar_id: barId,
      ano,
      numero_semana: numeroSemana,
      data_inicio: datas.inicio,
      data_fim: datas.fim,
      faturamento_total: 0,
      faturamento_entrada: 0,
      faturamento_bar: 0,
      clientes_atendidos: 0,
      reservas_totais: 0,
      reservas_presentes: 0,
      ticket_medio: 0,
      cmv_teorico: 0,
      cmv_limpo: 0,
      cmv: 0,
      cmo: 0,
      custo_atracao_faturamento: 0,
      meta_semanal: 0,
      observacoes: `Semana criada automaticamente em ${new Date().toLocaleString('pt-BR')}`
    })

  if (error) {
    throw new Error(`Erro ao criar semana: ${error.message}`)
  }
}

// Função para recalcular dados da semana
async function recalcularDesempenhoSemana(supabase: any, barId: number, ano: number, numeroSemana: number) {
  console.log(`🔄 Recalculando dados da semana ${numeroSemana}/${ano} para bar ${barId}`)
  
  // Buscar dados da semana
  const { data: semana, error: semanaError } = await supabase
    .from('desempenho_semanal')
    .select('*')
    .eq('bar_id', barId)
    .eq('ano', ano)
    .eq('numero_semana', numeroSemana)
    .single()

  if (semanaError || !semana) {
    throw new Error('Semana não encontrada para recálculo')
  }

  const startDate = semana.data_inicio
  const endDate = semana.data_fim

  console.log(`📅 Período: ${startDate} até ${endDate}`)

  // 1. FATURAMENTO TOTAL
  const [contahubData, yuzerData, symplaData] = await Promise.all([
    fetchAllData(supabase, 'contahub_pagamentos', 'liquido', {
      'gte_dt_gerencial': startDate,
      'lte_dt_gerencial': endDate,
      'eq_bar_id': barId
    }),
    fetchAllData(supabase, 'yuzer_pagamento', 'valor_liquido', {
      'gte_data_evento': startDate,
      'lte_data_evento': endDate,
      'eq_bar_id': barId
    }),
    fetchAllData(supabase, 'sympla_pedidos', 'valor_liquido', {
      'gte_data_pedido': startDate,
      'lte_data_pedido': endDate
    })
  ])

  const faturamentoContahub = contahubData?.reduce((sum, item) => sum + (parseFloat(item.liquido) || 0), 0) || 0
  const faturamentoYuzer = yuzerData?.reduce((sum, item) => sum + (parseFloat(item.valor_liquido) || 0), 0) || 0
  const faturamenteSympla = symplaData?.reduce((sum, item) => sum + (parseFloat(item.valor_liquido) || 0), 0) || 0
  const faturamentoTotal = faturamentoContahub + faturamentoYuzer + faturamenteSympla

  console.log(`💰 Faturamento Total: R$ ${faturamentoTotal.toFixed(2)}`)

  // 2. CUSTO ATRAÇÃO
  const atracaoData = await fetchAllData(supabase, 'nibo_agendamentos', 'valor, categoria_nome', {
    'gte_data_competencia': startDate,
    'lte_data_competencia': endDate
  })

  const categoriasAtracao = ['Atração', 'Atrações', 'Programação', 'Shows', 'Eventos', 'Artistas']
  const custoAtracao = atracaoData?.filter(item => 
    item.categoria_nome && categoriasAtracao.some(cat => 
      item.categoria_nome.toLowerCase().includes(cat.toLowerCase())
    )
  ).reduce((sum, item) => sum + Math.abs(parseFloat(item.valor) || 0), 0) || 0

  const atracaoFaturamentoPercent = faturamentoTotal > 0 ? (custoAtracao / faturamentoTotal) * 100 : 0

  console.log(`🎭 Atração/Faturamento: ${atracaoFaturamentoPercent.toFixed(1)}%`)

  // 3. CMO (Custo de Mão de Obra)
  const cmoData = await fetchAllData(supabase, 'nibo_agendamentos', 'valor, categoria_nome', {
    'gte_data_competencia': startDate,
    'lte_data_competencia': endDate,
    'eq_bar_id': barId
  })

  const categoriasCMO = [
    'SALARIO FUNCIONARIOS', 'VALE TRANSPORTE', 'ALIMENTAÇÃO', 'ADICIONAIS',
    'FREELA ATENDIMENTO', 'FREELA BAR', 'FREELA COZINHA', 'FREELA LIMPEZA',
    'FREELA SEGURANÇA', 'PRO LABORE', 'PROVISÃO TRABALHISTA'
  ]

  const custoTotalCMO = cmoData?.filter(item => 
    item.categoria_nome && categoriasCMO.includes(item.categoria_nome.trim())
  ).reduce((sum, item) => sum + Math.abs(parseFloat(item.valor) || 0), 0) || 0

  console.log(`👷 CMO: R$ ${custoTotalCMO.toFixed(2)}`)

  // 4. CLIENTES ATENDIDOS
  const [contahubPessoas, yuzerProdutos, symplaParticipantes] = await Promise.all([
    fetchAllData(supabase, 'contahub_periodo', 'pessoas', {
      'gte_dt_gerencial': startDate,
      'lte_dt_gerencial': endDate,
      'eq_bar_id': barId
    }),
    fetchAllData(supabase, 'yuzer_produtos', 'quantidade, produto_nome', {
      'gte_data_evento': startDate,
      'lte_data_evento': endDate,
      'eq_bar_id': barId
    }),
    fetchAllData(supabase, 'sympla_participantes', '*', {
      'gte_data_checkin': startDate,
      'lte_data_checkin': endDate,
      'eq_fez_checkin': true
    })
  ])

  const pessoasContahub = contahubPessoas?.reduce((sum, item) => sum + (parseInt(item.pessoas) || 0), 0) || 0
  const pessoasYuzer = yuzerProdutos?.filter(item => 
    item.produto_nome && (
      item.produto_nome.toLowerCase().includes('ingresso') || 
      item.produto_nome.toLowerCase().includes('entrada')
    )
  ).reduce((sum, item) => sum + (parseInt(item.quantidade) || 0), 0) || 0
  const pessoasSympla = symplaParticipantes?.length || 0
  const clientesAtendidos = pessoasContahub + pessoasYuzer + pessoasSympla

  console.log(`👥 Clientes Atendidos: ${clientesAtendidos}`)

  // 5. TICKET MÉDIO
  const ticketMedio = clientesAtendidos > 0 ? faturamentoTotal / clientesAtendidos : 0

  console.log(`🎯 Ticket Médio: R$ ${ticketMedio.toFixed(2)}`)

  // =============================================
  // 6. % CLIENTES NOVOS (usando stored procedure)
  // =============================================
  console.log(`🆕 Calculando % Clientes Novos...`)
  
  // Calcular período anterior para comparação (semana anterior)
  const dataInicio = new Date(startDate + 'T00:00:00')
  const dataFim = new Date(endDate + 'T00:00:00')
  const inicioAnterior = new Date(dataInicio)
  inicioAnterior.setDate(dataInicio.getDate() - 7)
  const fimAnterior = new Date(dataFim)
  fimAnterior.setDate(dataFim.getDate() - 7)
  
  const inicioAnteriorStr = inicioAnterior.toISOString().split('T')[0]
  const fimAnteriorStr = fimAnterior.toISOString().split('T')[0]

  let percClientesNovos = 0
  let clientesAtivos = 0

  // Chamar stored procedure para métricas de clientes
  const { data: metricas, error: metricasError } = await supabase.rpc('calcular_metricas_clientes', {
    p_bar_id: barId,
    p_data_inicio_atual: startDate,
    p_data_fim_atual: endDate,
    p_data_inicio_anterior: inicioAnteriorStr,
    p_data_fim_anterior: fimAnteriorStr
  })

  if (!metricasError && metricas && metricas[0]) {
    const resultado = metricas[0]
    const totalClientes = Number(resultado.total_atual) || 0
    const novosClientes = Number(resultado.novos_atual) || 0
    
    // Calcular percentual de novos
    percClientesNovos = totalClientes > 0 ? (novosClientes / totalClientes) * 100 : 0
    
    console.log(`🆕 Total Clientes: ${totalClientes}, Novos: ${novosClientes}`)
    console.log(`🆕 % Clientes Novos: ${percClientesNovos.toFixed(2)}%`)
  } else {
    console.error(`❌ Erro ao calcular métricas de clientes:`, metricasError)
  }

  // =============================================
  // 7. CLIENTES ATIVOS (2+ visitas em 90 dias)
  // =============================================
  console.log(`⭐ Calculando Clientes Ativos...`)
  
  // Calcular 90 dias antes do fim do período
  const data90DiasAtras = new Date(dataFim)
  data90DiasAtras.setDate(dataFim.getDate() - 90)
  const data90DiasAtrasStr = data90DiasAtras.toISOString().split('T')[0]

  // Chamar stored procedure para base ativa
  const { data: baseAtivaResult, error: baseAtivaError } = await supabase.rpc('get_count_base_ativa', {
    p_bar_id: barId,
    p_data_inicio: data90DiasAtrasStr,
    p_data_fim: endDate
  })

  if (!baseAtivaError && baseAtivaResult !== null) {
    clientesAtivos = Number(baseAtivaResult) || 0
    console.log(`⭐ Clientes Ativos (2+ visitas em 90d): ${clientesAtivos}`)
  } else {
    console.error(`❌ Erro ao calcular clientes ativos:`, baseAtivaError)
  }

  // 8. ATUALIZAR REGISTRO COM TODOS OS DADOS
  const dadosAtualizados = {
    faturamento_total: faturamentoTotal,
    clientes_atendidos: clientesAtendidos,
    ticket_medio: ticketMedio,
    custo_atracao_faturamento: atracaoFaturamentoPercent,
    cmo: custoTotalCMO,
    perc_clientes_novos: parseFloat(percClientesNovos.toFixed(2)),
    clientes_ativos: clientesAtivos,
    atualizado_em: new Date().toISOString(),
    observacoes: `Atualizado automaticamente em ${new Date().toLocaleString('pt-BR')} - Automação semanal (com % novos e ativos)`
  }

  const { data: atualizada, error: updateError } = await supabase
    .from('desempenho_semanal')
    .update(dadosAtualizados)
    .eq('id', semana.id)
    .eq('bar_id', barId)
    .select()
    .single()

  if (updateError) {
    throw new Error(`Erro ao atualizar semana: ${updateError.message}`)
  }

  console.log(`✅ Semana ${numeroSemana} atualizada com sucesso!`)
  console.log(`   📊 % Novos: ${percClientesNovos.toFixed(2)}% | Ativos: ${clientesAtivos}`)
  return atualizada
}

// Função auxiliar para buscar dados com paginação
async function fetchAllData(supabase: any, tableName: string, columns: string, filters: any = {}) {
  let allData: any[] = []
  let from = 0
  const limit = 1000
  
  while (true) {
    let query = supabase
      .from(tableName)
      .select(columns)
      .range(from, from + limit - 1)
    
    // Aplicar filtros
    Object.entries(filters).forEach(([key, value]) => {
      if (key.includes('gte_')) query = query.gte(key.replace('gte_', ''), value)
      else if (key.includes('lte_')) query = query.lte(key.replace('lte_', ''), value)
      else if (key.includes('eq_')) query = query.eq(key.replace('eq_', ''), value)
      else if (key.includes('in_')) query = query.in(key.replace('in_', ''), value)
    })
    
    const { data, error } = await query
    
    if (error) {
      console.error(`❌ Erro ao buscar ${tableName}:`, error)
      break
    }
    
    if (!data || data.length === 0) break
    
    allData.push(...data)
    if (data.length < limit) break
    
    from += limit
  }
  
  return allData
}
