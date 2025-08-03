import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

console.log("🚀 ContaHub Sync Automático - Edge Function");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateDynamicTimestamp(): string {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}${String(now.getMilliseconds()).padStart(3, '0')}`;
}

// Função para timeout aleatório entre chamadas
function randomTimeout(): number {
  const min = 5000; // 5 segundos
  const max = 30000; // 30 segundos
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Função para enviar notificação Discord
async function sendDiscordNotification(webhookUrl: string, title: string, description: string, color: number = 3447003, fields: any[] = []) {
  try {
    const embed = {
      title,
      description,
      color,
      fields,
      timestamp: new Date().toISOString(),
      footer: {
        text: 'SGB ContaHub Sync'
      }
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ embeds: [embed] }),
    });

    if (!response.ok) {
      console.error('❌ Erro ao enviar Discord webhook:', await response.text());
    } else {
      console.log('✅ Discord notification enviada com sucesso');
    }
  } catch (error) {
    console.error('❌ Erro ao enviar Discord notification:', error);
  }
}

// Função de login no ContaHub
async function loginContaHub(email: string, password: string): Promise<string> {
  console.log('🔐 Fazendo login no ContaHub...');
  
  // No Deno, usar crypto global ao invés de import
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const passwordSha1 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  const loginData = new URLSearchParams({
    "usr_email": email,
    "usr_password_sha1": passwordSha1
  });
  
  // Usar a URL correta do login da API REST (baseado no teste-sync-contahub.js)
  console.log('🔍 Fazendo login no ContaHub via API REST...');
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
  
  const sessionData = await loginResponse.text();
  console.log('🔍 Resposta do ContaHub (primeiros 500 chars):', sessionData.substring(0, 500));
  console.log('🔍 Status da resposta:', loginResponse.status);
  console.log('🔍 Headers da resposta:', Object.fromEntries(loginResponse.headers.entries()));
  
  // Extrair cookies do header (como no código antigo que funcionava)
  const setCookieHeaders = loginResponse.headers.get('set-cookie');
  console.log('🔍 Set-Cookie headers:', setCookieHeaders);
  
  // Para API REST, verificar se retornou JSON com sucesso
  if (loginResponse.status === 200) {
    console.log('✅ Login bem-sucedido - API REST retornou 200');
    
    if (!setCookieHeaders) {
      console.log('⚠️ Cookies não encontrados no header');
      throw new Error(`Cookies de sessão não encontrados no login da API REST`);
    }
    
    // Usar cookies como session token
    const sessionToken = setCookieHeaders;
    console.log('✅ Login ContaHub realizado com sucesso (com cookies da API REST)');
    return sessionToken;
  }
  
  throw new Error(`Login ContaHub falhou. Status: ${loginResponse.status}, Resposta: ${sessionData.substring(0, 200)}`);
}

// Função para fazer requisições ao ContaHub
async function fetchContaHubData(url: string, sessionToken: string) {
  console.log(`🔗 Fazendo requisição: ${url}`);
  console.log(`🍪 Cookies: ${sessionToken?.substring(0, 100)}...`);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Cookie': sessionToken, // sessionToken já são os cookies completos
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json'
    },
  });
  
  console.log(`📡 Status da resposta: ${response.status}`);
  console.log(`📄 Headers da resposta:`, Object.fromEntries(response.headers.entries()));
  
  if (!response.ok) {
    const errorText = await response.text();
    console.log(`❌ Erro na resposta: ${errorText.substring(0, 200)}`);
    throw new Error(`Erro na requisição ContaHub: ${response.statusText}`);
  }
  
  const responseText = await response.text();
  console.log(`📄 Resposta (primeiros 200 chars): ${responseText.substring(0, 200)}`);
  
  return JSON.parse(responseText);
}

// Função para limpar dados antigos em lotes (evitar timeout)
async function clearPreviousData(supabase: any, dataFormatted: string, tableName: string, barId: number = 3) {
  console.log(`🗑️ Limpando dados antigos da tabela ${tableName} para bar_id=${barId} e data=${dataFormatted}...`);
  
  // Converter data para formato correto conforme cada tabela
  const start_date = dataFormatted.split('.').reverse().join('-');
  
  try {
    // Primeiro, contar quantos registros existem
    let countQuery = supabase
      .from(tableName)
      .select('id', { count: 'exact', head: true })
      .eq('bar_id', barId);

    // Adicionar filtro de data específico para cada tabela
    switch (tableName) {
      case 'contahub_analitico':
        countQuery = countQuery.eq('trn_dtgerencial', start_date);
        break;
      case 'contahub_fatporhora':
        countQuery = countQuery.eq('vd_dtgerencial', start_date);
        break;
      case 'contahub_pagamentos':
        countQuery = countQuery.eq('dt_gerencial', start_date);
        break;
      case 'contahub_periodo':
        countQuery = countQuery.eq('dt_gerencial', start_date);
        break;
      case 'contahub_tempo':
        countQuery = countQuery.eq('t0_lancamento', start_date);
        break;
      default:
        console.log(`⚠️ Tabela ${tableName} não mapeada para filtro de data`);
        return;
    }
    
    const { count: totalRecords } = await countQuery;
    
    if (!totalRecords || totalRecords === 0) {
      console.log(`✅ Nenhum dado antigo encontrado em ${tableName} para ${start_date}`);
      return;
    }
    
    console.log(`📊 Encontrados ${totalRecords} registros para limpar em ${tableName}`);
    
    // Se há muitos registros, deletar em lotes menores
    if (totalRecords > 1000) {
      console.log(`⚠️ Muitos registros (${totalRecords}). Pulando limpeza para evitar timeout.`);
      console.log(`💡 Sugestão: Limpar manualmente ou usar processo em background.`);
      return;
    }
    
    // Para poucos registros, deletar normalmente
    let deleteQuery = supabase
      .from(tableName)
      .delete()
      .eq('bar_id', barId);

    // Adicionar filtro de data específico para cada tabela
    switch (tableName) {
      case 'contahub_analitico':
        deleteQuery = deleteQuery.eq('trn_dtgerencial', start_date);
        break;
      case 'contahub_fatporhora':
        deleteQuery = deleteQuery.eq('vd_dtgerencial', start_date);
        break;
      case 'contahub_pagamentos':
        deleteQuery = deleteQuery.eq('dt_gerencial', start_date);
        break;
      case 'contahub_periodo':
        deleteQuery = deleteQuery.eq('dt_gerencial', start_date);
        break;
      case 'contahub_tempo':
        deleteQuery = deleteQuery.eq('t0_lancamento', start_date);
        break;
    }
    
    const result = await deleteQuery;
    
    if (result && result.error) {
      console.error(`❌ Erro ao limpar dados de ${tableName}:`, result.error);
      console.log(`⚠️ Continuando sem limpar dados antigos...`);
      return; // Não throw, apenas continua
    }
    
    console.log(`✅ Dados antigos de ${tableName} removidos: ${result?.count || totalRecords} registros`);
    
  } catch (error) {
    console.error(`❌ Erro na limpeza de ${tableName}:`, error);
    console.log(`⚠️ Continuando sem limpar dados antigos...`);
    // Não throw, apenas continua sem limpar
  }
}

// Função para salvar dados brutos em lotes (evitar timeout)
async function saveRawData(supabase: any, dataType: string, rawData: any, dataFormatted: string, logId?: number) {
  console.log(`💾 Salvando dados brutos de ${dataType}...`);
  
  try {
    // Contar registros para log
    let recordCount = 0;
    let dataToProcess: any[] = [];
    
    if (rawData?.list) {
      dataToProcess = rawData.list;
      recordCount = rawData.list.length;
    } else if (Array.isArray(rawData)) {
      dataToProcess = rawData;
      recordCount = rawData.length;
    } else {
      dataToProcess = [rawData];
      recordCount = 1;
    }
    
    console.log(`📊 ${dataType}: ${recordCount} registros recebidos da API`);
    
    // Se não há dados para processar, retornar 0
    if (recordCount === 0) {
      console.log(`⚠️ Nenhum dado para processar em ${dataType}`);
      return 0;
    }
    
    // Quebrar em lotes de 500 para evitar timeout
    const BATCH_SIZE = 500;
    const batches: any[][] = [];
    
    for (let i = 0; i < dataToProcess.length; i += BATCH_SIZE) {
      batches.push(dataToProcess.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`📦 Processando ${batches.length} lotes de até ${BATCH_SIZE} registros cada`);
    
    let totalInserted = 0;
    let batchErrors: Array<{batch: number, error: string}> = [];
    
    // Processar cada lote sequencialmente (aguardar trigger entre lotes)
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`🔄 Processando lote ${batchIndex + 1}/${batches.length} (${batch.length} registros)`);
      
      try {
        // Inserir lote na tabela raw_data
        const { error } = await supabase
          .from('contahub_raw_data')
          .insert({
            bar_id: 3,
            data_type: dataType,
            data_date: dataFormatted.split('.').reverse().join('-'),
            raw_json: batch,
            processed: false
          });
          
        if (error) {
          const errorMessage = error?.message || error?.details || JSON.stringify(error);
          console.error(`❌ Erro no lote ${batchIndex + 1}:`, errorMessage);
          batchErrors.push({ batch: batchIndex + 1, error: errorMessage });
          
          // Se for timeout, tentar salvar apenas no log
          if (errorMessage.includes('timeout')) {
            console.log(`⚠️ Timeout no lote ${batchIndex + 1}. Salvando no log...`);
            
            if (logId) {
              const { error: logError } = await supabase
                .from('sync_logs_contahub')
                .update({
                  detalhes: {
                    ...(logId ? { log_id: logId } : {}),
                    timeout_lote: `Timeout no lote ${batchIndex + 1} de ${dataType}.`,
                    lote_tamanho: batch.length,
                    total_lotes: batches.length,
                    lote_atual: batchIndex + 1
                  }
                })
                .eq('id', logId);
                
              if (logError) {
                console.error(`❌ Erro ao salvar log de timeout:`, logError);
              }
            }
          }
        } else {
          totalInserted += batch.length;
          console.log(`✅ Lote ${batchIndex + 1} inserido com sucesso (${batch.length} registros)`);
          
          // Aguardar processamento do trigger antes do próximo lote
          if (batchIndex < batches.length - 1) {
            console.log(`⏳ Aguardando processamento do trigger (${dataType} - lote ${batchIndex + 1})...`);
            
            // Aguardar tempo suficiente para o trigger processar
            const triggerWaitTime = Math.max(5000, batch.length * 10); // 5s mínimo ou 10ms por registro
            console.log(`⏰ Aguardando ${Math.round(triggerWaitTime/1000)}s para processamento do trigger...`);
            await new Promise(resolve => setTimeout(resolve, triggerWaitTime));
            
            // Verificar se o trigger processou (opcional - para debug)
            try {
              const { count } = await supabase
                .from('contahub_raw_data')
                .select('*', { count: 'exact', head: true })
                .eq('data_type', dataType)
                .eq('processed', true);
                
              console.log(`📊 Trigger processou ${count || 0} registros até agora`);
            } catch (checkError) {
              console.log(`⚠️ Não foi possível verificar processamento do trigger:`, checkError);
            }
          }
        }
        
      } catch (batchError) {
        console.error(`❌ Erro inesperado no lote ${batchIndex + 1}:`, batchError);
        batchErrors.push({ batch: batchIndex + 1, error: batchError.toString() });
      }
    }
    
    // Relatório final
    console.log(`📊 Resumo ${dataType}: ${totalInserted}/${recordCount} registros inseridos`);
    
    if (batchErrors.length > 0) {
      console.log(`⚠️ ${batchErrors.length} lotes com erro:`, batchErrors);
      
      // Salvar erros no log
      if (logId) {
        await supabase
          .from('sync_logs_contahub')
          .update({
            detalhes: {
              ...(logId ? { log_id: logId } : {}),
              erros_lotes: batchErrors,
              total_inseridos: totalInserted,
              total_recebidos: recordCount
            }
          })
          .eq('id', logId);
      }
    }
    
    return totalInserted;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Falha ao salvar dados brutos de ${dataType}:`, errorMessage);
    throw new Error(`Erro ao salvar ${dataType}: ${errorMessage}`);
  }
}

