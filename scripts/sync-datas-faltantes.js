/**
 * Script para sincronizar as datas faltantes no contahub_periodo
 * Usa a API sync-automatico existente para cada data
 * 
 * Uso: 
 *   cd F:\Zykor\frontend
 *   node ../scripts/sync-datas-faltantes.js
 */

const fs = require('fs');
const path = require('path');

// Carregar .env.local manualmente
function loadEnvFile(envPath) {
  try {
    const envFile = fs.readFileSync(envPath, 'utf8');
    const lines = envFile.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        let value = valueParts.join('=');
        // Remover aspas se existirem
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    }
    console.log('✅ Variáveis de ambiente carregadas de .env.local');
  } catch (e) {
    console.log('⚠️ Não foi possível carregar .env.local:', e.message);
  }
}

// Tentar carregar do diretório atual (frontend) ou do pai
const envPaths = [
  path.join(process.cwd(), '.env.local'),
  path.join(process.cwd(), '..', 'frontend', '.env.local'),
  path.join(__dirname, '..', 'frontend', '.env.local')
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    loadEnvFile(envPath);
    break;
  }
}

const DATAS_FALTANTES = [
  '2025-02-02', '2025-02-09', '2025-02-10', '2025-02-12',
  '2025-02-17', '2025-02-24', '2025-03-05', '2025-03-10',
  '2025-03-17', '2025-03-31', '2025-04-01', '2025-04-02',
  '2025-04-03', '2025-04-04', '2025-04-05', '2025-04-06',
  '2025-04-07', '2025-04-08', '2025-04-09', '2025-04-14',
  '2025-04-22', '2025-04-28', '2025-04-29', '2025-05-05',
  '2025-05-06', '2025-05-12', '2025-05-13', '2025-05-19',
  '2025-05-20', '2025-05-26', '2025-05-27', '2025-06-03',
  '2025-06-10', '2025-06-24', '2025-07-01', '2025-07-08',
  '2025-07-15', '2025-07-22', '2025-07-29', '2025-08-05',
  '2025-08-12', '2025-08-19', '2025-08-26', '2025-09-02',
  '2025-09-05', '2025-09-09', '2025-09-16', '2025-09-23',
  '2025-09-30', '2025-10-07', '2025-10-14', '2025-10-21',
  '2025-10-28'
];

const BAR_ID = 3; // Ordinário Bar
const SUPABASE_URL = 'https://uqtgsvujwcbymjmvkjhy.supabase.co';

// Pegar a service role key do ambiente
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada no ambiente!');
  console.log('Execute: $env:SUPABASE_SERVICE_ROLE_KEY = "sua_key_aqui"');
  process.exit(1);
}

// Usar o PROCESSOR para processar dados brutos que já existem
async function processData(dataDate) {
  console.log(`\n🗓️ Processando ${dataDate}...`);
  
  try {
    // Chamar o contahub-processor para processar os dados brutos
    const response = await fetch(`${SUPABASE_URL}/functions/v1/contahub-processor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        data_date: dataDate,
        bar_id: BAR_ID,
        data_types: ['analitico', 'fatporhora', 'pagamentos', 'periodo', 'tempo', 'vendas']
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    const processed = result.summary?.total_processed || result.processed || 0;
    
    console.log(`   ✅ ${dataDate}: ${processed} registros processados`);
    return { success: true, date: dataDate, processed };
    
  } catch (error) {
    console.error(`   ❌ ${dataDate}: ${error.message}`);
    return { success: false, date: dataDate, error: error.message };
  }
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🚀 Iniciando sincronização das datas faltantes');
  console.log(`📊 Total de ${DATAS_FALTANTES.length} datas para sincronizar`);
  console.log(`🏪 Bar ID: ${BAR_ID} (Ordinário Bar)`);
  console.log('─'.repeat(50));

  const results = {
    success: [],
    errors: []
  };

  for (let i = 0; i < DATAS_FALTANTES.length; i++) {
    const data = DATAS_FALTANTES[i];
    const progress = ((i + 1) / DATAS_FALTANTES.length * 100).toFixed(1);
    
    console.log(`[${progress}%] Processando ${i + 1}/${DATAS_FALTANTES.length}`);
    
    const result = await processData(data);
    
    if (result.success) {
      results.success.push(result);
    } else {
      results.errors.push(result);
    }

    // Delay de 1 segundo entre requisições
    if (i < DATAS_FALTANTES.length - 1) {
      await delay(1000);
    }
  }

  console.log('\n' + '═'.repeat(50));
  console.log('📊 RESUMO FINAL');
  console.log('═'.repeat(50));
  console.log(`✅ Sucessos: ${results.success.length}/${DATAS_FALTANTES.length}`);
  console.log(`❌ Erros: ${results.errors.length}/${DATAS_FALTANTES.length}`);
  
  const totalProcessed = results.success.reduce((sum, r) => sum + (r.processed || 0), 0);
  console.log(`📤 Total processados: ${totalProcessed}`);

  if (results.errors.length > 0) {
    console.log('\n❌ Datas com erro:');
    results.errors.forEach(e => console.log(`   - ${e.date}: ${e.error}`));
  }

  console.log('\n🎉 Sincronização concluída!');
}

main().catch(console.error);

