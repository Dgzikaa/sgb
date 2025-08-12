import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

console.log("📥 ContaHub Sync - Coleta de Dados (Processamento via pg_cron)");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateDynamicTimestamp(): string {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}${String(now.getMilliseconds()).padStart(3, '0')}`;
}

// Função para enviar notificação Discord
async function sendDiscordNotification(message: string, isError: boolean = false) {
  try {
    const webhookUrl = Deno.env.get('DISCORD_CONTAHUB_WEBHOOK');
    if (!webhookUrl) {
      console.log('⚠️ Discord webhook não configurado');
      return;
    }

    const embed = {
      title: isError ? '❌ ContaHub Sync - Erro' : '🔄 ContaHub Sync',
      description: message,
      color: isError ? 15158332 : 3066993, // Vermelho ou Verde
      timestamp: new Date().toISOString(),
      footer: {
        text: 'SGB ContaHub Automation'
      }
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        embeds: [embed]
      })
    });

    if (!response.ok) {
      console.error('❌ Erro ao enviar notificação Discord:', response.status, response.statusText);
    } else {
      console.log('📢 Notificação Discord enviada');
    }
  } catch (error) {
    console.error('❌ Erro ao enviar notificação Discord:', error);
  }
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
  console.log(`🔗 Fazendo requisição: ${url}`);
  
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

// Função para salvar JSON bruto (SEM PROCESSAMENTO)
async function saveRawDataOnly(supabase: any, dataType: string, rawData: any, dataDate: string, barId: number = 3) {
  console.log(`💾 Salvando JSON bruto para ${dataType}...`);
  
  try {
    // Salvar JSON completo como está - SEM PROCESSAMENTO
    const { data, error } = await supabase
          .from('contahub_raw_data')
          .insert({
        bar_id: barId,
            data_type: dataType,
        data_date: dataDate,
        raw_json: rawData, // JSON completo sem modificação
        processed: false    // Sempre false - processamento será manual
      })
      .select('id')
      .single();
          
        if (error) {
      console.error(`❌ Erro ao salvar ${dataType}:`, error);
      throw new Error(`Erro ao salvar ${dataType}: ${error.message}`);
    }
    
    const recordCount = Array.isArray(rawData?.list) ? rawData.list.length : 
                       Array.isArray(rawData) ? rawData.length : 1;
    
    console.log(`✅ ${dataType} salvo: raw_data_id=${data.id}, registros=${recordCount}`);
    
    return {
      raw_data_id: data.id,
      record_count: recordCount,
      data_type: dataType
    };
    
  } catch (error) {
    console.error(`❌ Falha ao salvar ${dataType}:`, error);
    throw error;
  }
}

// Processamento será feito via pg_cron - função removida

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestBody = await req.text();
    console.log('📥 Body recebido:', requestBody);
    
    const { bar_id, data_date } = JSON.parse(requestBody || '{}');
    
    if (!bar_id || !data_date) {
      throw new Error('bar_id e data_date são obrigatórios');
    }
    
    console.log(`🎯 Processando dados para bar_id=${bar_id}, data=${data_date}`);
    
    // Enviar notificação de início
    await sendDiscordNotification(`🚀 **Iniciando sincronização ContaHub**\n\n📊 **Dados:** ${data_date}\n🏪 **Bar ID:** ${bar_id}\n⏰ **Início:** ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    
    // Configurar Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Variáveis do Supabase não encontradas');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Configurar ContaHub
    const contahubEmail = Deno.env.get('CONTAHUB_EMAIL');
    const contahubPassword = Deno.env.get('CONTAHUB_PASSWORD');
    const contahubBaseUrl = 'https://sp.contahub.com';
    
    if (!contahubEmail || !contahubPassword) {
      throw new Error('Variáveis do ContaHub não encontradas');
    }
    
    // Login no ContaHub
    const sessionToken = await loginContaHub(contahubEmail, contahubPassword);
    
    const results = {
      collected: [] as any[],
      processed: [] as any[],
      errors: [] as any[]
    };
    
    // 1. COLETA E ARMAZENAMENTO DE JSON BRUTO
    console.log('\n📥 FASE 1: Coletando e salvando JSONs brutos...');
    
    const dataTypes = ['analitico', 'fatporhora', 'pagamentos', 'periodo', 'tempo'];
    
    for (const dataType of dataTypes) {
      try {
        console.log(`\n📊 Coletando ${dataType}...`);
        
        // Gerar timestamp dinâmico para cada query
        const queryTimestamp = generateDynamicTimestamp();
        
        // emp_id fixo para Ordinário (bar_id = 3)
        const emp_id = "3768";
        
        let url: string;
        
        // Construir URL específica para cada tipo de dados
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
            throw new Error(`Tipo de dados não suportado: ${dataType}`);
        }
        
        console.log(`🔗 URL: ${url}`);
        
        // Buscar dados do ContaHub
        const rawData = await fetchContaHubData(url, sessionToken);
        
        // Salvar JSON bruto (SEM PROCESSAMENTO)
        const saveResult = await saveRawDataOnly(supabase, dataType, rawData, data_date, bar_id);
        results.collected.push(saveResult);
        
        console.log(`✅ ${dataType}: JSON bruto salvo (${saveResult.record_count} registros)`);
        
      } catch (error) {
        console.error(`❌ Erro ao coletar ${dataType}:`, error);
        results.errors.push({ 
          phase: 'collection', 
          data_type: dataType, 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }
    
    // PROCESSAMENTO SERÁ FEITO VIA PG_CRON
    console.log('\n🔄 PROCESSAMENTO: Dados salvos para processamento automático via pg_cron');
    
    // Resultado final
    const summary = {
      bar_id,
      data_date,
      collected_count: results.collected.length,
      error_count: results.errors.length,
      total_records_collected: results.collected.reduce((sum, item) => sum + item.record_count, 0),
      processing_method: 'pg_cron_background'
    };
    
    console.log('\n📊 RESUMO FINAL:');
    console.log(`- Coletados: ${summary.collected_count}/5 tipos`);
    console.log(`- Registros coletados: ${summary.total_records_collected}`);
    console.log(`- Erros: ${summary.error_count}`);
    console.log(`- Processamento: Automático via pg_cron`);
    
    // 🚀 CHAMAR DISCORD NOTIFICATION para CONTAHUB
    try {
      const discordResponse = await fetch('https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/discord-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({
          title: summary.error_count === 0 ? '✅ ContaHub Sync Concluído' : '⚠️ ContaHub Sync com Erros',
          webhook_type: 'contahub',
          processed_records: summary.total_records_collected,
          bar_id: parseInt(bar_id),
          execution_time: `Dados: ${data_date}`,
          custom_message: `📊 **Coleta ContaHub concluída**\n\n📈 **Resultados:**\n• Coletados: ${summary.collected_count}/5 tipos\n• Registros coletados: ${summary.total_records_collected}\n• Erros: ${summary.error_count}\n\n🔄 **Processamento:** Iniciado automaticamente via pg_cron\n⏰ **Fim:** ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`
        })
      });

      if (!discordResponse.ok) {
        console.error('❌ Erro ao enviar notificação Discord ContaHub:', discordResponse.status);
      } else {
        console.log('📢 Notificação Discord ContaHub enviada');
      }
    } catch (discordError) {
      console.error('❌ Erro ao enviar notificação Discord ContaHub:', discordError);
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'ContaHub coleta concluída - processamento via pg_cron',
      summary,
      details: {
        collected: results.collected,
        errors: results.errors
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
    
    // Enviar notificação de erro crítico
    const errorMessage = `❌ **Erro crítico na sincronização ContaHub**\n\n⏰ **Tempo:** ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n🚨 **Erro:** ${error instanceof Error ? error.message : String(error)}`;
    await sendDiscordNotification(errorMessage, true);
  
  return new Response(JSON.stringify({
    success: false,
      error: error instanceof Error ? error.message : String(error)
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 500
  });
} 
});