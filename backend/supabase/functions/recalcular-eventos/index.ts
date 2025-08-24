import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔄 Iniciando recálculo de eventos...')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data_inicio, data_fim, force_all } = await req.json()

    let query = `
      DO $$
      DECLARE
          evento_record RECORD;
          total_recalculados INTEGER := 0;
      BEGIN
          -- Recalcular eventos do período especificado
          FOR evento_record IN 
              SELECT id FROM eventos_base 
              WHERE data_evento BETWEEN $1 AND $2
              ORDER BY data_evento
              LIMIT 50  -- Processar 50 por vez para não travar
          LOOP
              PERFORM calculate_evento_metrics(evento_record.id);
              total_recalculados := total_recalculados + 1;
          END LOOP;
          
          RAISE NOTICE 'Total de eventos recalculados: %', total_recalculados;
      END $$;
    `

    // Se force_all for true, recalcular todos os eventos pendentes
    if (force_all) {
      query = `
        DO $$
        DECLARE
            evento_record RECORD;
            total_recalculados INTEGER := 0;
        BEGIN
            -- Recalcular todos os eventos marcados como pendentes
            FOR evento_record IN 
                SELECT id FROM eventos_base 
                WHERE precisa_recalculo = TRUE 
                ORDER BY data_evento DESC
                LIMIT 100  -- Processar 100 por vez
            LOOP
                PERFORM calculate_evento_metrics(evento_record.id);
                total_recalculados := total_recalculados + 1;
            END LOOP;
            
            RAISE NOTICE 'Total de eventos pendentes recalculados: %', total_recalculados;
        END $$;
      `
    }

    console.log('📊 Executando recálculo...')
    
    if (force_all) {
      const { error } = await supabase.rpc('exec_sql', { 
        sql_query: query 
      })
      
      if (error) {
        console.error('❌ Erro ao executar recálculo:', error)
        throw error
      }
    } else {
      // Para período específico, usar parâmetros
      const startDate = data_inicio || '2025-08-01'
      const endDate = data_fim || '2025-08-31'
      
      const { error } = await supabase.rpc('exec_sql', { 
        sql_query: query,
        params: [startDate, endDate]
      })
      
      if (error) {
        console.error('❌ Erro ao executar recálculo:', error)
        throw error
      }
    }

    // Verificar resultados
    const { data: eventosAtualizados, error: selectError } = await supabase
      .from('eventos_base')
      .select('id, data_evento, nome, te_real, tb_real, real_r, cl_real')
      .gte('data_evento', data_inicio || '2025-08-01')
      .lte('data_evento', data_fim || '2025-08-31')
      .order('data_evento')
      .limit(10)

    if (selectError) {
      console.error('❌ Erro ao verificar resultados:', selectError)
    }

    console.log('✅ Recálculo concluído!')
    console.log(`📊 Eventos verificados: ${eventosAtualizados?.length || 0}`)

    return new Response(JSON.stringify({
      success: true,
      message: 'Recálculo de eventos concluído',
      periodo: {
        inicio: data_inicio || '2025-08-01',
        fim: data_fim || '2025-08-31'
      },
      eventos_verificados: eventosAtualizados?.length || 0,
      sample_eventos: eventosAtualizados?.slice(0, 5) || []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('❌ Erro no recálculo de eventos:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
