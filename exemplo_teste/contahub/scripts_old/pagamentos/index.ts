import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

// ========================================
// CONTAHUB PAGAMENTOS FIXED - VERSÃO CORRIGIDA
// Sistema: ContaHub → Supabase  
// Baseado na função analítico que funciona 100%
// Corrigido: Bug de inserção que causava 0 inseridos
// ========================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PagamentoRecord {
  bar_id: number;
  dia_da_semana: string;
  semana: number;
  vd: number;
  trn: number;
  dt_gerencial: string;
  hr_lancamento: string | null;
  hr_transacao: string | null; 
  dt_transacao: string | null;
  mesa: string | null;
  cli: string | null;
  cliente: string | null;
  vr_pagamentos: number | null;
  pag: string | null;
  valor: number | null;
  taxa: number | null;
  perc: number | null;
  liquido: number | null;
  vr_couvert: number | null;
  tipo: string | null;
  meio: string | null;
  cartao: string | null;
  autorizacao: string | null;
  dt_credito: string | null;
  usr_abriu: string | null;
  usr_lancou: string | null; 
  usr_aceitou: string | null;
  motivodesconto: string | null;
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
      meio = ''
    } = await req.json();

    console.log('💳 PAGAMENTOS FIXED (CORRIGIDO): ContaHub → Supabase');
    console.log('==============================================================');
    console.log(`📅 Período: ${data_inicio} → ${data_fim}`);
    console.log(`🏪 Bar ID: ${bar_id}`);
    console.log(`🔍 Filtro meio: ${meio}`);

    // ==========================================
    // AUTENTICAÇÃO CONTAHUB (TESTADA E FUNCIONANDO)
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
    // CONSULTA PAGAMENTOS CONTAHUB
    // ==========================================
    const emp_id = bar_id === 1 ? "3768" : "3691";
    
    // Converter datas DD.MM.YYYY para YYYY-MM-DD (formato ContaHub)
    const start_date = data_inicio ? data_inicio.split('.').reverse().join('-') : '';
    const end_date = data_fim ? data_fim.split('.').reverse().join('-') : '';
    
    // URL específica de pagamentos (do testefinal.py)
    const query_url = `https://sp.contahub.com/rest/contahub.cmds.QueryCmd/execQuery/1742602462905?qry=7&d0=${start_date}&d1=${end_date}&emp=${emp_id}&nfe=1&meio=${meio}`;
    
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
      throw new Error(`Erro ao buscar pagamentos: ${response.status}`);
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
      console.log(`📊 ${records.length} pagamentos encontrados no ContaHub`);
    } else {
      console.log('⚠️ Estrutura inesperada ou sem dados');
      return Response.json({
        success: true,
        message: "Nenhum pagamento encontrado para o período",
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
    // PROCESSAMENTO E INSERÇÃO (LÓGICA CORRIGIDA)
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

        // Função auxiliar para converter datas
        const convertDate = (dateStr: string): string => {
          if (!dateStr || dateStr.trim() === '') return start_date;
          const parts = dateStr.split('.');
          if (parts.length === 3) {
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
          return dateStr;
        };

        // Função auxiliar para converter datas que podem ser null
        const convertDateOrNull = (dateStr: string): string | null => {
          if (!dateStr || dateStr.trim() === '') return null;
          const parts = dateStr.split('.');
          if (parts.length === 3) {
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
          return dateStr;
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

        // Parse dos campos principais (CORRIGIDO - usando nomes reais)
        const dt_gerencial = String(record.dt_gerencial || ''); // Data
        const vd = parseInt(String(record.vd || '0'), 10); // VD
        const trn = parseInt(String(record.trn || '0'), 10); // TRN
        const valor = parseFloat(String(record.$valor || '0')); // Valor
        
        console.log(`📋 Registro ${processed_count}: VD=${vd}, TRN=${trn}, Valor=${valor}, Data=${dt_gerencial}`);
        
        // Calcular dia da semana e número da semana
        const [dia_da_semana, semana] = calculateWeekInfo(dt_gerencial);
        
        // VERIFICAR SE REGISTRO JÁ EXISTE (para UPSERT)
        console.log(`🔍 Verificando registro existente: bar_id=${bar_id}, vd=${vd}, trn=${trn}`);
        
        const { data: existingRecord, error: checkError } = await supabase
          .from('pagamentos')
          .select('*')
          .eq('bar_id', bar_id)
          .eq('vd', vd)
          .eq('trn', trn)
          .single();
        
        if (checkError && checkError.code !== 'PGRST116') {
          console.log(`❌ Erro verificação existente: ${checkError.message}`);
          continue;
        }
        
        // Preparar registro para inserção (CORRIGIDO - usando nomes reais dos campos)
        const pagamentoRecord: PagamentoRecord = {
          bar_id: bar_id,
          dia_da_semana: dia_da_semana,
          semana: semana,
          vd: vd,
          trn: trn,
          dt_gerencial: dt_gerencial,
          hr_lancamento: String(record.hr_lancamento || ''),
          hr_transacao: String(record.hr_transacao || ''),
          dt_transacao: convertDateOrNull(String(record.dt_transacao || '')),
          mesa: String(record.mesa || ''),
          cli: String(record.cli || ''),
          cliente: String(record.cliente || ''),
          vr_pagamentos: parseFloat(String(record.$vr_pagamentos || '0')),
          pag: String(record.pag || ''),
          valor: valor,
          taxa: 0, // Campo não presente nos dados atuais
          perc: 0, // Campo não presente nos dados atuais  
          liquido: record.$liquido ? parseFloat(String(record.$liquido)) : null,
          vr_couvert: (record as any).vr_couvert ? parseFloat(String((record as any).vr_couvert)) : ((record as any).$vr_couvert ? parseFloat(String((record as any).$vr_couvert)) : 0),
          tipo: String(record.tipo || ''),
          meio: String(record.meio || ''),
          cartao: String(record.cartao || ''),
          autorizacao: String(record.autorizacao || ''),
          dt_credito: convertDateOrNull(String(record.dt_credito || '')),
          usr_abriu: String(record.usr_abriu || ''),
          usr_lancou: String(record.usr_lancou || ''),
          usr_aceitou: String(record.usr_aceitou || ''),
          motivodesconto: String(record.motivodesconto || '')
        };
        
        // Log do registro preparado
        if (processed_count <= 3) {
          console.log(`📄 Registro ${processed_count} preparado:`, JSON.stringify(pagamentoRecord, null, 2));
        }
        
        // UPSERT NO SUPABASE (INSERT ou UPDATE)
        if (existingRecord) {
          // DEBUG: Log dos valores para comparação
          if (processed_count <= 3) {
            console.log(`🔍 DEBUG COMPARAÇÃO ${processed_count}:`);
            console.log(`   Existing vr_couvert: ${existingRecord.vr_couvert}`);
            console.log(`   New vr_couvert: ${pagamentoRecord.vr_couvert}`);
            console.log(`   Record vr_couvert field: ${(record as any).vr_couvert}`);
            console.log(`   Record $vr_couvert field: ${(record as any).$vr_couvert}`);
          }
          
          // VERIFICAR SE PRECISA ATUALIZAR (incluindo forçar atualização de vr_couvert)
          const needsUpdate = 
            existingRecord.valor !== valor ||
            existingRecord.vr_couvert !== pagamentoRecord.vr_couvert ||
            existingRecord.liquido !== pagamentoRecord.liquido ||
            existingRecord.vr_pagamentos !== pagamentoRecord.vr_pagamentos ||
            existingRecord.pag !== pagamentoRecord.pag ||
            existingRecord.tipo !== pagamentoRecord.tipo ||
            existingRecord.meio !== pagamentoRecord.meio ||
            (existingRecord.vr_couvert === 0 && pagamentoRecord.vr_couvert === 0); // Forçar atualização se ambos forem 0
          
          if (needsUpdate) {
            console.log(`🔄 Atualizando registro ${processed_count} no Supabase...`);
            
            const { error: updateError } = await supabase
              .from('pagamentos')
              .update(pagamentoRecord)
              .eq('bar_id', bar_id)
              .eq('vd', vd)
              .eq('trn', trn);
            
            if (updateError) {
              console.log(`❌ Erro atualização ${processed_count}: ${updateError.message}`);
              continue;
            }
            
            console.log(`✅ Registro ${processed_count} atualizado com sucesso!`);
            updated++;
          } else {
            console.log(`⚠️ Registro ${processed_count} já existe e está atualizado - PULANDO`);
            skipped++;
          }
        } else {
          // INSERIR NOVO REGISTRO
          console.log(`💾 Inserindo novo registro ${processed_count} no Supabase...`);
          
          const { error: insertError } = await supabase
            .from('pagamentos')
            .insert(pagamentoRecord);
          
          if (insertError) {
            console.log(`❌ Erro inserção ${processed_count}: ${insertError.message}`);
            continue;
          }
          
          console.log(`✅ Registro ${processed_count} inserido com sucesso!`);
          inserted++;
        }
        
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