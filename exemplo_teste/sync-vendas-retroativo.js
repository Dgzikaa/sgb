/**
 * Script para sincronizar dados de VENDAS do ContaHub retroativamente
 * 
 * USO: node sync-vendas-retroativo.js
 * 
 * REQUISITOS: Node.js 18+ (para fetch nativo) ou instalar node-fetch
 * 
 * Variáveis de ambiente necessárias (ou edite diretamente abaixo):
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_KEY
 * - CONTAHUB_EMAIL
 * - CONTAHUB_PASSWORD
 * - CONTAHUB_EMP_ID
 */

const crypto = require('crypto');

// Verificar versão do Node
const nodeVersion = parseInt(process.version.slice(1).split('.')[0]);
if (nodeVersion < 18) {
  console.error('❌ ERRO: Este script requer Node.js 18 ou superior.');
  console.error(`   Sua versão: ${process.version}`);
  console.error('   Atualize o Node.js ou use: npm install node-fetch');
  process.exit(1);
}

console.log(`📦 Node.js ${process.version}`);

// ========== CONFIGURAÇÕES - EDITE AQUI ==========
const CONFIG = {
  // Supabase
  supabaseUrl: process.env.SUPABASE_URL || 'https://uqtgsvujwcbymjmvkjhy.supabase.co',
  supabaseKey: process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMxMTE2NiwiZXhwIjoyMDY2ODg3MTY2fQ.cGdHBTSYbNv_qgm6K94DjGXDW46DtiSL3c5428c0WQ0',
  
  // ContaHub
  contahubEmail: process.env.CONTAHUB_EMAIL || 'digao@3768',
  contahubPassword: process.env.CONTAHUB_PASSWORD || 'Geladeira@001',
  contahubEmpId: process.env.CONTAHUB_EMP_ID || '3768',
  
  // Configurações do sync
  barId: 3,
  startDate: '2025-02-01',  // Data início (YYYY-MM-DD)
  endDate: '2025-12-14',    // Data fim (YYYY-MM-DD) - até ontem (15 já foi feito)
  delayMs: 2000,            // Delay entre dias (ms)
  delayTurnoMs: 500,        // Delay entre turnos (ms)
};

// ========== FUNÇÕES AUXILIARES ==========

function generateTimestamp() {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}${String(now.getMilliseconds()).padStart(3, '0')}`;
}

function sha1(str) {
  return crypto.createHash('sha1').update(str).digest('hex');
}

function generateDateRange(startDate, endDate) {
  const dates = [];
  // Usar UTC para evitar problemas de timezone
  const start = new Date(startDate + 'T12:00:00Z');
  const end = new Date(endDate + 'T12:00:00Z');
  
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
  }
  
  return dates;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ========== LOGIN CONTAHUB ==========

async function loginContaHub() {
  console.log('🔐 Fazendo login no ContaHub...');
  
  const passwordSha1 = sha1(CONFIG.contahubPassword);
  const loginTimestamp = generateTimestamp();
  
  const loginData = new URLSearchParams({
    'usr_email': CONFIG.contahubEmail,
    'usr_password_sha1': passwordSha1
  });
  
  const response = await fetch(`https://sp.contahub.com/rest/contahub.cmds.UsuarioCmd/login/${loginTimestamp}?emp=0`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json'
    },
    body: loginData,
  });
  
  if (!response.ok) {
    throw new Error(`Erro no login ContaHub: ${response.statusText}`);
  }
  
  const setCookieHeaders = response.headers.get('set-cookie');
  if (!setCookieHeaders) {
    throw new Error('Cookies de sessão não encontrados no login');
  }
  
  console.log('✅ Login ContaHub realizado com sucesso');
  return setCookieHeaders;
}

// ========== FETCH CONTAHUB ==========

async function fetchContaHub(url, sessionToken) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Cookie': sessionToken,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText.substring(0, 100)}`);
    }
    
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error(`JSON parse error: ${text.substring(0, 100)}`);
    }
  } catch (error) {
    if (error.message.includes('fetch')) {
      throw new Error(`Network error: ${error.message}`);
    }
    throw error;
  }
}

