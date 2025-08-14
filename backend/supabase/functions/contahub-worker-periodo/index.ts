import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

console.log("⚙️ ContaHub Worker - Período");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WorkerRequest {
  job_id: string;
  raw_data_id: number;
  batch_size: number;
}

interface PeriodoRecord {
  dt_gerencial: string;
  tipovenda: string;
  vd_mesadesc: string;
  vd_localizacao: string;
  cht_nome: string;
  cli_nome: string;
  cli_dtnasc: string | null;
  cli_email: string;
  cli_fone: string;
  usr_abriu: string;
  pessoas: number;
  qtd_itens: number;
  vr_pagamentos: number;
  vr_produtos: number;
  vr_repique: number;
  vr_couvert: number;
  vr_desconto: number;
  motivo: string;
  dt_contabil: string | null;
  ultimo_pedido: string;
  vd_dtcontabil: string | null;
  semana: number;
}

function parsePeriodoData(rawJson: any): PeriodoRecord[] {
  if (!rawJson || !rawJson.list || !Array.isArray(rawJson.list)) {
    console.warn('⚠️ Formato inesperado de dados de período');
    return [];
  }
  
  return rawJson.list.map((item: any) => {
    // Calcular semana do ano
    const dataGerencial = item.dt_gerencial ? new Date(item.dt_gerencial) : new Date();
    const inicioAno = new Date(dataGerencial.getFullYear(), 0, 1);
    const diasDesdeInicio = Math.floor((dataGerencial.getTime() - inicioAno.getTime()) / (24 * 60 * 60 * 1000));
    const semana = Math.ceil((diasDesdeInicio + inicioAno.getDay() + 1) / 7);
    
    // Processar cli_dtnasc com validação
    let cli_dtnasc = null;
    if (item.cli_dtnasc) {
      const dtNascStr = item.cli_dtnasc.split('T')[0];
      if (dtNascStr && dtNascStr !== '0001-01-01') { // Ignorar datas inválidas
        cli_dtnasc = dtNascStr;
      }
    }
    
    return {
      dt_gerencial: item.dt_gerencial || null,
      tipovenda: item.tipovenda || '',
      vd_mesadesc: item.vd_mesadesc || '',
      vd_localizacao: item.vd_localizacao || '', // Não existe no raw mas mantemos por compatibilidade
      cht_nome: item.cht_nome || '',
      cli_nome: item.cli_nome || '',
      cli_dtnasc: cli_dtnasc,
      cli_email: item.cli_email || '',
      cli_fone: item.cli_fone || '',
      usr_abriu: item.usr_abriu || '',
      pessoas: parseInt(item.pessoas) || 0,
      qtd_itens: parseInt(item.qtd_itens) || 0,
      vr_pagamentos: parseFloat(item['$vr_pagamentos']) || 0,
      vr_produtos: parseFloat(item['$vr_produtos']) || 0,
      vr_repique: parseFloat(item['$vr_repique']) || 0,
      vr_couvert: parseFloat(item['$vr_couvert']) || 0,
      vr_desconto: parseFloat(item['$vr_desconto']) || 0,
      motivo: item.motivo || '',
      dt_contabil: item.dt_contabil ? item.dt_contabil.split('T')[0] : null,
      ultimo_pedido: item.ultimo_pedido || '',
      vd_dtcontabil: item.vd_dtcontabil ? item.vd_dtcontabil.split('T')[0] : null,
      semana: semana
    };
  });
}

async function processPeriodo(supabase: any, rawData: any, batchSize: number) {
  console.log(`📊 Processando dados de período (raw_id: ${rawData.id})`);
  
  const records = parsePeriodoData(rawData.raw_json);
  if (records.length === 0) {
    console.warn('⚠️ Nenhum registro de período para processar');
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
    
    // IMPORTANTE: Supabase tem limite de 1000 registros por operação
    let batchInserted = 0;
    
    for (let subBatchStart = 0; subBatchStart < insertData.length; subBatchStart += 1000) {
      const subBatch = insertData.slice(subBatchStart, subBatchStart + 1000);
      
      const { data, error } = await supabase
        .from('contahub_periodo')
        .upsert(subBatch, {
          onConflict: 'idempotency_key',
          ignoreDuplicates: false
        })
        .select();
      
      if (error) {
        console.error(`❌ Erro ao inserir sub-batch:`, error);
      } else {
        const inserted = data?.length || 0;
        batchInserted += inserted;
        console.log(`✅ Sub-batch inserido: ${inserted} registros`);
      }
      
      if (subBatchStart + 1000 < insertData.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    totalInserted += batchInserted;
    
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
    
    const { job_id, raw_data_id, batch_size = 200 } = await req.json() as WorkerRequest;
    
    console.log(`🎯 Worker Período iniciado - Job: ${job_id}, Raw: ${raw_data_id}`);
    
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
    const result = await processPeriodo(supabase, rawData, batch_size);
    
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
    console.error('❌ Erro no worker período:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
