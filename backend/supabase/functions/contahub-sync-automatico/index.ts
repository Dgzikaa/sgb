import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

console.log("🚀 ContaHub Sync Automático - Edge Function");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Funções auxiliares para tratamento seguro de valores
function parseFloatSafe(value: any): number {
  if (!value || value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    return parseFloat(value.replace(',', '.')) || 0;
  }
  return 0;
}

function parseIntSafe(value: any): number {
  if (!value || value === null || value === undefined) return 0;
  if (typeof value === 'number') return Math.floor(value);
  if (typeof value === 'string') {
    return parseInt(value) || 0;
  }
  return 0;
}

function generateDynamicTimestamp(): string {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}${String(now.getMilliseconds()).padStart(3, '0')}`;
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
  
  const loginResponse = await fetch('https://sp.contahub.com/vd/mob_login.asp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: loginData,
  });
  
  if (!loginResponse.ok) {
    throw new Error(`Erro no login ContaHub: ${loginResponse.statusText}`);
  }
  
  const sessionData = await loginResponse.text();
  
  // Extrair session token da resposta
  const sessionMatch = sessionData.match(/sessaoativa=([^&]+)/);
  if (!sessionMatch) {
    throw new Error('Token de sessão não encontrado na resposta do login');
  }
  
  const sessionToken = sessionMatch[1];
  console.log('✅ Login ContaHub realizado com sucesso');
  return sessionToken;
}

// Função para fazer requisições ao ContaHub
async function fetchContaHubData(url: string, sessionToken: string) {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Cookie': `sessaoativa=${sessionToken}`,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Erro na requisição ContaHub: ${response.statusText}`);
  }
  
  return await response.json();
}

// Função para limpar dados antigos antes de inserir novos
async function clearPreviousData(supabase: any, dataOntem: string, tableName: string) {
  console.log(`🗑️ Limpando dados antigos da tabela ${tableName} para ${dataOntem}...`);
  
  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq('bar_id', 3);
  
  if (error) {
    console.error(`❌ Erro ao limpar dados de ${tableName}:`, error);
    throw error;
  }
  
  console.log(`✅ Dados antigos de ${tableName} removidos`);
}

// Função para processar dados analíticos
async function processAnaliticData(supabase: any, sessionToken: string, baseUrl: string, dataOntem: string) {
  console.log('📊 Processando dados analíticos...');
  
  const analiticUrl = `${baseUrl}/apps/appvdanalitico.asp?dtini=${dataOntem}&dtfim=${dataOntem}&formato=json&request=${generateDynamicTimestamp()}`;
  const analiticData = await fetchContaHubData(analiticUrl, sessionToken);
  
  if (!analiticData || !Array.isArray(analiticData)) {
    console.log('⚠️ Nenhum dado analítico encontrado');
    return 0;
  }
  
  await clearPreviousData(supabase, dataOntem, 'contahub_analitico');
  
  const processedData = analiticData.map(item => ({
    vd_mesadesc: item.vd_mesadesc || null,
    vd_localizacao: item.vd_localizacao || null,
    itm: item.itm || null,
    trn: item.trn || null,
    trn_desc: item.trn_desc || null,
    prefixo: item.prefixo || null,
    tipo: item.tipo || null,
    tipovenda: item.tipovenda || null,
    ano: parseIntSafe(item.ano),
    mes: parseIntSafe(item.mes),
    trn_dtgerencial: item.trn_dtgerencial || null,
    usr_lancou: item.usr_lancou || null,
    prd: item.prd || null,
    prd_desc: item.prd_desc || null,
    grp_desc: item.grp_desc || null,
    loc_desc: item.loc_desc || null,
    qtd: parseIntSafe(item.qtd),
    desconto: parseFloatSafe(item.desconto),
    valorfinal: parseFloatSafe(item.valorfinal),
    custo: parseFloatSafe(item.custo),
    itm_obs: item.itm_obs || null,
    comandaorigem: item.comandaorigem || null,
    itemorigem: item.itemorigem || null,
    bar_id: 3
  }));
  
  const { error } = await supabase
    .from('contahub_analitico')
    .insert(processedData);
  
  if (error) {
    console.error('❌ Erro ao inserir dados analíticos:', error);
    throw error;
  }
  
  console.log(`✅ ${processedData.length} registros analíticos inseridos`);
  return processedData.length;
}

