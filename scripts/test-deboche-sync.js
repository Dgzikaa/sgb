/**
 * Script de TESTE - Sincroniza apenas 1 dia do Deboche
 * Uso: node scripts/test-deboche-sync.js
 */

const BAR_ID = 4; // Deboche Bar
const TEST_DATE = '2024-12-05'; // Data de teste (mais recente)
const SUPABASE_URL = 'https://uqtgsvujwcbymjmvkjhy.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMxMTE2NiwiZXhwIjoyMDY2ODg3MTY2fQ.cGdHBTSYbNv_qgm6K94DjGXDW46DtiSL3c5428c0WQ0';

async function testSync() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║        🧪 TESTE DE SYNC - DEBOCHE BAR (bar_id = 4)         ║');
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
    
    if (result.success) {
      console.log('✅ TESTE BEM SUCEDIDO!');
      console.log('');
      console.log(`📊 Resumo:`);
      console.log(`   - Tipos coletados: ${result.summary?.collected_count || 0}/5`);
      console.log(`   - Registros: ${result.summary?.total_records_collected || 0}`);
      console.log(`   - Erros: ${result.summary?.error_count || 0}`);
      console.log(`   - Tempo: ${elapsed}s`);
      console.log('');
      console.log('🚀 Credenciais OK! Pode rodar o script completo:');
      console.log('   node scripts/sync-deboche-retroativo.js');
    } else {
      console.log('❌ TESTE FALHOU!');
      console.log('');
      console.log(`Erro: ${result.error}`);
      console.log('');
      console.log('🔍 Verifique:');
      console.log('   1. Credenciais do ContaHub (digao@3691 / Geladeira@001)');
      console.log('   2. emp_id está correto (3691)');
      console.log('   3. Conta do ContaHub está ativa');
    }
    
  } catch (error) {
    console.log('❌ ERRO DE CONEXÃO!');
    console.log('');
    console.log(`Erro: ${error.message}`);
  }
}

testSync();