// Função simplificada para buscar dados analíticos
async function fetchAnaliticData(supabase: any, sessionToken: string, baseUrl: string, dataFormatted: string, logId?: number) {
  console.log('📊 Buscando dados analíticos...');
  
  const start_date = dataFormatted.split('.').reverse().join('-');
  const end_date = dataFormatted.split('.').reverse().join('-');
  const queryTimestamp = generateDynamicTimestamp();
  const analiticUrl = `${baseUrl}/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=77&d0=${start_date}&d1=${end_date}&produto=&grupo=&local=&turno=&mesa=&emp=3768&nfe=1`;
  
  console.log(`🔗 URL Analítico: ${analiticUrl}`);
  
  try {
    const analiticData = await fetchContaHubData(analiticUrl, sessionToken);
    console.log('✅ Dados analíticos obtidos do ContaHub');
    
    // Debug: verificar tamanho e estrutura dos dados
    const dataSize = JSON.stringify(analiticData).length;
    const recordCount = Array.isArray(analiticData) ? analiticData.length : (analiticData?.list?.length || 0);
    console.log(`📊 Debug - Tamanho: ${dataSize} chars, Registros: ${recordCount}`);
    
    // Salvar dados brutos
    return await saveRawData(supabase, 'analitico', analiticData, dataFormatted, logId);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro ao buscar dados analíticos:', errorMessage);
    console.error('❌ Detalhes do erro:', JSON.stringify(error, null, 2));
    throw new Error(`Erro ao buscar analíticos: ${errorMessage}`);
  }
}