// Função para processar faturamento por hora
async function processFatPorHora(supabase: any, sessionToken: string, baseUrl: string, dataOntem: string) {
  console.log('🕐 Processando faturamento por hora...');
  
  const fatHoraUrl = `${baseUrl}/apps/appvdfatporhora.asp?dtini=${dataOntem}&dtfim=${dataOntem}&formato=json&request=${generateDynamicTimestamp()}`;
  const fatHoraData = await fetchContaHubData(fatHoraUrl, sessionToken);
  
  if (!fatHoraData || !Array.isArray(fatHoraData)) {
    console.log('⚠️ Nenhum dado de faturamento por hora encontrado');
    return 0;
  }
  
  await clearPreviousData(supabase, dataOntem, 'contahub_fatporhora');
  
  const processedData = fatHoraData.map(item => ({
    vd_dtgerencial: item.vd_dtgerencial || null,
    dds: parseIntSafe(item.dds),
    dia: item.dia || null,
    hora: item.hora || null,
    qtd: parseIntSafe(item.qtd),
    valor: parseFloatSafe(item.valor),
    bar_id: 3
  }));
  
  const { error } = await supabase
    .from('contahub_fatporhora')
    .insert(processedData);
  
  if (error) {
    console.error('❌ Erro ao inserir faturamento por hora:', error);
    throw error;
  }
  
  console.log(`✅ ${processedData.length} registros de faturamento por hora inseridos`);
  return processedData.length;
}

// Função para processar pagamentos
async function processPagamentos(supabase: any, sessionToken: string, baseUrl: string, dataOntem: string) {
  console.log('💳 Processando pagamentos...');
  
  const pagamentosUrl = `${baseUrl}/apps/appvdpagamento.asp?dtini=${dataOntem}&dtfim=${dataOntem}&formato=json&request=${generateDynamicTimestamp()}`;
  const pagamentosData = await fetchContaHubData(pagamentosUrl, sessionToken);
  
  if (!pagamentosData || !Array.isArray(pagamentosData)) {
    console.log('⚠️ Nenhum dado de pagamentos encontrado');
    return 0;
  }
  
  await clearPreviousData(supabase, dataOntem, 'contahub_pagamentos');
  
  const processedData = pagamentosData.map(item => ({
    vd: item.vd || null,
    trn: item.trn || null,
    dt_gerencial: item.dt_gerencial || null,
    hr_lancamento: item.hr_lancamento || null,
    hr_transacao: item.hr_transacao || null,
    dt_transacao: item.dt_transacao || null,
    mesa: item.mesa || null,
    cli: item.cli || null,
    cliente: item.cliente || null,
    vr_pagamentos: parseFloatSafe(item.vr_pagamentos),
    pag: item.pag || null,
    valor: parseFloatSafe(item.valor),
    taxa: parseFloatSafe(item.taxa),
    perc: parseFloatSafe(item.perc),
    liquido: parseFloatSafe(item.liquido),
    tipo: item.tipo || null,
    meio: item.meio || null,
    cartao: item.cartao || null,
    autorizacao: item.autorizacao || null,
    dt_credito: item.dt_credito || null,
    usr_abriu: item.usr_abriu || null,
    usr_lancou: item.usr_lancou || null,
    usr_aceitou: item.usr_aceitou || null,
    motivodesconto: item.motivodesconto || null,
    bar_id: 3
  }));
  
  const { error } = await supabase
    .from('contahub_pagamentos')
    .insert(processedData);
  
  if (error) {
    console.error('❌ Erro ao inserir pagamentos:', error);
    throw error;
  }
  
  console.log(`✅ ${processedData.length} registros de pagamentos inseridos`);
  return processedData.length;
}

