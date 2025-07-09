// 🔄 PROCESSAR DADOS PENDENTES - SCRIPT SIMPLES
// Chama diretamente a API processadora

console.log('🔄 PROCESSANDO DADOS PENDENTES');
console.log('=' .repeat(40));

async function processarDadosPendentes() {
  console.log('🚀 Chamando API processadora...');
  
  try {
    // URL da API processadora
    const url = 'https://sgbv2.vercel.app/api/admin/contahub-processar-raw';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📡 Status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Erro: ${errorText}`);
      return;
    }
    
    const result = await response.json();
    
    console.log('✅ SUCESSO!');
    console.log(`📊 Resultado:`, JSON.stringify(result, null, 2));
    
    if (result.success && result.resumo) {
      console.log(`\n🎉 PROCESSAMENTO CONCLUÍDO:`);
      console.log(`   • Total: ${result.resumo.total_registros} registros`);
      console.log(`   • Processados: ${result.resumo.processados}`);
      console.log(`   • Erros: ${result.resumo.erros}`);
      
      if (result.detalhes) {
        console.log(`\n📋 DETALHES:`);
        result.detalhes.forEach(detalhe => {
          const status = detalhe.status === 'sucesso' ? '✅' : '❌';
          console.log(`   ${status} ${detalhe.tipo} → ${detalhe.tabela || 'N/A'}`);
        });
      }
    }
    
  } catch (error) {
    console.error('💥 Erro:', error);
  }
}

// Executar
processarDadosPendentes(); 