import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

console.log("🔄 ContaHub Processor - Processa dados raw salvos");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para processar dados de uma tabela específica
async function processRawData(supabase: any, dataType: string, rawData: any, dataDate: string, barId: number = 3) {
  console.log(`📊 Processando ${dataType} para ${dataDate} (bar_id: ${barId})...`);
  
  if (!rawData?.list || !Array.isArray(rawData.list)) {
    console.log(`⚠️ Dados ${dataType} inválidos ou vazios`);
    return { success: false, count: 0, error: 'Dados inválidos' };
  }

  const records = rawData.list;
  let processedCount = 0;
  let errors = 0;

  try {
    // Processar cada tipo de dados usando INSERT (mais seguro para multi-bar)
    switch (dataType) {
      case 'analitico':
        // Primeiro deletar registros existentes para essa data/bar
        await supabase
          .from('contahub_analitico')
          .delete()
          .eq('bar_id', barId)
          .eq('trn_dtgerencial', dataDate);
        
        // Depois inserir novos registros em batch
        const analiticoRecords = records.map((item: any) => ({
          vd_mesadesc: item.vd_mesadesc || '',
          vd_localizacao: item.vd_localizacao || '',
          itm: parseInt(item.itm) || 0,
          trn: parseInt(item.trn) || 0,
          trn_desc: item.trn_desc || '',
          prefixo: item.prefixo || '',
          tipo: item.tipo || '',
          tipovenda: item.tipovenda || '',
          ano: parseInt(item.ano) || new Date().getFullYear(),
          mes: parseInt(item.mes) || new Date().getMonth() + 1,
          trn_dtgerencial: item.trn_dtgerencial || dataDate,
          usr_lancou: item.usr_lancou || '',
          prd: item.prd || '',
          prd_desc: item.prd_desc || '',
          grp_desc: item.grp_desc || '',
          loc_desc: item.loc_desc || '',
          qtd: parseFloat(item.qtd) || 0,
          desconto: parseFloat(item.desconto) || 0,
          valorfinal: parseFloat(item.valorfinal) || 0,
          custo: parseFloat(item.custo) || 0,
          itm_obs: item.itm_obs || '',
          comandaorigem: item.comandaorigem || '',
          itemorigem: item.itemorigem || '',
          bar_id: barId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        if (analiticoRecords.length > 0) {
          const { error } = await supabase
            .from('contahub_analitico')
            .insert(analiticoRecords);
          
          if (error) {
            console.error(`❌ Erro ao inserir analítico:`, error.message);
            errors = analiticoRecords.length;
          } else {
            processedCount = analiticoRecords.length;
          }
        }
        break;

      case 'periodo':
        await supabase
          .from('contahub_periodo')
          .delete()
          .eq('bar_id', barId)
          .eq('dt_gerencial', dataDate);
        
        const periodoRecords = records.map((item: any) => ({
          dt_gerencial: item.dt_gerencial || dataDate,
          tipovenda: item.tipovenda || '',
          vd_mesadesc: item.vd_mesadesc || '',
          vd_localizacao: item.vd_localizacao || '',
          cht_nome: item.cht_nome || '',
          cli_nome: item.cli_nome || '',
          cli_dtnasc: item.cli_dtnasc || null,
          cli_email: item.cli_email || '',
          cli_fone: item.cli_fone || '',
          usr_abriu: item.usr_abriu || '',
          pessoas: parseFloat(item.pessoas) || 0,
          qtd_itens: parseFloat(item.qtd_itens) || 0,
          vr_pagamentos: parseFloat(item['$vr_pagamentos'] || item.vr_pagamentos || 0),
          vr_produtos: parseFloat(item['$vr_produtos'] || item.vr_produtos || 0),
          vr_repique: parseFloat(item['$vr_repique'] || item.vr_repique || 0),
          vr_couvert: parseFloat(item['$vr_couvert'] || item.vr_couvert || 0),
          vr_desconto: parseFloat(item['$vr_desconto'] || item.vr_desconto || 0),
          motivo: item.motivo || '',
          dt_contabil: item.dt_contabil || null,
          ultimo_pedido: item.vd_hrultimo || item.ultimo_pedido || '',
          vd_dtcontabil: item.vd_dtcontabil || null,
          bar_id: barId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        if (periodoRecords.length > 0) {
          const { error } = await supabase
            .from('contahub_periodo')
            .insert(periodoRecords);
          
          if (error) {
            console.error(`❌ Erro ao inserir período:`, error.message);
            return { success: true, count: 0, errors: periodoRecords.length, errorMessage: error.message, errorDetails: JSON.stringify(error) };
          } else {
            processedCount = periodoRecords.length;
          }
        }
        break;

      case 'fatporhora':
        await supabase
          .from('contahub_fatporhora')
          .delete()
          .eq('bar_id', barId)
          .eq('vd_dtgerencial', dataDate);
        
        const fatporhoraRecords = records.map((item: any) => ({
          vd_dtgerencial: item.vd_dtgerencial || dataDate,
          dds: parseInt(item.dds) || 0,
          dia: item.dia || '',
          hora: parseInt(item.hora) || 0,
          qtd: parseFloat(item.qtd) || 0,
          valor: parseFloat(item['$valor'] || item.valor) || 0,
          bar_id: barId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        if (fatporhoraRecords.length > 0) {
          const { error } = await supabase
            .from('contahub_fatporhora')
            .insert(fatporhoraRecords);
          
          if (error) {
            console.error(`❌ Erro ao inserir fatporhora:`, error.message);
            errors = fatporhoraRecords.length;
          } else {
            processedCount = fatporhoraRecords.length;
          }
        }
        break;

      case 'pagamentos':
        await supabase
          .from('contahub_pagamentos')
          .delete()
          .eq('bar_id', barId)
          .eq('dt_gerencial', dataDate);
        
        const pagamentosRecords = records.map((item: any) => ({
          dt_gerencial: item.dt_gerencial || dataDate,
          vd: String(item.vd || ''),
          trn: String(item.trn || ''),
          hr_lancamento: item.hr_lancamento || '',
          hr_transacao: item.hr_transacao || '',
          dt_transacao: item.dt_transacao || null,
          mesa: item.mesa || '',
          cli: item.cli ? parseInt(item.cli) : null,
          cliente: item.cliente || item.cli_nome || '',
          vr_pagamentos: parseFloat(item['$vr_pagamentos'] || item.vr_pagamentos) || 0,
          pag: String(item.pag || ''),
          valor: parseFloat(item['$valor'] || item.valor) || 0,
          taxa: parseFloat(item['$taxa'] || item.taxa) || 0,
          perc: parseFloat(item['$perc'] || item.perc) || 0,
          liquido: parseFloat(item['$liquido'] || item.liquido) || 0,
          tipo: item.tipo || '',
          meio: item.meio || '',
          cartao: item.cartao || '',
          autorizacao: String(item.autorizacao || ''),
          dt_credito: item.dt_credito || null,
          usr_abriu: item.usr_abriu || '',
          usr_lancou: item.usr_lancou || '',
          usr_aceitou: item.usr_aceitou || '',
          motivodesconto: item.motivodesconto || '',
          bar_id: barId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        if (pagamentosRecords.length > 0) {
          const { error } = await supabase
            .from('contahub_pagamentos')
            .insert(pagamentosRecords);
          
          if (error) {
            console.error(`❌ Erro ao inserir pagamentos:`, error.message, JSON.stringify(error));
            return { success: true, count: 0, errors: pagamentosRecords.length, errorMessage: error.message, errorDetails: JSON.stringify(error) };
          } else {
            processedCount = pagamentosRecords.length;
          }
        }
        break;

      case 'tempo':
        await supabase
          .from('contahub_tempo')
          .delete()
          .eq('bar_id', barId)
          .eq('data', dataDate);
        
        const tempoRecords = records.map((item: any) => ({
          data: dataDate,
          prd: parseInt(item.prd) || null,
          prd_desc: item.prd_desc || '',
          grp_desc: item.grp_desc || '',
          loc_desc: item.loc_desc || '',
          vd_mesadesc: item.vd_mesadesc || '',
          vd_localizacao: item.vd_localizacao || '',
          itm: String(item.itm || ''),
          t0_lancamento: item['t0-lancamento'] || item.t0_lancamento || null,
          t1_prodini: item['t1-prodini'] || item.t1_prodini || null,
          t2_prodfim: item['t2-prodfim'] || item.t2_prodfim || null,
          t3_entrega: item['t3-entrega'] || item.t3_entrega || null,
          t0_t1: parseFloat(item['t0-t1'] || item.t0_t1) || 0,
          t0_t2: parseFloat(item['t0-t2'] || item.t0_t2) || 0,
          t0_t3: parseFloat(item['t0-t3'] || item.t0_t3) || 0,
          t1_t2: parseFloat(item['t1-t2'] || item.t1_t2) || 0,
          t1_t3: parseFloat(item['t1-t3'] || item.t1_t3) || 0,
          t2_t3: parseFloat(item['t2-t3'] || item.t2_t3) || 0,
          prd_idexterno: item.prd_idexterno || '',
          usr_abriu: item.usr_abriu || '',
          usr_lancou: item.usr_lancou || '',
          usr_produziu: item.usr_produziu || '',
          usr_entregou: item.usr_entregou || '',
          usr_transfcancelou: item.usr_transfcancelou || '',
          prefixo: item.prefixo || '',
          tipovenda: item.tipovenda || '',
          ano: parseInt(item.ano) || new Date().getFullYear(),
          mes: item.mes ? parseInt(String(item.mes).split('-')[1]) : new Date().getMonth() + 1,
          dds: parseInt(item.dds) || 0,
          diadasemana: item.diadasemana || '',
          hora: item.hora ? String(item.hora) : '',
          itm_qtd: parseInt(item.itm_qtd) || 0,
          bar_id: barId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        if (tempoRecords.length > 0) {
          const { error } = await supabase
            .from('contahub_tempo')
            .insert(tempoRecords);
          
          if (error) {
            console.error(`❌ Erro ao inserir tempo:`, error.message, JSON.stringify(error));
            return { success: true, count: 0, errors: tempoRecords.length, errorMessage: error.message, errorDetails: JSON.stringify(error) };
          } else {
            processedCount = tempoRecords.length;
          }
        }
        break;

      case 'prodporhora':
        await supabase
          .from('contahub_prodporhora')
          .delete()
          .eq('bar_id', barId)
          .eq('data_gerencial', dataDate);
        
        const prodporhoraRecords = records.map((item: any) => ({
          data_gerencial: item.data_gerencial || dataDate,
          hora: parseInt(item.hora) || 0,
          produto_id: String(item.produto_id || item.prd || ''),
          produto_descricao: String(item.produto_descricao || item.prd_desc || ''),
          grupo_descricao: String(item.grupo_descricao || item.grp_desc || ''),
          quantidade: parseFloat(item.quantidade || item.qtd || 0),
          valor_unitario: parseFloat(item.valor_unitario || item.valor_unit || 0),
          valor_total: parseFloat(item.valor_total || item.valor || 0),
          bar_id: barId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        if (prodporhoraRecords.length > 0) {
          const { error } = await supabase
            .from('contahub_prodporhora')
            .insert(prodporhoraRecords);
          
          if (error) {
            console.error(`❌ Erro ao inserir prodporhora:`, error.message);
            errors = prodporhoraRecords.length;
          } else {
            processedCount = prodporhoraRecords.length;
          }
        }
        break;

      default:
        console.log(`⚠️ Tipo de dados não suportado: ${dataType}`);
        return { success: false, count: 0, error: `Tipo não suportado: ${dataType}` };
    }

    console.log(`✅ ${dataType}: ${processedCount} processados, ${errors} erros`);
    return { success: true, count: processedCount, errors };

  } catch (error) {
    console.error(`❌ Erro geral ao processar ${dataType}:`, error);
    return { success: false, count: 0, error: error instanceof Error ? error.message : String(error) };
  }
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestBody = await req.text();
    console.log('📥 Body recebido:', requestBody);
    
    const { data_date, bar_id = 3, data_types, process_all = false } = JSON.parse(requestBody || '{}');
    
    // Configurar Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Variáveis do Supabase não encontradas');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const results = {
      processed: [] as any[],
      errors: [] as any[]
    };

    // Se process_all = true, processar todos os dados raw pendentes
    if (process_all) {
      console.log('🔄 Processando TODOS os dados raw pendentes...');
      
      const { data: rawDataList, error: fetchError } = await supabase
        .from('contahub_raw_data')
        .select('*')
        .eq('processed', false)
        .order('created_at', { ascending: true })
        .limit(50);
      
      if (fetchError) {
        throw new Error(`Erro ao buscar dados raw: ${fetchError.message}`);
      }
      
      for (const rawRecord of rawDataList || []) {
        try {
          const result = await processRawData(
            supabase,
            rawRecord.data_type,
            rawRecord.raw_json,
            rawRecord.data_date,
            rawRecord.bar_id
          );
          
          results.processed.push({
            data_type: rawRecord.data_type,
            data_date: rawRecord.data_date,
            bar_id: rawRecord.bar_id,
            result
          });
          
          if (result.success) {
            await supabase
              .from('contahub_raw_data')
              .update({ processed: true, processed_at: new Date().toISOString() })
              .eq('id', rawRecord.id);
          }
          
        } catch (error) {
          console.error(`❌ Erro ao processar registro ${rawRecord.id}:`, error);
          results.errors.push({
            raw_id: rawRecord.id,
            data_type: rawRecord.data_type,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    } else {
      if (!data_date) {
        throw new Error('data_date é obrigatório quando process_all = false');
      }
      
      const typesToProcess = data_types || ['analitico', 'fatporhora', 'pagamentos', 'periodo', 'tempo'];
      
      for (const dataType of typesToProcess) {
        try {
          const { data: rawRecord, error: fetchError } = await supabase
            .from('contahub_raw_data')
            .select('*')
            .eq('data_type', dataType)
            .eq('data_date', data_date)
            .eq('bar_id', bar_id)
            .single();
          
          if (fetchError || !rawRecord) {
            console.log(`⚠️ Nenhum dado raw encontrado para ${dataType} em ${data_date}`);
            continue;
          }
          
          const result = await processRawData(
            supabase,
            dataType,
            rawRecord.raw_json,
            data_date,
            bar_id
          );
          
          results.processed.push({ data_type: dataType, result });
          
          if (result.success && result.count > 0) {
            await supabase
              .from('contahub_raw_data')
              .update({ processed: true, processed_at: new Date().toISOString() })
              .eq('id', rawRecord.id);
          }
          
        } catch (error) {
          console.error(`❌ Erro ao processar ${dataType}:`, error);
          results.errors.push({
            data_type: dataType,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    }
    
    const summary = {
      total_processed: results.processed.length,
      total_errors: results.errors.length,
      success_rate: results.processed.length > 0 
        ? (results.processed.length / (results.processed.length + results.errors.length) * 100).toFixed(1)
        : 0
    };
    
    console.log(`📊 Processamento concluído: ${summary.total_processed} processados, ${summary.total_errors} erros`);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Processamento de dados raw concluído',
      summary,
      details: {
        processed: results.processed,
        errors: results.errors
      },
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
    
  } catch (error) {
    console.error('❌ Erro geral no processor:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
