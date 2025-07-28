// ========================================
// TESTE DE SINCRONIZAÇÃO CONTAHUB - SGB V3
// Script para testar a sincronização localmente
// Baseado na Edge Function contahub-sync-automatico
// Uso: node teste-sync-contahub.js
// ========================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Carregar variáveis de ambiente
try {
  require('dotenv').config({ path: '../../frontend/.env.local' });
  console.log('🔧 .env.local carregado');
} catch (error) {
  console.log('⚠️ dotenv não encontrado, usando configuração manual');
}

// Importar Supabase client
const { createClient } = require('@supabase/supabase-js');

// Configuração
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/"/g, '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/"/g, '');
const CONTAHUB_EMAIL = process.env.CONTAHUB_EMAIL?.replace(/"/g, '');
const CONTAHUB_PASSWORD = process.env.CONTAHUB_PASSWORD?.replace(/"/g, '');
const CONTAHUB_BASE_URL = process.env.CONTAHUB_BASE_URL?.replace(/"/g, '') || 'https://sp.contahub.com';

// Verificar variáveis obrigatórias
const requiredVars = {
  'SUPABASE_URL': SUPABASE_URL,
  'SUPABASE_SERVICE_ROLE_KEY': SUPABASE_KEY,
  'CONTAHUB_EMAIL': CONTAHUB_EMAIL,
  'CONTAHUB_PASSWORD': CONTAHUB_PASSWORD
};

const missingVars = Object.entries(requiredVars).filter(([key, value]) => !value);

if (missingVars.length > 0) {
  console.log('\n❌ Variáveis de ambiente não configuradas:');
  missingVars.forEach(([key]) => {
    console.log(`   - ${key}`);
  });
  console.log('\n📋 Configure no arquivo .env.local e tente novamente');
  process.exit(1);
}

console.log('🔑 Configurações carregadas:');
console.log(`   📡 Supabase: ${SUPABASE_URL}`);
console.log(`   📧 ContaHub Email: ${CONTAHUB_EMAIL}`);
console.log(`   🌐 ContaHub URL: ${CONTAHUB_BASE_URL}`);

// Função para timeout aleatório (entre 5-10 segundos para teste)
function randomTimeout() {
  const min = 5000;
  const max = 10000;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Função auxiliar para tratar valores numéricos de forma segura
function parseFloatSafe(value) {
  if (!value || value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    return parseFloat(value.replace(',', '.')) || 0;
  }
  return 0;
}

function parseIntSafe(value) {
  if (!value || value === null || value === undefined) return 0;
  if (typeof value === 'number') return Math.floor(value);
  if (typeof value === 'string') {
    return parseInt(value) || 0;
  }
  return 0;
}

// Gerar timestamp dinâmico para queries
function generateDynamicTimestamp() {
  const now = new Date();
  const timestamp = now.getTime();
  return timestamp.toString();
}

// Função para fazer login no ContaHub
async function loginContaHub() {
  console.log('🔐 Fazendo login no ContaHub...');
  
  // Converter senha para SHA1
  const passwordSha1 = crypto.createHash('sha1').update(CONTAHUB_PASSWORD).digest('hex');

  const loginData = new URLSearchParams({
    "usr_email": CONTAHUB_EMAIL,
    "usr_password_sha1": passwordSha1
  });

  // Gerar timestamp dinâmico para o login
  const loginTimestamp = generateDynamicTimestamp();

  const loginResponse = await fetch(`${CONTAHUB_BASE_URL}/rest/contahub.cmds.UsuarioCmd/login/${loginTimestamp}?emp=0`, {
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

// Função para sincronizar dados analíticos
async function syncAnalitico(cookies, dataOntem, bar_id, supabase) {
  console.log('📊 Sincronizando dados analíticos...');
  
  const emp_id = bar_id === 1 ? "3768" : "3691";
  const start_date = dataOntem.split('.').reverse().join('-');
  const end_date = dataOntem.split('.').reverse().join('-');
  
  // Gerar timestamp dinâmico para a query
  const queryTimestamp = generateDynamicTimestamp();
  
  // URL completa com todos os parâmetros necessários
  const query_url = `${CONTAHUB_BASE_URL}/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=77&d0=${start_date}&d1=${end_date}&produto=&grupo=&local=&turno=&mesa=&emp=${emp_id}&nfe=1`;
  
  console.log(`🔗 URL da requisição: ${query_url}`);
  
  const response = await fetch(query_url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "application/json",
      "Cookie": cookies
    }
  });

  console.log(`📡 Status da resposta: ${response.status}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.log(`❌ Erro na resposta: ${errorText}`);
    throw new Error(`Erro na requisição analítico: ${response.status}`);
  }
  
  const responseText = await response.text();
  console.log(`📄 Resposta bruta (primeiros 200 chars): ${responseText.substring(0, 200)}...`);
  
  let data;
  try {
    data = JSON.parse(responseText);
    console.log(`📊 Dados analíticos recebidos: ${data?.length || 'N/A'} registros`);
    console.log(`🔍 Tipo de dados: ${typeof data}, é array: ${Array.isArray(data)}`);
    
    // Se data não for array, verificar se está em alguma propriedade
    if (!Array.isArray(data)) {
      console.log(`🔍 Propriedades do objeto: ${Object.keys(data).join(', ')}`);
      // Tentar encontrar array em propriedades comuns
      if (data.list) data = data.list;           // ← ContaHub usa 'list'
      else if (data.rows) data = data.rows;
      else if (data.data) data = data.data;
      else if (data.result) data = data.result;
    }
  } catch (error) {
    console.log(`❌ Erro ao fazer parse do JSON: ${error.message}`);
    throw new Error(`Erro no parse da resposta analítico`);
  }

  // Se não houver dados, retornar sem erro
  if (!data || data.length === 0) {
    console.log('⚠️ Nenhum dado encontrado para o período');
    return { inserted: 0, skipped: 0, total_processed: 0 };
  }

  // Deletar dados anteriores do período
  console.log(`🗑️ Removendo dados anteriores do período ${start_date}...`);
  const { error: deleteError } = await supabase
    .from('contahub_analitico')
    .delete()
    .eq('bar_id', bar_id)
    .eq('trn_dtgerencial', start_date);

  if (deleteError) {
    console.log(`⚠️ Aviso ao deletar dados anteriores: ${deleteError.message}`);
  }

  let inserted = 0;
  let skipped = 0;
  const batchSize = 100;

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize).map((item) => ({
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
    
    if (error) {
      console.error(`❌ Erro ao inserir lote analítico ${Math.floor(i/batchSize) + 1}:`, error.message);
      skipped += batch.length;
    } else {
      inserted += batch.length;
      console.log(`   ✅ Lote ${Math.floor(i/batchSize) + 1}: ${batch.length} registros`);
    }
  }

  return { inserted, skipped, total_processed: data.length };
}

// Função para sincronizar dados de pagamentos
async function syncPagamentos(cookies, dataOntem, bar_id, supabase) {
  console.log('💳 Sincronizando dados de pagamentos...');
  
  const emp_id = bar_id === 1 ? "3768" : "3691";
  const start_date = dataOntem.split('.').reverse().join('-');
  const end_date = dataOntem.split('.').reverse().join('-');
  
  const queryTimestamp = generateDynamicTimestamp();
  // URL corrigida com qry=7, meio= e nfe=1
  const query_url = `${CONTAHUB_BASE_URL}/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=7&d0=${start_date}&d1=${end_date}&meio=&emp=${emp_id}&nfe=1`;
  
  console.log(`🔗 URL da requisição: ${query_url}`);
  
  const response = await fetch(query_url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "application/json",
      "Cookie": cookies
    }
  });

  // Aplicar mesma correção de parsing em syncPagamentos
  console.log(`📡 Status da resposta: ${response.status}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.log(`❌ Erro na resposta: ${errorText}`);
    throw new Error(`Erro na requisição pagamentos: ${response.status}`);
  }
  
  const responseText = await response.text();
  console.log(`📄 Resposta bruta (primeiros 200 chars): ${responseText.substring(0, 200)}...`);
  
  let data;
  try {
    data = JSON.parse(responseText);
    console.log(`📊 Dados de pagamentos recebidos: ${data?.length || 'N/A'} registros`);
    console.log(`🔍 Tipo de dados: ${typeof data}, é array: ${Array.isArray(data)}`);
    
    if (!Array.isArray(data)) {
      console.log(`🔍 Propriedades do objeto: ${Object.keys(data).join(', ')}`);
      if (data.list) data = data.list;           // ← ContaHub usa 'list'
      else if (data.rows) data = data.rows;
      else if (data.data) data = data.data;
      else if (data.result) data = data.result;
    }
  } catch (error) {
    console.log(`❌ Erro ao fazer parse do JSON: ${error.message}`);
    throw new Error(`Erro no parse da resposta pagamentos`);
  }

  // Se não houver dados, retornar sem erro
  if (!data || data.length === 0) {
    console.log('⚠️ Nenhum dado encontrado para o período');
    return { inserted: 0, skipped: 0, total_processed: 0 };
  }

  // Deletar dados anteriores do período
  console.log(`🗑️ Removendo dados anteriores do período ${start_date}...`);
  const { error: deleteError } = await supabase
    .from('contahub_pagamentos')
    .delete()
    .eq('bar_id', bar_id)
    .eq('dt_gerencial', start_date);

  if (deleteError) {
    console.log(`⚠️ Aviso ao deletar dados anteriores: ${deleteError.message}`);
  }

  let inserted = 0;
  let skipped = 0;
  const batchSize = 100;

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize).map((item) => ({
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
    
    if (error) {
      console.error(`❌ Erro ao inserir lote pagamentos ${Math.floor(i/batchSize) + 1}:`, error.message);
      skipped += batch.length;
    } else {
      inserted += batch.length;
      console.log(`   ✅ Lote ${Math.floor(i/batchSize) + 1}: ${batch.length} registros`);
    }
  }

  return { inserted, skipped, total_processed: data.length };
}

// Função para sincronizar dados de tempo
async function syncTempo(cookies, dataOntem, bar_id, supabase) {
  console.log('⏱️ Sincronizando dados de tempo...');
  
  const emp_id = bar_id === 1 ? "3768" : "3691";
  const start_date = dataOntem.split('.').reverse().join('-');
  const end_date = dataOntem.split('.').reverse().join('-');
  
  const queryTimestamp = generateDynamicTimestamp();
  // URL corrigida com qry=81, prod=, grupo=, local= e nfe=1
  const query_url = `${CONTAHUB_BASE_URL}/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=81&d0=${start_date}&d1=${end_date}&prod=&grupo=&local=&emp=${emp_id}&nfe=1`;
  
  console.log(`🔗 URL da requisição: ${query_url}`);
  
  const response = await fetch(query_url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "application/json",
      "Cookie": cookies
    }
  });

  console.log(`📡 Status da resposta: ${response.status}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.log(`❌ Erro na resposta: ${errorText}`);
    throw new Error(`Erro na requisição tempo: ${response.status}`);
  }
  
  const responseText = await response.text();
  console.log(`📄 Resposta bruta (primeiros 200 chars): ${responseText.substring(0, 200)}...`);
  
  let data;
  try {
    data = JSON.parse(responseText);
    console.log(`📊 Dados de tempo recebidos: ${data?.length || 'N/A'} registros`);
    console.log(`🔍 Tipo de dados: ${typeof data}, é array: ${Array.isArray(data)}`);
    
    if (!Array.isArray(data)) {
      console.log(`🔍 Propriedades do objeto: ${Object.keys(data).join(', ')}`);
      if (data.list) data = data.list;           // ← ContaHub usa 'list'
      else if (data.rows) data = data.rows;
      else if (data.data) data = data.data;
      else if (data.result) data = data.result;
    }
  } catch (error) {
    console.log(`❌ Erro ao fazer parse do JSON: ${error.message}`);
    throw new Error(`Erro no parse da resposta tempo`);
  }

  // Se não houver dados, retornar sem erro
  if (!data || data.length === 0) {
    console.log('⚠️ Nenhum dado encontrado para o período');
    return { inserted: 0, skipped: 0, total_processed: 0 };
  }

  // Deletar dados anteriores do período
  console.log(`🗑️ Removendo dados anteriores do período ${start_date}...`);
  const { error: deleteError } = await supabase
    .from('contahub_tempo')
    .delete()
    .eq('bar_id', bar_id)
    .eq('t0_lancamento', start_date);

  if (deleteError) {
    console.log(`⚠️ Aviso ao deletar dados anteriores: ${deleteError.message}`);
  }

  let inserted = 0;
  let skipped = 0;
  const batchSize = 100;

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize).map((item) => ({
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
      ano: parseInt(item.ano) || 0,
      mes: parseInt(item.mes) || 0,
      dia: parseInt(item.dia) || 0,
      dds: parseInt(item.dds) || 0,
      diadasemana: item.diadasemana || '',
      hora: item.hora || '',
      itm_qtd: parseInt(item.itm_qtd) || 0,
      bar_id: bar_id
    }));

    const { error } = await supabase.from('contahub_tempo').insert(batch);
    
    if (error) {
      console.error(`❌ Erro ao inserir lote tempo ${Math.floor(i/batchSize) + 1}:`, error.message);
      skipped += batch.length;
    } else {
      inserted += batch.length;
      console.log(`   ✅ Lote ${Math.floor(i/batchSize) + 1}: ${batch.length} registros`);
    }
  }

  return { inserted, skipped, total_processed: data.length };
}

// Função para sincronizar dados de período
async function syncPeriodo(cookies, dataOntem, bar_id, supabase) {
  console.log('📅 Sincronizando dados por período...');
  
  const emp_id = bar_id === 1 ? "3768" : "3691";
  const start_date = dataOntem.split('.').reverse().join('-');
  const end_date = dataOntem.split('.').reverse().join('-');
  
  const queryTimestamp = generateDynamicTimestamp();
  // URL corrigida com qry=5 e nfe=1
  const query_url = `${CONTAHUB_BASE_URL}/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=5&d0=${start_date}&d1=${end_date}&emp=${emp_id}&nfe=1`;
  
  console.log(`🔗 URL da requisição: ${query_url}`);
  
  const response = await fetch(query_url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "application/json",
      "Cookie": cookies
    }
  });

  console.log(`📡 Status da resposta: ${response.status}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.log(`❌ Erro na resposta: ${errorText}`);
    throw new Error(`Erro na requisição período: ${response.status}`);
  }
  
  const responseText = await response.text();
  console.log(`📄 Resposta bruta (primeiros 200 chars): ${responseText.substring(0, 200)}...`);
  
  let data;
  try {
    data = JSON.parse(responseText);
    console.log(`📊 Dados por período recebidos: ${data?.length || 'N/A'} registros`);
    console.log(`🔍 Tipo de dados: ${typeof data}, é array: ${Array.isArray(data)}`);
    
    if (!Array.isArray(data)) {
      console.log(`🔍 Propriedades do objeto: ${Object.keys(data).join(', ')}`);
      if (data.list) data = data.list;           // ← ContaHub usa 'list'
      else if (data.rows) data = data.rows;
      else if (data.data) data = data.data;
      else if (data.result) data = data.result;
    }
  } catch (error) {
    console.log(`❌ Erro ao fazer parse do JSON: ${error.message}`);
    throw new Error(`Erro no parse da resposta período`);
  }

  // Se não houver dados, retornar sem erro
  if (!data || data.length === 0) {
    console.log('⚠️ Nenhum dado encontrado para o período');
    return { inserted: 0, skipped: 0, total_processed: 0 };
  }

  // Deletar dados anteriores do período
  console.log(`🗑️ Removendo dados anteriores do período ${start_date}...`);
  const { error: deleteError } = await supabase
    .from('contahub_periodo')
    .delete()
    .eq('bar_id', bar_id)
    .eq('dt_gerencial', start_date);

  if (deleteError) {
    console.log(`⚠️ Aviso ao deletar dados anteriores: ${deleteError.message}`);
  }

  let inserted = 0;
  let skipped = 0;
  const batchSize = 100;

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize).map((item) => ({
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
    
    if (error) {
      console.error(`❌ Erro ao inserir lote período ${Math.floor(i/batchSize) + 1}:`, error.message);
      skipped += batch.length;
    } else {
      inserted += batch.length;
      console.log(`   ✅ Lote ${Math.floor(i/batchSize) + 1}: ${batch.length} registros`);
    }
  }

  return { inserted, skipped, total_processed: data.length };
}

// Função para sincronizar dados de faturamento por hora
async function syncFatPorHora(cookies, dataOntem, bar_id, supabase) {
  console.log('🕐 Sincronizando dados de faturamento por hora...');
  
  const emp_id = bar_id === 1 ? "3768" : "3691";
  const start_date = dataOntem.split('.').reverse().join('-');
  const end_date = dataOntem.split('.').reverse().join('-');
  
  const queryTimestamp = generateDynamicTimestamp();
  // URL corrigida com qry=101 e nfe=1
  const query_url = `${CONTAHUB_BASE_URL}/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=101&d0=${start_date}&d1=${end_date}&emp=${emp_id}&nfe=1`;
  
  console.log(`🔗 URL da requisição: ${query_url}`);
  
  const response = await fetch(query_url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "application/json",
      "Cookie": cookies
    }
  });

  console.log(`📡 Status da resposta: ${response.status}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.log(`❌ Erro na resposta: ${errorText}`);
    throw new Error(`Erro na requisição faturamento por hora: ${response.status}`);
  }
  
  const responseText = await response.text();
  console.log(`📄 Resposta bruta (primeiros 200 chars): ${responseText.substring(0, 200)}...`);
  
  let data;
  try {
    data = JSON.parse(responseText);
    console.log(`📊 Dados de faturamento por hora recebidos: ${data?.length || 'N/A'} registros`);
    console.log(`🔍 Tipo de dados: ${typeof data}, é array: ${Array.isArray(data)}`);
    
    if (!Array.isArray(data)) {
      console.log(`🔍 Propriedades do objeto: ${Object.keys(data).join(', ')}`);
      if (data.list) data = data.list;           // ← ContaHub usa 'list'
      else if (data.rows) data = data.rows;
      else if (data.data) data = data.data;
      else if (data.result) data = data.result;
    }
  } catch (error) {
    console.log(`❌ Erro ao fazer parse do JSON: ${error.message}`);
    throw new Error(`Erro no parse da resposta faturamento por hora`);
  }

  // Se não houver dados, retornar sem erro
  if (!data || data.length === 0) {
    console.log('⚠️ Nenhum dado encontrado para o período');
    return { inserted: 0, skipped: 0, total_processed: 0 };
  }

  // Deletar dados anteriores do período
  console.log(`🗑️ Removendo dados anteriores do período ${start_date}...`);
  const { error: deleteError } = await supabase
    .from('contahub_fatporhora')
    .delete()
    .eq('bar_id', bar_id)
    .eq('vd_dtgerencial', start_date);

  if (deleteError) {
    console.log(`⚠️ Aviso ao deletar dados anteriores: ${deleteError.message}`);
  }

  let inserted = 0;
  let skipped = 0;
  const batchSize = 100;

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize).map((item) => ({
      vd_dtgerencial: item.vd_dtgerencial || null,
      dds: parseIntSafe(item.dds),
      dia: item.dia || '',
      hora: item.hora || '',
      qtd: parseIntSafe(item.qtd),
      valor: parseFloatSafe(item.valor),
      bar_id: bar_id
    }));

    const { error } = await supabase.from('contahub_fatporhora').insert(batch);
    
    if (error) {
      console.error(`❌ Erro ao inserir lote faturamento por hora ${Math.floor(i/batchSize) + 1}:`, error.message);
      skipped += batch.length;
    } else {
      inserted += batch.length;
      console.log(`   ✅ Lote ${Math.floor(i/batchSize) + 1}: ${batch.length} registros`);
    }
  }

  return { inserted, skipped, total_processed: data.length };
}

// Função principal de teste
async function testarSync() {
  const startTime = Date.now();
  
  console.log('🎯 TESTE DE SINCRONIZAÇÃO CONTAHUB - SGB V3');
  console.log('================================================');
  
  try {
    // Conectar ao Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('✅ Conectado ao Supabase');
    
    // Calcular data de ontem
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const day = String(yesterday.getDate()).padStart(2, '0');
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const year = yesterday.getFullYear();
    
    const dataOntem = `${day}.${month}.${year}`;
    const executionDate = new Date().toISOString();

    console.log(`📅 Data de execução: ${executionDate}`);
    console.log(`📊 Processando dados de: ${dataOntem}`);
    console.log('================================================');

    // 1. Login único no ContaHub
    const cookies = await loginContaHub();

    // 2. Módulos de sincronização completos
    const modules = [
      {
        name: 'analitico',
        description: 'Dados analíticos de vendas',
        syncFunction: syncAnalitico
      },
      {
        name: 'pagamentos',
        description: 'Dados de pagamentos',
        syncFunction: syncPagamentos
      },
      {
        name: 'periodo',
        description: 'Dados por período',
        syncFunction: syncPeriodo
      },
      {
        name: 'tempo',
        description: 'Dados de tempo',
        syncFunction: syncTempo
      },
      {
        name: 'fatporhora',
        description: 'Dados de faturamento por hora',
        syncFunction: syncFatPorHora
      }
    ];

    const results = [];
    let totalInserted = 0;
    let totalSkipped = 0;
    let successfulModules = 0;
    const bar_id = 1; // Ordinário

    // 3. Executar cada módulo
    for (const module of modules) {
      const moduleStartTime = Date.now();
      
      console.log(`\n🔄 [${modules.indexOf(module) + 1}/${modules.length}] Executando: ${module.name.toUpperCase()}`);
      console.log(`📝 Descrição: ${module.description}`);

      try {
        const result = await module.syncFunction(cookies, dataOntem, bar_id, supabase);
        
        const moduleEndTime = Date.now();
        const executionTime = moduleEndTime - moduleStartTime;

        const moduleResult = {
          module: module.name,
          status: 'success',
          message: `Sincronizado com sucesso: ${result.inserted} inseridos, ${result.skipped} ignorados`,
          inserted: result.inserted,
          skipped: result.skipped,
          total_processed: result.total_processed,
          execution_time: executionTime
        };

        totalInserted += moduleResult.inserted || 0;
        totalSkipped += moduleResult.skipped || 0;
        successfulModules++;

        console.log(`✅ ${module.name.toUpperCase()} - SUCESSO`);
        console.log(`   📊 Inseridos: ${moduleResult.inserted}`);
        console.log(`   ⏭️ Ignorados: ${moduleResult.skipped}`);
        console.log(`   ⏱️ Tempo: ${Math.round(executionTime/1000)}s`);

        results.push(moduleResult);

      } catch (error) {
        const moduleEndTime = Date.now();
        const executionTime = moduleEndTime - moduleStartTime;

        console.log(`❌ ${module.name.toUpperCase()} - ERRO`);
        console.log(`   💥 Erro: ${error.message}`);
        console.log(`   ⏱️ Tempo: ${Math.round(executionTime/1000)}s`);

        results.push({
          module: module.name,
          status: 'error',
          message: 'Falha na sincronização',
          error: error.message,
          execution_time: executionTime
        });
      }

      // Timeout entre módulos
      if (modules.indexOf(module) < modules.length - 1) {
        const timeout = randomTimeout();
        console.log(`⏸️ Pausando ${timeout/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, timeout));
      }
    }

    const totalExecutionTime = Date.now() - startTime;
    const failedModules = modules.length - successfulModules;

    console.log('\n================================================');
    console.log('📊 RESULTADO FINAL DO TESTE');
    console.log('================================================');
    console.log(`📅 Data processada: ${dataOntem}`);
    console.log(`✅ Módulos com sucesso: ${successfulModules}/${modules.length}`);
    console.log(`❌ Módulos com erro: ${failedModules}`);
    console.log(`💾 Total de registros inseridos: ${totalInserted}`);
    console.log(`⏭️ Total de registros ignorados: ${totalSkipped}`);
    console.log(`⏱️ Tempo total de execução: ${Math.round(totalExecutionTime/1000)}s`);
    console.log(`🎯 Status: ${successfulModules === modules.length ? '✅ SUCESSO TOTAL' : '⚠️ SUCESSO PARCIAL'}`);
    
    console.log('\n📋 PRÓXIMOS PASSOS:');
    if (successfulModules === modules.length) {
      console.log('✅ Teste bem-sucedido! Pode deployar a Edge Function.');
      console.log('✅ Verificar dados no Supabase para confirmar.');
    } else {
      console.log('⚠️ Corrigir erros antes de deployar a Edge Function.');
      console.log('⚠️ Verificar credenciais e conexões.');
    }

  } catch (error) {
    const totalExecutionTime = Date.now() - startTime;
    
    console.error('\n💥 ERRO CRÍTICO NO TESTE:', error.message);
    console.log(`⏱️ Tempo de execução: ${Math.round(totalExecutionTime/1000)}s`);
  }
}

// Verificar dependências
console.log('🔧 Verificando dependências...');

const requiredModules = ['@supabase/supabase-js'];
const missingModules = [];

for (const module of requiredModules) {
  try {
    require(module);
  } catch (error) {
    missingModules.push(module);
  }
}

if (missingModules.length > 0) {
  console.log('\n❌ Módulos não encontrados:');
  missingModules.forEach(module => {
    console.log(`   - ${module}`);
  });
  console.log('\n📋 Instale com: npm install @supabase/supabase-js');
  process.exit(1);
}

// Executar teste
console.log('✅ Dependências OK!');
console.log('🎯 Iniciando teste em 2 segundos...\n');
setTimeout(testarSync, 2000); 