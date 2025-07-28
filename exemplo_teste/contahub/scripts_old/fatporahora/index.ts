import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

// ========================================
// CONTAHUB FATPORHORA V2 - BASEADO NO EXEMPLO REAL
// URL: 1749180482959, Query: 14
// Estrutura: {"hora":"16:00","qtd":2,"$valor":21.9}
// ========================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FatPorHoraRecord {
  bar_id: number;
  vd_dtgerencial: string;
  dds: string;
  dia: string;
  hora: string;
  qtd: number;
  valor: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { bar_id = 1, data_inicio, data_fim } = await req.json();

    console.log('⏰ FATPORHORA V2: ContaHub → Supabase');
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

    // QUERY FATPORHORA (URL DO EXEMPLO!)
    const emp_id = bar_id === 1 ? "3768" : "3691";
    const start_date = data_inicio ? data_inicio.split('.').reverse().join('-') : '';
    const end_date = data_fim ? data_fim.split('.').reverse().join('-') : '';
    
    const query_url = `https://sp.contahub.com/rest/contahub.cmds.QueryCmd/execQuery/1749180482959?qry=14&d0=${start_date}&d1=${end_date}&emp=${emp_id}&nfe=1`;
    
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
        result: { inserted: 0, updated: 0, skipped: 0, total_processed: 0 }
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

    // PROCESS RECORDS
    let inserted = 0, skipped = 0;

    // Calculate date info
    const date = new Date(start_date);
    const weekdayNames = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'];
    const dds = weekdayNames[date.getDay()];
    const dia = String(date.getDate()).padStart(2, '0');

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      console.log(`🔄 Processing ${i + 1}/${records.length}`);
      
      try {
        // Simple field mapping based on example
        const hora = String(record.hora || '');
        const qtd = parseInt(String(record.qtd || '0'), 10);
        const valor = parseFloat(String(record.$valor || record.valor || '0'));
        
        console.log(`📋 ${i + 1}: ${start_date} ${hora} - ${qtd} - ${valor}`);
        
        // Check duplicates
        const { data: existing, error: checkError } = await supabase
          .from('fatporhora')
          .select('*')
          .eq('bar_id', bar_id)
          .eq('vd_dtgerencial', start_date)
          .eq('hora', hora)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.log(`❌ Check error: ${checkError.message}`);
          continue;
        }

        if (existing) {
          console.log(`⚠️ Duplicate found - skipping`);
          skipped++;
          continue;
        }

        // Insert record
        const fatRecord: FatPorHoraRecord = {
          bar_id,
          vd_dtgerencial: start_date,
          dds,
          dia,
          hora,
          qtd,
          valor
        };

        const { data: insertResult, error: insertError } = await supabase
          .from('fatporhora')
          .insert(fatRecord)
          .select('*')
          .single();

        if (insertError) {
          console.error(`❌ Insert error:`, insertError);
          continue;
        }

        inserted++;
        console.log(`✅ Inserted: ${insertResult?.id || 'N/A'}`);

      } catch (recordError) {
        console.error(`❌ Record error:`, recordError);
        continue;
      }
    }

    const result = { inserted, updated: 0, skipped, total_processed: records.length };

    console.log('📊 FINAL:');
    console.log(`✅ Inserted: ${result.inserted}`);
    console.log(`⏭️ Skipped: ${result.skipped}`);
    console.log(`📋 Total: ${result.total_processed}`);

    return Response.json({
      success: true,
      message: `FatPorHora V2: ${result.inserted} inserted, ${result.skipped} skipped`,
      result
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('❌ ERROR:', error);
    
    return Response.json({
      success: false,
      error: error.message || 'Internal error',
      result: { inserted: 0, updated: 0, skipped: 0, total_processed: 0 }
    }, { 
      status: 500,
      headers: corsHeaders 
    });
  }
}); 