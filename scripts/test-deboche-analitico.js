/**
 * Script de TESTE - Testa apenas o analitico do Deboche
 * Uso: node scripts/test-deboche-analitico.js
 */

const BAR_ID = 4; // Deboche Bar
const TEST_DATE = '2024-12-07'; // Data de teste
const SUPABASE_URL = 'https://uqtgsvujwcbymjmvkjhy.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMxMTE2NiwiZXhwIjoyMDY2ODg3MTY2fQ.cGdHBTSYbNv_qgm6K94DjGXDW46DtiSL3c5428c0WQ0';

async function testSync() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   🧪 TESTE ANALITICO - DEBOCHE BAR (bar_id = 4)            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`📅 Data de teste: ${TEST_DATE}`);
  console.log(`🏪 Bar ID: ${BAR_ID} (Deboche)`);
  console.log('');
  console.log('Iniciando sincronização...');
  console.log('');
  
  const startTime = Date.now();
  
  try {
    const url = `${SUPABASE_URL}/functions/v1/contahub-sync-automatico`;
    
    console.log(`🔗 URL: ${url}`);
    console.log(`📤 Enviando requisição...`);
    console.log('');
    
    const response = await fetch(url, {
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
    
    console.log(`📥 Status: ${response.status} ${response.statusText}`);
    console.log('');
    
    const result = await response.json();
    
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    
    console.log('─'.repeat(60));
    console.log('📋 RESPOSTA COMPLETA:');
    console.log('─'.repeat(60));
    console.log(JSON.stringify(result, null, 2));
    console.log('─'.repeat(60));
    console.log('');
    
    // Verificar analitico especificamente
    const analiticoCollected = result.details?.collected?.find(c => c.data_type === 'analitico');
    const analiticoProcessed = result.details?.processed?.find(p => p.data_type === 'analitico');
    const analiticoError = result.details?.errors?.find(e => e.data_type === 'analitico');
    
    console.log('📊 RESULTADO DO ANALÍTICO:');
    console.log('─'.repeat(60));
    
    if (analiticoError) {
      console.log(`❌ ERRO: ${analiticoError.error}`);
    } else if (analiticoCollected) {
      console.log(`✅ Coletado: ${analiticoCollected.record_count} registros`);
      if (analiticoProcessed) {
        console.log(`✅ Processado: ${analiticoProcessed.result?.count || 0} registros`);
      }
    } else {
      console.log('⚠️ Analítico não encontrado nos resultados');
    }
    
    console.log('');
    console.log(`⏱️ Tempo total: ${elapsed}s`);
    
  } catch (error) {
    console.log('❌ ERRO DE CONEXÃO!');
    console.log('');
    console.log(`Erro: ${error.message}`);
  }
}

testSync();
