const fs = require('fs');
const path = require('path');

// Carregar .env.local do frontend
const envPath = path.join(__dirname, '../frontend/.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex > 0) {
      const key = trimmed.substring(0, eqIndex);
      const value = trimmed.substring(eqIndex + 1).replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  }
});

console.log('✅ Variáveis de ambiente carregadas');
console.log('🚀 Iniciando sync retroativo Getin - Dezembro 2025...');
console.log('📅 Período: 2025-12-01 a 2025-12-31');

const url = 'https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/getin-sync-continuous';

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY
  },
  body: JSON.stringify({
    start_date: '2025-12-01',
    end_date: '2025-12-31'
  })
})
.then(r => r.json())
.then(data => {
  console.log('\n✅ Resultado da sincronização:');
  if (data.success) {
    console.log('📊 Total encontrados:', data.stats?.total_encontrados || 0);
    console.log('🆕 Novas:', data.stats?.total_novas || 0);
    console.log('🔄 Atualizadas:', data.stats?.total_atualizadas || 0);
    console.log('✅ Salvas:', data.stats?.total_salvos || 0);
    console.log('❌ Erros:', data.stats?.total_erros || 0);
    console.log('📅 Período:', data.stats?.periodo || '');
  } else {
    console.log('❌ Erro:', data.error || data.message || JSON.stringify(data));
  }
})
.catch(err => console.error('❌ Erro:', err));

