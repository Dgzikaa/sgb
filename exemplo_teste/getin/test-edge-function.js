/**
 * Script para testar a Edge Function de sincronização contínua do Getin
 */

async function testEdgeFunction() {
  console.log('🧪 Testando Edge Function - Getin Sync Continuous')
  console.log('=' .repeat(60))

  try {
    // URL da Edge Function (local ou produção)
    const functionUrl = process.env.SUPABASE_FUNCTION_URL || 'http://localhost:54321/functions/v1/getin-sync-continuous'
    
    console.log(`📡 Chamando: ${functionUrl}`)
    console.log(`⏰ Iniciado em: ${new Date().toLocaleString('pt-BR')}`)
    
    const startTime = Date.now()
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const duration = Math.round((Date.now() - startTime) / 1000)
    
    console.log(`⏱️  Duração: ${duration}s`)
    console.log(`📊 Status: ${response.status} ${response.statusText}`)
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ Resposta da função:')
      console.log(JSON.stringify(result, null, 2))
      
      if (result.success) {
        console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!')
        console.log(`📊 Estatísticas:`)
        console.log(`   - Encontradas: ${result.stats.total_encontrados}`)
        console.log(`   - Salvas: ${result.stats.total_salvos}`)
        console.log(`   - Erros: ${result.stats.total_erros}`)
        console.log(`   - Período: ${result.stats.periodo}`)
        console.log(`   - Próxima execução: ${new Date(result.stats.proxima_execucao).toLocaleString('pt-BR')}`)
      } else {
        console.log('❌ Função retornou erro:', result.error)
      }
    } else {
      const errorText = await response.text()
      console.log('❌ Erro na requisição:')
      console.log(errorText)
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

// Executar teste
if (import.meta.main) {
  testEdgeFunction()
}

export { testEdgeFunction }
