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

function formatDiaFromISO(isoString: string): number {
  if (!isoString || typeof isoString !== 'string') return 0;
  try {
    // Extrair data do formato: "2025-07-28T00:00:00-0300"
    const datePart = isoString.split('T')[0]; // "2025-07-28"
    const [year, month, day] = datePart.split('-');
    return parseInt(`${year}${month}${day}`); // 20250728
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 0;
  }
}

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

// Função para limpar dados antigos antes de inserir novos
async function clearPreviousData(supabase: any, dataFormatted: string, tableName: string, barId: number = 3) {
  console.log(`🗑️ Limpando dados antigos da tabela ${tableName} para bar_id=${barId} e data=${dataFormatted}...`);
  
  // Converter data para formato correto conforme cada tabela
  const start_date = dataFormatted.split('.').reverse().join('-');
  
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
    default:
      console.log(`⚠️ Tabela ${tableName} não mapeada para filtro de data`);
  }
  
  const { error, count } = await deleteQuery;
  
  if (error) {
    console.error(`❌ Erro ao limpar dados de ${tableName}:`, error);
    throw error;
  }
  
  console.log(`✅ Dados antigos de ${tableName} removidos: ${count || 0} registros`);
}

// Função para processar dados analíticos
async function processAnaliticData(supabase: any, sessionToken: string, baseUrl: string, dataFormatted: string) {
  console.log('📊 Processando dados analíticos...');
  
  const start_date = dataFormatted.split('.').reverse().join('-');
  const end_date = dataFormatted.split('.').reverse().join('-');
  const queryTimestamp = generateDynamicTimestamp();
  const analiticUrl = `${baseUrl}/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=77&d0=${start_date}&d1=${end_date}&produto=&grupo=&local=&turno=&mesa=&emp=3768&nfe=1`;
  
  console.log(`🔗 URL Analítico: ${analiticUrl}`);
  console.log(`🍪 SessionToken: ${sessionToken ? 'PRESENTE' : 'AUSENTE'}`);
  console.log(`📅 Data processamento: ${dataFormatted} → ${start_date}`);
  
  let analiticData;
  try {
    console.log('🚀 Iniciando fetchContaHubData para analítico...');
    analiticData = await fetchContaHubData(analiticUrl, sessionToken);
    console.log('✅ fetchContaHubData analítico concluído');
  } catch (error) {
    console.error('❌ Erro detalhado em fetchContaHubData analítico:', error);
    throw error;
  }
  
    // Verificar se os dados estão em uma propriedade (como no teste-sync-contahub.js)
  let finalData = analiticData;
  if (!Array.isArray(analiticData)) {
    console.log('🔍 Dados não são array, verificando propriedades...');
    if (analiticData?.list) finalData = analiticData.list;
    else if (analiticData?.rows) finalData = analiticData.rows;
    else if (analiticData?.data) finalData = analiticData.data;
    else if (analiticData?.result) finalData = analiticData.result;
  }

  if (!finalData || !Array.isArray(finalData)) {
    console.log('⚠️ Nenhum dado analítico encontrado');
    return 0;
  }

  await clearPreviousData(supabase, dataFormatted, 'contahub_analitico', 3); // bar_id = 3 (Ordinário)

  const processedData = finalData.map((item: any) => ({
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
async function processFatPorHora(supabase: any, sessionToken: string, baseUrl: string, dataFormatted: string) {
  console.log('🕐 Processando faturamento por hora...');
  
  const start_date = dataFormatted.split('.').reverse().join('-');
  const end_date = dataFormatted.split('.').reverse().join('-');
  const queryTimestamp = generateDynamicTimestamp();
  const fatHoraUrl = `${baseUrl}/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=101&d0=${start_date}&d1=${end_date}&emp=3768&nfe=1`;
  let fatHoraData;
  try {
    console.log('🚀 Iniciando fetchContaHubData para faturamento por hora...');
    fatHoraData = await fetchContaHubData(fatHoraUrl, sessionToken);
    console.log('✅ fetchContaHubData faturamento por hora concluído');
  } catch (error) {
    console.error('❌ Erro detalhado em fetchContaHubData faturamento por hora:', error);
    throw error;
  }

  // Verificar se os dados estão em uma propriedade (como no teste-sync-contahub.js)
  let finalData = fatHoraData;
  if (!Array.isArray(fatHoraData)) {
    console.log('🔍 Dados não são array, verificando propriedades...');
    if (fatHoraData?.list) finalData = fatHoraData.list;
    else if (fatHoraData?.rows) finalData = fatHoraData.rows;
    else if (fatHoraData?.data) finalData = fatHoraData.data;
    else if (fatHoraData?.result) finalData = fatHoraData.result;
  }

  if (!finalData || !Array.isArray(finalData)) {
    console.log('⚠️ Nenhum dado de faturamento por hora encontrado');
    return 0;
  }
  
  await clearPreviousData(supabase, dataFormatted, 'contahub_fatporhora', 3);
  
  const processedData = finalData.map((item: any) => ({
    vd_dtgerencial: item.vd_dtgerencial || null,
    dds: parseIntSafe(item.dds),
    dia: item.dia || null,
    hora: item.hora || null,
    qtd: parseIntSafe(item.qtd),
    valor: parseFloatSafe(item.$valor || item.valor),
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
async function processPagamentos(supabase: any, sessionToken: string, baseUrl: string, dataFormatted: string) {
  console.log('💳 Processando pagamentos...');
  
  const start_date = dataFormatted.split('.').reverse().join('-');
  const end_date = dataFormatted.split('.').reverse().join('-');
  const queryTimestamp = generateDynamicTimestamp();
  const pagamentosUrl = `${baseUrl}/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=7&d0=${start_date}&d1=${end_date}&meio=&emp=3768&nfe=1`;
  let pagamentosData;
  try {
    console.log('🚀 Iniciando fetchContaHubData para pagamentos...');
    pagamentosData = await fetchContaHubData(pagamentosUrl, sessionToken);
    console.log('✅ fetchContaHubData pagamentos concluído');
  } catch (error) {
    console.error('❌ Erro detalhado em fetchContaHubData pagamentos:', error);
    throw error;
  }

  // Verificar se os dados estão em uma propriedade (como no teste-sync-contahub.js)
  let finalData = pagamentosData;
  if (!Array.isArray(pagamentosData)) {
    console.log('🔍 Dados não são array, verificando propriedades...');
    if (pagamentosData?.list) finalData = pagamentosData.list;
    else if (pagamentosData?.rows) finalData = pagamentosData.rows;
    else if (pagamentosData?.data) finalData = pagamentosData.data;
    else if (pagamentosData?.result) finalData = pagamentosData.result;
  }

  if (!finalData || !Array.isArray(finalData)) {
    console.log('⚠️ Nenhum dado de pagamentos encontrado');
    return 0;
  }
  
  await clearPreviousData(supabase, dataFormatted, 'contahub_pagamentos', 3);
  


  const processedData = finalData.map((item: any) => ({
    vd: item.vd || null,
    trn: item.trn || null,
    dt_gerencial: item.dt_gerencial || null,
    hr_lancamento: item.hr_lancamento || null,
    hr_transacao: item.hr_transacao || null,
    dt_transacao: item.dt_transacao || null,
    mesa: item.mesa || null,
    cli: item.cli || null,
    cliente: item.cliente || null,
    vr_pagamentos: parseFloatSafe(item.$vr_pagamentos),
    pag: item.pag || null,
    valor: parseFloatSafe(item.$valor),
    taxa: parseFloatSafe(item.taxa), // campo sem $ (se existir)
    perc: parseFloatSafe(item.perc), // campo sem $ (se existir)
    liquido: parseFloatSafe(item.$liquido),
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
async function processPeriodo(supabase: any, sessionToken: string, baseUrl: string, dataFormatted: string) {
  console.log('📅 Processando dados por período...');
  
  const start_date = dataFormatted.split('.').reverse().join('-');
  const end_date = dataFormatted.split('.').reverse().join('-');
  const queryTimestamp = generateDynamicTimestamp();
  const periodoUrl = `${baseUrl}/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=5&d0=${start_date}&d1=${end_date}&emp=3768&nfe=1`;
    let periodoData;
  try {
    periodoData = await fetchContaHubData(periodoUrl, sessionToken);
  } catch (error) {
    console.error('❌ Erro em fetchContaHubData período:', error);
    throw error;
  }

  let finalData = periodoData;
  if (!Array.isArray(periodoData)) {
    if (periodoData?.list) finalData = periodoData.list;
    else if (periodoData?.rows) finalData = periodoData.rows;
    else if (periodoData?.data) finalData = periodoData.data;
    else if (periodoData?.result) finalData = periodoData.result;
  }

  if (!finalData || !Array.isArray(finalData)) {
    console.log('⚠️ Nenhum dado de período encontrado');
    return 0;
  }

  await clearPreviousData(supabase, dataFormatted, 'contahub_periodo', 3);



  const processedData = finalData.map((item: any) => ({
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
    vr_pagamentos: parseFloatSafe(item.$vr_pagamentos),
    vr_produtos: parseFloatSafe(item.$vr_produtos),
    vr_repique: parseFloatSafe(item.$vr_repique),
    vr_couvert: parseFloatSafe(item.$vr_couvert),
    vr_desconto: parseFloatSafe(item.$vr_desconto),
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
async function processTempo(supabase: any, sessionToken: string, baseUrl: string, dataFormatted: string) {
  console.log('⏱️ Processando dados de tempo...');
  
  const start_date = dataFormatted.split('.').reverse().join('-');
  const end_date = dataFormatted.split('.').reverse().join('-');
  const queryTimestamp = generateDynamicTimestamp();
  const tempoUrl = `${baseUrl}/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=81&d0=${start_date}&d1=${end_date}&prod=&grupo=&local=&emp=3768&nfe=1`;
    let tempoData;
  try {
    tempoData = await fetchContaHubData(tempoUrl, sessionToken);
  } catch (error) {
    console.error('❌ Erro em fetchContaHubData tempo:', error);
    throw error;
  }

  let finalData = tempoData;
  if (!Array.isArray(tempoData)) {
    if (tempoData?.list) finalData = tempoData.list;
    else if (tempoData?.rows) finalData = tempoData.rows;
    else if (tempoData?.data) finalData = tempoData.data;
    else if (tempoData?.result) finalData = tempoData.result;
  }

  if (!finalData || !Array.isArray(finalData)) {
    console.log('⚠️ Nenhum dado de tempo encontrado');
    return 0;
  }

  await clearPreviousData(supabase, dataFormatted, 'contahub_tempo', 3);

  const processedData = finalData.map((item: any) => ({
    grp_desc: item.grp_desc || null,
    prd_desc: item.prd_desc || null,
    vd_mesadesc: item.vd_mesadesc || null,
    vd_localizacao: item.vd_localizacao || null,
    itm: item.itm || null,
    t0_lancamento: item['t0-lancamento'] || null,
    t1_prodini: item['t1-prodini'] || null,
    t2_prodfim: item['t2-prodfim'] || null,
    t3_entrega: item['t3-entrega'] || null,
    t0_t1: parseFloatSafe(item['t0-t1']),
    t0_t2: parseFloatSafe(item['t0-t2']),
    t0_t3: parseFloatSafe(item['t0-t3']),
    t1_t2: parseFloatSafe(item['t1-t2']),
    t1_t3: parseFloatSafe(item['t1-t3']),
    t2_t3: parseFloatSafe(item['t2-t3']),
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
    dia: formatDiaFromISO(item.dia),
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
  console.log('🚀 INICIANDO EDGE FUNCTION - contahub-sync-automatico');
  console.log('🔍 Method:', req.method);
  console.log('🔍 URL:', req.url);
  console.log('🔍 Headers:', Object.fromEntries(req.headers.entries()));
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    console.log('✅ Retornando CORS OK');
    return new Response('ok', { headers: corsHeaders });
  }

  let logId: number | null = null;
  const inicioExecucao = new Date();

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
    
    // Processar cada tipo de dados com timeouts aleatórios
    console.log('📊 [1/5] Processando dados analíticos...');
    const totalAnalitico = await processAnaliticData(supabase, sessionToken, contahubBaseUrl, dataFormatted);
    
    const timeout1 = randomTimeout();
    console.log(`⏸️ Pausando ${Math.round(timeout1/1000)}s antes do próximo módulo...`);
    await new Promise(resolve => setTimeout(resolve, timeout1));
    
    console.log('🕐 [2/5] Processando faturamento por hora...');
    const totalFatporhora = await processFatPorHora(supabase, sessionToken, contahubBaseUrl, dataFormatted);
    
    const timeout2 = randomTimeout();
    console.log(`⏸️ Pausando ${Math.round(timeout2/1000)}s antes do próximo módulo...`);
    await new Promise(resolve => setTimeout(resolve, timeout2));
    
    console.log('💳 [3/5] Processando pagamentos...');
    const totalPagamentos = await processPagamentos(supabase, sessionToken, contahubBaseUrl, dataFormatted);
    
    const timeout3 = randomTimeout();
    console.log(`⏸️ Pausando ${Math.round(timeout3/1000)}s antes do próximo módulo...`);
    await new Promise(resolve => setTimeout(resolve, timeout3));
    
    console.log('📅 [4/5] Processando dados por período...');
    const totalPeriodo = await processPeriodo(supabase, sessionToken, contahubBaseUrl, dataFormatted);
    
    const timeout4 = randomTimeout();
    console.log(`⏸️ Pausando ${Math.round(timeout4/1000)}s antes do último módulo...`);
    await new Promise(resolve => setTimeout(resolve, timeout4));
    
    console.log('⏱️ [5/5] Processando dados de tempo...');
    const totalTempo = await processTempo(supabase, sessionToken, contahubBaseUrl, dataFormatted);
    
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
            }
          }
        })
        .eq('id', logId);
    }

    // Enviar notificação Discord de sucesso
    if (discordWebhook && discordWebhook.startsWith('https://')) {
      await sendDiscordNotification(
        discordWebhook,
        '✅ ContaHub Sync Concluído',
        `Sincronização automática concluída com **sucesso** para ${dataFormatted}`,
        5763719, // Verde
        [
          { name: '📊 Total de Registros', value: totalRegistros.toString(), inline: true },
          { name: '⏱️ Duração', value: `${duracaoSegundos}s`, inline: true },
          { name: '📅 Data', value: dataFormatted, inline: true },
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
        data_sincronizada: dataFormatted,
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
}); 