/**
 * Script para testar sync de UMA data por vez
 */

const fs = require('fs');
const path = require('path');

function loadEnvFile(envPath) {
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
}

const envPath = path.join(__dirname, '..', 'frontend', '.env.local');
loadEnvFile(envPath);

const SUPABASE_URL = 'https://uqtgsvujwcbymjmvkjhy.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Testar apenas estas datas
const datasParaTestar = ['2025-10-28', '2025-10-21'];

async function syncData(date) {
  console.log(`\n🔄 Sincronizando ${date}...`);
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/contahub-sync-retroativo`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      bar_id: 3,
      start_date: date,
      end_date: date,
      tipos: ['analitico', 'periodo', 'tempo', 'pagamentos']
    })
  });

  const result = await response.json();
  console.log('Resultado:', JSON.stringify(result, null, 2));
  return result;
}

async function main() {
  console.log('='.repeat(60));
  console.log('TESTE DE SYNC INDIVIDUAL');
  console.log('='.repeat(60));

  for (const data of datasParaTestar) {
    await syncData(data);
    // Esperar 10 segundos entre cada sync
    console.log('\n⏳ Aguardando 10 segundos...');
    await new Promise(r => setTimeout(r, 10000));
  }

  console.log('\n✅ Teste concluído!');
}

main().catch(console.error);




