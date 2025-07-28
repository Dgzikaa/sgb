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
  
  // Gerar timestamp dinâmico para o login
  const loginTimestamp = generateDynamicTimestamp();
  
  const loginResponse = await fetch(`https://sp.contahub.com/rest/contahub.cmds.UsuarioCmd/login/${loginTimestamp}?emp=0`, {
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
    throw new Error('Não foi possível obter cookies de autenticação');
  }
  
  console.log(`✅ Login realizado com sucesso!`);
  return setCookieHeaders;
}

// Função para buscar dados do ContaHub
async function fetchContaHubData(
  url: string, 
  cookies: string
): Promise<any[]> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "application/json",
      "Cookie": cookies
    }
  });
  
  if (!response.ok) {
    throw new Error(`Erro na requisição: ${response.status}`);
  }
  
  const responseText = await response.text();
  let data = JSON.parse(responseText);
  
  // ContaHub retorna dados na propriedade 'list'
  if (!Array.isArray(data) && data.list) {
    data = data.list;
  }
  
  return data || [];
}

// Função para sincronizar dados analíticos
async function syncAnalitico(cookies: string, dataOntem: string, bar_id: number, supabase: any): Promise<{inserted: number, skipped: number, total_processed: number}> {
  // SEMPRE usar emp_id = 3768 (Ordinário no ContaHub) que é onde tem dados
  const emp_id = "3768";
  const start_date = dataOntem.split('.').reverse().join('-');
  const end_date = dataOntem.split('.').reverse().join('-');
  const queryTimestamp = generateDynamicTimestamp();
  
  const query_url = `https://sp.contahub.com/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=77&d0=${start_date}&d1=${end_date}&produto=&grupo=&local=&turno=&mesa=&emp=${emp_id}&nfe=1`;
  
  console.log(`🔗 URL da requisição ANALITICO: ${query_url}`);
  
  const data = await fetchContaHubData(query_url, cookies);
  
  if (!data || data.length === 0) {
    return { inserted: 0, skipped: 0, total_processed: 0 };
  }
  
  // Deletar dados anteriores
  await supabase
    .from('contahub_analitico')
    .delete()
    .eq('bar_id', bar_id)
    .eq('trn_dtgerencial', start_date);
  
  let inserted = 0;
  const batchSize = 100;
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize).map((item: any) => ({
      vd_mesadesc: item.vd_mesadesc || '',
      vd_localizacao: item.vd_localizacao || '',
      itm: item.itm || '',
      trn: item.trn || '',
      trn_desc: item.trn_desc || '',
      prefixo: item.prefixo || '',
      tipo: item.tipo || '',
      tipovenda: item.tipovenda || '',
      ano: parseIntSafe(item.ano),
      mes: parseIntSafe(item.mes),
      trn_dtgerencial: item.trn_dtgerencial || null,
      usr_lancou: item.usr_lancou || '',
      prd: item.prd || '',
      prd_desc: item.prd_desc || '',
      grp_desc: item.grp_desc || '',
      loc_desc: item.loc_desc || '',
      qtd: parseIntSafe(item.qtd),
      desconto: parseFloatSafe(item.desconto),
      valorfinal: parseFloatSafe(item.valorfinal),
      custo: parseFloatSafe(item.custo),
      itm_obs: item.itm_obs || '',
      comandaorigem: item.comandaorigem || '',
      itemorigem: item.itemorigem || '',
      bar_id: bar_id
    }));
    
    const { error } = await supabase.from('contahub_analitico').insert(batch);
    if (!error) inserted += batch.length;
  }
  
  return { inserted, skipped: 0, total_processed: data.length };
}

