/**
 * Script para processar dados raw pendentes do Deboche
 * Uso: node scripts/process-deboche-raw.js
 */

const SUPABASE_URL = 'https://uqtgsvujwcbymjmvkjhy.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMxMTE2NiwiZXhwIjoyMDY2ODg3MTY2fQ.cGdHBTSYbNv_qgm6K94DjGXDW46DtiSL3c5428c0WQ0';

async function processRawData() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   🔄 PROCESSAR DADOS RAW PENDENTES - DEBOCHE BAR           ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  
  try {
    const url = `${SUPABASE_URL}/functions/v1/contahub-processor`;
    
    console.log('📤 Chamando processor para processar todos os dados raw pendentes...');
    console.log('');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`
      },
      body: JSON.stringify({
        process_all: true
      })
    });
    
    console.log(`📥 Status: ${response.status} ${response.statusText}`);
    console.log('');
    
    const result = await response.json();
    
    console.log('─'.repeat(60));
    console.log('📋 RESULTADO:');
    console.log('─'.repeat(60));
    console.log(JSON.stringify(result, null, 2));
    console.log('─'.repeat(60));
    
    if (result.success) {
      console.log('');
      console.log('✅ PROCESSAMENTO CONCLUÍDO!');
      console.log(`   Processados: ${result.summary?.total_processed || 0}`);
      console.log(`   Erros: ${result.summary?.total_errors || 0}`);
    } else {
      console.log('');
      console.log('❌ ERRO NO PROCESSAMENTO');
      console.log(`   ${result.error}`);
    }
    
  } catch (error) {
    console.log('❌ ERRO DE CONEXÃO:', error.message);
  }
}

processRawData();
