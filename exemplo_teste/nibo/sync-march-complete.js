#!/usr/bin/env -S deno run --allow-net --allow-read --allow-env

const SUPABASE_URL = 'https://uqtgsvujwcbymjmvkjhy.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMxMTE2NiwiZXhwIjoyMDY2ODg3MTY2fQ.cGdHBTSYbNv_qgm6K94DjGXDW46DtiSL3c5428c0WQ0'

async function syncMarchComplete() {
  console.log('🚀 [SYNC-MARCH] Iniciando sincronização completa de março 2025...')
  
  try {
    // Sincronizar março completo (01/03 a 31/03)
    const startDate = '2025-03-01'
    const endDate = '2025-03-31'
    
    console.log(`📅 [SYNC-MARCH] Período: ${startDate} a ${endDate}`)
    
    // 1. Chamar nibo_collector
    console.log('📥 [SYNC-MARCH] Executando nibo_collector...')
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
    console.log('✅ [SYNC-MARCH] Collector executado:', collectorResult)
    
    if (!collectorResult.success || !collectorResult.raw_data_id) {
      throw new Error(`Collector não retornou raw_data_id: ${JSON.stringify(collectorResult)}`)
    }
    
    // 2. Aguardar um pouco antes de processar
    console.log('⏳ [SYNC-MARCH] Aguardando 2 segundos antes de processar...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 3. Chamar nibo_processor
    console.log('⚙️ [SYNC-MARCH] Executando nibo_processor...')
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
    console.log('✅ [SYNC-MARCH] Processor executado:', processorResult)
    
    console.log('🎉 [SYNC-MARCH] Sincronização de março completa!')
    console.log(`📊 [SYNC-MARCH] Coletados: ${collectorResult.records_count || 'N/A'} registros`)
    console.log(`📊 [SYNC-MARCH] Processados: ${processorResult.records_processed || 'N/A'} registros`)
    
  } catch (error) {
    console.error('❌ [SYNC-MARCH] Erro na sincronização:', error.message)
    throw error
  }
}

// Executar
if (import.meta.main) {
  await syncMarchComplete()
}
