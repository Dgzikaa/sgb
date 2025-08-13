import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

console.log("⚙️ ContaHub Worker - Analítico");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WorkerRequest {
  job_id: string;
  raw_data_id: number;
  batch_size: number;
}

interface AnaliticoRecord {
  vd_mesadesc: string;
  vd_localizacao: string;
  itm: string;
  trn: string;
  trn_desc: string;
  prefixo: string;
  tipo: string;
  tipovenda: string;
  ano: number;
  mes: number;
  trn_dtgerencial: string;
  usr_lancou: string;
  prd: string;
  prd_desc: string;
  grp_desc: string;
  loc_desc: string;
  qtd: number;
  desconto: number;
  valorfinal: number;
  custo: number;
  itm_obs: string;
  comandaorigem: string;
  itemorigem: string;
}

function parseAnaliticoData(rawJson: any): AnaliticoRecord[] {
  if (!rawJson || !rawJson.list || !Array.isArray(rawJson.list)) {
    console.warn('⚠️ Formato inesperado de dados analíticos');
    return [];
  }
  
  console.log(`📦 Total de registros no raw: ${rawJson.list.length}`);
  
  // IMPORTANTE: NÃO fazer deduplicação aqui!
  // Cada registro representa uma venda diferente, mesmo que seja do mesmo produto
  // A idempotency_key do banco será gerada com base em trn+itm+prd, mas isso está errado
  // e precisa ser corrigido no banco de dados
  
  return rawJson.list.map((item: any) => {
    // Extrair mês da data se vier como "2025-08"
    let mes = 0;
    if (item.mes) {
      if (typeof item.mes === 'string' && item.mes.includes('-')) {
        mes = parseInt(item.mes.split('-')[1]);
      } else {
        mes = parseInt(item.mes);
      }
    }
    
    return {
      vd_mesadesc: item.vd_mesadesc || '',
      vd_localizacao: item.vd_localizacao || '', // Mantemos por compatibilidade
      itm: item.itm?.toString() || '',
      trn: item.trn?.toString() || '',
      trn_desc: item.trn_desc || '',
      prefixo: item.prefixo || '',
      tipo: item.tipo || '',
      tipovenda: item.tipovenda || '',
      ano: parseInt(item.ano) || new Date().getFullYear(),
      mes: mes || new Date().getMonth() + 1,
      trn_dtgerencial: item.trn_dtgerencial ? item.trn_dtgerencial.split('T')[0] : null,
      usr_lancou: item.usr_lancou || '',
      prd: item.prd?.toString() || '',
      prd_desc: item.prd_desc || '',
      grp_desc: item.grp_desc || '',
      loc_desc: item.loc_desc || '',
      qtd: parseFloat(item.qtd) || 0,
      desconto: parseFloat(item.desconto) || 0,
      valorfinal: parseFloat(item.valorfinal) || 0,
      custo: parseFloat(item.custo) || 0,
      itm_obs: item.itm_obs || '',
      comandaorigem: item.comandaorigem || '',
      itemorigem: item.itemorigem || ''
    };
  });
}

async function processAnalitico(supabase: any, rawData: any, batchSize: number) {
  console.log(`📊 Processando dados analíticos (raw_id: ${rawData.id})`);
  
  const records = parseAnaliticoData(rawData.raw_json);
  if (records.length === 0) {
    console.warn('⚠️ Nenhum registro analítico para processar');
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
      .from('contahub_analitico')
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
  
  // Marcar raw_data como processado apenas se TODOS os registros foram processados
  const successRate = records.length > 0 ? (totalInserted / records.length) : 0;
  console.log(`📊 Taxa de sucesso: ${(successRate * 100).toFixed(2)}% (${totalInserted}/${records.length})`);
  
  // Só marcar como processado se pelo menos 95% dos registros foram inseridos com sucesso
  if (successRate >= 0.95) {
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
  } else {
    console.warn('⚠️ Raw data NÃO marcado como processado devido a baixa taxa de sucesso');
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
    
    console.log(`🎯 Worker Analítico iniciado - Job: ${job_id}, Raw: ${raw_data_id}`);
    
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
    const result = await processAnalitico(supabase, rawData, batch_size);
    
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
    console.error('❌ Erro no worker analítico:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
