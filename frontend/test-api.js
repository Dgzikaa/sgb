// Script de teste para verificar as APIs
const testAPI = async () => {
  try {
    console.log('🔍 Testando API de produtos por hora...');
    
    const produtosResponse = await fetch('http://localhost:3000/api/ferramentas/produtos-por-hora', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data_selecionada: '2025-09-26',
        bar_id: 3
      }),
    });

    const produtosData = await produtosResponse.json();
    console.log('📊 Produtos por hora:', {
      success: produtosData.success,
      dados_length: produtosData.dados?.length,
      estatisticas: produtosData.estatisticas
    });

    console.log('\n🔍 Testando API de horário de pico...');
    
    const horarioResponse = await fetch('http://localhost:3000/api/ferramentas/horario-pico', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data_selecionada: '2025-09-26',
        bar_id: 3
      }),
    });

    const horarioData = await horarioResponse.json();
    console.log('⏰ Horário de pico:', {
      success: horarioData.success,
      produto_mais_vendido: horarioData.data?.estatisticas?.produto_mais_vendido,
      produto_mais_faturou: horarioData.data?.estatisticas?.produto_mais_faturou,
      produto_mais_faturou_valor: horarioData.data?.estatisticas?.produto_mais_faturou_valor,
      total_faturamento: horarioData.data?.estatisticas?.faturamento_total_calculado
    });

  } catch (error) {
    console.error('❌ Erro:', error);
  }
};

testAPI();