// Função para processar dados por período
async function processPeriodo(supabase: any, sessionToken: string, baseUrl: string, dataOntem: string) {
  console.log('📅 Processando dados por período...');
  
  const periodoUrl = `${baseUrl}/apps/appvdperiodo.asp?dtini=${dataOntem}&dtfim=${dataOntem}&formato=json&request=${generateDynamicTimestamp()}`;
  const periodoData = await fetchContaHubData(periodoUrl, sessionToken);
  
  if (!periodoData || !Array.isArray(periodoData)) {
    console.log('⚠️ Nenhum dado de período encontrado');
    return 0;
  }
  
  await clearPreviousData(supabase, dataOntem, 'contahub_periodo');
  
  const processedData = periodoData.map(item => ({
    dt_gerencial: item.dt_gerencial || null,
    tipovenda: item.tipovenda || null,
    vd_mesadesc: item.vd_mesadesc || null,
    vd_localizacao: item.vd_localizacao || null,
    cht_nome: item.cht_nome || null,
    cli_nome: item.cli_nome || null,
    cli_dtnasc: item.cli_dtnasc || null,
    cli_email: item.cli_email || null,
    cli_fone: item.cli_fone || null,
    usr_abriu: item.usr_abriu || null,
    pessoas: parseIntSafe(item.pessoas),
    qtd_itens: parseIntSafe(item.qtd_itens),
    vr_pagamentos: parseFloatSafe(item.vr_pagamentos),
    vr_produtos: parseFloatSafe(item.vr_produtos),
    vr_repique: parseFloatSafe(item.vr_repique),
    vr_couvert: parseFloatSafe(item.vr_couvert),
    vr_desconto: parseFloatSafe(item.vr_desconto),
    motivo: item.motivo || null,
    dt_contabil: item.dt_contabil || null,
    ultimo_pedido: item.ultimo_pedido || null,
    vd_dtcontabil: item.vd_dtcontabil || null,
    bar_id: 3
  }));
  
  const { error } = await supabase
    .from('contahub_periodo')
    .insert(processedData);
  
  if (error) {
    console.error('❌ Erro ao inserir dados de período:', error);
    throw error;
  }
  
  console.log(`✅ ${processedData.length} registros de período inseridos`);
  return processedData.length;
}

