// ========================================
// TESTE SYNC CONTAHUB - SGB V3
// Script para testar a Edge Function de sincronização
// ========================================

const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente
function loadEnvFile() {
  const envPath = path.join(__dirname, '../frontend/.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      env[key.trim()] = value.trim().replace(/"/g, '');
    }
  });
  
  return env;
}

const env = loadEnvFile();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🧪 TESTE SYNC CONTAHUB - SGB V3');
console.log('================================================');

// URL da Edge Function
const EDGE_FUNCTION_URL = `https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/contahub-sync-automatico`;

async function testSync() {
  try {
    console.log('🚀 Iniciando teste da sincronização...');
    console.log(`📡 URL: ${EDGE_FUNCTION_URL}`);
    
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!');
    console.log('================================================');
    console.log(`📊 Resultado: ${result.message}`);
    console.log(`📅 Data processada: ${result.result.data_date}`);
    console.log(`✅ Módulos com sucesso: ${result.result.successful_modules}/${result.result.total_modules}`);
    console.log(`❌ Módulos com erro: ${result.result.failed_modules}`);
    console.log(`💾 Total de registros inseridos: ${result.result.total_records_inserted}`);
    console.log(`⏭️ Total de registros ignorados: ${result.result.total_records_skipped}`);
    console.log(`⏱️ Tempo total de execução: ${Math.round(result.result.total_execution_time/1000)}s`);
    
    console.log('\n📋 DETALHES POR MÓDULO:');
    console.log('================================================');
    
    result.result.modules.forEach(module => {
      const status = module.status === 'success' ? '✅' : '❌';
      const time = Math.round((module.execution_time || 0)/1000);
      
      console.log(`${status} ${module.module.toUpperCase()}:`);
      console.log(`   📝 ${module.message}`);
      if (module.inserted !== undefined) {
        console.log(`   📊 Inseridos: ${module.inserted}`);
        console.log(`   ⏭️ Ignorados: ${module.skipped}`);
      }
      console.log(`   ⏱️ Tempo: ${time}s`);
      
      if (module.error) {
        console.log(`   💥 Erro: ${module.error}`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error.message);
    
    if (error.response) {
      const errorText = await error.response.text();
      console.error('📄 Resposta do servidor:', errorText);
    }
  }
}

// Executar teste
testSync(); 