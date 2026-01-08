/**
 * Script para sincronizar tempo das 9 datas de março
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

const datasMarco = [
  '2025-03-18', '2025-03-19', '2025-03-23', '2025-03-24', 
  '2025-03-25', '2025-03-26', '2025-03-27', '2025-03-29', '2025-03-30'
];

async function syncTempo(date) {
  console.log(`🔄 Sincronizando tempo ${date}...`);
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
      tipos: ['tempo']
    })
  });
  const result = await response.json();
  const records = result.details?.collected?.[0]?.collected?.[0]?.record_count || 0;
  console.log(`   ✅ ${date}: ${records} registros`);
  return result;
}

async function main() {
  console.log('Sincronizando tempo para 9 datas de março...\n');
  for (const data of datasMarco) {
    await syncTempo(data);
    await new Promise(r => setTimeout(r, 3000));
  }
  console.log('\n✅ Concluído!');
}

main().catch(console.error);