// Função para processar dados de tempo
async function processTempo(supabase: any, sessionToken: string, baseUrl: string, dataOntem: string) {
  console.log('⏱️ Processando dados de tempo...');
  
  const tempoUrl = `${baseUrl}/apps/appvdtempo.asp?dtini=${dataOntem}&dtfim=${dataOntem}&formato=json&request=${generateDynamicTimestamp()}`;
  const tempoData = await fetchContaHubData(tempoUrl, sessionToken);
  
  if (!tempoData || !Array.isArray(tempoData)) {
    console.log('⚠️ Nenhum dado de tempo encontrado');
    return 0;
  }
  
  await clearPreviousData(supabase, dataOntem, 'contahub_tempo');
  
  const processedData = tempoData.map(item => ({
    grp_desc: item.grp_desc || null,
    prd_desc: item.prd_desc || null,
    vd_mesadesc: item.vd_mesadesc || null,
    vd_localizacao: item.vd_localizacao || null,
    itm: item.itm || null,
    t0_lancamento: item.t0_lancamento || null,
    t1_prodini: item.t1_prodini || null,
    t2_prodfim: item.t2_prodfim || null,
    t3_entrega: item.t3_entrega || null,
    t0_t1: parseFloatSafe(item.t0_t1),
    t0_t2: parseFloatSafe(item.t0_t2),
    t0_t3: parseFloatSafe(item.t0_t3),
    t1_t2: parseFloatSafe(item.t1_t2),
    t1_t3: parseFloatSafe(item.t1_t3),
    t2_t3: parseFloatSafe(item.t2_t3),
    prd: item.prd || null,
    prd_idexterno: item.prd_idexterno || null,
    loc_desc: item.loc_desc || null,
    usr_abriu: item.usr_abriu || null,
    usr_lancou: item.usr_lancou || null,
    usr_produziu: item.usr_produziu || null,
    usr_entregou: item.usr_entregou || null,
    usr_transfcancelou: item.usr_transfcancelou || null,
    prefixo: item.prefixo || null,
    tipovenda: item.tipovenda || null,
    ano: parseIntSafe(item.ano),
    mes: parseIntSafe(item.mes),
    dia: parseIntSafe(item.dia),
    dds: parseIntSafe(item.dds),
    diadasemana: item.diadasemana || null,
    hora: item.hora || null,
    itm_qtd: parseIntSafe(item.itm_qtd),
    bar_id: 3
  }));
  
  const { error } = await supabase
    .from('contahub_tempo')
    .insert(processedData);
  
  if (error) {
    console.error('❌ Erro ao inserir dados de tempo:', error);
    throw error;
  }
  
  console.log(`✅ ${processedData.length} registros de tempo inseridos`);
  return processedData.length;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let logId: number | null = null;
  const inicioExecucao = new Date();

  try {
    // Verificar se é chamada do pgcron
    const requestBody = await req.text()
    console.log('📥 Recebido body:', requestBody)
    
    const { cronSecret } = JSON.parse(requestBody || '{}')
    
    // Permitir acesso do pgcron sem verificação rigorosa
    if (cronSecret === 'pgcron_contahub') {
      console.log('✅ Acesso autorizado via pgcron')
    } else {
      console.log('⚠️ Acesso sem cronSecret - continuando (para compatibilidade)')
    }
    
    console.log('🔧 Testando acesso ao Deno.env...');
    
    // Verificar se Deno.env funciona
    console.log('🔍 Todas as variáveis disponíveis:', Object.keys(Deno.env.toObject()));
    
    // Configuração do Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('🔍 Variáveis Supabase:', {
      url: supabaseUrl ? 'OK' : 'FALTANDO',
      serviceKey: supabaseServiceKey ? 'OK' : 'FALTANDO'
    });
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Variáveis do Supabase não encontradas');
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
    if (!discordWebhook) {
      console.log('⚠️ DISCORD_WEBHOOK não configurado - notificações desabilitadas');
    }
    
    // Calcular data de ontem
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const day = String(yesterday.getDate()).padStart(2, '0');
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const year = yesterday.getFullYear();
    
    const dataOntem = `${day}.${month}.${year}`;
    const dataOntemISO = `${year}-${month}-${day}`;
    
    console.log(`📅 Sincronizando dados de: ${dataOntem}`);

    // Criar log inicial
    const { data: logData, error: logError } = await supabase
      .from('sync_logs_contahub')
      .insert({
        bar_id: 3,
        data_sync: dataOntemISO,
        status: 'iniciado',
        inicio_execucao: inicioExecucao.toISOString(),
        triggered_by: cronSecret === 'pgcron_contahub' ? 'pgcron' : 'manual',
        detalhes: {
          data_requisitada: dataOntem,
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
    if (discordWebhook) {
      await sendDiscordNotification(
        discordWebhook,
        '🚀 ContaHub Sync Iniciado',
        `Iniciando sincronização automática dos dados do ContaHub para **${dataOntem}**`,
        3447003, // Azul
        [
          { name: '📅 Data', value: dataOntem, inline: true },
          { name: '🕐 Início', value: `<t:${Math.floor(inicioExecucao.getTime() / 1000)}:T>`, inline: true },
          { name: '🤖 Trigger', value: cronSecret === 'pgcron_contahub' ? 'Cron Automático' : 'Manual', inline: true }
        ]
      );
    }
    
    // Login no ContaHub
    const sessionToken = await loginContaHub(contahubEmail, contahubPassword);
    
    console.log('🔄 Iniciando sincronização ContaHub...');
    
    // Processar cada tipo de dados
    const totalAnalitico = await processAnaliticData(supabase, sessionToken, contahubBaseUrl, dataOntem);
    const totalFatporhora = await processFatPorHora(supabase, sessionToken, contahubBaseUrl, dataOntem);
    const totalPagamentos = await processPagamentos(supabase, sessionToken, contahubBaseUrl, dataOntem);
    const totalPeriodo = await processPeriodo(supabase, sessionToken, contahubBaseUrl, dataOntem);
    const totalTempo = await processTempo(supabase, sessionToken, contahubBaseUrl, dataOntem);
    
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
            data_requisitada: dataOntem,
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
            }
          }
        })
        .eq('id', logId);
    }

    // Enviar notificação Discord de sucesso
    if (discordWebhook) {
      await sendDiscordNotification(
        discordWebhook,
        '✅ ContaHub Sync Concluído',
        `Sincronização automática concluída com **sucesso** para ${dataOntem}`,
        5763719, // Verde
        [
          { name: '📊 Total de Registros', value: totalRegistros.toString(), inline: true },
          { name: '⏱️ Duração', value: `${duracaoSegundos}s`, inline: true },
          { name: '📅 Data', value: dataOntem, inline: true },
          { name: '📈 Analítico', value: totalAnalitico.toString(), inline: true },
          { name: '🕐 Fat/Hora', value: totalFatporhora.toString(), inline: true },
          { name: '💳 Pagamentos', value: totalPagamentos.toString(), inline: true },
          { name: '📅 Período', value: totalPeriodo.toString(), inline: true },
          { name: '⏱️ Tempo', value: totalTempo.toString(), inline: true },
          { name: '🆔 Log ID', value: logId?.toString() || 'N/A', inline: true }
        ]
      );
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Sincronização ContaHub concluída com sucesso',
      data: {
        data_sincronizada: dataOntem,
        total_registros: totalRegistros,
        duracao_segundos: duracaoSegundos,
        detalhes: {
          analitico: totalAnalitico,
          fatporhora: totalFatporhora,
          pagamentos: totalPagamentos,
          periodo: totalPeriodo,
          tempo: totalTempo
        },
        log_id: logId
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
    
  } catch (error) {
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
    if (discordWebhook) {
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
}); 