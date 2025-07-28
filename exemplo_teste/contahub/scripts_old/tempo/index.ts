import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

// ========================================
// CONTAHUB TEMPO DINÂMICO - VERSÃO FINAL
// Sistema: ContaHub → Supabase  
// Baseado na função pagamentos que funcionou 100%
// Query: qry=81, URL: 1742603193885
// ========================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TempoRecord {
  bar_id: number;
  dia_da_semana: string;
  semana: number;
  grp_desc: string | null;
  prd_desc: string | null;
  vd: number | null;
  itm: number | null;
  t0_lancamento: string | null;
  t1_prodini: string | null;
  t2_prodfim: string | null;
  t3_entrega: string | null;
  t0_t1: number | null;
  t0_t2: number | null;
  t0_t3: number | null;
  t1_t2: number | null;
  t1_t3: number | null;
  t2_t3: number | null;
  prd: number | null;
  prd_idexterno: string | null;
  loc_desc: string | null;
  vd_mesadesc: string | null;
  vd_localizacao: string | null;
  usr_abriu: string | null;
  usr_lancou: string | null;
  usr_produziu: string | null;
  usr_entregou: string | null;
  usr_transfcancelou: string | null;
  prefixo: string | null;
  tipovenda: string | null;
  ano: number | null;
  mes: number | null;
  dia: number | null;
  dds: string | null;
  diadasemana: string | null;
  hora: string | null;
  itm_qtd: number | null;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { 
      bar_id = 1, 
      data_inicio, 
      data_fim,
      prod = '',
      grupo = '',
      local = ''
    } = await req.json();

    console.log('⏱️  TEMPO DINÂMICO: ContaHub → Supabase');
    console.log('==============================================================');
    console.log(`📅 Período: ${data_inicio} → ${data_fim}`);
    console.log(`🏪 Bar ID: ${bar_id}`);
    console.log(`🔍 Filtros: prod=${prod}, grupo=${grupo}, local=${local}`);

    // ==========================================
    // AUTENTICAÇÃO CONTAHUB (PADRÃO DOS PAGAMENTOS)
    // ==========================================
    console.log('🔐 Fazendo login no ContaHub...');
    
    const contahub_email = "digao@3768";
    const contahub_senha = "Geladeira@001";
    
    // Converter senha para SHA1 (mesmo padrão das functions que funcionam)
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
      throw new Error(`Erro no login ContaHub: ${loginResponse.status}`);
    }

    const setCookieHeaders = loginResponse.headers.get('set-cookie');
    if (!setCookieHeaders) {
      throw new Error('Cookies de autenticação não obtidos');
    }

    console.log(`✅ Login realizado com sucesso!`);

    // ==========================================
    // CONSULTA TEMPO CONTAHUB
    // ==========================================
    const emp_id = bar_id === 1 ? "3768" : "3691";
    
    // Converter datas DD.MM.YYYY para YYYY-MM-DD (formato ContaHub)
    const start_date = data_inicio ? data_inicio.split('.').reverse().join('-') : '';
    const end_date = data_fim ? data_fim.split('.').reverse().join('-') : '';
    
    // URL específica de tempo (baseada no testefinal.py)
    const query_url = `https://sp.contahub.com/rest/contahub.cmds.QueryCmd/execQuery/1742603193885?qry=81&d0=${start_date}&d1=${end_date}&emp=${emp_id}&prod=${prod}&grupo=${grupo}&local=${local}`;
    
    console.log(`🔗 URL ContaHub: ${query_url}`);

    const response = await fetch(query_url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Cookie": setCookieHeaders,
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest"
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar dados de tempo: ${response.status}`);
    }

    const responseText = await response.text();
    console.log(`✅ Resposta ContaHub: ${responseText.length} caracteres`);

    // Parsear JSON
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('✅ JSON parseado com sucesso');
    } catch (parseError) {
      throw new Error(`Erro ao parsear JSON: ${parseError.message}`);
    }

    // Extrair registros (mesmo padrão das functions que funcionam)
    let records = [];
    if (data && data.list && Array.isArray(data.list)) {
      records = data.list;
      console.log(`📊 ${records.length} registros de tempo encontrados no ContaHub`);
    } else {
      console.log('⚠️ Estrutura inesperada ou sem dados');
      return Response.json({
        success: true,
        message: "Nenhum registro de tempo encontrado para o período",
        result: { inserted: 0, updated: 0, skipped: 0, total_processed: 0 }
      }, { headers: corsHeaders });
    }

    // Debug: Log do primeiro registro
    if (records.length > 0) {
      console.log(`📄 Primeiro registro:`, JSON.stringify(records[0], null, 2));
    }

    // ==========================================
    // PREPARAR CONEXÃO SUPABASE
    // ==========================================
    console.log('🔌 Conectando ao Supabase...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // ==========================================
    // PROCESSAMENTO E INSERÇÃO (LÓGICA TESTADA)
    // ==========================================
    console.log('🔄 Processando e inserindo dados...');
    
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    let processed_count = 0;
    for (const record of records) {
      processed_count++;
      console.log(`🔄 Processando registro ${processed_count}/${records.length}`);
      
      try {
        // Log do registro original para debug
        if (processed_count <= 3) {
          console.log(`📄 Registro ${processed_count} original:`, JSON.stringify(record, null, 2));
        }

        // Função auxiliar para converter timestamps
        const convertTimestamp = (timestampStr: string): string | null => {
          if (!timestampStr || timestampStr.trim() === '') return null;
          // ContaHub retorna timestamps como "2025-05-15T22:36:16-0300"
          // Converter para formato aceito pelo PostgreSQL
          return timestampStr.replace('T', ' ').split('-0300')[0];
        };

        // Função auxiliar para calcular informações da semana
        const calculateWeekInfo = (dateStr: string): [string, number] => {
          const date = new Date(dateStr);
          const weekdayNames = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO', 'DOMINGO'];
          const dayOfWeek = date.getDay();
          const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          const weekName = weekdayNames[dayIndex];
          
          // Calcular número da semana no ano
          const startOfYear = new Date(date.getFullYear(), 0, 1);
          const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
          const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
          
          return [weekName, weekNumber];
        };

        // Parse dos campos principais (BASEADO NA ESTRUTURA ENCONTRADA)
        const vd = parseInt(String(record.vd || '0'), 10);
        const itm = parseInt(String(record.itm || '0'), 10);
        const t0_lancamento = convertTimestamp(String(record['t0-lancamento'] || ''));
        
        // Usar t0_lancamento para calcular data base com regra de vigência
        let base_date = start_date;
        if (t0_lancamento) {
          const timestamp_parts = t0_lancamento.split(' ');
          const date_part = timestamp_parts[0];
          const time_part = timestamp_parts[1] || '00:00:00';
          
          // Extrair hora do timestamp
          const hour = parseInt(time_part.split(':')[0]);
          
          // Regra de vigência: se for depois da meia-noite (0h-8h), considera dia anterior
          if (hour >= 0 && hour < 8) {
            // Subtrair 1 dia para considerar vigência do dia anterior
            const date_obj = new Date(date_part);
            date_obj.setDate(date_obj.getDate() - 1);
            base_date = date_obj.toISOString().split('T')[0];
            console.log(`🌙 Vigência: ${date_part} ${time_part} → ${base_date} (dia anterior)`);
          } else {
            base_date = date_part;
            console.log(`☀️ Vigência: ${date_part} ${time_part} → ${base_date} (mesmo dia)`);
          }
        }
        
        console.log(`📋 Registro ${processed_count}: VD=${vd}, ITM=${itm}, T0=${t0_lancamento}, Data=${base_date}`);
        
        // Calcular dia da semana e número da semana
        const [dia_da_semana, semana] = calculateWeekInfo(base_date);
        
        // VERIFICAR DUPLICATA (mesmo padrão das functions que funcionam)
        console.log(`🔍 Verificando duplicata: bar_id=${bar_id}, vd=${vd}, itm=${itm}`);
        
        const { data: existingRecord, error: checkError } = await supabase
          .from('tempo')
          .select('*')
          .eq('bar_id', bar_id)
          .eq('vd', vd)
          .eq('itm', itm)
          .single();
        
        if (checkError && checkError.code !== 'PGRST116') {
          console.log(`❌ Erro verificação duplicata: ${checkError.message}`);
          continue;
        }
        
        if (existingRecord) {
          console.log(`⚠️ Registro ${processed_count} já existe - PULANDO`);
          skipped++;
          continue;
        }
        
        console.log(`✅ Registro ${processed_count} é novo - INSERINDO`);
        
        // Calcular campos de data corretamente
        const base_date_obj = new Date(base_date);
        const ano = base_date_obj.getFullYear();
        const mes = base_date_obj.getMonth() + 1;
        const dia_numero = base_date_obj.getDate();
        
        // Calcular campo 'dia' no formato YYYYMMDD (como no ContaHub original)
        const dia_yyyymmdd = parseInt(`${ano}${String(mes).padStart(2, '0')}${String(dia_numero).padStart(2, '0')}`);
        
        console.log(`📅 Data calculada: ${base_date} → ano=${ano}, mes=${mes}, dia_numero=${dia_numero}, dia_yyyymmdd=${dia_yyyymmdd}`);
        
        // Preparar registro para inserção (MAPEAMENTO CORRETO DOS CAMPOS)
        const tempoRecord: TempoRecord = {
          bar_id: bar_id,
          dia_da_semana: dia_da_semana,
          semana: semana,
          grp_desc: String(record.grp_desc || ''),
          prd_desc: String(record.prd_desc || ''),
          vd: vd,
          itm: itm,
          t0_lancamento: t0_lancamento,
          t1_prodini: convertTimestamp(String(record['t1-prodini'] || '')),
          t2_prodfim: convertTimestamp(String(record['t2-prodfim'] || '')),
          t3_entrega: convertTimestamp(String(record['t3-entrega'] || '')),
          t0_t1: parseInt(String(record['t0-t1'] || '0'), 10) || null,
          t0_t2: parseInt(String(record['t0-t2'] || '0'), 10) || null,
          t0_t3: parseInt(String(record['t0-t3'] || '0'), 10) || null,
          t1_t2: parseInt(String(record['t1-t2'] || '0'), 10) || null,
          t1_t3: parseInt(String(record['t1-t3'] || '0'), 10) || null,
          t2_t3: parseInt(String(record['t2-t3'] || '0'), 10) || null,
          prd: parseInt(String(record.prd || '0'), 10) || null,
          prd_idexterno: String(record.prd_idexterno || ''),
          loc_desc: String(record.loc_desc || ''),
          vd_mesadesc: String(record.vd_mesadesc || ''),
          vd_localizacao: String(record.vd_localizacao || ''),
          usr_abriu: String(record.usr_abriu || ''),
          usr_lancou: String(record.usr_lancou || ''),
          usr_produziu: String(record.usr_produziu || ''),
          usr_entregou: String(record.usr_entregou || ''),
          usr_transfcancelou: String(record.usr_transfcancelou || ''),
          prefixo: String(record.prefixo || ''),
          tipovenda: String(record.tipovenda || ''),
          ano: ano,
          mes: mes,
          dia: dia_yyyymmdd,  // CORREÇÃO: formato YYYYMMDD
          dds: String(record.dds || ''),
          diadasemana: String(record.diadasemana || ''),
          hora: String(record.hora || ''),
          itm_qtd: parseFloat(String(record.itm_qtd || '0')) || null
        };
        
        // Log do registro preparado
        if (processed_count <= 3) {
          console.log(`📄 Registro ${processed_count} preparado:`, JSON.stringify(tempoRecord, null, 2));
        }
        
        // INSERIR NO SUPABASE (LÓGICA TESTADA)
        console.log(`💾 Inserindo registro ${processed_count} no Supabase...`);
        
        const { error: insertError } = await supabase
          .from('tempo')
          .insert(tempoRecord);
        
        if (insertError) {
          console.log(`❌ Erro inserção ${processed_count}: ${insertError.message}`);
          continue;
        }
        
        console.log(`✅ Registro ${processed_count} inserido com sucesso!`);
        inserted++;
        
      } catch (error) {
        console.log(`❌ Erro processando registro ${processed_count}: ${error.message}`);
        continue;
      }
    }

    const result = {
      inserted,
      updated, 
      skipped,
      total_processed: records.length
    };

    console.log('🎯 RESULTADO FINAL:');
    console.log('====================');
    console.log(`📊 Processados: ${result.total_processed}`);
    console.log(`✅ Inseridos: ${result.inserted}`);
    console.log(`🔄 Atualizados: ${result.updated}`);
    console.log(`⚠️ Pulados: ${result.skipped}`);
    
    return Response.json({
      success: true,
      message: `Processamento concluído: ${result.inserted} inseridos, ${result.skipped} pulados de ${result.total_processed} registros`,
      result
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('❌ ERRO GERAL:', error);
    
    return Response.json({
      success: false,
      error: error.message,
      details: String(error)
    }, {
      status: 500,
      headers: corsHeaders
    });
  }
}); 