// ========== SUPABASE ==========

async function supabaseQuery(method, table, data = null, filters = null) {
  let url = `${CONFIG.supabaseUrl}/rest/v1/${table}`;
  
  if (filters) {
    const params = new URLSearchParams(filters);
    url += `?${params.toString()}`;
  }
  
  const options = {
    method,
    headers: {
      'apikey': CONFIG.supabaseKey,
      'Authorization': `Bearer ${CONFIG.supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'return=minimal' : 'return=representation'
    }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase error: ${response.status} - ${errorText}`);
  }
  
  if (method === 'GET') {
    return response.json();
  }
  
  return { success: true };
}

async function saveRawData(dataType, rawData, dataDate) {
  const url = `${CONFIG.supabaseUrl}/rest/v1/contahub_raw_data`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': CONFIG.supabaseKey,
      'Authorization': `Bearer ${CONFIG.supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify({
      bar_id: CONFIG.barId,
      data_type: dataType,
      data_date: dataDate,
      raw_json: rawData,
      processed: false
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao salvar raw data: ${errorText}`);
  }
  
  return { success: true };
}

async function processVendas(vendas, dataDate) {
  // Deletar existentes
  const deleteUrl = `${CONFIG.supabaseUrl}/rest/v1/contahub_vendas?bar_id=eq.${CONFIG.barId}&dt_gerencial=eq.${dataDate}`;
  await fetch(deleteUrl, {
    method: 'DELETE',
    headers: {
      'apikey': CONFIG.supabaseKey,
      'Authorization': `Bearer ${CONFIG.supabaseKey}`,
    }
  });
  
  if (vendas.length === 0) return { count: 0 };
  
  // Parser de timestamp
  const parseTs = (ts) => {
    if (!ts) return null;
    try {
      const date = new Date(ts);
      return isNaN(date.getTime()) ? null : date.toISOString();
    } catch {
      return null;
    }
  };
  
  // Parser de data
  const parseDate = (d) => {
    if (!d) return null;
    try {
      return d.split('T')[0];
    } catch {
      return null;
    }
  };
  
  // Parser monetário
  const parseMoney = (val) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    return parseFloat(String(val).replace('$', '').replace(',', '.').trim()) || 0;
  };
  
  // Mapear registros
  const records = vendas.map(item => ({
    bar_id: CONFIG.barId,
    dt_gerencial: dataDate,
    trn: parseInt(item.trn) || null,
    vd: parseInt(item.vd) || null,
    vd_nome: item.vd_nome || '',
    vd_mesadesc: item.vd_mesadesc || '',
    vd_localizacao: item.vd_localizacao || '',
    cli_nome: item.cli_nome || item.vd_nome || '',
    cli_fone: item.cli_fone || '',
    cli_email: item.cli_email || item.vd_email || '',
    cli_dtnasc: parseDate(item.cli_dtnasc),
    vd_cpf: item.vd_cpf || item.cli_cpf || '',
    vd_hrabertura: parseTs(item.vd_hrabertura),
    vd_hrsaida: parseTs(item.vd_hrsaida),
    vd_hrultimo: parseTs(item.vd_hrultimo),
    vd_hrprimeiro: parseTs(item.vd_hrprimeiro),
    vd_hrfechamento: parseTs(item.vd_hrfechamento),
    vd_comanda: item.vd_comanda || '',
    vd_status: item.vd_status || '',
    vd_senha: item.vd_senha || '',
    pessoas: parseFloat(item.vd_pessoas) || 0,
    qtd_itens: parseFloat(item.vd_qtditens) || 0,
    vd_vrcheio: parseFloat(item.vd_vrcheio) || 0,
    vr_couvert: parseFloat(item.vd_vrcouvert) || 0,
    vd_vrdescontos: parseFloat(item.vd_vrdescontos) || 0,
    vr_repique: parseFloat(item.vd_vrrepique) || 0,
    trn_desc: item.trn_desc || '',
    trn_couvert: parseMoney(item.trn_couvert),
    trn_status: item.trn_status || '',
    usr_abriu: item.usr_nome_abriu || '',
    motivo: item.vd_motivodesconto || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    idempotency_key: `${CONFIG.barId}_${dataDate}_${item.vd || ''}_${item.trn || ''}`
  })).filter(v => v.vd);
  
  if (records.length === 0) return { count: 0 };
  
  // Inserir em batches de 100
  const batchSize = 100;
  let inserted = 0;
  
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    
    const url = `${CONFIG.supabaseUrl}/rest/v1/contahub_vendas`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': CONFIG.supabaseKey,
        'Authorization': `Bearer ${CONFIG.supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(batch)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`  ⚠️ Erro ao inserir batch: ${errorText}`);
    } else {
      inserted += batch.length;
    }
  }
  
  return { count: inserted };
}

// ========== MAIN ==========

async function main() {
  console.log('🚀 Sync Retroativo de Vendas ContaHub');
  console.log('=====================================');
  console.log(`📅 Período: ${CONFIG.startDate} até ${CONFIG.endDate}`);
  console.log(`🏪 Bar ID: ${CONFIG.barId}`);
  console.log(`⏱️ Delay: ${CONFIG.delayMs}ms entre dias`);
  console.log('');
  
  // Validar credenciais
  if (!CONFIG.contahubEmail || !CONFIG.contahubPassword) {
    console.error('❌ ERRO: Configure CONTAHUB_EMAIL e CONTAHUB_PASSWORD no script!');
    process.exit(1);
  }
  
  try {
    // Login
    const sessionToken = await loginContaHub();
    
    // Gerar datas
    const dates = generateDateRange(CONFIG.startDate, CONFIG.endDate);
    console.log(`\n📆 Total de ${dates.length} dias para processar\n`);
    
    const results = {
      success: 0,
      errors: 0,
      totalVendas: 0
    };
    
    // Processar cada dia
    for (let i = 0; i < dates.length; i++) {
      const dataDate = dates[i];
      const progress = `[${i + 1}/${dates.length}]`;
      
      try {
        // Verificar se já existe
        const checkUrl = `${CONFIG.supabaseUrl}/rest/v1/contahub_raw_data?bar_id=eq.${CONFIG.barId}&data_type=eq.vendas&data_date=eq.${dataDate}&select=id`;
        const checkResponse = await fetch(checkUrl, {
          headers: {
            'apikey': CONFIG.supabaseKey,
            'Authorization': `Bearer ${CONFIG.supabaseKey}`,
          }
        });
        const existing = await checkResponse.json();
        
        if (existing && existing.length > 0) {
          console.log(`${progress} ⏭️ ${dataDate} - já existe, pulando...`);
          continue;
        }
        
        // Calcular turno baseado na data
        // trn = 1 foi 31/01/2025, incrementa 1 por dia de operação
        // Primeiro tenta buscar do banco, senão calcula
        console.log(`  🔍 Buscando turno para ${dataDate}...`);
        
        let turnosDisponiveis = [];
        
        // Tentar buscar do banco primeiro (trn_dtgerencial é TIMESTAMP, usar gte e lt para filtrar por data)
        const nextDate = new Date(dataDate);
        nextDate.setDate(nextDate.getDate() + 1);
        const nextDateStr = nextDate.toISOString().split('T')[0];
        
        const turnoUrl = `${CONFIG.supabaseUrl}/rest/v1/contahub_analitico?bar_id=eq.${CONFIG.barId}&trn_dtgerencial=gte.${dataDate}&trn_dtgerencial=lt.${nextDateStr}&select=trn&limit=1`;
        const turnoResponse = await fetch(turnoUrl, {
          headers: {
            'apikey': CONFIG.supabaseKey,
            'Authorization': `Bearer ${CONFIG.supabaseKey}`,
          }
        });
        
        if (!turnoResponse.ok) {
          console.log(`  ⚠️ Erro ao buscar turno do banco: ${turnoResponse.status}`);
        }
        
        const turnoData = await turnoResponse.json();
        
        if (turnoData && turnoData.length > 0 && turnoData[0].trn) {
          turnosDisponiveis = [turnoData[0].trn];
          console.log(`  📅 Turno do banco: ${turnosDisponiveis[0]}`);
        } else {
          // Calcular turno baseado na data (trn=1 em 31/01/2025)
          const baseDate = new Date('2025-01-31');
          const targetDate = new Date(dataDate);
          const diffDays = Math.floor((targetDate - baseDate) / (1000 * 60 * 60 * 24));
          const calculatedTrn = diffDays + 1; // trn=1 no dia base
          
          if (calculatedTrn > 0 && calculatedTrn <= 400) { // Sanity check
            turnosDisponiveis = [calculatedTrn];
            console.log(`  📅 Turno calculado: ${calculatedTrn} (${diffDays} dias desde 31/01)`);
          } else {
            console.log(`  ⚠️ Turno calculado inválido: ${calculatedTrn}`);
          }
        }
        
        if (turnosDisponiveis.length === 0) {
          console.log(`${progress} ⚠️ ${dataDate} - nenhum turno`);
          await delay(500);
          continue;
        }
        
        // Buscar vendas de cada turno
        const allVendas = [];
        for (const turno of turnosDisponiveis) {
          const vendasUrl = `https://sp.contahub.com/M/guru.facades.GerenciaFacade/getTurnoVendas?trn=${turno}&t=${generateTimestamp()}&emp=${CONFIG.contahubEmpId}`;
          console.log(`  🔗 URL: ${vendasUrl}`);
          
          try {
            const vendasData = await fetchContaHub(vendasUrl, sessionToken);
            console.log(`  📊 Resposta: ${typeof vendasData}, isArray: ${Array.isArray(vendasData)}, length: ${vendasData?.length || 'N/A'}`);
            
            if (Array.isArray(vendasData)) {
              vendasData.forEach(v => v.trn = turno);
              allVendas.push(...vendasData);
              console.log(`  ✅ ${vendasData.length} vendas do turno ${turno}`);
            } else if (vendasData && typeof vendasData === 'object') {
              // Pode vir em outro formato
              console.log(`  🔎 Keys: ${Object.keys(vendasData).join(', ')}`);
              if (vendasData.data && Array.isArray(vendasData.data)) {
                vendasData.data.forEach(v => v.trn = turno);
                allVendas.push(...vendasData.data);
                console.log(`  ✅ ${vendasData.data.length} vendas (em .data)`);
              }
            }
          } catch (e) {
            console.warn(`  ⚠️ Erro turno ${turno}: ${e.message}`);
          }
          
          await delay(CONFIG.delayTurnoMs);
        }
        
        // Salvar raw data
        await saveRawData('vendas', { list: allVendas }, dataDate);
        
        // Processar e inserir na tabela final
        const processResult = await processVendas(allVendas, dataDate);
        
        console.log(`${progress} ✅ ${dataDate} - ${allVendas.length} vendas (${turnosDisponiveis.length} turnos)`);
        results.success++;
        results.totalVendas += processResult.count;
        
      } catch (error) {
        console.error(`${progress} ❌ ${dataDate} - ${error.message}`);
        if (error.stack) {
          console.error(`  Stack: ${error.stack.split('\n')[1]}`);
        }
        results.errors++;
      }
      
      // Delay entre dias
      if (i < dates.length - 1) {
        await delay(CONFIG.delayMs);
      }
    }
    
    // Resumo
    console.log('\n=====================================');
    console.log('📊 RESUMO FINAL:');
    console.log(`✅ Dias processados: ${results.success}`);
    console.log(`❌ Erros: ${results.errors}`);
    console.log(`📈 Total de vendas: ${results.totalVendas}`);
    console.log('=====================================');
    
  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  }
}

// Executar
main();

