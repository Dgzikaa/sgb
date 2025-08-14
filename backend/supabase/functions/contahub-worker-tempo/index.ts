import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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

interface TempoRecordRaw {
  vd_dtgerencial: string | null;
  vd_mesadesc: string;
  itm: string;
  prd: string;
  prd_desc: string;
  grupo: string; // origem: raw.grupo
  local: string; // origem: raw.local
  usr_lancou: string;
  ht_comanda: string; // HH:mm:ss
  ht_pedido: string; // HH:mm:ss
  ht_liberacao: string; // HH:mm:ss
  ht_venda: string; // HH:mm:ss
  qtd: number;
  valorfinal: number;
}

type ContahubTempoRawItem = {
  vd_dtgerencial?: string;
  vd_mesadesc?: string;
  itm?: string | number;
  prd?: string | number;
  prd_desc?: string;
  grupo?: string;
  local?: string;
  usr_lancou?: string;
  ht_comanda?: string;
  ht_pedido?: string;
  ht_liberacao?: string;
  ht_venda?: string;
  qtd?: string | number;
  valorfinal?: string | number;
};

type TempoRawJson = { list?: ContahubTempoRawItem[] };

// Colunas suportadas pela tabela contahub_tempo que precisamos preencher
interface TempoRow {
  bar_id: number;
  data: string | null; // YYYY-MM-DD
  vd_mesadesc?: string;
  itm?: string;
  prd?: number | null;
  prd_idexterno?: string | null;
  prd_desc?: string;
  grp_desc?: string;
  loc_desc?: string;
  usr_lancou?: string;
  itm_qtd?: number;
  t0_lancamento?: string | null; // ISO timestamp
  t1_prodini?: string | null;     // ISO timestamp
  t2_prodfim?: string | null;     // ISO timestamp
  t3_entrega?: string | null;     // ISO timestamp
  t0_t2?: number | null;          // seconds
  t0_t3?: number | null;          // seconds
  idempotency_key?: string;
}

function parseTempoData(rawJson: TempoRawJson): TempoRecordRaw[] {
  if (!rawJson || !rawJson.list || !Array.isArray(rawJson.list)) {
    console.warn('⚠️ Formato inesperado de dados de tempo');
    return [];
  }
  
  return rawJson.list.map((item) => ({
    vd_dtgerencial: item.vd_dtgerencial ? item.vd_dtgerencial.split('T')[0] : null,
    vd_mesadesc: item.vd_mesadesc || '',
    itm: (item.itm ?? '').toString(),
    prd: (item.prd ?? '').toString(),
    prd_desc: item.prd_desc || '',
    grupo: item.grupo || '',
    local: item.local || '',
    usr_lancou: item.usr_lancou || '',
    ht_comanda: item.ht_comanda || '',
    ht_pedido: item.ht_pedido || '',
    ht_liberacao: item.ht_liberacao || '',
    ht_venda: item.ht_venda || '',
    qtd: Number(item.qtd) || 0,
    valorfinal: Number(item.valorfinal) || 0
  }));
}

function toIsoTimestamp(dateOnly: string | null, timeHHMMSS: string | null): string | null {
  if (!dateOnly || !timeHHMMSS) return null;
  const time = (timeHHMMSS || '').trim();
  if (!time) return null;
  // Garantir formato HH:mm:ss
  const hhmmss = time.length === 8 ? time : `${time}:00`.slice(0, 8);
  const iso = `${dateOnly}T${hhmmss}`;
  // Não converter para Date() para evitar timezone offsets; enviar string ISO local
  return iso;
}

function parseHmsToSeconds(hms: string | null | undefined): number | null {
  if (!hms) return null;
  const parts = hms.split(':');
  if (parts.length < 2) return null;
  const h = parseInt(parts[0] || '0', 10);
  const m = parseInt(parts[1] || '0', 10);
  const s = parseInt((parts[2] || '0').slice(0,2), 10);
  if (Number.isNaN(h) || Number.isNaN(m) || Number.isNaN(s)) return null;
  return h * 3600 + m * 60 + s;
}

interface RawDataTempo {
  id: number;
  bar_id: number;
  raw_json: TempoRawJson;
}

async function processTempo(supabase: SupabaseClient, rawData: RawDataTempo, batchSize: number) {
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
    
    // Preparar dados para inserção apenas com colunas suportadas pela tabela
    const insertData: TempoRow[] = batch.map(record => {
      const data = record.vd_dtgerencial || null;
      const prdNumeric = Number.isFinite(Number(record.prd)) ? Number(record.prd) : null;
      const t0 = record.ht_comanda || null;
      const t2 = record.ht_liberacao || null;
      const t3 = record.ht_venda || null;
      const sec0 = parseHmsToSeconds(t0);
      const sec2 = parseHmsToSeconds(t2);
      const sec3 = parseHmsToSeconds(t3);
      const t0_t2 = (sec0 != null && sec2 != null && sec2 >= sec0) ? (sec2 - sec0) : null;
      const t0_t3 = (sec0 != null && sec3 != null && sec3 >= sec0) ? (sec3 - sec0) : null;
      const row: TempoRow = {
        bar_id: rawData.bar_id,
        data,
        vd_mesadesc: record.vd_mesadesc || undefined,
        itm: record.itm || undefined,
        prd: prdNumeric,
        prd_idexterno: record.prd || null,
        prd_desc: record.prd_desc || undefined,
        grp_desc: record.grupo || undefined,
        loc_desc: record.local || undefined,
        usr_lancou: record.usr_lancou || undefined,
        itm_qtd: record.qtd || undefined,
        t0_lancamento: toIsoTimestamp(data, record.ht_comanda || null),
        t1_prodini: toIsoTimestamp(data, record.ht_pedido || null),
        t2_prodfim: toIsoTimestamp(data, record.ht_liberacao || null),
        t3_entrega: toIsoTimestamp(data, record.ht_venda || null),
        t0_t2,
        t0_t3,
      };
      // Chave idempotente simples
      row.idempotency_key = `${rawData.bar_id}-${data}-${row.itm ?? 'x'}-${row.prd ?? 'x'}-${row.loc_desc ?? 'x'}`;
      return row;
    });
    
    // IMPORTANTE: Supabase tem limite de 1000 registros por operação
    let batchInserted = 0;
    
    for (let subBatchStart = 0; subBatchStart < insertData.length; subBatchStart += 1000) {
      const subBatch = insertData.slice(subBatchStart, subBatchStart + 1000);
      
      const { data, error } = await supabase
        .from('contahub_tempo')
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
    
    const { job_id, raw_data_id, batch_size = 1000 } = await req.json() as WorkerRequest;
    
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
      error: (error as Error).message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});