// Função para sincronizar dados de pagamentos
async function syncPagamentos(cookies: string, dataOntem: string, bar_id: number, supabase: any): Promise<{inserted: number, skipped: number, total_processed: number}> {
  // SEMPRE usar emp_id = 3768 (Ordinário no ContaHub) que é onde tem dados
  const emp_id = "3768";
  const start_date = dataOntem.split('.').reverse().join('-');
  const end_date = dataOntem.split('.').reverse().join('-');
  const queryTimestamp = generateDynamicTimestamp();
  
  const query_url = `https://sp.contahub.com/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=7&d0=${start_date}&d1=${end_date}&meio=&emp=${emp_id}&nfe=1`;
  
  console.log(`🔗 URL da requisição PAGAMENTOS: ${query_url}`);
  
  const data = await fetchContaHubData(query_url, cookies);
  
  if (!data || data.length === 0) {
    return { inserted: 0, skipped: 0, total_processed: 0 };
  }
  
  // Deletar dados anteriores
  await supabase
    .from('contahub_pagamentos')
    .delete()
    .eq('bar_id', bar_id)
    .eq('dt_gerencial', start_date);
  
  let inserted = 0;
  const batchSize = 100;
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize).map((item: any) => ({
      vd: item.vd || '',
      trn: item.trn || '',
      dt_gerencial: item.dt_gerencial || null,
      hr_lancamento: item.hr_lancamento || '',
      hr_transacao: item.hr_transacao || '',
      dt_transacao: item.dt_transacao || null,
      mesa: item.mesa || '',
      cli: item.cli || '',
      cliente: item.cliente || '',
      vr_pagamentos: parseFloatSafe(item.vr_pagamentos),
      pag: item.pag || '',
      valor: parseFloatSafe(item.valor),
      taxa: parseFloatSafe(item.taxa),
      perc: parseFloatSafe(item.perc),
      liquido: parseFloatSafe(item.liquido),
      tipo: item.tipo || '',
      meio: item.meio || '',
      cartao: item.cartao || '',
      autorizacao: item.autorizacao || '',
      dt_credito: item.dt_credito || null,
      usr_abriu: item.usr_abriu || '',
      usr_lancou: item.usr_lancou || '',
      usr_aceitou: item.usr_aceitou || '',
      motivodesconto: item.motivodesconto || '',
      bar_id: bar_id
    }));
    
    const { error } = await supabase.from('contahub_pagamentos').insert(batch);
    if (!error) inserted += batch.length;
  }
  
  return { inserted, skipped: 0, total_processed: data.length };
}

// Função para sincronizar dados por período
async function syncPeriodo(cookies: string, dataOntem: string, bar_id: number, supabase: any): Promise<{inserted: number, skipped: number, total_processed: number}> {
  // SEMPRE usar emp_id = 3768 (Ordinário no ContaHub) que é onde tem dados
  const emp_id = "3768";
  const start_date = dataOntem.split('.').reverse().join('-');
  const end_date = dataOntem.split('.').reverse().join('-');
  const queryTimestamp = generateDynamicTimestamp();
  
  const query_url = `https://sp.contahub.com/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=5&d0=${start_date}&d1=${end_date}&emp=${emp_id}&nfe=1`;
  
  console.log(`🔗 URL da requisição PERIODO: ${query_url}`);
  
  const data = await fetchContaHubData(query_url, cookies);
  
  if (!data || data.length === 0) {
    return { inserted: 0, skipped: 0, total_processed: 0 };
  }
  
  // Deletar dados anteriores
  await supabase
    .from('contahub_periodo')
    .delete()
    .eq('bar_id', bar_id)
    .eq('dt_gerencial', start_date);
  
  let inserted = 0;
  const batchSize = 100;
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize).map((item: any) => ({
      dt_gerencial: item.dt_gerencial || null,
      tipovenda: item.tipovenda || '',
      vd_mesadesc: item.vd_mesadesc || '',
      vd_localizacao: item.vd_localizacao || '',
      cht_nome: item.cht_nome || '',
      cli_nome: item.cli_nome || '',
      cli_dtnasc: item.cli_dtnasc || null,
      cli_email: item.cli_email || '',
      cli_fone: item.cli_fone || '',
      usr_abriu: item.usr_abriu || '',
      pessoas: parseIntSafe(item.pessoas),
      qtd_itens: parseIntSafe(item.qtd_itens),
      vr_pagamentos: parseFloatSafe(item.vr_pagamentos),
      vr_produtos: parseFloatSafe(item.vr_produtos),
      vr_repique: parseFloatSafe(item.vr_repique),
      vr_couvert: parseFloatSafe(item.vr_couvert),
      vr_desconto: parseFloatSafe(item.vr_desconto),
      motivo: item.motivo || '',
      dt_contabil: item.dt_contabil || null,
      ultimo_pedido: item.ultimo_pedido || null,
      vd_dtcontabil: item.vd_dtcontabil || null,
      bar_id: bar_id
    }));
    
    const { error } = await supabase.from('contahub_periodo').insert(batch);
    if (!error) inserted += batch.length;
  }
  
  return { inserted, skipped: 0, total_processed: data.length };
}

