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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { bar_id } = await req.json()

    if (!bar_id) {
      throw new Error('bar_id é obrigatório')
    }

    console.log(`Configurando agente inteligente para bar_id: ${bar_id}`)

    // 1. Criar configurações para todos os tipos de agente
    const tiposAgente = ['operacional', 'financeiro', 'experiencia', 'equipe']
    const configsCriadas = []

    for (const tipo of tiposAgente) {
      const { data: configExistente } = await supabase
        .from('agente_configuracoes')
        .select('*')
        .eq('bar_id', bar_id)
        .eq('tipo_agente', tipo)
        .single()

      if (!configExistente) {
        const { data: novaConfig, error } = await supabase
          .from('agente_configuracoes')
          .insert({
            bar_id,
            tipo_agente: tipo,
            ativo: true,
            frequencia_scan: 3600, // 1 hora
            notificacoes_ativas: true,
            metricas_monitoradas: [],
            thresholds: {}
          })
          .select()
          .single()

        if (!error) {
          configsCriadas.push(novaConfig)
          console.log(`✅ Configuração ${tipo} criada`)
        } else {
          console.error(`❌ Erro ao criar configuração ${tipo}:`, error)
        }
      } else {
        console.log(`ℹ️ Configuração ${tipo} já existe`)
        configsCriadas.push(configExistente)
      }
    }

    // 2. Executar scan inicial de teste
    console.log('Executando scan inicial...')
    
    const scannerUrl = `${supabaseUrl}/functions/v1/agente-scanner`
    const scanResponse = await fetch(scannerUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bar_id,
        tipo_scan: 'completo',
        periodo_dias: 7
      })
    })

    const scanResult = await scanResponse.json()
    console.log('Scan inicial completado:', scanResult)

    // 3. Aguardar processamento
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 4. Verificar insights e alertas gerados
    const { data: insights } = await supabase
      .from('agente_insights')
      .select('*')
      .eq('bar_id', bar_id)
      .order('created_at', { ascending: false })
      .limit(10)

    const { data: alertas } = await supabase
      .from('agente_alertas')
      .select('*')
      .eq('bar_id', bar_id)
      .order('created_at', { ascending: false })
      .limit(10)

    const { data: metricas } = await supabase
      .from('agente_metricas')
      .select('*')
      .eq('bar_id', bar_id)
      .order('created_at', { ascending: false })
      .limit(20)

    // 5. Resumo da configuração
    const resumo = {
      status: 'success',
      bar_id,
      configuracoes_criadas: configsCriadas.length,
      scan_inicial: scanResult,
      estatisticas: {
        insights_gerados: insights?.length || 0,
        alertas_gerados: alertas?.length || 0,
        metricas_coletadas: metricas?.length || 0
      },
      proximos_passos: [
        'Acesse /visao-geral/agente-inteligente para ver os insights',
        'Configure as notificações em /configuracoes/agente-inteligente',
        'Monitore as métricas em /visao-geral/metricas-agente',
        'O agente executará análises automáticas conforme a frequência configurada'
      ]
    }

    console.log('✅ Setup completo:', resumo)

    return new Response(
      JSON.stringify(resumo),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Erro no setup:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
