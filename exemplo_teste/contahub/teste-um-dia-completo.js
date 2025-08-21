// Script para testar apenas 01/02/2025 e validar inserção completa
const fs = require('fs');
const path = require('path');
const { createClient } = require('../../frontend/node_modules/@supabase/supabase-js');

// Tentar carregar variáveis do .env.local
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '../../frontend/.env.local');
    console.log(`🔍 Procurando .env.local em: ${envPath}`);
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envVars = {};
      
      envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            envVars[key] = valueParts.join('=').replace(/"/g, '');
          }
        }
      });
      
      // Aplicar as variáveis ao process.env
      Object.assign(process.env, envVars);
      console.log('✅ Arquivo .env.local carregado com sucesso!');
      return true;
    } else {
      console.log('❌ Arquivo .env.local não encontrado');
    }
  } catch (error) {
    console.log('⚠️ Não foi possível carregar .env.local:', error.message);
  }
  return false;
}

// Carregar variáveis de ambiente
loadEnvFile();

// Configuração do Supabase
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uqtgsvujwcbymjmvkjhy.supabase.co').replace(/"/g, '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/"/g, '') || '';

if (!SUPABASE_KEY) {
  console.error('❌ Erro: SUPABASE_SERVICE_ROLE_KEY não encontrada!');
  process.exit(1);
}

console.log(`🔑 API Key carregada: ${SUPABASE_KEY.substring(0, 20)}...`);
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Função para chamar o orquestrador ContaHub
async function callContaHubOrchestrator(date, barId = 3) {
  console.log(`🔄 Sincronizando dados para ${date}...`);
  
  try {
    const { data, error } = await supabase.functions.invoke('contahub_orchestrator', {
      body: {
        data_date: date,
        bar_id: barId
      }
    });

    if (error) {
      console.error(`❌ Erro ao sincronizar ${date}:`, error);
      return null;
    }

    console.log(`✅ Sincronização de ${date} concluída:`, JSON.stringify(data, null, 2));
    return data;
  } catch (err) {
    console.error(`❌ Erro na chamada para ${date}:`, err.message);
    return null;
  }
}

// Função para verificar dados raw coletados
async function checkRawData(date) {
  console.log(`\n📋 Verificando dados RAW coletados para ${date}...`);
  
  const { data, error } = await supabase
    .from('contahub_raw_data')
    .select('data_type, record_count, processed')
    .eq('bar_id', 3)
    .eq('data_date', date)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ Erro ao verificar raw data:', error);
    return [];
  }

  console.log(`📊 Dados RAW coletados:`, data);
  
  const totalColetado = data.reduce((sum, item) => sum + (item.record_count || 0), 0);
  console.log(`📈 Total coletado: ${totalColetado} registros`);
  
  return data;
}

// Função para verificar dados processados nas tabelas finais
async function checkProcessedData(date) {
  console.log(`\n📋 Verificando dados PROCESSADOS nas tabelas finais para ${date}...`);
  
  const queries = [
    {
      table: 'contahub_analitico',
      dateField: 'trn_dtgerencial',
      query: supabase.from('contahub_analitico').select('*', { count: 'exact', head: true }).eq('bar_id', 3).eq('trn_dtgerencial', date)
    },
    {
      table: 'contahub_fatporhora', 
      dateField: 'vd_dtgerencial',
      query: supabase.from('contahub_fatporhora').select('*', { count: 'exact', head: true }).eq('bar_id', 3).eq('vd_dtgerencial', date)
    },
    {
      table: 'contahub_pagamentos',
      dateField: 'dt_gerencial',
      query: supabase.from('contahub_pagamentos').select('*', { count: 'exact', head: true }).eq('bar_id', 3).eq('dt_gerencial', date)
    },
    {
      table: 'contahub_periodo',
      dateField: 'dt_gerencial',
      query: supabase.from('contahub_periodo').select('*', { count: 'exact', head: true }).eq('bar_id', 3).eq('dt_gerencial', date)
    },
    {
      table: 'contahub_tempo',
      dateField: 'data',
      query: supabase.from('contahub_tempo').select('*', { count: 'exact', head: true }).eq('bar_id', 3).eq('data', date)
    }
  ];
  
  const results = [];
  let totalProcessado = 0;
  
  for (const { table, query } of queries) {
    const { count, error } = await query;
    
    if (error) {
      console.log(`❌ Erro ao verificar ${table}:`, error.message);
      results.push({ table, count: 0, error: error.message });
    } else {
      console.log(`📊 ${table}: ${count || 0} registros`);
      results.push({ table, count: count || 0 });
      totalProcessado += count || 0;
    }
  }
  
  console.log(`📈 Total processado: ${totalProcessado} registros`);
  return { results, totalProcessado };
}

