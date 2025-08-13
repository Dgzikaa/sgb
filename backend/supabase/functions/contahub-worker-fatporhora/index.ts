import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

console.log("⚙️ ContaHub Worker - Faturamento por Hora");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WorkerRequest {
  job_id: string;
  raw_data_id: number;
  batch_size: number;
}

interface FatPorHoraRecord {
  vd_dtgerencial: string;
  hora: number;
  valor: number;
  dds: number;
  dia: string;
  qtd: number;
}

function parseFatPorHoraData(rawJson: any): FatPorHoraRecord[] {
  if (!rawJson || !rawJson.list || !Array.isArray(rawJson.list)) {
    console.warn('⚠️ Formato inesperado de dados de faturamento por hora');
    return [];
  }
  
  return rawJson.list.map((item: any) => ({
    vd_dtgerencial: item.vd_dtgerencial ? item.vd_dtgerencial.split('T')[0] : null,
    hora: parseInt(item.hora) || 0,
    valor: parseFloat(item['$valor']) || 0,
    dds: parseInt(item.dds) || 0,
    dia: item.dia || '',
    qtd: parseInt(item.qtd) || 0
  }));
}

async function processFatPorHora(supabase: any, rawData: any, batchSize: number) {
  console.log(`📈 Processando faturamento por hora (raw_id: ${rawData.id})`);
  
  const records = parseFatPorHoraData(rawData.raw_json);
  if (records.length === 0) {
    console.warn('⚠️ Nenhum registro de faturamento por hora para processar');
    return { processed: 0, inserted: 0 };
  }
  
  console.log(`📦 Total de registros: ${records.length}`);
  
  let totalInserted = 0;
  let processedCount = 0;
  
  // Processar em batches
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    console.log(`🔄 Processando batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(records.length/batchSize)} (${batch.length} registros)`);
    
    // Preparar dados para inserção
    const insertData = batch.map(record => ({
      bar_id: rawData.bar_id,
      ...record
    }));
    
    // Usar upsert para idempotência
    const { data, error } = await supabase
      .from('contahub_fatporhora')
      .upsert(insertData, {
        onConflict: 'idempotency_key',
        ignoreDuplicates: false
      })
      .select();
    
    if (error) {
      console.error(`❌ Erro ao inserir batch:`, error);
    } else {
      const inserted = data?.length || 0;
      totalInserted += inserted;
      console.log(`✅ Batch inserido: ${inserted} registros`);
    }
    
    processedCount += batch.length;
    
    if (i + batchSize < records.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Marcar raw_data como processado se tudo correu bem
  if (totalInserted > 0) {
    await supabase
      .from('contahub_raw_data')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('id', rawData.id);
  }
  
  return { processed: processedCount, inserted: totalInserted };
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
    
    const { job_id, raw_data_id, batch_size = 500 } = await req.json() as WorkerRequest;
    
    console.log(`🎯 Worker FatPorHora iniciado - Job: ${job_id}, Raw: ${raw_data_id}`);
    
    // Buscar dados raw
    const { data: rawData, error: fetchError } = await supabase
      .from('contahub_raw_data')
      .select('*')
      .eq('id', raw_data_id)
      .single();
    
    if (fetchError || !rawData) {
      throw new Error(`Raw data não encontrado: ${fetchError?.message}`);
    }
    
    // Processar dados
    const result = await processFatPorHora(supabase, rawData, batch_size);
    
    console.log(`✅ Processamento concluído: ${result.inserted}/${result.processed} registros inseridos`);
    
    return new Response(JSON.stringify({
      success: true,
      job_id,
      raw_data_id,
      processed_count: result.processed,
      inserted_count: result.inserted
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Erro no worker fatporhora:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
