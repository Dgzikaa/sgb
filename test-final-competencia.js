// TESTE FINAL: Endpoint com data_competencia usando renovação automática

async function testeFinalCompetencia() {
  try {
    console.log('🎯 TESTE FINAL - DATA_COMPETENCIA COM RENOVAÇÃO AUTOMÁTICA!\n')
    
    // Testar primeiro o endpoint atualizado
    const url = 'http://localhost:3001/api/contaazul/test-competencia-endpoint?barId=3'
    console.log('🔗 Testando endpoint com renovação automática...')
    console.log('   URL:', url)
    
    const response = await fetch(url)
    
    if (!response.ok) {
      console.error('❌ Erro HTTP:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Detalhes:', errorText)
      
      // Se falhou, tentar diagnóstico básico
      console.log('\n🩺 Tentando diagnóstico básico...')
      const diagUrl = 'http://localhost:3001/api/contaazul/test-basic-endpoints?barId=3'
      const diagResponse = await fetch(diagUrl)
      
      if (diagResponse.ok) {
        const diagData = await diagResponse.json()
        console.log('📊 Diagnóstico básico:')
        console.log('   Testes OK:', diagData.resumo?.testes_ok || 0)
        console.log('   Total testes:', diagData.resumo?.total_testes || 0)
      }
      
      return
    }
    
    const data = await response.json()
    
    console.log('✅ Resposta recebida!')
    console.log('\n🔥 RESULTADO:')
    console.log('=' .repeat(50))
    
    if (data.conclusoes) {
      console.log('📊 Receitas funcionam:', data.conclusoes.endpoint_receitas_funciona ? '✅' : '❌')
      console.log('📊 Despesas funcionam:', data.conclusoes.endpoint_despesas_funciona ? '✅' : '❌')
      console.log('🎯 Receitas têm competência:', data.conclusoes.receitas_tem_competencia ? '✅' : '❌')
      console.log('🎯 Despesas têm competência:', data.conclusoes.despesas_tem_competencia ? '✅' : '❌')
      
      const sucesso = data.conclusoes.viavel_para_dre
      
      console.log('\n' + '=' .repeat(50))
      console.log('🏆 RESULTADO FINAL:', sucesso ? '🎉 SUCESSO!' : '😞 NÃO FUNCIONOU')
      console.log('=' .repeat(50))
      
      if (sucesso) {
        console.log('\n🚀 PARABÉNS! DATA_COMPETENCIA FUNCIONOU!')
        console.log('📈 Agora podemos implementar DRE por regime de competência!')
        
        // Mostrar detalhes se tiver
        if (data.analise?.receitas?.total_itens > 0) {
          console.log(`\n💰 Receitas: ${data.analise.receitas.total_itens} itens`)
          if (data.analise.receitas.amostra_campos?.data_competencia) {
            console.log(`   Exemplo data_competencia: ${data.analise.receitas.amostra_campos.data_competencia}`)
          }
        }
        
        if (data.analise?.despesas?.total_itens > 0) {
          console.log(`💸 Despesas: ${data.analise.despesas.total_itens} itens`)
          if (data.analise.despesas.amostra_campos?.data_competencia) {
            console.log(`   Exemplo data_competencia: ${data.analise.despesas.amostra_campos.data_competencia}`)
          }
        }
        
        console.log('\n🎯 PRÓXIMOS PASSOS:')
        console.log('   1. Migrar sync para usar esses endpoints')
        console.log('   2. Atualizar banco com data_competencia')
        console.log('   3. Reprocessar DRE com regime de competência')
        console.log('   4. DRE 100% CORRETA! 🎉')
        
      } else {
        console.log('\n😞 Infelizmente não funcionou ainda')
        console.log('📞 Próximos passos:')
        console.log('   - Verificar documentação atualizada ContaAzul')
        console.log('   - Contatar suporte sobre data_competencia')
        console.log('   - Tentar outros endpoints alternativos')
      }
    } else {
      console.log('❌ Resposta inesperada da API')
      console.log('Dados recebidos:', JSON.stringify(data, null, 2))
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

console.log('⏳ Iniciando teste em 2 segundos...')
setTimeout(testeFinalCompetencia, 2000) 