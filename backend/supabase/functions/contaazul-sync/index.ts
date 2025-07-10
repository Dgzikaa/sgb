// ✅ EDGE FUNCTION - Sincronização Automática ContaAzul
// Executa coleta completa com categoria e centro de custo
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface SyncRequest {
  bar_id?: number
  data_inicio?: string
  data_fim?: string
  force?: boolean // Forçar mesmo se já sincronizado hoje
}

interface SyncResponse {
  success: boolean
  message: string
  resultado?: any
  log_id?: number
  erro?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validação de método
    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    console.log('🚀 EDGE FUNCTION: ContaAzul Sync iniciada...')

    // Configuração do Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Parse do body
    const body: SyncRequest = await req.json()
    const barId = body.bar_id

    if (!barId) {
      throw new Error('bar_id é obrigatório')
    }

    console.log(`📊 Iniciando sincronização para bar_id: ${barId}`)

    // Verificar se já foi sincronizado hoje (se não for forçado)
    if (!body.force) {
      const hoje = new Date().toISOString().split('T')[0]
      const { data: ultimaSync } = await supabaseClient
        .from('contaazul_sync_log')
        .select('*')
        .eq('bar_id', barId)
        .eq('tipo_operacao', 'COLETA_DETALHES')
        .gte('iniciado_em', `${hoje}T00:00:00`)
        .order('iniciado_em', { ascending: false })
        .limit(1)
        .single()

      if (ultimaSync) {
        return new Response(JSON.stringify({
          success: true,
          message: 'Já sincronizado hoje',
          ultima_sincronizacao: ultimaSync.iniciado_em
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }
    }

    // Buscar credenciais
    const { data: credentials } = await supabaseClient
      .from('api_credentials')
      .select('*')
      .eq('bar_id', barId)
      .single()

    if (!credentials?.access_token) {
      throw new Error('Credenciais do ContaAzul não encontradas')
    }

    // Definir período (padrão: mês atual)
    const dataInicio = body.data_inicio || 
      new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
    const dataFim = body.data_fim || 
      new Date().toISOString().split('T')[0]

    console.log(`📅 Período: ${dataInicio} até ${dataFim}`)

    // Registrar início da sincronização
    const { data: logEntry } = await supabaseClient
      .from('contaazul_sync_log')
      .insert({
        bar_id: barId,
        tipo_operacao: 'COLETA_DETALHES',
        periodo_inicio: dataInicio,
        periodo_fim: dataFim
      })
      .select()
      .single()

    const logId = logEntry?.id
    const inicioExecucao = Date.now()

    let resultado = {
      receitas: { total: 0, processadas: 0, erros: 0 },
      despesas: { total: 0, processadas: 0, erros: 0 },
      dados_auxiliares: { categorias: 0, centros_custo: 0, contas: 0 },
      detalhes: [] as string[]
    }

    try {
      // FASE 1: Coletar dados auxiliares
      console.log('📥 FASE 1: Coletando dados auxiliares...')
      await coletarDadosAuxiliares(credentials.access_token, barId, resultado, supabaseClient)

      // FASE 2: Coletar RECEITAS com detalhes
      console.log('💰 FASE 2: Coletando RECEITAS com detalhes...')
      await coletarFinanceiroComDetalhes(
        credentials.access_token, 
        barId, 
        'receitas',
        dataInicio, 
        dataFim, 
        resultado,
        supabaseClient
      )

      // FASE 3: Coletar DESPESAS com detalhes
      console.log('💸 FASE 3: Coletando DESPESAS com detalhes...')
      await coletarFinanceiroComDetalhes(
        credentials.access_token, 
        barId, 
        'despesas',
        dataInicio, 
        dataFim, 
        resultado,
        supabaseClient
      )

      // Atualizar log de sucesso
      const tempoExecucao = Date.now() - inicioExecucao
      await supabaseClient
        .from('contaazul_sync_log')
        .update({
          total_processado: resultado.receitas.total + resultado.despesas.total,
          total_sucesso: resultado.receitas.processadas + resultado.despesas.processadas,
          total_erro: resultado.receitas.erros + resultado.despesas.erros,
          tempo_execucao_ms: tempoExecucao,
          finalizado_em: new Date().toISOString()
        })
        .eq('id', logId)

      // Atualizar configuração
      await supabaseClient
        .from('contaazul_config')
        .upsert({
          bar_id: barId,
          ultima_sincronizacao: new Date().toISOString(),
          periodo_competencia_inicio: dataInicio,
          periodo_competencia_fim: dataFim
        })

      console.log('🎯 SINCRONIZAÇÃO AUTOMÁTICA CONCLUÍDA!')

      const response: SyncResponse = {
        success: true,
        message: '✅ Sincronização automática concluída com sucesso!',
        resultado,
        log_id: logId
      }

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })

    } catch (error) {
      // Registrar erro no log
      await supabaseClient
        .from('contaazul_sync_log')
        .update({
          detalhes_erro: error instanceof Error ? error.message : 'Erro desconhecido',
          tempo_execucao_ms: Date.now() - inicioExecucao,
          finalizado_em: new Date().toISOString()
        })
        .eq('id', logId)

      throw error
    }

  } catch (error) {
    console.error('❌ Erro na sincronização automática:', error)
    
    const response: SyncResponse = {
      success: false,
      message: 'Erro na sincronização automática',
      erro: error instanceof Error ? error.message : 'Erro desconhecido'
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

// ========== FUNÇÕES AUXILIARES ==========

async function coletarDadosAuxiliares(accessToken: string, barId: number, resultado: any, supabase: any) {
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }

  try {
    // Coletar categorias
    console.log('🏷️ Coletando categorias...')
    const categoriasResponse = await fetch('https://api-v2.contaazul.com/v1/categorias?tamanho_pagina=100', { headers })
    
    if (categoriasResponse.ok) {
      const categoriasData = await categoriasResponse.json()
      const categorias = categoriasData.dados || []
      
      for (const categoria of categorias) {
        await supabase
          .from('contaazul_categorias')
          .upsert({
            id: categoria.id,
            bar_id: barId,
            nome: categoria.nome,
            tipo: categoria.tipo,
            codigo: categoria.codigo,
            permite_filhos: categoria.permite_filhos,
            categoria_pai_id: categoria.categoria_pai?.id,
            entrada_dre: categoria.entrada_dre,
            ativo: true
          })
      }
      
      resultado.dados_auxiliares.categorias = categorias.length
      console.log(`✅ ${categorias.length} categorias coletadas`)
    }

    // Coletar centros de custo
    console.log('🎯 Coletando centros de custo...')
    const centrosResponse = await fetch('https://api-v2.contaazul.com/v1/centro-de-custo?tamanho_pagina=100', { headers })
    
    if (centrosResponse.ok) {
      const centrosData = await centrosResponse.json()
      const centros = centrosData.dados || []
      
      for (const centro of centros) {
        await supabase
          .from('contaazul_centros_custo')
          .upsert({
            id: centro.id,
            bar_id: barId,
            nome: centro.nome,
            codigo: centro.codigo,
            ativo: centro.ativo !== false
          })
      }
      
      resultado.dados_auxiliares.centros_custo = centros.length
      console.log(`✅ ${centros.length} centros de custo coletados`)
    }

    // Coletar contas financeiras
    console.log('🏦 Coletando contas financeiras...')
    const contasResponse = await fetch('https://api-v2.contaazul.com/v1/conta-financeira?tamanho_pagina=100', { headers })
    
    if (contasResponse.ok) {
      const contasData = await contasResponse.json()
      const contas = contasData.dados || []
      
      for (const conta of contas) {
        await supabase
          .from('contaazul_contas_financeiras')
          .upsert({
            id: conta.id,
            bar_id: barId,
            nome: conta.nome,
            tipo: conta.tipo,
            banco_numero: conta.banco?.numero,
            agencia: conta.agencia,
            conta: conta.conta,
            saldo_inicial: conta.saldo_inicial || 0,
            ativo: conta.ativo !== false
          })
      }
      
      resultado.dados_auxiliares.contas = contas.length
      console.log(`✅ ${contas.length} contas financeiras coletadas`)
    }

  } catch (error) {
    console.error('❌ Erro ao coletar dados auxiliares:', error)
    resultado.detalhes.push(`⚠️ Erro dados auxiliares: ${error}`)
  }
}

async function coletarFinanceiroComDetalhes(
  accessToken: string, 
  barId: number, 
  tipo: 'receitas' | 'despesas',
  dataInicio: string,
  dataFim: string,
  resultado: any,
  supabase: any
) {
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }

  const endpoint = tipo === 'receitas' 
    ? 'contas-a-receber/buscar'
    : 'contas-a-pagar/buscar'

  const tipoMaiusculo = tipo === 'receitas' ? 'RECEITA' : 'DESPESA'
  
  let pagina = 1
  const tamanhoPagina = 50
  let continuarColetando = true

  while (continuarColetando) {
    try {
      console.log(`📄 ${tipo} - Página ${pagina}...`)
      
      // PASSO 1: Buscar parcelas por competência
      const url = `https://api-v2.contaazul.com/v1/financeiro/eventos-financeiros/${endpoint}?` +
        `data_competencia_de=${dataInicio}&` +
        `data_competencia_ate=${dataFim}&` +
        `pagina=${pagina}&` +
        `tamanho_pagina=${tamanhoPagina}`

      const response = await fetch(url, { headers })
      
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const parcelas = data.dados || []
      
      if (parcelas.length === 0) {
        continuarColetando = false
        break
      }

      resultado[tipo].total += parcelas.length
      console.log(`📋 ${parcelas.length} ${tipo} encontradas na página ${pagina}`)

      // PASSO 2: Para cada parcela, buscar evento completo
      for (const parcela of parcelas) {
        try {
          await processarParcelaComDetalhes(accessToken, barId, parcela, tipoMaiusculo, supabase)
          resultado[tipo].processadas++
        } catch (error) {
          console.error(`❌ Erro ao processar parcela ${parcela.id}:`, error)
          resultado[tipo].erros++
          resultado.detalhes.push(`❌ Parcela ${parcela.id}: ${error}`)
        }
      }

      pagina++
      
      // Pausa para evitar rate limit
      if (pagina % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

    } catch (error) {
      console.error(`❌ Erro na página ${pagina} de ${tipo}:`, error)
      resultado[tipo].erros += tamanhoPagina
      continuarColetando = false
    }
  }
}

async function processarParcelaComDetalhes(
  accessToken: string, 
  barId: number, 
  parcela: any, 
  tipo: string,
  supabase: any
) {
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }

  // PASSO 2: Buscar detalhes completos da parcela
  const detalhesUrl = `https://api-v2.contaazul.com/v1/financeiro/eventos-financeiros/parcelas/${parcela.id}`
  
  const detalhesResponse = await fetch(detalhesUrl, { headers })
  
  if (!detalhesResponse.ok) {
    throw new Error(`Erro ao buscar detalhes da parcela: ${detalhesResponse.status}`)
  }

  const detalhesData = await detalhesResponse.json()
  const evento = detalhesData.evento
  
  if (!evento || !evento.rateio) {
    // Inserir sem categoria/centro custo se não tiver rateio
    await inserirVisaoCompetencia(barId, parcela, null, null, tipo, supabase)
    return
  }

  // PASSO 3: Processar cada item do rateio (categoria + centro custo)
  for (const itemRateio of evento.rateio) {
    const categoriaId = itemRateio.id_categoria
    let categoriaNome = null
    
    // Buscar nome da categoria no cache
    if (categoriaId) {
      const { data: categoria } = await supabase
        .from('contaazul_categorias')
        .select('nome')
        .eq('id', categoriaId)
        .single()
      
      categoriaNome = categoria?.nome
    }

    // Processar centros de custo do rateio
    const centrosCusto = itemRateio.rateio_centro_custo || []
    
    if (centrosCusto.length === 0) {
      // Inserir sem centro de custo
      await inserirVisaoCompetencia(barId, parcela, {
        id: categoriaId,
        nome: categoriaNome,
        valor: itemRateio.valor
      }, null, tipo, supabase)
    } else {
      // Inserir para cada centro de custo
      for (const centroCusto of centrosCusto) {
        let centroCustoNome = null
        
        if (centroCusto.id_centro_custo) {
          const { data: centro } = await supabase
            .from('contaazul_centros_custo')
            .select('nome')
            .eq('id', centroCusto.id_centro_custo)
            .single()
          
          centroCustoNome = centro?.nome
        }

        await inserirVisaoCompetencia(barId, parcela, {
          id: categoriaId,
          nome: categoriaNome,
          valor: itemRateio.valor
        }, {
          id: centroCusto.id_centro_custo,
          nome: centroCustoNome,
          valor: centroCusto.valor
        }, tipo, supabase)
      }
    }
  }
}

async function inserirVisaoCompetencia(
  barId: number, 
  parcela: any, 
  categoria: any, 
  centroCusto: any, 
  tipo: string,
  supabase: any
) {
  const clienteFornecedor = tipo === 'RECEITA' 
    ? parcela.cliente 
    : parcela.fornecedor

  await supabase
    .from('contaazul_visao_competencia')
    .upsert({
      bar_id: barId,
      parcela_id: parcela.id,
      evento_id: parcela.evento_id,
      tipo,
      descricao: parcela.descricao,
      valor: parseFloat(parcela.total || parcela.valor || 0),
      data_vencimento: parcela.data_vencimento,
      data_competencia: parcela.data_competencia,
      data_pagamento: parcela.data_pagamento,
      categoria_id: categoria?.id,
      categoria_nome: categoria?.nome,
      categoria_valor: categoria?.valor ? parseFloat(categoria.valor) : null,
      centro_custo_id: centroCusto?.id,
      centro_custo_nome: centroCusto?.nome,
      centro_custo_valor: centroCusto?.valor ? parseFloat(centroCusto.valor) : null,
      cliente_fornecedor_id: clienteFornecedor?.id,
      cliente_fornecedor_nome: clienteFornecedor?.nome,
      status: parcela.status,
      conta_financeira_id: parcela.conta_financeira?.id,
      conta_financeira_nome: parcela.conta_financeira?.nome
    }, {
      onConflict: 'bar_id,parcela_id'
    })
} 