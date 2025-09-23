import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

console.log("🔄 ContaHub Processor - Processa dados raw salvos");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para processar dados de uma tabela específica
async function processRawData(supabase: any, dataType: string, rawData: any, dataDate: string, barId: number = 3) {
  console.log(`📊 Processando ${dataType} para ${dataDate}...`);
  
  if (!rawData?.list || !Array.isArray(rawData.list)) {
    console.log(`⚠️ Dados ${dataType} inválidos ou vazios`);
    return { success: false, count: 0, error: 'Dados inválidos' };
  }

  const records = rawData.list;
  let processedCount = 0;
  let errors = 0;

  try {
    // Processar cada tipo de dados
    switch (dataType) {
      case 'analitico':
        for (const item of records) {
          try {
            const { error } = await supabase
              .from('contahub_analitico')
              .upsert({
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
              }, {
                onConflict: 'trn,itm,bar_id',
                ignoreDuplicates: false
              });

            if (error) {
              console.error(`❌ Erro ao inserir analítico:`, error.message);
              errors++;
            } else {
              processedCount++;
            }
          } catch (itemError) {
            console.error(`❌ Erro no item analítico:`, itemError);
            errors++;
          }
        }
        break;

      case 'periodo':
        for (const item of records) {
          try {
            const { error } = await supabase
              .from('contahub_periodo')
              .upsert({
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
                vr_pagamentos: parseFloat(item.vr_pagamentos) || 0,
                vr_produtos: parseFloat(item.vr_produtos) || 0,
                vr_repique: parseFloat(item.vr_repique) || 0,
                vr_couvert: parseFloat(item.vr_couvert) || 0,
                vr_desconto: parseFloat(item.vr_desconto) || 0,
                motivo: item.motivo || '',
                dt_contabil: item.dt_contabil || null,
                ultimo_pedido: item.ultimo_pedido || '',
                vd_dtcontabil: item.vd_dtcontabil || null,
                bar_id: barId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'dt_gerencial,cli_nome,vr_pagamentos,vd_mesadesc,usr_abriu,bar_id',
                ignoreDuplicates: true
              });

            if (error) {
              console.error(`❌ Erro ao inserir período:`, error.message);
              errors++;
            } else {
              processedCount++;
            }
          } catch (itemError) {
            console.error(`❌ Erro no item período:`, itemError);
            errors++;
          }
        }
        break;

      case 'fatporhora':
        for (const item of records) {
          try {
            const { error } = await supabase
              .from('contahub_fatporhora')
              .upsert({
                vd_dtgerencial: item.vd_dtgerencial || dataDate,
                dds: parseInt(item.dds) || 0,
                dia: item.dia || '',
                hora: parseInt(item.hora) || 0,
                qtd: parseFloat(item.qtd) || 0,
                valor: parseFloat(item['$valor'] || item.valor) || 0,
                bar_id: barId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'vd_dtgerencial,hora,bar_id',
                ignoreDuplicates: false
              });

            if (error) {
              console.error(`❌ Erro ao inserir fatporhora:`, error.message);
              errors++;
            } else {
              processedCount++;
            }
          } catch (itemError) {
            console.error(`❌ Erro no item fatporhora:`, itemError);
            errors++;
          }
        }
        break;

      case 'pagamentos':
        for (const item of records) {
          try {
            const { error } = await supabase
              .from('contahub_pagamentos')
              .upsert({
                dt_gerencial: item.dt_gerencial || dataDate,
                meio: item.meio || '',
                bruto: parseFloat(item.bruto) || 0,
                liquido: parseFloat(item.liquido) || 0,
                taxa: parseFloat(item.taxa) || 0,
                bar_id: barId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'dt_gerencial,meio,bar_id',
                ignoreDuplicates: false
              });

            if (error) {
              console.error(`❌ Erro ao inserir pagamento:`, error.message);
              errors++;
            } else {
              processedCount++;
            }
          } catch (itemError) {
            console.error(`❌ Erro no item pagamento:`, itemError);
            errors++;
          }
        }
        break;

      case 'tempo':
        for (const item of records) {
          try {
            const { error } = await supabase
              .from('contahub_tempo')
              .upsert({
                dt_gerencial: item.dt_gerencial || dataDate,
                prd: item.prd || '',
                prd_desc: item.prd_desc || '',
                grp_desc: item.grp_desc || '',
                tempo_medio: parseFloat(item.tempo_medio) || 0,
                qtd_vendas: parseInt(item.qtd_vendas) || 0,
                bar_id: barId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'dt_gerencial,prd,bar_id',
                ignoreDuplicates: false
              });

            if (error) {
              console.error(`❌ Erro ao inserir tempo:`, error.message);
              errors++;
            } else {
              processedCount++;
            }
          } catch (itemError) {
            console.error(`❌ Erro no item tempo:`, itemError);
            errors++;
          }
        }
        break;

      case 'prodporhora':
        for (const item of records) {
          try {
            const { error } = await supabase
              .from('contahub_prodporhora')
              .upsert({
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
              }, {
                onConflict: 'data_gerencial,hora,produto_id,bar_id',
                ignoreDuplicates: false
              });

            if (error) {
              console.error(`❌ Erro ao inserir prodporhora:`, error.message);
              errors++;
            } else {
              processedCount++;
            }
          } catch (itemError) {
            console.error(`❌ Erro no item prodporhora:`, itemError);
            errors++;
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
        .limit(50); // Processar até 50 registros por vez
      
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
            result
          });
          
          // Marcar como processado se sucesso
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
      // Processar dados específicos
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
            .eq('processed', false)
            .single();
          
          if (fetchError) {
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
          
          // Marcar como processado se sucesso
          if (result.success) {
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
      success_rate: results.processed.length / (results.processed.length + results.errors.length) * 100
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
