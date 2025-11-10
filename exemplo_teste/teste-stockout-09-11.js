#!/usr/bin/env node

// Teste API Stockout - 09/11/2025

const testeStockout = async () => {
  console.log('🧪 Testando API de Stockout para 09/11/2025...\n');

  try {
    const response = await fetch('http://localhost:3000/api/analitico/stockout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data_selecionada: '2025-11-09',
        filtros: []
      }),
    });

    const result = await response.json();

    console.log('📊 Resultado da API:');
    console.log(JSON.stringify(result, null, 2));

    if (result.success && result.data) {
      console.log('\n✅ DADOS ENCONTRADOS:');
      console.log(`📅 Data: ${result.data.data_analisada}`);
      console.log(`📦 Total Produtos: ${result.data.estatisticas.total_produtos}`);
      console.log(`✅ Disponíveis: ${result.data.estatisticas.produtos_ativos}`);
      console.log(`❌ Stockout: ${result.data.estatisticas.produtos_inativos}`);
      console.log(`📊 % Stockout: ${result.data.estatisticas.percentual_stockout}`);
      console.log(`📊 % Disponibilidade: ${result.data.estatisticas.percentual_disponibilidade}`);
    } else {
      console.log('\n❌ ERRO: Nenhum dado retornado');
      console.log('Erro:', result.error);
    }

  } catch (error) {
    console.error('❌ Erro ao testar API:', error);
  }
};

testeStockout();