// Função simplificada para buscar faturamento por hora
async function fetchFatPorHoraData(supabase: any, sessionToken: string, baseUrl: string, dataFormatted: string, logId?: number) {
  console.log('🕐 Buscando faturamento por hora...');
  
  const start_date = dataFormatted.split('.').reverse().join('-');
  const end_date = dataFormatted.split('.').reverse().join('-');
  const queryTimestamp = generateDynamicTimestamp();
  const fatHoraUrl = `${baseUrl}/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=101&d0=${start_date}&d1=${end_date}&emp=3768&nfe=1`;
  
  try {
    const fatHoraData = await fetchContaHubData(fatHoraUrl, sessionToken);
    console.log('✅ Dados de faturamento por hora obtidos');
    
    return await saveRawData(supabase, 'fatporhora', fatHoraData, dataFormatted, logId);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro ao buscar faturamento por hora:', errorMessage);
    throw new Error(`Erro ao buscar fatporhora: ${errorMessage}`);
  }
}

// Função simplificada para buscar pagamentos
async function fetchPagamentosData(supabase: any, sessionToken: string, baseUrl: string, dataFormatted: string, logId?: number) {
  console.log('💳 Buscando pagamentos...');
  
  const start_date = dataFormatted.split('.').reverse().join('-');
  const end_date = dataFormatted.split('.').reverse().join('-');
  const queryTimestamp = generateDynamicTimestamp();
  const pagamentosUrl = `${baseUrl}/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=7&d0=${start_date}&d1=${end_date}&meio=&emp=3768&nfe=1`;
  
  try {
    const pagamentosData = await fetchContaHubData(pagamentosUrl, sessionToken);
    console.log('✅ Dados de pagamentos obtidos');
    
    return await saveRawData(supabase, 'pagamentos', pagamentosData, dataFormatted, logId);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro ao buscar pagamentos:', errorMessage);
    throw new Error(`Erro ao buscar pagamentos: ${errorMessage}`);
  }
}

