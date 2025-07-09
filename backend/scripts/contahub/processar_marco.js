// Processar dados de março que estão pendentes usando a API processadora
const FRONTEND_URL = 'https://sgb-v2.vercel.app';

async function processarMarco() {
  console.log('🔄 Processando dados de março pendentes via API processadora...');
  
  try {
    const response = await fetch(`${FRONTEND_URL}/api/admin/contahub-processar-raw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Status da resposta:', response.status);
    console.log('📡 Status text:', response.statusText);
    
    const result = await response.json();
    
    console.log('✅ Resultado do processamento:');
    console.log('  • Success:', result.success);
    console.log('  • Message:', result.message);
    console.log('  • Processados:', result.processados);
    
    if (result.detalhes) {
      console.log('  • Detalhes:', result.detalhes);
    }
    
    if (result.distribuicao) {
      console.log('  • Distribuição por tabela:');
      Object.entries(result.distribuicao).forEach(([tabela, count]) => {
        console.log(`    - ${tabela}: ${count} registros`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao processar:', error);
  }
}

processarMarco(); 