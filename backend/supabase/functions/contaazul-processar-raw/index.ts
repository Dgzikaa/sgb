import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RequestBody {
  bar_id: number
  lote_size?: number
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
    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

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

    const body: RequestBody = await req.json()
    const { bar_id, lote_size = 50 } = body
    
    if (!bar_id) {
      throw new Error('bar_id é obrigatório')
    }

    console.log(`🔄 Iniciando processamento RAW para bar_id: ${bar_id}`)

    // Buscar token válido
    const { data: credentiaisData } = await supabaseClient
      .from('contaazul_credentials')
      .select('access_token, refresh_token, expires_at')
      .eq('bar_id', bar_id)
      .eq('sistema', 'contaazul')
      .eq('ativo', true)
      .single()

    if (!credentiaisData) {
      throw new Error('Credenciais ContaAzul não encontradas')
    }

    let accessToken = credentiaisData.access_token

    // Verificar se token precisa ser renovado
    const agora = new Date()
    const expiraEm = new Date(credentiaisData.expires_at)
    const margem = 5 * 60 * 1000 // 5 minutos de margem

    if (expiraEm.getTime() - agora.getTime() < margem) {
      console.log('🔄 Token expirando, renovando...')
      // Aqui você implementaria a renovação do token se necessário
      // Por enquanto, vamos usar o token atual
    }

    console.log('✅ Token válido obtido')

    // Buscar parcelas RAW não processadas em lotes
    const { data: parcelasRaw, error } = await supabaseClient
      .from('contaazul_raw_parcelas')
      .select('*')
      .eq('bar_id', bar_id)
      .eq('processado', false)
      .limit(lote_size)

    if (error) {
      throw new Error(`Erro ao buscar parcelas RAW: ${error.message}`)
    }

    if (!parcelasRaw || parcelasRaw.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Nenhuma parcela RAW para processar',
          processadas: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    console.log(`📋 Processando ${parcelasRaw.length} parcelas RAW...`)

    let processadas = 0
    let erros = 0

    // Processar cada parcela RAW
    for (const parcelaRaw of parcelasRaw) {
      try {
        await processarParcelaIndividual(
          accessToken,
          bar_id,
          parcelaRaw,
          supabaseClient
        )
        
        // Marcar como processada
        await supabaseClient
          .from('contaazul_raw_parcelas')
          .update({ 
            processado: true, 
            processado_em: new Date().toISOString() 
          })
          .eq('id', parcelaRaw.id)

        processadas++
        
        if (processadas % 10 === 0) {
          console.log(`✅ ${processadas} parcelas processadas...`)
        }

      } catch (error) {
        console.error(`❌ Erro ao processar parcela ${parcelaRaw.parcela_id}:`, error)
        
        // Marcar erro na parcela
        await supabaseClient
          .from('contaazul_raw_parcelas')
          .update({ 
            erro_processamento: error instanceof Error ? error.message : 'Erro desconhecido',
            tentativas_processamento: (parcelaRaw.tentativas_processamento || 0) + 1
          })
          .eq('id', parcelaRaw.id)

        erros++
      }

      // Pequena pausa para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    const response = {
      success: true,
      message: `Processamento de lote concluído`,
      bar_id,
      lote_processado: {
        total: parcelasRaw.length,
        processadas,
        erros
      },
      proxima_acao: processadas > 0 
        ? 'Execute novamente para processar próximo lote'
        : 'Todos os dados foram processados'
    }

    console.log('🎯 Lote processado:', response.lote_processado)

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('❌ Erro no processamento RAW:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

// Processar parcela individual - buscar detalhes e salvar na tabela final
async function processarParcelaIndividual(
  accessToken: string,
  barId: number,
  parcelaRaw: any,
  supabaseClient: any
) {
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }

  // PASSO 1: Buscar detalhes da parcela
  const detalhesUrl = `https://api-v2.contaazul.com/v1/financeiro/eventos-financeiros/parcelas/${parcelaRaw.parcela_id}`
  
  const detalhesResponse = await fetch(detalhesUrl, { headers })
  
  if (!detalhesResponse.ok) {
    throw new Error(`Erro ao buscar detalhes da parcela: ${detalhesResponse.status}`)
  }

  const detalhesData = await detalhesResponse.json()
  const evento = detalhesData.evento
  const parcela = parcelaRaw.raw_data // Dados básicos da parcela

  if (!evento || !evento.rateio) {
    // Inserir sem categoria/centro custo se não tiver rateio
    await inserirVisaoCompetencia(supabaseClient, barId, parcela, null, null, parcelaRaw.tipo)
    return
  }

  // PASSO 2: Processar cada item do rateio (categoria + centro custo)
  for (const itemRateio of evento.rateio) {
    const categoriaId = itemRateio.id_categoria
    let categoriaNome = null
    
    // Buscar nome da categoria no cache
    if (categoriaId) {
      const { data: categoria } = await supabaseClient
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
      await inserirVisaoCompetencia(supabaseClient, barId, parcela, {
        id: categoriaId,
        nome: categoriaNome,
        valor: itemRateio.valor
      }, null, parcelaRaw.tipo)
    } else {
      // Inserir para cada centro de custo
      for (const centroCusto of centrosCusto) {
        let centroCustoNome = null
        
        if (centroCusto.id_centro_custo) {
          const { data: centro } = await supabaseClient
            .from('contaazul_centros_custo')
            .select('nome')
            .eq('id', centroCusto.id_centro_custo)
            .single()
          
          centroCustoNome = centro?.nome
        }

        await inserirVisaoCompetencia(supabaseClient, barId, parcela, {
          id: categoriaId,
          nome: categoriaNome,
          valor: itemRateio.valor
        }, {
          id: centroCusto.id_centro_custo,
          nome: centroCustoNome,
          valor: centroCusto.valor
        }, parcelaRaw.tipo)
      }
    }
  }
}

// Inserir na tabela de visão de competência
async function inserirVisaoCompetencia(
  supabaseClient: any,
  barId: number, 
  parcela: any, 
  categoria: any, 
  centroCusto: any, 
  tipo: string
) {
  const clienteFornecedor = tipo === 'RECEITA' 
    ? parcela.cliente 
    : parcela.fornecedor

  await supabaseClient
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