import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

console.log("🎯 ContaHub Orchestrator - Coordenador de Processamento");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessingRequest {
  bar_id?: number;
  data_date?: string;
  start_date?: string;
  end_date?: string;
  data_types?: string[];
  force_reprocess?: boolean;
}

interface WorkerConfig {
  function_name: string;
  batch_size: number;
  timeout_seconds: number;
}

const WORKER_CONFIGS: Record<string, WorkerConfig> = {
  analitico: {
    function_name: 'contahub-worker-analitico',
    batch_size: 500,
    timeout_seconds: 30
  },
  pagamentos: {
    function_name: 'contahub-worker-pagamentos', 
    batch_size: 1000,
    timeout_seconds: 30
  },
  fatporhora: {
    function_name: 'contahub-worker-fatporhora',
    batch_size: 500,
    timeout_seconds: 30
  },
  periodo: {
    function_name: 'contahub-worker-periodo',
    batch_size: 200,
    timeout_seconds: 30
  },
  tempo: {
    function_name: 'contahub-worker-tempo',
    batch_size: 500,
    timeout_seconds: 30
  }
};

async function createProcessingJobs(supabase: any, request: ProcessingRequest) {
  console.log('📋 Criando jobs de processamento...', request);
  
  // Buscar dados raw pendentes
  let query = supabase
    .from('contahub_raw_data')
    .select('id, bar_id, data_type, data_date, raw_json')
    .eq('processed', false);
  
  if (request.bar_id) {
    query = query.eq('bar_id', request.bar_id);
  }
  
  if (request.data_date) {
    query = query.eq('data_date', request.data_date);
  } else if (request.start_date && request.end_date) {
    query = query.gte('data_date', request.start_date)
                 .lte('data_date', request.end_date);
  }
  
  if (request.data_types && request.data_types.length > 0) {
    query = query.in('data_type', request.data_types);
  }
  
  const { data: rawDataList, error } = await query.order('data_date', { ascending: true });
  
  if (error) {
    throw new Error(`Erro ao buscar dados raw: ${error.message}`);
  }
  
  if (!rawDataList || rawDataList.length === 0) {
    console.log('⚠️ Nenhum dado raw pendente encontrado');
    return [];
  }
  
  console.log(`📊 Encontrados ${rawDataList.length} registros raw para processar`);
  
  // Criar jobs na fila
  const jobs = [];
  
  for (const rawData of rawDataList) {
    const config = WORKER_CONFIGS[rawData.data_type];
    if (!config) {
      console.error(`❌ Configuração não encontrada para tipo: ${rawData.data_type}`);
      continue;
    }
    
    // Calcular total de registros
    let totalCount = 0;
    if (rawData.raw_json?.list && Array.isArray(rawData.raw_json.list)) {
      totalCount = rawData.raw_json.list.length;
    } else if (Array.isArray(rawData.raw_json)) {
      totalCount = rawData.raw_json.length;
    }
    
    const job = {
      raw_data_id: rawData.id,
      bar_id: rawData.bar_id,
      data_type: rawData.data_type,
      data_date: rawData.data_date,
      worker_function: config.function_name,
      batch_size: config.batch_size,
      total_count: totalCount,
      status: 'pending'
    };
    
    jobs.push(job);
  }
  
  if (jobs.length > 0) {
    const { error: insertError } = await supabase
      .from('contahub_processing_queue')
      .insert(jobs);
    
    if (insertError) {
      throw new Error(`Erro ao criar jobs: ${insertError.message}`);
    }
  }
  
  console.log(`✅ ${jobs.length} jobs criados na fila`);
  return jobs;
}

