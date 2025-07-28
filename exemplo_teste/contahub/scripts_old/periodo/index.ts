import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

// ========================================
// CONTAHUB PERÍODO COM CLIENTES V2 - UPSERT CORRIGIDO
// Query: 5 (período)
// VERSÃO CORRIGIDA: Evita duplicação verificando por origem
// ========================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { bar_id = 1, data_inicio, data_fim } = await req.json();

    console.log('📊 PERÍODO COM CLIENTES V2 (UPSERT CORRIGIDO): ContaHub → Supabase');
    console.log(`📅 ${data_inicio} → ${data_fim} | 🏪 Bar: ${bar_id}`);

    // LOGIN CONTAHUB
    const contahub_email = "digao@3768";
    const contahub_senha = "Geladeira@001";
    
    const passwordSha1 = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(contahub_senha));
    const passwordSha1Hex = Array.from(new Uint8Array(passwordSha1))
      .map(b => b.toString(16).padStart(2, '0')).join('');

    const loginData = new URLSearchParams({
      "usr_email": contahub_email,
      "usr_password_sha1": passwordSha1Hex
    });

    const loginResponse = await fetch("https://sp.contahub.com/rest/contahub.cmds.UsuarioCmd/login/17421701611337?emp=0", {
      method: "POST",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
      },
      body: loginData.toString()
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const setCookieHeaders = loginResponse.headers.get('set-cookie');
    if (!setCookieHeaders) {
      throw new Error('No cookies received');
    }

    console.log('✅ Login OK');

    // QUERY PERÍODO (Query 5)
    const emp_id = bar_id === 1 ? "3768" : "3691";
    const start_date = data_inicio ? data_inicio.split('.').reverse().join('-') : '';
    const end_date = data_fim ? data_fim.split('.').reverse().join('-') : '';
    
    const timestamp = Date.now();
    const query_url = `https://sp.contahub.com/rest/contahub.cmds.QueryCmd/execQuery/${timestamp}?qry=5&d0=${start_date}&d1=${end_date}&emp=${emp_id}&nfe=1`;
    
    console.log(`🔗 ${query_url}`);

    const response = await fetch(query_url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Cookie": setCookieHeaders,
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest"
      }
    });

    if (!response.ok) {
      throw new Error(`Query failed: ${response.status}`);
    }

    const responseText = await response.text();
    console.log(`✅ Response: ${responseText.length} chars`);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`JSON parse error: ${parseError.message}`);
    }

    let records = [];
    if (data && data.list && Array.isArray(data.list)) {
      records = data.list;
      console.log(`📊 ${records.length} records found`);
    } else {
      console.log('⚠️ No data or unexpected structure');
      return Response.json({
        success: true,
        message: "No data found",
        result: { inserted: 0, updated: 0, skipped: 0, total_processed: 0, registros_com_cliente: 0 }
      }, { headers: corsHeaders });
    }

    if (records.length > 0) {
      console.log(`📄 First record:`, JSON.stringify(records[0], null, 2));
    }

    // SUPABASE CONNECTION
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // PROCESS RECORDS COM LÓGICA DE UPSERT CORRIGIDA
    let inserted = 0, updated = 0, skipped = 0, registros_com_cliente = 0;

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      console.log(`🔄 Processing ${i + 1}/${records.length}`);
      
      try {
        // Extract fields from ContaHub response
        const dt_gerencial = record.data || record.dt_gerencial || start_date;
        const vd = parseInt(String(record.numero || record.vd || '0'), 10);
        
        console.log(`📋 ${i + 1}: ${dt_gerencial} VD=${vd}`);
        
        // Check for existing record FROM THE SAME SOURCE (v2) ONLY
        const { data: existing, error: checkError } = await supabase
          .from('periodo')
          .select('id, vr_couvert')
          .eq('bar_id', bar_id)
          .eq('dt_gerencial', dt_gerencial)
          .eq('vd', vd)
          .eq('origem', 'contahub_periodo_v2')
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          console.log(`❌ Check error: ${checkError.message}`);
          continue;
        }

        // Calculate dia_da_semana and semana
        const dateObj = new Date(dt_gerencial);
        const dayOfWeek = dateObj.getDay(); // 0=Sunday, 6=Saturday
        const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const dia_da_semana = diasSemana[dayOfWeek];
        
        // Calculate week number
        const startOfYear = new Date(dateObj.getFullYear(), 0, 1);
        const daysSinceStart = Math.floor((dateObj.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
        const semana = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7);

        // Create periodo record with ALL available fields
        const periodoRecord = {
          // Basic fields
          bar_id,
          dt_gerencial: dt_gerencial,
          vd: vd,
          trn: parseInt(String(record.trn || '0'), 10),
          tipovenda: String(record.tipovenda || ''),
          vd_mesadesc: String(record.vd_mesadesc || ''),
          vd_localizacao: String(record.vd_localizacao || ''),
          usr_abriu: String(record.usr_abriu || ''),
          
          // Quantities and values
          pessoas: parseInt(String(record.pessoas || '0'), 10),
          qtd_itens: parseInt(String(record.qtd_itens || '0'), 10),
          vr_produtos: parseFloat(String(record.$vr_produtos || record.vr_produtos || '0')),
          vr_pagamentos: parseFloat(String(record.$vr_pagamentos || record.vr_pagamentos || '0')),
          vr_repique: parseFloat(String(record.$vr_repique || record.vr_repique || '0')),
          vr_couvert: parseFloat(String(record.$vr_couvert || record.vr_couvert || '0')),
          vr_desconto: parseFloat(String(record.$vr_desconto || record.vr_desconto || '0')),
          
          // Dates and control
          motivo: String(record.motivo || ''),
          ultimo_pedido: record.ultimo_pedido || null,
          dt_contabil: record.dt_contabil || null,
          vd_dtcontabil: record.vd_dtcontabil || null,
          
          // Invoice data
          nf_autorizada: record.nf_autorizada === 'S' ? true : (record.nf_autorizada === 'N' ? false : null),
          nf_chaveacesso: String(record.nf_chaveacesso || ''),
          nf_dtcontabil: record.nf_dtcontabil || null,
          
          // Calculated fields
          dia_da_semana: dia_da_semana,
          semana: semana,
          
          // Client data - MAPEAMENTO COMPLETO DE TODOS OS CAMPOS
          vd_cpf: String(record.cli_cpf || ''), // CPF do cliente na venda
          cli_cpf: String(record.cli_cpf || ''),
          cli_nome: String(record.cli_nome || ''),
          cli_email: String(record.cli_email || ''),
          cli_dtnasc: record.cli_dtnasc || null,
          cli_telefone: String(record.cli_fone || ''), // CORRIGIDO: campo da ContaHub é cli_fone
          cli_fone: String(record.cli_fone || ''), // Campo direto do telefone
          cli_endereco: String(record.cli_endereco || ''),
          
          // Campos adicionais da ContaHub
          cht_fonea: String(record.cht_fonea || ''),
          cht_nome: String(record.cht_nome || ''),
          cli: String(record.cli || ''),
          
          // Origin
          origem: 'contahub_periodo_v2'
        };

        // Count records with client info
        if (periodoRecord.cli_nome || periodoRecord.vd_cpf) {
          registros_com_cliente++;
        }

        // **LÓGICA DE UPSERT CORRIGIDA: INSERT OU UPDATE (APENAS DA MESMA ORIGEM)**
        if (existing) {
          // REGISTRO EXISTE DA MESMA ORIGEM - FAZER UPDATE
          console.log(`🔄 Registro v2 existe (ID: ${existing.id}) - fazendo UPDATE`);
          console.log(`   💰 Couvert atual: R$ ${existing.vr_couvert || 0} → Novo: R$ ${periodoRecord.vr_couvert}`);
          
          const { data: updateResult, error: updateError } = await supabase
            .from('periodo')
            .update(periodoRecord)
            .eq('id', existing.id)
            .select('id')
            .single();

          if (updateError) {
            console.error(`❌ Update error:`, updateError);
            continue;
          }

          updated++;
          const clienteInfo = periodoRecord.cli_nome ? ` (${periodoRecord.cli_nome} - ${periodoRecord.vd_cpf})` : '';
          console.log(`✅ Updated: ${updateResult?.id || existing.id}${clienteInfo}`);

        } else {
          // REGISTRO NÃO EXISTE DA MESMA ORIGEM - FAZER INSERT
          console.log(`➕ Registro v2 novo - fazendo INSERT`);
          
          const { data: insertResult, error: insertError } = await supabase
            .from('periodo')
            .insert(periodoRecord)
            .select('id')
            .single();

          if (insertError) {
            console.error(`❌ Insert error:`, insertError);
            continue;
          }

          inserted++;
          const clienteInfo = periodoRecord.cli_nome ? ` (${periodoRecord.cli_nome} - ${periodoRecord.vd_cpf})` : '';
          console.log(`✅ Inserted: ${insertResult?.id || 'N/A'}${clienteInfo}`);
        }

      } catch (recordError) {
        console.error(`❌ Record error:`, recordError);
        continue;
      }
    }

    const result = { 
      inserted, 
      updated, 
      skipped, 
      total_processed: records.length,
      registros_com_cliente
    };

    console.log('📊 FINAL (UPSERT CORRIGIDO):');
    console.log(`✅ Inserted: ${result.inserted}`);
    console.log(`🔄 Updated: ${result.updated}`);
    console.log(`⏭️ Skipped: ${result.skipped}`);
    console.log(`👥 Com Cliente: ${result.registros_com_cliente}`);
    console.log(`📋 Total: ${result.total_processed}`);

    return Response.json({
      success: true,
      message: `UPSERT corrigido concluído: ${result.inserted} inseridos, ${result.updated} atualizados`,
      result
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('❌ Erro na Edge Function período v2 corrigida:', error);
    return Response.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { 
      status: 500,
      headers: corsHeaders 
    });
  }
}); 