// Função para sincronizar dados de tempo
async function syncTempo(cookies: string, dataOntem: string, bar_id: number, supabase: any): Promise<{inserted: number, skipped: number, total_processed: number}> {
  // SEMPRE usar emp_id = 3768 (Ordinário no ContaHub) que é onde tem dados
  const emp_id = "3768";
  const start_date = dataOntem.split('.').reverse().join('-');
  const end_date = dataOntem.split('.').reverse().join('-');
  const queryTimestamp = generateDynamicTimestamp();
  
  const query_url = `https://sp.contahub.com/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=81&d0=${start_date}&d1=${end_date}&prod=&grupo=&local=&emp=${emp_id}&nfe=1`;
  
  console.log(`🔗 URL da requisição TEMPO: ${query_url}`);
  
  const data = await fetchContaHubData(query_url, cookies);
  
  if (!data || data.length === 0) {
    return { inserted: 0, skipped: 0, total_processed: 0 };
  }
  
  // Deletar dados anteriores
  await supabase
    .from('contahub_tempo')
    .delete()
    .eq('bar_id', bar_id)
    .eq('t0_lancamento', start_date);
  
  let inserted = 0;
  const batchSize = 100;
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize).map((item: any) => ({
      grp_desc: item.grp_desc || '',
      prd_desc: item.prd_desc || '',
      vd_mesadesc: item.vd_mesadesc || '',
      vd_localizacao: item.vd_localizacao || '',
      itm: item.itm || '',
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
      prd: item.prd || '',
      prd_idexterno: item.prd_idexterno || '',
      loc_desc: item.loc_desc || '',
      usr_abriu: item.usr_abriu || '',
      usr_lancou: item.usr_lancou || '',
      usr_produziu: item.usr_produziu || '',
      usr_entregou: item.usr_entregou || '',
      usr_transfcancelou: item.usr_transfcancelou || '',
      prefixo: item.prefixo || '',
      tipovenda: item.tipovenda || '',
      tipo: item.tipo || '',
      bar_id: bar_id
    }));
    
    const { error } = await supabase.from('contahub_tempo').insert(batch);
    if (!error) inserted += batch.length;
  }
  
  return { inserted, skipped: 0, total_processed: data.length };
}

