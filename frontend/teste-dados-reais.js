// Teste para verificar dados reais no banco
const testarDadosReais = async () => {
  console.log('🔍 VERIFICANDO DADOS REAIS');
  
  // Testar diferentes bar_ids
  const barIds = [1, 2, 3, 4, 5];
  
  for (const barId of barIds) {
    console.log(`\n📊 Testando bar_id=${barId}`);
    
    try {
      const url = `https://zykor.com.br/api/analitico/semanal-horario?barId=${barId}&diaSemana=todos&meses=2025-10,2025-09,2025-08&modo=individual`;
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Bar ${barId}: DADOS ENCONTRADOS`);
        console.log(`   - Horários: ${result.data.horarios?.length || 0}`);
        console.log(`   - Resumo por data: ${result.data.resumo_por_data?.length || 0}`);
      } else {
        console.log(`❌ Bar ${barId}: ${result.error}`);
      }
      
    } catch (error) {
      console.log(`💥 Bar ${barId}: Erro na requisição - ${error.message}`);
    }
    
    // Pequena pausa entre requisições
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n🏁 Teste finalizado');
};

// Executar
testarDadosReais();
