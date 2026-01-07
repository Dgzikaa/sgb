/**
 * Script para ressincronizar datas faltantes usando contahub-sync-retroativo
 * Executa: node scripts/sync-contahub-retroativo-completo.js
 */

const fs = require('fs');
const path = require('path');

// Carregar .env.local para pegar a service role key
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

// Tentar carregar .env.local
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

const SUPABASE_URL = 'https://uqtgsvujwcbymjmvkjhy.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada!');
  console.log('Execute: cd frontend e tente novamente');
  process.exit(1);
}

// Datas que precisam ressincronizar - TUDO ZERADO (41 datas)
const datasZeradas = [
  '2025-02-02', '2025-02-12', '2025-03-05', '2025-03-10', '2025-03-17', '2025-03-31',
  '2025-04-07', '2025-04-14', '2025-04-22', '2025-04-28', '2025-04-29',
  '2025-05-05', '2025-05-06', '2025-05-12', '2025-05-13', '2025-05-19', '2025-05-20', '2025-05-26', '2025-05-27',
  '2025-06-03', '2025-06-10', '2025-06-24',
  '2025-07-01', '2025-07-08', '2025-07-15', '2025-07-22', '2025-07-29',
  '2025-08-05', '2025-08-12', '2025-08-19', '2025-08-26',
  '2025-09-02', '2025-09-05', '2025-09-09', '2025-09-16', '2025-09-23', '2025-09-30',
  '2025-10-07', '2025-10-14', '2025-10-21', '2025-10-28'
];

// Datas que só precisam de tempo (9 datas)
const datasSemTempo = [
  '2025-03-18', '2025-03-19', '2025-03-23', '2025-03-24', '2025-03-25', 
  '2025-03-26', '2025-03-27', '2025-03-29', '2025-03-30'
];

// Data que só precisa de analitico
const datasSemAnalitico = ['2025-10-11'];

async function syncData(startDate, endDate, tipos) {
  const url = `${SUPABASE_URL}/functions/v1/contahub-sync-retroativo`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bar_id: 3,
        start_date: startDate,
        end_date: endDate,
        tipos: tipos
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text.substring(0, 200)}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`❌ Erro ao sincronizar ${startDate}: ${error.message}`);
    return { error: error.message };
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('='.repeat(60));
  console.log('SYNC RETROATIVO - CORREÇÃO DE DADOS CONTAHUB');
  console.log('='.repeat(60));
  console.log('');
  console.log('📊 Resumo:');
  console.log(`   - Datas TUDO ZERADO: ${datasZeradas.length}`);
  console.log(`   - Datas SEM TEMPO: ${datasSemTempo.length}`);
  console.log(`   - Datas SEM ANALITICO: ${datasSemAnalitico.length}`);
  console.log(`   - TOTAL: ${datasZeradas.length + datasSemTempo.length + datasSemAnalitico.length}`);
  console.log('');

  // Tipos para sincronização completa
  const tiposCompletos = ['analitico', 'periodo', 'tempo', 'pagamentos', 'fatporhora', 'prodporhora'];
  
  let sucesso = 0;
  let falha = 0;

  // 1. Processar datas zeradas (sync completo)
  console.log('🔄 Processando datas TUDO ZERADO...');
  console.log('-'.repeat(60));
  
  for (let i = 0; i < datasZeradas.length; i++) {
    const data = datasZeradas[i];
    console.log(`[${i + 1}/${datasZeradas.length}] Sincronizando ${data}...`);
    
    const result = await syncData(data, data, tiposCompletos);
    
    if (result.error) {
      console.log(`   ❌ Erro: ${result.error.substring(0, 100)}`);
      falha++;
    } else if (result.results && result.results[0]) {
      const dayResult = result.results[0];
      const collected = dayResult.collected?.length || 0;
      const errors = dayResult.errors?.length || 0;
      console.log(`   ✅ Coletados: ${collected} tipos | Erros: ${errors}`);
      sucesso++;
    } else if (result.success === false) {
      console.log(`   ❌ Erro: ${result.error || 'Erro desconhecido'}`);
      falha++;
    } else {
      console.log(`   ✅ Sincronizado`);
      sucesso++;
    }
    
    // Esperar 3 segundos entre cada sync para não sobrecarregar
    await sleep(3000);
  }

  // 2. Processar datas sem tempo
  console.log('');
  console.log('🔄 Processando datas SEM TEMPO...');
  console.log('-'.repeat(60));
  
  for (let i = 0; i < datasSemTempo.length; i++) {
    const data = datasSemTempo[i];
    console.log(`[${i + 1}/${datasSemTempo.length}] Sincronizando ${data} (tempo)...`);
    
    const result = await syncData(data, data, ['tempo']);
    
    if (result.error) {
      console.log(`   ❌ Erro: ${result.error.substring(0, 100)}`);
      falha++;
    } else {
      console.log(`   ✅ Tempo sincronizado`);
      sucesso++;
    }
    
    await sleep(2000);
  }

  // 3. Processar datas sem analitico
  console.log('');
  console.log('🔄 Processando datas SEM ANALITICO...');
  console.log('-'.repeat(60));
  
  for (let i = 0; i < datasSemAnalitico.length; i++) {
    const data = datasSemAnalitico[i];
    console.log(`[${i + 1}/${datasSemAnalitico.length}] Sincronizando ${data} (analitico)...`);
    
    const result = await syncData(data, data, ['analitico']);
    
    if (result.error) {
      console.log(`   ❌ Erro: ${result.error.substring(0, 100)}`);
      falha++;
    } else {
      console.log(`   ✅ Analitico sincronizado`);
      sucesso++;
    }
    
    await sleep(2000);
  }

  // Resumo final
  console.log('');
  console.log('='.repeat(60));
  console.log('📊 RESUMO FINAL');
  console.log('='.repeat(60));
  console.log(`✅ Sucesso: ${sucesso}`);
  console.log(`❌ Falhas: ${falha}`);
  console.log(`📊 Total: ${sucesso + falha}`);
}

main().catch(console.error);


