import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

console.log("📥 ContaHub Sync Retroativo - Sincronização de dados históricos");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateDynamicTimestamp(): string {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}${String(now.getMilliseconds()).padStart(3, '0')}`;
}

// Função de login no ContaHub
async function loginContaHub(email: string, password: string): Promise<string> {
  console.log('🔐 Fazendo login no ContaHub...');
  
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const passwordSha1 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  const loginData = new URLSearchParams({
    "usr_email": email,
    "usr_password_sha1": passwordSha1
  });
  
  const loginTimestamp = generateDynamicTimestamp();
  const loginResponse = await fetch(`https://sp.contahub.com/rest/contahub.cmds.UsuarioCmd/login/${loginTimestamp}?emp=0`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json'
    },
    body: loginData,
  });
  
  if (!loginResponse.ok) {
    throw new Error(`Erro no login ContaHub: ${loginResponse.statusText}`);
  }
  
  const setCookieHeaders = loginResponse.headers.get('set-cookie');
  if (!setCookieHeaders) {
    throw new Error('Cookies de sessão não encontrados no login');
  }
  
  console.log('✅ Login ContaHub realizado com sucesso');
  return setCookieHeaders;
}

// Função para fazer requisições ao ContaHub
async function fetchContaHubData(url: string, sessionToken: string) {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Cookie': sessionToken,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json'
    },
  });
  
  if (!response.ok) {
    throw new Error(`Erro na requisição ContaHub: ${response.statusText}`);
  }
  
  const responseText = await response.text();
  return JSON.parse(responseText);
}

// Função para salvar JSON bruto
async function saveRawDataOnly(supabase: any, dataType: string, rawData: any, dataDate: string, barId: number) {
  try {
    const { data, error } = await supabase
      .from('contahub_raw_data')
      .upsert({
        bar_id: barId,
        data_type: dataType,
        data_date: dataDate,
        raw_json: rawData,
        processed: false
      }, {
        onConflict: 'bar_id,data_type,data_date',
        ignoreDuplicates: true
      })
      .select('id')
      .single();
        
    if (error) {
      console.error(`❌ Erro ao salvar ${dataType}:`, error);
      throw new Error(`Erro ao salvar ${dataType}: ${error.message}`);
    }
    
    const recordCount = Array.isArray(rawData?.list) ? rawData.list.length : 
                       Array.isArray(rawData) ? rawData.length : 1;
    
    return {
      raw_data_id: data?.id,
      record_count: recordCount,
      data_type: dataType
    };
    
  } catch (error) {
    console.error(`❌ Falha ao salvar ${dataType}:`, error);
    throw error;
  }
}

// Gerar array de datas entre start e end
function generateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
  }
  
  return dates;
}

