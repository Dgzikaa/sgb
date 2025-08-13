import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

console.log("⚙️ ContaHub Worker - Pagamentos");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WorkerRequest {
  job_id: string;
  raw_data_id: number;
  batch_size: number;
}

interface PagamentosRecord {
  vd: string;
  trn: string;
  dt_gerencial: string;
  hr_lancamento: string;
  hr_transacao: string;
  dt_transacao: string;
  mesa: string;
  cli: string;
  cliente: string;
  vr_pagamentos: number;
  pag: string;
  valor: number;
  taxa: number;
  perc: number;
  liquido: number;
  tipo: string;
  meio: string;
  cartao: string;
  autorizacao: string;
  dt_credito: string;
  usr_abriu: string;
  usr_lancou: string;
  usr_aceitou: string;
  motivodesconto: string;
}

function parsePagamentosData(rawJson: any): PagamentosRecord[] {
  if (!rawJson || !rawJson.list || !Array.isArray(rawJson.list)) {
    console.warn('⚠️ Formato inesperado de dados de pagamentos');
    return [];
  }
  
  return rawJson.list.map((item: any) => ({
    vd: item.vd || '',
    trn: item.trn || '',
    dt_gerencial: item.dt_gerencial || null, // Usar null se vazio para DATE
    hr_lancamento: item.hr_lancamento || '', 
    hr_transacao: item.hr_transacao || '', 
    dt_transacao: item.dt_transacao ? item.dt_transacao.split('T')[0] : null, // Usar null se vazio para DATE
    mesa: item.mesa || '',
    cli: parseInt(item.cli) || 0,
    cliente: item.cliente || '',
    vr_pagamentos: parseFloat(item['$vr_pagamentos']) || 0,
    pag: item.pag || '',
    valor: parseFloat(item['$valor']) || 0,
    taxa: parseFloat(item['$taxa']) || 0,
    perc: parseFloat(item['$perc']) || 0,
    liquido: parseFloat(item['$liquido']) || 0,
    tipo: item.tipo || '',
    meio: item.meio || '',
    cartao: item.cartao || '',
    autorizacao: item.autorizacao || '',
    dt_credito: item.dt_credito ? item.dt_credito.split('T')[0] : null,
    usr_abriu: item.usr_abriu || '',
    usr_lancou: item.usr_lancou || '',
    usr_aceitou: item.usr_aceitou || '',
    motivodesconto: item.motivodesconto || ''
  }));
}

async function processPagamentos(supabase: any, rawData: any, batchSize: number) {
  console.log(`💳 Processando dados de pagamentos (raw_id: ${rawData.id})`);
  
  const records = parsePagamentosData(rawData.raw_json);
  if (records.length === 0) {
    console.warn('⚠️ Nenhum registro de pagamento para processar');
    return { processed: 0, inserted: 0 };
  }
  
  console.log(`📦 Total de registros: ${records.length}`);
  
  let totalInserted = 0;
  let processedCount = 0;
  
  // Processar em batches
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    console.log(`🔄 Processando batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(records.length/batchSize)} (${batch.length} registros)`);
    
    // Preparar dados para inserção com idempotency_key
    const insertData = batch.map(record => ({
      bar_id: rawData.bar_id,
      ...record
    }));
    
    // Usar upsert para idempotência
    const { data, error } = await supabase
      .from('contahub_pagamentos')
      .upsert(insertData, {
        onConflict: 'idempotency_key',
        ignoreDuplicates: false
      })
      .select();
    
    if (error) {
      console.error(`❌ Erro ao inserir batch:`, error);
      // Continuar com próximo batch mesmo se houver erro
    } else {
      const inserted = data?.length || 0;
      totalInserted += inserted;
      console.log(`✅ Batch inserido: ${inserted} registros`);
    }
    
    processedCount += batch.length;
    
    // Pequena pausa entre batches para não sobrecarregar
    if (i + batchSize < records.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Marcar raw_data como processado se tudo correu bem
  if (totalInserted > 0) {
    const { error: updateError } = await supabase
      .from('contahub_raw_data')
      .update({
        processed: true,
        processed_at: new Date().toISOString()
      })
      .eq('id', rawData.id);
    
    if (updateError) {
      console.error('❌ Erro ao marcar raw_data como processado:', updateError);
    } else {
      console.log('✅ Raw data marcado como processado');
    }
  }
  
  return {
    processed: processedCount,
    inserted: totalInserted
  };
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
    
    const { job_id, raw_data_id, batch_size = 1000 } = await req.json() as WorkerRequest;
    
    console.log(`🎯 Worker Pagamentos iniciado - Job: ${job_id}, Raw: ${raw_data_id}`);
    
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
    const result = await processPagamentos(supabase, rawData, batch_size);
    
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
    console.error('❌ Erro no worker pagamentos:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
