import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { batch_id, batch_size = 20 } = await req.json();

    if (!batch_id) {
      throw new Error('batch_id é obrigatório');
    }

    console.log(`🚀 NIBO Orchestrator V2 - Batch ${batch_id}`);

    // Atualizar status para processing
    await supabase
      .from('nibo_background_jobs')
      .update({
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .eq('batch_id', batch_id);

    // Contar total de pendentes
    const { count: totalPendentes } = await supabase
      .from('nibo_temp_agendamentos')
      .select('*', { count: 'exact', head: true })
      .eq('batch_id', batch_id)
      .eq('processed', false);

    console.log(`📊 Total de agendamentos pendentes: ${totalPendentes}`);

    let totalProcessed = 0;
    let totalInserted = 0;
    let totalErrors = 0;
    let iteration = 0;
    const maxIterations = Math.ceil((totalPendentes || 0) / batch_size) + 1;

    // Processar em batches
    while (iteration < maxIterations) {
      iteration++;
      console.log(`🔄 Iteração ${iteration}/${maxIterations}`);
      
      try {
        // Chamar o worker
        const response = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/nibo-worker-agendamentos-v2`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
            },
            body: JSON.stringify({
              batch_id: batch_id,
              batch_size: batch_size
            })
          }
        );

        if (!response.ok) {
          const error = await response.text();
          console.error(`❌ Worker erro: ${error}`);
          break;
        }

        const result = await response.json();
        
        if (result.processed === 0) {
          console.log('✅ Não há mais agendamentos para processar');
          break;
        }

        totalProcessed += result.processed || 0;
        totalInserted += result.inserted || 0;
        totalErrors += result.errors || 0;

        console.log(`📊 Batch processado: ${result.processed} itens`);
        
        // Pequena pausa entre batches
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`❌ Erro na iteração ${iteration}:`, error);
        totalErrors++;
        break;
      }
    }

    // Atualizar status final
    await supabase
      .from('nibo_background_jobs')
      .update({
        processed_records: totalProcessed,
        status: 'completed',
        completed_at: new Date().toISOString(),
        error_message: totalErrors > 0 ? `${totalErrors} erros durante processamento` : null
      })
      .eq('batch_id', batch_id);

    console.log(`✅ Processamento concluído: ${totalProcessed} processados, ${totalInserted} inseridos`);

    return new Response(JSON.stringify({
      success: true,
      batch_id: batch_id,
      processed_count: totalProcessed,
      inserted_count: totalInserted,
      error_count: totalErrors,
      message: `Processados ${totalProcessed} agendamentos`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erro no orchestrator:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