// Função para sincronizar dados de faturamento por hora
async function syncFatPorHora(cookies: string, dataOntem: string, bar_id: number, supabase: any): Promise<{inserted: number, skipped: number, total_processed: number}> {
  // SEMPRE usar emp_id = 3768 (Ordinário no ContaHub) que é onde tem dados
  const emp_id = "3768";
  const start_date = dataOntem.split('.').reverse().join('-');
  const end_date = dataOntem.split('.').reverse().join('-');
  const queryTimestamp = generateDynamicTimestamp();
  
  const query_url = `https://sp.contahub.com/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=101&d0=${start_date}&d1=${end_date}&emp=${emp_id}&nfe=1`;
  
  console.log(`🔗 URL da requisição FATPORHORA: ${query_url}`);
  
  const data = await fetchContaHubData(query_url, cookies);
  
  if (!data || data.length === 0) {
    return { inserted: 0, skipped: 0, total_processed: 0 };
  }
  
  // Deletar dados anteriores
  await supabase
    .from('contahub_fatporhora')
    .delete()
    .eq('bar_id', bar_id)
    .eq('vd_dtgerencial', start_date);
  
  let inserted = 0;
  const batchSize = 100;
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize).map((item: any) => ({
      vd_dtgerencial: item.vd_dtgerencial || null,
      dds: parseIntSafe(item.dds),
      dia: item.dia || '',
      hora: item.hora || '',
      qtd: parseIntSafe(item.qtd),
      valor: parseFloatSafe(item.valor),
      bar_id: bar_id
    }));
    
    const { error } = await supabase.from('contahub_fatporhora').insert(batch);
    if (!error) inserted += batch.length;
  }
  
  return { inserted, skipped: 0, total_processed: data.length };
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
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
    
    const startTime = Date.now();
    console.log('🔄 Iniciando sincronização ContaHub...');
    
    // Calcular data de ontem
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const day = String(yesterday.getDate()).padStart(2, '0');
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const year = yesterday.getFullYear();
    
    const dataOntem = `${day}.${month}.${year}`;
    
         // Login no ContaHub
     const cookies = await loginContaHub(contahubEmail, contahubPassword);
    
    // Módulos para sincronizar
    const modules = [
      { name: 'ANALITICO', syncFunction: syncAnalitico },
      { name: 'PAGAMENTOS', syncFunction: syncPagamentos },
      { name: 'PERIODO', syncFunction: syncPeriodo },
      { name: 'TEMPO', syncFunction: syncTempo },
      { name: 'FATPORHORA', syncFunction: syncFatPorHora }
    ];
    
    const results = {
      success: 0,
      error: 0,
      totalInserted: 0,
      totalProcessed: 0,
      details: [] as Array<{module: string, status: string, inserted?: number, processed?: number, error?: string}>
    };
    
    // Executar sincronização para cada módulo
    for (const module of modules) {
      try {
        console.log(`🔄 Sincronizando ${module.name}...`);
        const result = await module.syncFunction(cookies, dataOntem, 3, supabase); // bar_id = 3 (salvar no banco)
        
        results.success++;
        results.totalInserted += result.inserted;
        results.totalProcessed += result.total_processed;
        results.details.push({
          module: module.name,
          status: 'success',
          inserted: result.inserted,
          processed: result.total_processed
        });
        
        console.log(`✅ ${module.name}: ${result.inserted} registros inseridos`);
             } catch (error) {
         const errorMessage = error instanceof Error ? error.message : String(error);
         console.error(`❌ Erro em ${module.name}:`, errorMessage);
         results.error++;
         results.details.push({
           module: module.name,
           status: 'error',
           error: errorMessage
         });
      }
      
      // Pausa entre módulos
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    const executionTime = Math.round((Date.now() - startTime) / 1000);
    
    console.log(`✅ Sincronização concluída em ${executionTime}s`);
    console.log(`📊 Registros inseridos: ${results.totalInserted}`);
    console.log(`📈 Módulos com sucesso: ${results.success}/${modules.length}`);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Sincronização ContaHub concluída',
      data: {
        date: dataOntem,
        executionTime: `${executionTime}s`,
        modules: {
          success: results.success,
          error: results.error,
          total: modules.length
        },
        records: {
          inserted: results.totalInserted,
          processed: results.totalProcessed
        },
        details: results.details
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

     } catch (error) {
     const errorMessage = error instanceof Error ? error.message : String(error);
     console.error('❌ Erro na sincronização:', errorMessage);
     return new Response(JSON.stringify({
       success: false,
       error: errorMessage
     }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
}); 