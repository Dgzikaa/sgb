#!/usr/bin/env node

const SUPABASE_URL = 'https://uqtgsvujwcbymjmvkjhy.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMxMTE2NiwiZXhwIjoyMDY2ODg3MTY2fQ.cGdHBTSYbNv_qgm6K94DjGXDW46DtiSL3c5428c0WQ0';

async function getCredenciais() {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/api_credentials?sistema=eq.nibo&bar_id=eq.3&ativo=eq.true&select=api_token`,
    {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    }
  );
  const dados = await response.json();
  return dados[0].api_token;
}

async function testarPeriodo() {
  console.log('🔍 Testando se existe dados de 01/10 a 06/10 no Nibo...\n');
  
  const apiToken = await getCredenciais();
  
  const url = new URL('https://api.nibo.com.br/empresas/v1/schedules');
  url.searchParams.set('apitoken', apiToken);
  url.searchParams.set('$filter', 'accrualDate ge 2025-10-01 and accrualDate le 2025-10-06');
  url.searchParams.set('$top', '10');
  
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'apitoken': apiToken
    }
  });
  
  const data = await response.json();
  
  if (data?.items && data.items.length > 0) {
    console.log(`✅ Existem ${data.items.length} registros no período!`);
    console.log('\nPrimeiros registros:');
    data.items.slice(0, 5).forEach(item => {
      console.log(`  - ${item.accrualDate}: ${item.category?.name} - R$ ${item.value}`);
    });
  } else {
    console.log('❌ Não existem dados desse período no Nibo');
    console.log('   (Pode ser que realmente não houve movimentação nesses dias)');
  }
}

testarPeriodo().catch(console.error);

