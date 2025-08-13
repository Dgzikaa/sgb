// Script para testar a correção do processamento NIBO
// Execute com: node test-nibo-fix.js

const SUPABASE_URL = 'https://uqtgsvujwcbymjmvkjhy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ ERRO: SUPABASE_SERVICE_ROLE_KEY não encontrada!');
  console.error('Configure a variável de ambiente antes de executar:');
  console.error('  $env:SUPABASE_SERVICE_ROLE_KEY = "sua-service-role-key"');
  process.exit(1);
}

async function testNiboOrchestrator() {
  console.log('🚀 Testando NIBO Orchestrator...\n');
  
  const batchId = '5bf38415-bc4e-4c9c-bf89-1ce9bb20368e';
  console.log(`📋 Batch ID: ${batchId}`);
  console.log(`📊 Total de agendamentos: 232\n`);
  
  try {
    console.log('🔄 Chamando NIBO Orchestrator...');
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/nibo-orchestrator`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({
          batch_id: batchId,
          batch_size: 50
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const result = await response.json();
    console.log('\n✅ Orchestrator respondeu com sucesso!');
    console.log('📊 Resultado:', JSON.stringify(result, null, 2));
    
    // Aguardar um pouco e verificar o status
    console.log('\n⏳ Aguardando 5 segundos para verificar o processamento...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Você pode adicionar aqui uma verificação no banco de dados
    // para confirmar quantos registros foram processados
    
  } catch (error) {
    console.error('\n❌ Erro ao chamar orchestrator:', error.message);
  }
}

// Executar o teste
testNiboOrchestrator();