// Função para verificar exemplos de dados inseridos
async function checkSampleData(date) {
  console.log(`\n🔍 Verificando exemplos de dados inseridos para ${date}...`);
  
  // Verificar alguns registros de cada tabela
  const tables = [
    { name: 'contahub_analitico', dateField: 'trn_dtgerencial' },
    { name: 'contahub_fatporhora', dateField: 'vd_dtgerencial' },
    { name: 'contahub_pagamentos', dateField: 'dt_gerencial' },
    { name: 'contahub_periodo', dateField: 'dt_gerencial' },
    { name: 'contahub_tempo', dateField: 'data' }
  ];
  
  for (const { name, dateField } of tables) {
    const { data, error } = await supabase
      .from(name)
      .select('*')
      .eq('bar_id', 3)
      .eq(dateField, date)
      .limit(2);
    
    if (error) {
      console.log(`❌ Erro ao buscar exemplos de ${name}:`, error.message);
    } else if (data && data.length > 0) {
      console.log(`\n📄 Exemplo de ${name} (${data.length} registros):`, JSON.stringify(data[0], null, 2));
    } else {
      console.log(`⚠️ ${name}: Nenhum registro encontrado`);
    }
  }
}

async function main() {
  const testDate = '2025-02-01';
  
  console.log('🧪 TESTE COMPLETO - 01/02/2025');
  console.log('=====================================');
  
  // 1. Executar sincronização
  console.log('\n🚀 PASSO 1: Executando sincronização...');
  const result = await callContaHubOrchestrator(testDate, 3);
  
  if (!result || !result.success) {
    console.error('❌ Falha na sincronização. Abortando teste.');
    return;
  }
  
  // 2. Verificar dados raw
  console.log('\n🔍 PASSO 2: Verificando dados RAW...');
  const rawData = await checkRawData(testDate);
  
  // 3. Verificar dados processados
  console.log('\n📊 PASSO 3: Verificando dados PROCESSADOS...');
  const { results, totalProcessado } = await checkProcessedData(testDate);
  
  // 4. Verificar exemplos de dados
  console.log('\n📄 PASSO 4: Verificando exemplos de dados...');
  await checkSampleData(testDate);
  
  // 5. Resumo final
  console.log('\n🎯 RESUMO FINAL:');
  console.log('=====================================');
  console.log(`📅 Data testada: ${testDate}`);
  console.log(`📥 Total coletado: ${result.summary.total_records_collected} registros`);
  console.log(`📤 Total processado (orquestrador): ${result.summary.total_records_processed} registros`);
  console.log(`📊 Total processado (verificação): ${totalProcessado} registros`);
  
  // Análise de discrepâncias
  const coletado = result.summary.total_records_collected;
  const processadoOrq = result.summary.total_records_processed;
  const processadoReal = totalProcessado;
  
  if (coletado === processadoReal) {
    console.log('✅ PERFEITO: Todos os registros coletados foram processados!');
  } else {
    console.log(`⚠️ DISCREPÂNCIA: Coletado ${coletado}, Processado ${processadoReal}`);
    console.log(`📉 Diferença: ${coletado - processadoReal} registros não processados`);
    
    // Mostrar detalhes por tabela
    console.log('\n📋 Detalhes por tabela:');
    rawData.forEach(raw => {
      const processed = results.find(r => r.table === `contahub_${raw.data_type}`);
      const processedCount = processed ? processed.count : 0;
      const status = raw.record_count === processedCount ? '✅' : '❌';
      console.log(`${status} ${raw.data_type}: ${raw.record_count} coletados → ${processedCount} processados`);
    });
  }
}

main().catch(console.error);