// Função simplificada para buscar período
async function fetchPeriodoData(supabase: any, sessionToken: string, baseUrl: string, dataFormatted: string, logId?: number) {
  console.log('📅 Buscando dados por período...');
  
  const start_date = dataFormatted.split('.').reverse().join('-');
  const end_date = dataFormatted.split('.').reverse().join('-');
  const queryTimestamp = generateDynamicTimestamp();
  const periodoUrl = `${baseUrl}/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=5&d0=${start_date}&d1=${end_date}&emp=3768&nfe=1`;
  
  try {
    const periodoData = await fetchContaHubData(periodoUrl, sessionToken);
    console.log('✅ Dados de período obtidos');
    
    return await saveRawData(supabase, 'periodo', periodoData, dataFormatted, logId);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro ao buscar dados de período:', errorMessage);
    throw new Error(`Erro ao buscar periodo: ${errorMessage}`);
  }
}

// Função simplificada para buscar tempo
async function fetchTempoData(supabase: any, sessionToken: string, baseUrl: string, dataFormatted: string, logId?: number) {
  console.log('⏱️ Buscando dados de tempo...');
  
  const start_date = dataFormatted.split('.').reverse().join('-');
  const end_date = dataFormatted.split('.').reverse().join('-');
  const queryTimestamp = generateDynamicTimestamp();
  const tempoUrl = `${baseUrl}/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=81&d0=${start_date}&d1=${end_date}&prod=&grupo=&local=&emp=3768&nfe=1`;
  
  try {
    const tempoData = await fetchContaHubData(tempoUrl, sessionToken);
    console.log('✅ Dados de tempo obtidos');
    
    return await saveRawData(supabase, 'tempo', tempoData, dataFormatted, logId);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro ao buscar dados de tempo:', errorMessage);
    throw new Error(`Erro ao buscar tempo: ${errorMessage}`);
  }
}





Deno.serve(async (req: Request): Promise<Response> => {
  console.log('🚀 INICIANDO EDGE FUNCTION - contahub-sync-automatico');
  console.log('🔍 Method:', req.method);
  console.log('🔍 URL:', req.url);
  console.log('🔍 Headers:', Object.fromEntries(req.headers.entries()));
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    console.log('✅ Retornando CORS OK');
    return new Response('ok', { headers: corsHeaders });
  }

  // Criar timeout para a function (15 minutos)
  const functionTimeout = 15 * 60 * 1000; // 15 minutos
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Timeout da Edge Function após 15 minutos'));
    }, functionTimeout);
  });

  const inicioExecucao = new Date();

  try {
    // Executar o processamento principal com timeout
    return await Promise.race([
      processMainFunction(req, inicioExecucao),
      timeoutPromise
    ]);
    
  } catch (error) {
    return await handleMainError(error, null, inicioExecucao);
  }
});