// Delay entre requisições
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestBody = await req.text();
    console.log('📥 Body recebido:', requestBody);
    
    const { 
      bar_id, 
      start_date, 
      end_date, 
      data_types = ['analitico', 'fatporhora', 'pagamentos', 'periodo', 'tempo'],
      delay_ms = 2000, // Delay entre dias para não sobrecarregar
      process_after = true // Processar dados após coleta
    } = JSON.parse(requestBody || '{}');
    
    if (!bar_id || !start_date || !end_date) {
      throw new Error('bar_id, start_date e end_date são obrigatórios');
    }
    
    console.log(`🎯 Sincronização retroativa para bar_id=${bar_id}`);
    console.log(`📅 Período: ${start_date} até ${end_date}`);
    
    // Configurar Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Variáveis do Supabase não encontradas');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Buscar configuração do bar
    const { data: barConfig, error: barError } = await supabase
      .from('bars')
      .select('nome, config')
      .eq('id', bar_id)
      .single();
    
    if (barError || !barConfig) {
      throw new Error(`Bar não encontrado: ${bar_id}`);
    }
    
    const emp_id = barConfig.config?.contahub_emp_id;
    if (!emp_id) {
      throw new Error(`ContaHub emp_id não configurado para bar ${bar_id}`);
    }
    
    console.log(`📍 Bar: ${barConfig.nome}, ContaHub emp_id: ${emp_id}`);
    
    // Buscar credenciais do ContaHub
    const { data: contahubCreds, error: credsError } = await supabase
      .from('api_credentials')
      .select('username, password')
      .eq('bar_id', bar_id)
      .eq('sistema', 'contahub')
      .eq('ativo', true)
      .single();
    
    if (credsError || !contahubCreds) {
      throw new Error(`Credenciais ContaHub não encontradas para bar ${bar_id}`);
    }
    
    const contahubEmail = contahubCreds.username;
    const contahubPassword = contahubCreds.password;
    const contahubBaseUrl = 'https://sp.contahub.com';
    
    // Login no ContaHub
    const sessionToken = await loginContaHub(contahubEmail, contahubPassword);
    
    // Gerar datas
    const dates = generateDateRange(start_date, end_date);
    console.log(`📆 Total de ${dates.length} dias para processar`);
    
    const results = {
      total_days: dates.length,
      collected: [] as any[],
      errors: [] as any[],
      skipped: [] as string[]
    };
    
    // Processar cada dia
    for (let i = 0; i < dates.length; i++) {
      const data_date = dates[i];
      console.log(`\n📅 [${i + 1}/${dates.length}] Processando ${data_date}...`);
      
      const dayResult = {
        date: data_date,
        collected: [] as any[],
        errors: [] as any[]
      };
      
      for (const dataType of data_types) {
        try {
          // Verificar se já existe
          const { data: existing } = await supabase
            .from('contahub_raw_data')
            .select('id')
            .eq('bar_id', bar_id)
            .eq('data_type', dataType)
            .eq('data_date', data_date)
            .single();
          
          if (existing) {
            console.log(`⏭️ ${dataType} já existe para ${data_date}, pulando...`);
            continue;
          }
          
          const queryTimestamp = generateDynamicTimestamp();
          
          let url: string;
          
          switch (dataType) {
            case 'analitico':
              url = `${contahubBaseUrl}/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=77&d0=${data_date}&d1=${data_date}&produto=&grupo=&local=&turno=&mesa=&emp=${emp_id}&nfe=1`;
              break;
            case 'tempo':
              url = `${contahubBaseUrl}/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=81&d0=${data_date}&d1=${data_date}&prod=&grupo=&local=&emp=${emp_id}&nfe=1`;
              break;
            case 'pagamentos':
              url = `${contahubBaseUrl}/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=7&d0=${data_date}&d1=${data_date}&meio=&emp=${emp_id}&nfe=1`;
              break;
            case 'fatporhora':
              url = `${contahubBaseUrl}/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=101&d0=${data_date}&d1=${data_date}&emp=${emp_id}&nfe=1`;
              break;
            case 'periodo':
              url = `${contahubBaseUrl}/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=5&d0=${data_date}&d1=${data_date}&emp=${emp_id}&nfe=1`;
              break;
            default:
              continue;
          }
          
          const rawData = await fetchContaHubData(url, sessionToken);
          const saveResult = await saveRawDataOnly(supabase, dataType, rawData, data_date, bar_id);
          
          dayResult.collected.push(saveResult);
          console.log(`✅ ${dataType}: ${saveResult.record_count} registros`);
          
          // Pequeno delay entre tipos de dados
          await delay(500);
          
        } catch (error) {
          console.error(`❌ Erro em ${dataType}:`, error);
          dayResult.errors.push({
            data_type: dataType,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
      
      results.collected.push(dayResult);
      
      // Delay entre dias
      if (i < dates.length - 1) {
        await delay(delay_ms);
      }
    }
    
    // Processar dados coletados se solicitado
    if (process_after) {
      console.log('\n🔄 Processando dados coletados...');
      
      try {
        const processorUrl = `${supabaseUrl}/functions/v1/contahub-processor`;
        
        for (const day of results.collected) {
          if (day.collected.length > 0) {
            await fetch(processorUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': req.headers.get('Authorization') || ''
              },
              body: JSON.stringify({
                data_date: day.date,
                bar_id: bar_id,
                data_types: data_types
              })
            });
            
            await delay(1000);
          }
        }
        
        console.log('✅ Processamento concluído');
      } catch (procError) {
        console.error('❌ Erro no processamento:', procError);
      }
    }
    
    const summary = {
      bar_id,
      bar_nome: barConfig.nome,
      period: `${start_date} até ${end_date}`,
      total_days: results.total_days,
      days_collected: results.collected.filter(d => d.collected.length > 0).length,
      total_records: results.collected.reduce((sum, day) => 
        sum + day.collected.reduce((s: number, c: any) => s + (c.record_count || 0), 0), 0),
      errors_count: results.collected.reduce((sum, day) => sum + day.errors.length, 0)
    };
    
    console.log('\n📊 RESUMO FINAL:');
    console.log(`- Bar: ${summary.bar_nome}`);
    console.log(`- Período: ${summary.period}`);
    console.log(`- Dias processados: ${summary.days_collected}/${summary.total_days}`);
    console.log(`- Total de registros: ${summary.total_records}`);
    console.log(`- Erros: ${summary.errors_count}`);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Sincronização retroativa concluída',
      summary,
      details: results
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
