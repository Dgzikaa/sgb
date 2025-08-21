// Script para popular dados de fevereiro de 2024 usando a API do ContaHub
// Usa o mesmo orquestrador que está no backend

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
      return false;
    }

    console.log(`✅ Sincronização de ${date} concluída:`, data);
    return true;
  } catch (err) {
    console.error(`❌ Erro na chamada para ${date}:`, err.message);
    return false;
  }
}

// Função para gerar todas as datas de fevereiro de 2025
function generateFebruaryDates() {
  const dates = [];
  const year = 2025;
  const month = 2; // Fevereiro
  const daysInMonth = new Date(year, month, 0).getDate(); // 28 dias em 2025
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    dates.push(date);
  }
  
  return dates;
}

// Função para verificar dados existentes
async function checkExistingData() {
  console.log('\n📊 Verificando dados existentes de fevereiro/2025...');
  
  const tables = [
    'contahub_analitico',
    'contahub_fatporhora', 
    'contahub_pagamentos',
    'contahub_periodo',
    'contahub_tempo'
  ];
  
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq('bar_id', 3)
      .gte('trn_dtgerencial', '2025-02-01')
      .lte('trn_dtgerencial', '2025-02-28');
    
    if (error) {
      console.log(`⚠️ Erro ao verificar ${table}:`, error.message);
    } else {
      console.log(`📋 ${table}: ${count || 0} registros`);
    }
  }
}

async function main() {
  console.log('🚀 Iniciando população de dados de fevereiro/2025...');
  console.log('📅 Período: 01/02/2025 a 28/02/2025 (28 dias)');
  
  // Verificar dados existentes antes
  await checkExistingData();
  
  // Gerar todas as datas de fevereiro
  const dates = generateFebruaryDates();
  console.log(`\n📅 Datas a processar: ${dates.length} dias`);
  
  let successCount = 0;
  let errorCount = 0;
  
  // Processar cada data
  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    console.log(`\n[${i + 1}/${dates.length}] Processando ${date}...`);
    
    const success = await callContaHubOrchestrator(date, 3);
    
    if (success) {
      successCount++;
      console.log(`✅ ${date} processado com sucesso`);
    } else {
      errorCount++;
      console.log(`❌ Erro ao processar ${date}`);
    }
    
    // Pequena pausa entre as chamadas para não sobrecarregar a API
    if (i < dates.length - 1) {
      console.log('⏳ Aguardando 2 segundos...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n🎉 Processamento concluído!');
  console.log(`✅ Sucessos: ${successCount}`);
  console.log(`❌ Erros: ${errorCount}`);
  console.log(`📊 Total processado: ${successCount + errorCount}/${dates.length}`);
  
  // Verificar dados após o processamento
  console.log('\n📊 Verificando dados após processamento...');
  await checkExistingData();
}

main().catch(console.error);
