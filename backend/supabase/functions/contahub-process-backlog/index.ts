import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

console.log("🔄 ContaHub Process Backlog - Processamento de dados acumulados");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para processar um lote de registros de uma só vez
async function processRawDataBatch(supabase: SupabaseClient, rawDataId: number, batchSize: number = 100) {
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
    let insertedAnalitico = 0;
    let insertedPagamentos = 0;
    let insertedFatPorHora = 0;
    let insertedPeriodo = 0;
    let insertedTempo = 0;
    
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
            .upsert(analiticsToInsert, { onConflict: 'idempotency_key' });
            
          if (insertError) {
            console.error(`❌ Erro ao inserir analíticos:`, insertError);
          } else {
            insertedAnalitico += analiticsToInsert.length;
            totalProcessed += analiticsToInsert.length;
            console.log(`✅ Inseridos ${analiticsToInsert.length} analíticos`);
          }
        }
      }
      
      if (rawData.data_type === 'pagamentos') {
        const pagamentosToInsert = chunk
          .filter(item => item.trn)
          .map(item => ({
            bar_id: rawData.bar_id,
            trn: item.trn,
            dt_gerencial: rawData.data_date,
            hr_lancamento: item.hr_lancamento ?? null,
            hr_transacao: item.hr_transacao ?? null,
            dt_transacao: item.dt_transacao ? new Date(item.dt_transacao).toISOString().slice(0, 10) : null,
            mesa: item.mesa ?? null,
            cli: item.cli ?? null,
            cliente: item.cliente ?? null,
            vr_pagamentos: parseFloat(item['$vr_pagamentos'] ?? item.vr_pagamentos ?? 0) || 0,
            pag: item.pag ?? null,
            valor: parseFloat(item['$valor'] ?? item.valor ?? 0) || 0,
            taxa: parseFloat(item.taxa ?? 0) || 0,
            perc: parseFloat(item.perc ?? 0) || 0,
            liquido: parseFloat(item['$liquido'] ?? item.liquido ?? 0) || 0,
            tipo: item.tipo ?? null,
            meio: item.meio ?? null,
            cartao: item.cartao ?? null,
            autorizacao: item.autorizacao ?? null,
            dt_credito: item.dt_credito ? new Date(item.dt_credito).toISOString().slice(0, 10) : null,
            usr_abriu: item.usr_abriu ?? null,
            usr_lancou: item.usr_lancou ?? null,
            usr_aceitou: item.usr_aceitou ?? null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));

        if (pagamentosToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('contahub_pagamentos')
            .upsert(pagamentosToInsert, { onConflict: 'idempotency_key' });
          if (insertError) {
            console.error(`❌ Erro ao inserir pagamentos:`, insertError);
          } else {
            insertedPagamentos += pagamentosToInsert.length;
            totalProcessed += pagamentosToInsert.length;
            console.log(`✅ Inseridos ${pagamentosToInsert.length} pagamentos`);
          }
        }
      }

      if (rawData.data_type === 'fatporhora') {
        const fatToInsert = chunk
          .filter(item => item.hora)
          .map(item => ({
            bar_id: rawData.bar_id,
            vd_dtgerencial: item.vd_dtgerencial ?? rawData.data_date,
            dds: item.dds != null ? parseInt(item.dds) : null,
            dia: item.dia ?? null,
            hora: item.hora ?? null,
            qtd: parseFloat(item.qtd ?? 0) || 0,
            valor: parseFloat(item['$valor'] ?? item.valor ?? 0) || 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));

        if (fatToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('contahub_fatporhora')
            .upsert(fatToInsert, { onConflict: 'idempotency_key' });
          if (insertError) {
            console.error(`❌ Erro ao inserir fatporhora:`, insertError);
          } else {
            insertedFatPorHora += fatToInsert.length;
            totalProcessed += fatToInsert.length;
            console.log(`✅ Inseridos ${fatToInsert.length} fatporhora`);
          }
        }
      }

      if (rawData.data_type === 'periodo') {
        const periodoToInsert = chunk
          .filter(item => item.vd_mesadesc)
          .map(item => ({
            bar_id: rawData.bar_id,
            dt_gerencial: item.dt_gerencial ?? rawData.data_date,
            tipovenda: item.tipovenda ?? null,
            vd_mesadesc: item.vd_mesadesc ?? null,
            cli_nome: item.cli_nome ?? null,
            cli_fone: item.cli_fone ?? null,
            usr_abriu: item.usr_abriu ?? null,
            pessoas: parseFloat(item.pessoas ?? 0) || 0,
            qtd_itens: parseFloat(item.qtd_itens ?? 0) || 0,
            vr_pagamentos: parseFloat(item['$vr_pagamentos'] ?? item.vr_pagamentos ?? 0) || 0,
            vr_produtos: parseFloat(item['$vr_produtos'] ?? item.vr_produtos ?? 0) || 0,
            vr_repique: parseFloat(item['$vr_repique'] ?? item.vr_repique ?? 0) || 0,
            vr_couvert: parseFloat(item['$vr_couvert'] ?? item.vr_couvert ?? 0) || 0,
            ultimo_pedido: item.ultimo_pedido ?? null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));

        if (periodoToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('contahub_periodo')
            .upsert(periodoToInsert, { onConflict: 'idempotency_key' });
          if (insertError) {
            console.error(`❌ Erro ao inserir periodo:`, insertError);
          } else {
            insertedPeriodo += periodoToInsert.length;
            totalProcessed += periodoToInsert.length;
            console.log(`✅ Inseridos ${periodoToInsert.length} periodo`);
          }
        }
      }

      if (rawData.data_type === 'tempo') {
        const tempoToInsert = chunk
          .filter(item => item.itm)
          .map(item => ({
            bar_id: rawData.bar_id,
            data: rawData.data_date,
            grp_desc: item.grp_desc ?? null,
            prd_desc: item.prd_desc ?? null,
            vd_mesadesc: item.vd_mesadesc ?? null,
            itm: item.itm ?? null,
            t0_lancamento: item['t0-lancamento'] ? new Date(item['t0-lancamento']).toISOString() : null,
            t3_entrega: item['t3-entrega'] ? new Date(item['t3-entrega']).toISOString() : null,
            t0_t3: parseFloat(item['t0-t3'] ?? 0) || 0,
            prd: item.prd ?? null,
            loc_desc: item.loc_desc ?? null,
            usr_abriu: item.usr_abriu ?? null,
            usr_lancou: item.usr_lancou ?? null,
            usr_entregou: item.usr_entregou ?? null,
            prefixo: item.prefixo ?? null,
            tipovenda: item.tipovenda ?? null,
            ano: item.ano != null ? parseInt(item.ano) : null,
            mes: item.mes != null ? (typeof item.mes === 'string' && item.mes.length === 7 ? new Date(item.mes + '-01').getMonth() + 1 : parseInt(item.mes)) : null,
            dia: item.dia ? new Date(item.dia).toISOString().slice(0, 10) : null,
            dds: item.dds != null ? parseInt(item.dds) : null,
            diadasemana: item.diadasemana ?? null,
            hora: item.hora ?? null,
            itm_qtd: item.itm_qtd != null ? parseInt(item.itm_qtd) : null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));

        if (tempoToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('contahub_tempo')
            .upsert(tempoToInsert, { onConflict: 'idempotency_key' });
          if (insertError) {
            console.error(`❌ Erro ao inserir tempo:`, insertError);
          } else {
            insertedTempo += tempoToInsert.length;
            totalProcessed += tempoToInsert.length;
            console.log(`✅ Inseridos ${tempoToInsert.length} tempo`);
          }
        }
      }
      
      // Pausa pequena entre lotes para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Marcar como processado APENAS se houve inserções
    if (totalProcessed > 0) {
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
    } else {
      console.warn(`⚠️ Nenhuma inserção gerada para raw_data ${rawDataId} (${rawData.data_type}). Mantendo processed=false para reprocesso.`);
    }
    
    console.log(`✅ Raw data ${rawDataId} processado: ${totalProcessed} registros`);
    return { 
      success: true, 
      rawDataId, 
      totalRecords: records.length,
      totalProcessed,
      insertedByTable: {
        analitico: insertedAnalitico,
        pagamentos: insertedPagamentos,
        fatporhora: insertedFatPorHora,
        periodo: insertedPeriodo,
        tempo: insertedTempo,
      },
      dataType: rawData.data_type 
    };
    
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Erro ao processar raw_data ${rawDataId}:`, message);
    return { success: false, error: message };
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
    const { rawDataId, maxBatches = 25, dataType, bar_id: filterBarId, startDate, endDate } = body as {
      rawDataId?: number;
      maxBatches?: number;
      dataType?: string;
      bar_id?: number;
      startDate?: string;
      endDate?: string;
    };
    
    console.log(`🚀 Iniciando processamento de backlog`);
    
    const results = [];
    
    if (rawDataId) {
      // Processar um raw_data específico
      const result = await processRawDataBatch(supabase, rawDataId);
      results.push(result);
    } else {
      // Processar vários raw_data pendentes
      // Buscar raws pendentes, com filtros opcionais por tipo/bar/data
      let query = supabase
        .from('contahub_raw_data')
        .select('id')
        .eq('processed', false);

      if (dataType) query = query.eq('data_type', dataType);
      if (filterBarId != null) query = query.eq('bar_id', filterBarId);
      if (startDate) query = query.gte('data_date', startDate);
      if (endDate) query = query.lte('data_date', endDate);

      // processar dos mais antigos para os mais recentes
      // ordenar por created_at asc e limitar (tipagem mínima segura)
      type OrderLimit<T> = {
        order: (column: string, opts: { ascending: boolean }) => OrderLimit<T>;
        limit: (n: number) => Promise<{ data: T[]; error: { message: string } | null }>;
      };

      const { data: pendingRawData, error } = await (query as unknown as OrderLimit<{ id: number }>)
        .order('created_at', { ascending: true })
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
