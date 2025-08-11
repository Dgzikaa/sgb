import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

console.log("🔄 ContaHub Process Backlog - Processamento de dados acumulados");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para processar um lote de registros de uma só vez
async function processRawDataBatch(supabase: any, rawDataId: number, batchSize: number = 100) {
  console.log(`📊 Processando raw_data ID: ${rawDataId}`);
  
  try {
    // Buscar o raw_data específico
    const { data: rawData, error: fetchError } = await supabase
      .from('contahub_raw_data')
      .select('*')
      .eq('id', rawDataId)
      .eq('processed', false)
      .single();
      
    if (fetchError || !rawData) {
      console.log(`❌ Raw data ${rawDataId} não encontrado ou já processado`);
      return { success: false, message: 'Raw data não encontrado' };
    }
    
    const records = rawData.raw_json?.list || rawData.raw_json || [];
    if (!Array.isArray(records)) {
      console.log(`⚠️ Raw data ${rawDataId} não é um array válido`);
      return { success: false, message: 'Dados inválidos' };
    }
    
    console.log(`📈 Processando ${records.length} registros do tipo ${rawData.data_type}`);
    
    // Processar em lotes menores
    const chunks = [];
    for (let i = 0; i < records.length; i += batchSize) {
      chunks.push(records.slice(i, i + batchSize));
    }
    
    let totalProcessed = 0;
    
    for (const [index, chunk] of chunks.entries()) {
      console.log(`🔄 Processando lote ${index + 1}/${chunks.length} (${chunk.length} registros)`);
      
      if (rawData.data_type === 'analitico') {
        const analiticsToInsert = chunk
          .filter(item => item.trn && item.prd_desc)
          .map(item => ({
            bar_id: rawData.bar_id,
            itm: item.itm,
            trn: item.trn,
            prd_desc: item.prd_desc,
            grp_desc: item.grp_desc,
            loc_desc: item.loc_desc,
            qtd: item.qtd ? Math.floor(parseFloat(item.qtd) || 0) : 0,
            valorfinal: parseFloat(item.valorfinal) || 0,
            trn_dtgerencial: rawData.data_date,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));
          
        if (analiticsToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('contahub_analitico')
            .upsert(analiticsToInsert, { 
              onConflict: 'bar_id,trn,itm',
              ignoreDuplicates: true 
            });
            
          if (insertError) {
            console.error(`❌ Erro ao inserir analíticos:`, insertError);
          } else {
            totalProcessed += analiticsToInsert.length;
            console.log(`✅ Inseridos ${analiticsToInsert.length} analíticos`);
          }
        }
      }
      
      // Pausa pequena entre lotes para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Marcar como processado
    const { error: updateError } = await supabase
      .from('contahub_raw_data')
      .update({ 
        processed: true, 
        processed_at: new Date().toISOString() 
      })
      .eq('id', rawDataId);
      
    if (updateError) {
      console.error(`❌ Erro ao marcar raw_data como processado:`, updateError);
    }
    
    console.log(`✅ Raw data ${rawDataId} processado: ${totalProcessed} registros`);
    return { 
      success: true, 
      rawDataId, 
      totalRecords: records.length,
      totalProcessed,
      dataType: rawData.data_type 
    };
    
  } catch (error) {
    console.error(`❌ Erro ao processar raw_data ${rawDataId}:`, error);
    return { success: false, error: error.message };
  }
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Variáveis do Supabase não encontradas');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const body = await req.json().catch(() => ({}));
    const { rawDataId, maxBatches = 5 } = body;
    
    console.log(`🚀 Iniciando processamento de backlog`);
    
    const results = [];
    
    if (rawDataId) {
      // Processar um raw_data específico
      const result = await processRawDataBatch(supabase, rawDataId);
      results.push(result);
    } else {
      // Processar vários raw_data pendentes
      const { data: pendingRawData, error } = await supabase
        .from('contahub_raw_data')
        .select('id')
        .eq('processed', false)
        .eq('data_type', 'analitico')
        .limit(maxBatches);
        
      if (error) {
        throw new Error(`Erro ao buscar raw_data pendentes: ${error.message}`);
      }
      
      console.log(`📋 Encontrados ${pendingRawData?.length || 0} raw_data pendentes`);
      
      for (const rawData of pendingRawData || []) {
        const result = await processRawDataBatch(supabase, rawData.id);
        results.push(result);
        
        // Pausa entre processamentos
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`📊 Resumo: ${successful.length} sucessos, ${failed.length} falhas`);
    
    return new Response(JSON.stringify({
      success: true,
      message: `Processamento concluído`,
      summary: {
        total: results.length,
        successful: successful.length,
        failed: failed.length,
        totalProcessed: successful.reduce((sum, r) => sum + (r.totalProcessed || 0), 0)
      },
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
