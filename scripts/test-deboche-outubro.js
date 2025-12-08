/**
 * Teste específico para verificar dados de outubro do Deboche
 */

const BAR_ID = 4;
const TEST_DATE = '2024-10-15'; // Uma data no meio de outubro
const SUPABASE_URL = 'https://uqtgsvujwcbymjmvkjhy.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMxMTE2NiwiZXhwIjoyMDY2ODg3MTY2fQ.cGdHBTSYbNv_qgm6K94DjGXDW46DtiSL3c5428c0WQ0';

async function testSync() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   🧪 TESTE OUTUBRO - DEBOCHE BAR                           ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`📅 Data: ${TEST_DATE}`);
  console.log(`🏪 Bar ID: ${BAR_ID}`);
  console.log('');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/contahub-sync-automatico`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`
      },
      body: JSON.stringify({
        bar_id: BAR_ID,
        data_date: TEST_DATE
      })
    });
    
    console.log(`📥 Status: ${response.status}`);
    
    const result = await response.json();
    
    console.log('');
    console.log('═'.repeat(60));
    console.log('RESPOSTA COMPLETA:');
    console.log('═'.repeat(60));
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.log('❌ ERRO:', error.message);
  }
}

testSync();