// Função principal de processamento
async function processMainFunction(req: Request, inicioExecucao: Date): Promise<Response> {
  let logId: number | null = null;
  
  try {
    console.log('📥 Tentando ler body da requisição...');
    
    // Verificar se é chamada do pgcron
    const requestBody = await req.text()
    console.log('📥 Body recebido:', requestBody)
    
    let cronSecret = '';
    let dataEspecifica = '';
    try {
      const parsed = JSON.parse(requestBody || '{}');
      cronSecret = parsed.cronSecret || '';
      dataEspecifica = parsed.dataEspecifica || '';
      console.log('🔑 cronSecret extraído:', cronSecret);
      console.log('📅 dataEspecifica extraída:', dataEspecifica);
    } catch (parseError) {
      console.log('⚠️ Erro ao fazer parse do JSON:', parseError);
    }
    
    // Permitir acesso do pgcron sem verificação rigorosa
    if (cronSecret === 'pgcron_contahub') {
      console.log('✅ Acesso autorizado via pgcron')
    } else {
      console.log('⚠️ Acesso sem cronSecret - continuando (para compatibilidade)')
    }
    
    console.log('🔧 Testando acesso ao Deno.env...');
    
    // Verificar se Deno.env funciona
    const allEnvVars = Deno.env.toObject();
    console.log('🔍 Total de variáveis disponíveis:', Object.keys(allEnvVars).length);
    console.log('🔍 Variáveis que começam com SUPABASE:', Object.keys(allEnvVars).filter(k => k.startsWith('SUPABASE')));
    console.log('🔍 Variáveis que começam com CONTAHUB:', Object.keys(allEnvVars).filter(k => k.startsWith('CONTAHUB')));
    console.log('🔍 Variáveis que começam com DISCORD:', Object.keys(allEnvVars).filter(k => k.startsWith('DISCORD')));
    
    // Configuração do Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('🔍 Variáveis Supabase detalhadas:', {
      url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'FALTANDO',
      serviceKey: supabaseServiceKey ? `${supabaseServiceKey.substring(0, 20)}...` : 'FALTANDO'
    });
    
    if (!supabaseUrl || !supabaseServiceKey) {
      const erro = 'Variáveis do Supabase não encontradas';
      console.error('❌', erro);
      return new Response(JSON.stringify({
        success: false,
        error: erro,
        debug: {
          supabaseUrl: !!supabaseUrl,
          supabaseServiceKey: !!supabaseServiceKey,
          allEnvCount: Object.keys(allEnvVars).length
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Configuração do ContaHub
    const contahubEmail = Deno.env.get('CONTAHUB_EMAIL');
    const contahubPassword = Deno.env.get('CONTAHUB_PASSWORD');
    const contahubBaseUrl = Deno.env.get('CONTAHUB_BASE_URL') || 'https://sp.contahub.com';
    
    console.log('🔍 Variáveis ContaHub:', {
      email: contahubEmail ? 'OK' : 'FALTANDO',
      password: contahubPassword ? 'OK' : 'FALTANDO',
      baseUrl: contahubBaseUrl
    });
    
    if (!contahubEmail || !contahubPassword) {
      throw new Error('Variáveis do ContaHub não encontradas');
    }

    // Configuração Discord
    const discordWebhook = Deno.env.get('DISCORD_WEBHOOK');
    if (!discordWebhook || !discordWebhook.startsWith('https://')) {
      console.log('⚠️ DISCORD_WEBHOOK não configurado ou inválido - notificações desabilitadas');
    }
    
    // Determinar data para sincronização
    let targetDate;
    let dataFormatted;
    let dataISO;
    
    if (dataEspecifica) {
      // Usar data específica informada (formato esperado: DD.MM.YYYY)
      console.log(`📅 Usando data específica: ${dataEspecifica}`);
      const [dayStr, monthStr, yearStr] = dataEspecifica.split('.');
      targetDate = new Date(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr));
      dataFormatted = dataEspecifica;
      dataISO = `${yearStr}-${monthStr}-${dayStr}`;
    } else {
      // Calcular data de ontem (comportamento padrão)
      targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - 1);
      
      const day = String(targetDate.getDate()).padStart(2, '0');
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const year = targetDate.getFullYear();
      
      dataFormatted = `${day}.${month}.${year}`;
      dataISO = `${year}-${month}-${day}`;
    }
    
    console.log(`📅 Sincronizando dados de: ${dataFormatted}`);

    // Criar log inicial
    const { data: logData, error: logError } = await supabase
      .from('sync_logs_contahub')
      .insert({
        bar_id: 3,
        data_sync: dataISO,
        status: 'iniciado',
        inicio_execucao: inicioExecucao.toISOString(),
        triggered_by: cronSecret === 'pgcron_contahub' ? 'pgcron' : 'manual',
        detalhes: {
          data_requisitada: dataFormatted,
          inicio: inicioExecucao.toISOString()
        }
      })
      .select('id')
      .single();

    if (logError) {
      console.error('❌ Erro ao criar log inicial:', logError);
    } else {
      logId = logData.id;
      console.log(`📝 Log criado com ID: ${logId}`);
    }

    // Enviar notificação Discord de início
    if (discordWebhook && discordWebhook.startsWith('https://')) {
      await sendDiscordNotification(
        discordWebhook,
        '🚀 ContaHub Sync Iniciado',
        `Iniciando sincronização automática dos dados do ContaHub para **${dataFormatted}**`,
        3447003, // Azul
        [
          { name: '📅 Data', value: dataFormatted, inline: true },
          { name: '🕐 Início', value: `<t:${Math.floor(inicioExecucao.getTime() / 1000)}:T>`, inline: true },
          { name: '🤖 Trigger', value: cronSecret === 'pgcron_contahub' ? 'Cron Automático' : 'Manual', inline: true }
        ]
      );
    }
    
    // Login no ContaHub
    const sessionToken = await loginContaHub(contahubEmail, contahubPassword);
    
    console.log('🔄 Iniciando sincronização ContaHub...');
    
    // Buscar dados de TODAS as 5 APIs ContaHub com timeouts aleatórios
    console.log('📊 [1/5] Buscando dados analíticos...');
    let totalAnalitico = 0;
    let analiticoSuccess = false;
    try {
      totalAnalitico = await fetchAnaliticData(supabase, sessionToken, contahubBaseUrl, dataFormatted, logId || undefined);
      analiticoSuccess = true;
      console.log('✅ Analítico processado com sucesso');
    } catch (error) {
      console.error('❌ Erro no analítico:', error);
      analiticoSuccess = false;
    }
    
    // Timeout aleatório entre APIs usando função existente
    const timeout1 = randomTimeout();
    console.log(`⏰ Aguardando ${Math.round(timeout1/1000)}s antes da próxima API...`);
    await new Promise(resolve => setTimeout(resolve, timeout1));
    
    console.log('🕐 [2/5] Buscando faturamento por hora...');
    let totalFatporhora = 0;
    let fatporhoraSuccess = false;
    try {
      totalFatporhora = await fetchFatPorHoraData(supabase, sessionToken, contahubBaseUrl, dataFormatted, logId || undefined);
      fatporhoraSuccess = true;
      console.log('✅ Fat/Hora processado com sucesso');
    } catch (error) {
      console.error('❌ Erro no fat/hora:', error);
      fatporhoraSuccess = false;
    }
    
    // Timeout aleatório
    const timeout2 = randomTimeout();
    console.log(`⏰ Aguardando ${Math.round(timeout2/1000)}s antes da próxima API...`);
    await new Promise(resolve => setTimeout(resolve, timeout2));
    
    console.log('💳 [3/5] Buscando pagamentos...');
    let totalPagamentos = 0;
    let pagamentosSuccess = false;
    try {
      totalPagamentos = await fetchPagamentosData(supabase, sessionToken, contahubBaseUrl, dataFormatted, logId || undefined);
      pagamentosSuccess = true;
      console.log('✅ Pagamentos processado com sucesso');
    } catch (error) {
      console.error('❌ Erro nos pagamentos:', error);
      pagamentosSuccess = false;
    }
    
    // Timeout aleatório
    const timeout3 = randomTimeout();
    console.log(`⏰ Aguardando ${Math.round(timeout3/1000)}s antes da próxima API...`);
    await new Promise(resolve => setTimeout(resolve, timeout3));
    
    console.log('📅 [4/5] Buscando dados por período...');
    let totalPeriodo = 0;
    let periodoSuccess = false;
    try {
      totalPeriodo = await fetchPeriodoData(supabase, sessionToken, contahubBaseUrl, dataFormatted, logId || undefined);
      periodoSuccess = true;
      console.log('✅ Período processado com sucesso');
    } catch (error) {
      console.error('❌ Erro no período:', error);
      periodoSuccess = false;
    }
    
    // Timeout aleatório
    const timeout4 = randomTimeout();
    console.log(`⏰ Aguardando ${Math.round(timeout4/1000)}s antes da próxima API...`);
    await new Promise(resolve => setTimeout(resolve, timeout4));
    
    console.log('⏱️ [5/5] Buscando dados de tempo...');
    let totalTempo = 0;
    let tempoSuccess = false;
    try {
      totalTempo = await fetchTempoData(supabase, sessionToken, contahubBaseUrl, dataFormatted, logId || undefined);
      tempoSuccess = true;
      console.log('✅ Tempo processado com sucesso');
    } catch (error) {
      console.error('❌ Erro no tempo:', error);
      tempoSuccess = false;
    }
    
    console.log('✅ Dados salvos na tabela raw_data - processamento será feito automaticamente pelo trigger do banco');
    console.log('💡 Os dados serão processados em background pelas triggers automáticas do PostgreSQL');
    
    // Atualizar campo processed baseado no sucesso de cada tipo
    console.log('🔄 Atualizando status processed para cada tipo...');
    
    const processedUpdates: string[] = [];
    
    // Atualizar analítico
    if (analiticoSuccess) {
      try {
        await supabase
          .from('contahub_raw_data')
          .update({ processed: true })
          .eq('bar_id', 3)
          .eq('data_type', 'analitico')
          .eq('data_date', dataFormatted.split('.').reverse().join('-'));
        processedUpdates.push('analitico: true');
        console.log('✅ Analítico marcado como processado');
      } catch (error) {
        console.error('❌ Erro ao marcar analítico como processado:', error);
      }
    } else {
      processedUpdates.push('analitico: false (erro)');
      console.log('⚠️ Analítico mantido como não processado (erro)');
    }
    
    // Atualizar fat/hora
    if (fatporhoraSuccess) {
      try {
        await supabase
          .from('contahub_raw_data')
          .update({ processed: true })
          .eq('bar_id', 3)
          .eq('data_type', 'fatporhora')
          .eq('data_date', dataFormatted.split('.').reverse().join('-'));
        processedUpdates.push('fatporhora: true');
        console.log('✅ Fat/Hora marcado como processado');
      } catch (error) {
        console.error('❌ Erro ao marcar fat/hora como processado:', error);
      }
    } else {
      processedUpdates.push('fatporhora: false (erro)');
      console.log('⚠️ Fat/Hora mantido como não processado (erro)');
    }
    
    // Atualizar pagamentos
    if (pagamentosSuccess) {
      try {
        await supabase
          .from('contahub_raw_data')
          .update({ processed: true })
          .eq('bar_id', 3)
          .eq('data_type', 'pagamentos')
          .eq('data_date', dataFormatted.split('.').reverse().join('-'));
        processedUpdates.push('pagamentos: true');
        console.log('✅ Pagamentos marcado como processado');
      } catch (error) {
        console.error('❌ Erro ao marcar pagamentos como processado:', error);
      }
    } else {
      processedUpdates.push('pagamentos: false (erro)');
      console.log('⚠️ Pagamentos mantido como não processado (erro)');
    }
    
    // Atualizar período
    if (periodoSuccess) {
      try {
        await supabase
          .from('contahub_raw_data')
          .update({ processed: true })
          .eq('bar_id', 3)
          .eq('data_type', 'periodo')
          .eq('data_date', dataFormatted.split('.').reverse().join('-'));
        processedUpdates.push('periodo: true');
        console.log('✅ Período marcado como processado');
      } catch (error) {
        console.error('❌ Erro ao marcar período como processado:', error);
      }
    } else {
      processedUpdates.push('periodo: false (erro)');
      console.log('⚠️ Período mantido como não processado (erro)');
    }
    
    // Atualizar tempo
    if (tempoSuccess) {
      try {
        await supabase
          .from('contahub_raw_data')
          .update({ processed: true })
          .eq('bar_id', 3)
          .eq('data_type', 'tempo')
          .eq('data_date', dataFormatted.split('.').reverse().join('-'));
        processedUpdates.push('tempo: true');
        console.log('✅ Tempo marcado como processado');
      } catch (error) {
        console.error('❌ Erro ao marcar tempo como processado:', error);
      }
    } else {
      processedUpdates.push('tempo: false (erro)');
      console.log('⚠️ Tempo mantido como não processado (erro)');
    }
    
    console.log('📊 Status final dos processamentos:', processedUpdates.join(', '));
    
    const fimExecucao = new Date();
    const duracaoSegundos = Math.round((fimExecucao.getTime() - inicioExecucao.getTime()) / 1000);
    const totalRegistros = totalAnalitico + totalFatporhora + totalPagamentos + totalPeriodo + totalTempo;
    
    console.log('✅ Sincronização concluída com sucesso!');
    console.log(`📊 Resumo: ${totalRegistros} registros em ${duracaoSegundos}s`);

    // Atualizar log com sucesso
    if (logId) {
      await supabase
        .from('sync_logs_contahub')
        .update({
          status: 'sucesso',
          fim_execucao: fimExecucao.toISOString(),
          duracao_segundos: duracaoSegundos,
          total_analitico: totalAnalitico,
          total_fatporhora: totalFatporhora,
          total_pagamentos: totalPagamentos,
          total_periodo: totalPeriodo,
          total_tempo: totalTempo,
          session_token: sessionToken,
          detalhes: {
            data_requisitada: dataFormatted,
            inicio: inicioExecucao.toISOString(),
            fim: fimExecucao.toISOString(),
            duracao_segundos: duracaoSegundos,
            apis_chamadas: [
              'appvdanalitico.asp',
              'appvdfatporhora.asp', 
              'appvdpagamento.asp',
              'appvdperiodo.asp',
              'appvdtempo.asp'
            ],
            contadores: {
              analitico: totalAnalitico,
              fatporhora: totalFatporhora,
              pagamentos: totalPagamentos,
              periodo: totalPeriodo,
              tempo: totalTempo,
              total: totalRegistros
            },
            status_processamento: {
              analitico: analiticoSuccess,
              fatporhora: fatporhoraSuccess,
              pagamentos: pagamentosSuccess,
              periodo: periodoSuccess,
              tempo: tempoSuccess
            },
            processed_updates: processedUpdates
          }
        })
        .eq('id', logId);
    }

    // Enviar notificação Discord de sucesso
    if (discordWebhook && discordWebhook.startsWith('https://')) {
      await sendDiscordNotification(
        discordWebhook,
        '✅ ContaHub Sync - Dados Coletados',
        `Dados do ContaHub coletados com **sucesso** para ${dataFormatted}. Processamento automático iniciado.`,
        5763719, // Verde
        [
          { name: '📊 Total Coletado', value: totalRegistros.toString(), inline: true },
          { name: '⏱️ Duração', value: `${duracaoSegundos}s`, inline: true },
          { name: '📅 Data', value: dataFormatted, inline: true },
          { name: '📈 Analítico', value: totalAnalitico.toString(), inline: true },
          { name: '🕐 Fat/Hora', value: totalFatporhora.toString(), inline: true },
          { name: '💳 Pagamentos', value: totalPagamentos.toString(), inline: true },
          { name: '📅 Período', value: totalPeriodo.toString(), inline: true },
          { name: '⏱️ Tempo', value: totalTempo.toString(), inline: true },
          { name: '🔄 Status', value: 'Processamento automático em andamento', inline: false }
        ]
      );
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Dados ContaHub coletados com sucesso - processamento automático iniciado',
      data: {
        data_coletada: dataFormatted,
        total_registros_coletados: totalRegistros,
        duracao_coleta_segundos: duracaoSegundos,
        detalhes: {
          analitico: totalAnalitico,
          fatporhora: totalFatporhora,
          pagamentos: totalPagamentos,
          periodo: totalPeriodo,
          tempo: totalTempo
        },
        processamento: 'Em andamento via triggers automáticas',
        log_id: logId
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
    
  } catch (error) {
    return await handleMainError(error, logId, inicioExecucao);
  }
}

// Função para tratar erros principais
async function handleMainError(error: unknown, logId: number | null, inicioExecucao: Date): Promise<Response> {
  const fimExecucao = new Date();
  const duracaoSegundos = Math.round((fimExecucao.getTime() - inicioExecucao.getTime()) / 1000);
  const errorMessage = error instanceof Error ? error.message : String(error);
  const stackTrace = error instanceof Error ? error.stack : null;
  
  console.error('❌ Erro na sincronização:', errorMessage);

  // Atualizar log com erro
  if (logId) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        await supabase
          .from('sync_logs_contahub')
          .update({
            status: 'erro',
            fim_execucao: fimExecucao.toISOString(),
            duracao_segundos: duracaoSegundos,
            erro: errorMessage,
            stack_trace: stackTrace,
            detalhes: {
              inicio: inicioExecucao.toISOString(),
              fim: fimExecucao.toISOString(),
              erro_detalhado: errorMessage,
              stack_trace: stackTrace
            }
          })
          .eq('id', logId);
      } catch (logUpdateError) {
        console.error('❌ Erro ao atualizar log:', logUpdateError);
      }
    }
  }

  // Enviar notificação Discord de erro
  const discordWebhook = Deno.env.get('DISCORD_WEBHOOK');
  if (discordWebhook && discordWebhook.startsWith('https://')) {
    await sendDiscordNotification(
      discordWebhook,
      '❌ ContaHub Sync Falhou',
      `Erro na sincronização automática do ContaHub`,
      15158332, // Vermelho
      [
        { name: '🚨 Erro', value: errorMessage.substring(0, 1024), inline: false },
        { name: '⏱️ Duração até o erro', value: `${duracaoSegundos}s`, inline: true },
        { name: '🆔 Log ID', value: logId?.toString() || 'N/A', inline: true },
        { name: '🕐 Hora do erro', value: `<t:${Math.floor(fimExecucao.getTime() / 1000)}:T>`, inline: true }
      ]
    );
  }
  
  return new Response(JSON.stringify({
    success: false,
    error: errorMessage,
    log_id: logId
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 500
  });
} 