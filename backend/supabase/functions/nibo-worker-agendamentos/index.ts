import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    const { batch_id } = await req.json();

    if (!batch_id) {
      throw new Error('batch_id é obrigatório');
    }

    console.log(`🚀 NIBO Worker - Processamento automático via trigger para batch: ${batch_id}`);

    // Verificar quantos registros existem no batch
    const { data: batchInfo, error: batchError } = await supabase
      .from('nibo_temp_agendamentos')
      .select('id, processed')
      .eq('batch_id', batch_id);

    if (batchError) {
      throw batchError;
    }

    const totalRecords = batchInfo?.length || 0;
    const processedRecords = batchInfo?.filter(item => item.processed).length || 0;
    const pendingRecords = totalRecords - processedRecords;

    console.log(`📊 Batch ${batch_id}: ${totalRecords} total, ${processedRecords} processados, ${pendingRecords} pendentes`);

    // O processamento acontece automaticamente via trigger PostgreSQL
    // Não precisamos mais fazer nada aqui - o trigger cuida de tudo!

    // Aguardar um pouco para dar tempo do trigger processar (se houver registros pendentes)
    if (pendingRecords > 0) {
      console.log(`⏳ Aguardando trigger processar ${pendingRecords} registros...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Verificar status final
    const { data: finalStatus, error: finalError } = await supabase
      .from('nibo_temp_agendamentos')
      .select('processed')
      .eq('batch_id', batch_id);

    if (finalError) {
      throw finalError;
    }

    const finalProcessed = finalStatus?.filter(item => item.processed).length || 0;
    const finalPending = (finalStatus?.length || 0) - finalProcessed;

    // Atualizar status do background job
    await supabase
      .from('nibo_background_jobs')
      .update({
        processed_records: finalProcessed,
        status: finalPending > 0 ? 'partial' : 'completed',
        completed_at: new Date().toISOString(),
        error_message: finalPending > 0 ? `${finalPending} registros ainda pendentes` : null
      })
      .eq('batch_id', batch_id);

    const response = {
      success: true,
      batch_id: batch_id,
      processed_count: finalProcessed,
      pending_count: finalPending,
      total_count: totalRecords,
      message: `Batch processado via trigger: ${finalProcessed}/${totalRecords} agendamentos (${finalPending} pendentes)`,
      processing_method: 'PostgreSQL Trigger (Auto)'
    };

    console.log('✅ NIBO Worker concluído via trigger:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erro no NIBO worker:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      processing_method: 'PostgreSQL Trigger (Auto)'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});