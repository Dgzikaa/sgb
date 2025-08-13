import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface ProcessingRequest {
  batch_id: string;
  batch_size?: number;
  max_parallel?: number;
}

async function processBatch(supabase: SupabaseClient, batchId: string, batchSize: number = 50) {
  console.log(`🔄 Iniciando processamento do batch ${batchId}`);
  
  try {
    // Chamar o worker
    const response = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/nibo-worker-agendamentos`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({
          batch_id: batchId,
          batch_size: batchSize
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Worker retornou erro: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`✅ Batch ${batchId} processado:`, result);
    
    return result;
  } catch (error) {
    console.error(`❌ Erro ao processar batch ${batchId}:`, error);
    
    // Atualizar status do job com erro
    await supabase
      .from('nibo_background_jobs')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : String(error),
        completed_at: new Date().toISOString()
      })
      .eq('batch_id', batchId);
    
    throw error instanceof Error ? error : new Error(String(error));
  }
}

async function getProcessingStatus(supabase: SupabaseClient, batchId: string) {
  const { data, error } = await supabase
    .from('nibo_background_jobs')
    .select('*')
    .eq('batch_id', batchId)
    .single();

  if (error) {
    throw new Error(`Erro ao buscar status: ${error.message}`);
  }

  return data;
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

    const body: ProcessingRequest = await req.json();
    const { batch_id, batch_size = 50 } = body;

    if (!batch_id) {
      throw new Error('batch_id é obrigatório');
    }

    console.log(`🚀 NIBO Orchestrator iniciado para batch ${batch_id}`);

    // Atualizar status para processing
    await supabase
      .from('nibo_background_jobs')
      .update({
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .eq('batch_id', batch_id);

    // Processar o batch
    const result = await processBatch(supabase, batch_id, batch_size);

    // Buscar status final
    const finalStatus = await getProcessingStatus(supabase, batch_id);

    // Enviar notificação Discord
    const discordMessage = {
      webhook_type: 'nibo' as const,
      custom_message: `🔄 **NIBO Finalizado**

📊 **Resumo:**
• **Batch:** \`${batch_id.substring(0, 7)}\`
• **Processados:** ${result.processed_count}/${finalStatus.total_records}
• **Inseridos:** ${result.inserted_count}
• **Erros:** ${result.error_count}
• **Tempo:** ${Math.round((new Date(finalStatus.completed_at).getTime() - new Date(finalStatus.started_at).getTime()) / 1000)}s
• **Tipo:** agendamentos

⏰ **Concluído:** ${new Date().toLocaleString('pt-BR')}
🚀 **Status:** ${result.error_count === 0 ? 'Batch finalizado com sucesso!' : `Finalizado com ${result.error_count} erros`}`
    };

    try {
      await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/discord-notification`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify(discordMessage)
        }
      );
    } catch (error) {
      console.error('❌ Erro ao enviar notificação Discord:', error instanceof Error ? error.message : 'Erro desconhecido');
    }

    return new Response(JSON.stringify({
      success: true,
      batch_id: batch_id,
      status: finalStatus,
      result: result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erro no NIBO Orchestrator:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
