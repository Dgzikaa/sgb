/**
 * Script para sincronizar pagamentos e prodporhora faltantes
 */
const fs = require('fs');
const path = require('path');

function loadEnvFile(envPath) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      let value = valueParts.join('=');
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

loadEnvFile(path.join(__dirname, '..', 'frontend', '.env.local'));

const SUPABASE_URL = 'https://uqtgsvujwcbymjmvkjhy.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Datas sem pagamentos
const datasSemPagamentos = [
  '2025-03-02', '2025-03-03', '2025-03-20', '2025-03-21', 
  '2025-03-22', '2025-03-28', '2025-05-25', '2025-06-17'
];

async function syncData(date, tipos) {
  console.log(`🔄 Sincronizando ${date} (${tipos.join(', ')})...`);
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
      tipos: tipos
    })
  });
  const result = await response.json();
  const records = result.details?.collected?.[0]?.collected?.reduce((sum, c) => sum + (c.record_count || 0), 0) || 0;
  console.log(`   ✅ ${date}: ${records} registros`);
  return result;
}

async function main() {
  console.log('='.repeat(50));
  console.log('Sincronizando pagamentos e prodporhora faltantes...');
  console.log('='.repeat(50));
  
  for (const data of datasSemPagamentos) {
    await syncData(data, ['pagamentos', 'prodporhora']);
    await new Promise(r => setTimeout(r, 3000));
  }
  
  console.log('\n✅ Concluído!');
}

main().catch(console.error);




