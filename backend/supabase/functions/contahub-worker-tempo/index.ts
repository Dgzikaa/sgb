import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

console.log("⚙️ ContaHub Worker - Tempo");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WorkerRequest {
  job_id: string;
  raw_data_id: number;
  batch_size: number;
}

interface TempoRecord {
  grp_desc: string;
  prd_desc: string;
  vd_mesadesc: string;
  vd_localizacao: string;
  itm: string;
  t0_lancamento: string;
  t1_prodini: string | null;
  t2_prodfim: string | null;
  t3_entrega: string | null;
  t0_t1: number | null;
  t0_t2: number | null;
  t0_t3: number | null;
  t1_t2: number | null;
  t1_t3: number | null;
  t2_t3: number | null;
  prd: string;
  prd_idexterno: string | null;
  loc_desc: string;
  usr_abriu: string;
  usr_lancou: string;
  usr_produziu: string | null;
  usr_entregou: string | null;
  usr_transfcancelou: string | null;
  prefixo: string;
  tipovenda: string;
  ano: number;
  mes: number;
  dia: string;
  dds: number;
  diadasemana: string;
  hora: string;
  itm_qtd: number;
  data: string;
}

function parseTempoData(rawJson: any): TempoRecord[] {
  if (!rawJson || !rawJson.list || !Array.isArray(rawJson.list)) {
    console.warn('⚠️ Formato inesperado de dados de tempo');
    return [];
  }
  
  return rawJson.list.map((item: any) => {
    // Extrair mês como número se vier como "2025-08"
    let mes = 0;
    if (item.mes) {
      if (typeof item.mes === 'string' && item.mes.includes('-')) {
        mes = parseInt(item.mes.split('-')[1]);
      } else {
        mes = parseInt(item.mes);
      }
    }
    
    return {
      grp_desc: item.grp_desc || '',
      prd_desc: item.prd_desc || '',
      vd_mesadesc: item.vd_mesadesc || '',
      vd_localizacao: item.vd_localizacao || '',
      itm: item.itm?.toString() || '',
      t0_lancamento: item['t0-lancamento'] || null,
      t1_prodini: item['t1-prodini'] || null,
      t2_prodfim: item['t2-prodfim'] || null,
      t3_entrega: item['t3-entrega'] || null,
      t0_t1: item['t0-t1'] ? parseFloat(item['t0-t1']) : null,
      t0_t2: item['t0-t2'] ? parseFloat(item['t0-t2']) : null,
      t0_t3: item['t0-t3'] ? parseFloat(item['t0-t3']) : null,
      t1_t2: item['t1-t2'] ? parseFloat(item['t1-t2']) : null,
      t1_t3: item['t1-t3'] ? parseFloat(item['t1-t3']) : null,
      t2_t3: item['t2-t3'] ? parseFloat(item['t2-t3']) : null,
      prd: item.prd?.toString() || '',
      prd_idexterno: item.prd_idexterno || null,
      loc_desc: item.loc_desc || '',
      usr_abriu: item.usr_abriu || '',
      usr_lancou: item.usr_lancou || '',
      usr_produziu: item.usr_produziu || null,
      usr_entregou: item.usr_entregou || null,
      usr_transfcancelou: item.usr_transfcancelou || null,
      prefixo: item.prefixo || '',
      tipovenda: item.tipovenda || '',
      ano: parseInt(item.ano) || new Date().getFullYear(),
      mes: mes || new Date().getMonth() + 1,
      dia: item.dia ? item.dia.split('T')[0] : null,
      dds: parseInt(item.dds) || 0,
      diadasemana: item.diadasemana || '',
      hora: item.hora || '',
      itm_qtd: parseInt(item.itm_qtd) || 0,
      data: item.dia ? item.dia.split('T')[0] : null
    };
  });
}

async function processTempo(supabase: any, rawData: any, batchSize: number) {
  console.log(`⏱️ Processando dados de tempo (raw_id: ${rawData.id})`);
  
  const records = parseTempoData(rawData.raw_json);
  if (records.length === 0) {
    console.warn('⚠️ Nenhum registro de tempo para processar');
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
      .from('contahub_tempo')
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
    
    console.log(`🎯 Worker Tempo iniciado - Job: ${job_id}, Raw: ${raw_data_id}`);
    
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
    const result = await processTempo(supabase, rawData, batch_size);
    
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
    console.error('❌ Erro no worker tempo:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