async function processNextBatch(supabase: any) {
  console.log('🔄 Processando próximo batch...');
  
  // Buscar próximos jobs pendentes (máximo 5 em paralelo)
  const { data: pendingJobs, error: fetchError } = await supabase
    .from('contahub_processing_queue')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(5);
  
  if (fetchError) {
    throw new Error(`Erro ao buscar jobs: ${fetchError.message}`);
  }
  
  if (!pendingJobs || pendingJobs.length === 0) {
    console.log('✅ Nenhum job pendente');
    return { processed: 0, pending: 0 };
  }
  
  console.log(`📦 Processando ${pendingJobs.length} jobs em paralelo`);
  
  // Marcar jobs como processing
  const jobIds = pendingJobs.map(j => j.id);
  await supabase
    .from('contahub_processing_queue')
    .update({ status: 'processing', started_at: new Date().toISOString() })
    .in('id', jobIds);
  
  // Processar jobs em paralelo
  const promises = pendingJobs.map(async (job) => {
    try {
      console.log(`🚀 Disparando worker ${job.worker_function} para job ${job.id}`);
      
      // Chamar worker específico
      const response = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/${job.worker_function}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({
            job_id: job.id,
            raw_data_id: job.raw_data_id,
            batch_size: job.batch_size
          })
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        
        // Atualizar status do job
        await supabase
          .from('contahub_processing_queue')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            processed_count: result.processed_count || job.total_count
          })
          .eq('id', job.id);
        
        console.log(`✅ Job ${job.id} concluído: ${result.processed_count} registros`);
        return { success: true, job_id: job.id };
      } else {
        throw new Error(`Worker retornou erro: ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ Erro no job ${job.id}:`, error);
      
      // Incrementar retry count
      const newRetryCount = (job.retry_count || 0) + 1;
      const newStatus = newRetryCount >= 3 ? 'failed' : 'pending';
      
      await supabase
        .from('contahub_processing_queue')
        .update({
          status: newStatus,
          retry_count: newRetryCount,
          error_message: error.message
        })
        .eq('id', job.id);
      
      return { success: false, job_id: job.id, error: error.message };
    }
  });
  
  const results = await Promise.all(promises);
  const successCount = results.filter(r => r.success).length;
  
  // Contar jobs pendentes restantes
  const { count: pendingCount } = await supabase
    .from('contahub_processing_queue')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');
  
  return {
    processed: successCount,
    failed: results.length - successCount,
    pending: pendingCount || 0
  };
}

async function getProcessingStatus(supabase: any) {
  const { data, error } = await supabase
    .from('contahub_processing_queue')
    .select('status')
    .order('created_at', { ascending: false })
    .limit(100);
  
  if (error) {
    throw new Error(`Erro ao buscar status: ${error.message}`);
  }
  
  const stats = {
    total: data.length,
    pending: data.filter(d => d.status === 'pending').length,
    processing: data.filter(d => d.status === 'processing').length,
    completed: data.filter(d => d.status === 'completed').length,
    failed: data.filter(d => d.status === 'failed').length
  };
  
  return stats;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Variáveis de ambiente não configuradas');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const body = await req.json() as ProcessingRequest & { action?: string };
    const action = body.action || 'process';
    
    console.log(`🎯 Ação solicitada: ${action}`, body);
    
    switch (action) {
      case 'create_jobs':
        // Apenas criar jobs na fila
        const jobs = await createProcessingJobs(supabase, body);
        return new Response(JSON.stringify({
          success: true,
          jobs_created: jobs.length,
          jobs
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      
      case 'process_batch':
        // Processar próximo batch
        const batchResult = await processNextBatch(supabase);
        return new Response(JSON.stringify({
          success: true,
          ...batchResult
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      
      case 'status':
        // Verificar status geral
        const status = await getProcessingStatus(supabase);
        return new Response(JSON.stringify({
          success: true,
          status
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      
      case 'process':
      default:
        // Fluxo completo: criar jobs e processar
        const createdJobs = await createProcessingJobs(supabase, body);
        
        if (createdJobs.length === 0) {
          return new Response(JSON.stringify({
            success: true,
            message: 'Nenhum dado pendente para processar'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // Processar em loop até acabar
        let totalProcessed = 0;
        let pendingCount = createdJobs.length;
        
        while (pendingCount > 0) {
          const result = await processNextBatch(supabase);
          totalProcessed += result.processed;
          pendingCount = result.pending;
          
          console.log(`📊 Progresso: ${totalProcessed} processados, ${pendingCount} pendentes`);
          
          // Pequena pausa entre batches
          if (pendingCount > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        const finalStatus = await getProcessingStatus(supabase);
        
        return new Response(JSON.stringify({
          success: true,
          message: 'Processamento concluído',
          total_processed: totalProcessed,
          final_status: finalStatus
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('❌ Erro no orchestrator:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
