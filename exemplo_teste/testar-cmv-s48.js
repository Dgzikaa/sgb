require('dotenv').config({ path: 'F:\\Zykor\\frontend\\.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

async function testarCMV() {
  console.log('🧪 Testando processamento CMV S48...\n');
  
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/cmv-semanal-auto`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ offsetSemanas: -1 }) // S48 (semana passada)
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Erro na resposta:', data);
      return;
    }

    console.log('✅ Resposta da Edge Function:');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Erro ao chamar Edge Function:', error.message);
  }
}

testarCMV();

