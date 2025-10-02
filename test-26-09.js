// Teste específico para 26.09.2025
const testDate = '2025-09-26';

const testAPIs = async () => {
  try {
    console.log(`🔍 Testando APIs para ${testDate}...`);
    
    // Teste 1: API produtos-por-hora
    console.log('\n📊 Testando produtos-por-hora...');
    const produtosResponse = await fetch('http://localhost:3000/api/ferramentas/produtos-por-hora', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data_selecionada: testDate, bar_id: 3 }),
    });

    const produtosData = await produtosResponse.json();
    console.log('Produtos resultado:', {
      success: produtosData.success,
      dados_length: produtosData.dados?.length,
      primeiro_produto: produtosData.dados?.[0],
      estatisticas: produtosData.estatisticas
    });

    // Teste 2: API horario-pico
    console.log('\n⏰ Testando horario-pico...');
    const horarioResponse = await fetch('http://localhost:3000/api/ferramentas/horario-pico', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data_selecionada: testDate, bar_id: 3 }),
    });

    const horarioData = await horarioResponse.json();
    console.log('Horário resultado:', {
      success: horarioData.success,
      produto_mais_vendido: horarioData.data?.estatisticas?.produto_mais_vendido,
      produto_mais_vendido_qtd: horarioData.data?.estatisticas?.produto_mais_vendido_qtd,
      produto_mais_faturou: horarioData.data?.estatisticas?.produto_mais_faturou,
      produto_mais_faturou_valor: horarioData.data?.estatisticas?.produto_mais_faturou_valor,
      total_faturamento: horarioData.data?.estatisticas?.faturamento_total_calculado
    });

    // Verificar se os dados estão sendo processados corretamente
    console.log('\n✅ Resumo dos dados que deveriam aparecer na tela:');
    console.log('Produto Top:', horarioData.data?.estatisticas?.produto_mais_vendido || 'N/A');
    console.log('Quantidade:', horarioData.data?.estatisticas?.produto_mais_vendido_qtd || 0);
    console.log('Faturamento Top:', `R$ ${(horarioData.data?.estatisticas?.produto_mais_faturou_valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    console.log('Produto que mais faturou:', horarioData.data?.estatisticas?.produto_mais_faturou || 'N/A');

  } catch (error) {
    console.error('❌ Erro:', error);
  }
};

testAPIs();
