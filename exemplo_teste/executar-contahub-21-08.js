// Script para executar sincronização do ContaHub para 21/08/2025
const fetch = require('node-fetch');

async function executarSyncContaHub() {
  try {
    console.log('🚀 Executando sincronização ContaHub para 21/08/2025...');
    
    const response = await fetch('http://localhost:3000/api/contahub/sync-manual', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data_date: '2025-08-21'
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Sincronização executada com sucesso!');
      console.log('📊 Resultado:', JSON.stringify(result, null, 2));
    } else {
      console.error('❌ Erro na sincronização:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Erro ao executar:', error.message);
  }
}

executarSyncContaHub();
