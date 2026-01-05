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

    const { action = 'run_all', bar_id } = await req.json()

    if (action === 'run_all') {
      // Buscar todos os bares com agente ativo
      const { data: configuracoes } = await supabase
        .from('agente_configuracoes')
        .select('bar_id, tipo_agente, frequencia_scan')
        .eq('ativo', true)

      if (!configuracoes || configuracoes.length === 0) {
        return new Response(
          JSON.stringify({ message: 'Nenhum agente ativo encontrado' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const resultados = []

      // Executar scan para cada bar
      for (const config of configuracoes) {
        try {
          const scannerUrl = `${supabaseUrl}/functions/v1/agente-scanner`
          const response = await fetch(scannerUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              bar_id: config.bar_id,
              tipo_scan: config.tipo_agente
            })
          })

          const result = await response.json()
          resultados.push({
            bar_id: config.bar_id,
            status: 'success',
            result
          })
        } catch (error) {
          resultados.push({
            bar_id: config.bar_id,
            status: 'error',
            error: error.message
          })
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          total_processado: resultados.length,
          resultados
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'run_single' && bar_id) {
      // Executar scan para um bar específico
      const scannerUrl = `${supabaseUrl}/functions/v1/agente-scanner`
      const response = await fetch(scannerUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bar_id,
          tipo_scan: 'completo'
        })
      })

      const result = await response.json()

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    throw new Error('Ação inválida')

  } catch (error) {
    console.error('Erro no agente-orchestrator:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
