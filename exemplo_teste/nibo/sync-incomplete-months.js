#!/usr/bin/env -S deno run --allow-net --allow-read --allow-env

const SUPABASE_URL = 'https://uqtgsvujwcbymjmvkjhy.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMxMTE2NiwiZXhwIjoyMDY2ODg3MTY2fQ.cGdHBTSYbNv_qgm6K94DjGXDW46DtiSL3c5428c0WQ0'

// Meses que estão incompletos baseado na análise
const INCOMPLETE_MONTHS = [
  { month: 1, name: 'Janeiro', days: 31 },
  { month: 3, name: 'Março', days: 31 },
  { month: 4, name: 'Abril', days: 30 },
  { month: 6, name: 'Junho', days: 30 },
  { month: 7, name: 'Julho', days: 31 },
  { month: 9, name: 'Setembro', days: 30 },
  { month: 10, name: 'Outubro', days: 31 },
  { month: 11, name: 'Novembro', days: 30 },
  { month: 12, name: 'Dezembro', days: 31 }
]

async function syncMonth(month, monthName, days) {
  const startDate = `2025-${month.toString().padStart(2, '0')}-01`
  const endDate = `2025-${month.toString().padStart(2, '0')}-${days}`
  
  console.log(`\n🚀 [SYNC-${monthName.toUpperCase()}] Iniciando sincronização completa...`)
  console.log(`📅 [SYNC-${monthName.toUpperCase()}] Período: ${startDate} a ${endDate}`)
  
  try {
    // 1. Chamar nibo_collector
    console.log(`📥 [SYNC-${monthName.toUpperCase()}] Executando nibo_collector...`)
    const collectorResponse = await fetch(`${SUPABASE_URL}/functions/v1/nibo_collector`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data_type: 'agendamentos',
        start_date: startDate,
        end_date: endDate
      })
    })
    
    if (!collectorResponse.ok) {
      const errorText = await collectorResponse.text()
      throw new Error(`Collector failed: ${collectorResponse.status} - ${errorText}`)
    }
    
    const collectorResult = await collectorResponse.json()
    console.log(`✅ [SYNC-${monthName.toUpperCase()}] Collector executado:`, collectorResult)
    
    if (!collectorResult.success || !collectorResult.raw_data_id) {
      throw new Error(`Collector não retornou raw_data_id: ${JSON.stringify(collectorResult)}`)
    }
    
    // 2. Aguardar um pouco antes de processar
    console.log(`⏳ [SYNC-${monthName.toUpperCase()}] Aguardando 3 segundos antes de processar...`)
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // 3. Chamar nibo_processor
    console.log(`⚙️ [SYNC-${monthName.toUpperCase()}] Executando nibo_processor...`)
    const processorResponse = await fetch(`${SUPABASE_URL}/functions/v1/nibo_processor`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        raw_data_id: collectorResult.raw_data_id
      })
    })
    
    if (!processorResponse.ok) {
      const errorText = await processorResponse.text()
      throw new Error(`Processor failed: ${processorResponse.status} - ${errorText}`)
    }
    
    const processorResult = await processorResponse.json()
    console.log(`✅ [SYNC-${monthName.toUpperCase()}] Processor executado:`, processorResult)
    
    console.log(`🎉 [SYNC-${monthName.toUpperCase()}] Sincronização completa!`)
    console.log(`📊 [SYNC-${monthName.toUpperCase()}] Coletados: ${collectorResult.record_count || 'N/A'} registros`)
    console.log(`📊 [SYNC-${monthName.toUpperCase()}] Processados: ${processorResult.inserted_records || processorResult.records_processed || 'N/A'} registros`)
    
    return {
      month: monthName,
      success: true,
      collected: collectorResult.record_count || 0,
      processed: processorResult.inserted_records || processorResult.records_processed || 0
    }
    
  } catch (error) {
    console.error(`❌ [SYNC-${monthName.toUpperCase()}] Erro na sincronização:`, error.message)
    return {
      month: monthName,
      success: false,
      error: error.message
    }
  }
}

async function syncAllIncompleteMonths() {
  console.log('🚀 [SYNC-ALL] Iniciando sincronização de todos os meses incompletos...')
  console.log(`📋 [SYNC-ALL] Meses a sincronizar: ${INCOMPLETE_MONTHS.map(m => m.name).join(', ')}`)
  
  const results = []
  
  for (const monthInfo of INCOMPLETE_MONTHS) {
    const result = await syncMonth(monthInfo.month, monthInfo.name, monthInfo.days)
    results.push(result)
    
    // Pausa entre meses para não sobrecarregar
    if (monthInfo !== INCOMPLETE_MONTHS[INCOMPLETE_MONTHS.length - 1]) {
      console.log('⏳ [SYNC-ALL] Aguardando 5 segundos antes do próximo mês...')
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
  }
  
  console.log('\n📊 [SYNC-ALL] RESUMO FINAL:')
  console.log('=' .repeat(60))
  
  let totalSuccess = 0
  let totalErrors = 0
  
  for (const result of results) {
    if (result.success) {
      console.log(`✅ ${result.month}: ${result.collected} coletados, ${result.processed} processados`)
      totalSuccess++
    } else {
      console.log(`❌ ${result.month}: ${result.error}`)
      totalErrors++
    }
  }
  
  console.log('=' .repeat(60))
  console.log(`🎯 [SYNC-ALL] Sucessos: ${totalSuccess}/${INCOMPLETE_MONTHS.length}`)
  console.log(`⚠️ [SYNC-ALL] Erros: ${totalErrors}/${INCOMPLETE_MONTHS.length}`)
  
  if (totalErrors === 0) {
    console.log('🎉 [SYNC-ALL] Todos os meses foram sincronizados com sucesso!')
  } else {
    console.log('⚠️ [SYNC-ALL] Alguns meses falharam. Verifique os logs acima.')
  }
}

// Executar
if (import.meta.main) {
  await syncAllIncompleteMonths()
}
